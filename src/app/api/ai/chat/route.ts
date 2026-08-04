import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";
import { availableGateways, DEFAULT_CHAIN, gatewayById, type ModelRef } from "@/lib/ai/providers";
import { streamWithFallback } from "@/lib/ai/fallback";
import { can, type Role } from "@/lib/ai/roles";
import { assemble } from "@/lib/ai/skills";
import { toolsFor } from "@/lib/ai/tools";
import { openMcpSession } from "@/lib/ai/mcp";
import { BASE_INSTRUCTIONS } from "@/lib/ai/instructions";

/**
 * The one place a conversation is assembled.
 *
 * The order matters and is the point of the whole design: work out who is asking,
 * from the session cookie and not from the request body; take the skills they are
 * allowed to have, dropping any they asked for and may not use; union the tools
 * those skills declare; then stream.
 *
 * Nothing in the body decides what the assistant can do. A client can ask for a
 * skill and be refused, and it cannot name a model, a tool or an MCP server that
 * the role does not already carry.
 */

export const maxDuration = 60;

const Body = z.object({
  messages: z.array(z.any()).max(80),
  /** Which skills the panel wants active. Filtered against the role server-side. */
  skills: z.array(z.string().max(40)).max(20).optional(),
  model: z.enum(["default", "reasoning", "cheap"]).optional(),
  locale: z.enum(["fr", "en"]).default("fr"),
});

export async function POST(request: Request) {
  // Configured means at least one gateway has a key; which one is the chain's business.
  if (availableGateways().length === 0) {
    return NextResponse.json({ error: "ai_not_configured" }, { status: 503 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const role = await resolveRole();

  /*
    The client sends which skills it wants; `assemble` keeps only those the role may
    have. A guest asking for the account skill simply does not get it, and is not
    told off — there is nothing to tell off, the panel is allowed to ask.
  */
  const { active, instructions, tools: toolNames } = assemble(role, body.skills);
  const tools = toolsFor(role, { locale: body.locale }, toolNames);

  /*
    MCP is admin-only and additive. A server that is down contributes nothing and
    the conversation continues; the alternative — failing the request — would make
    the assistant hostage to somebody else's uptime.
  */
  const mcp = can(role, "useMcpServers") ? await openMcpSession() : null;
  if (mcp?.failed.length) {
    console.warn("MCP servers unreachable", mcp.failed);
  }

  const chain = await resolveChain();

  const attempt = await streamWithFallback(chain, {
    instructions: [
      BASE_INSTRUCTIONS[body.locale],
      instructions,
      `Active skills: ${active.map((s) => s.id).join(", ") || "none"}.`,
      mcp?.connected.length ? `MCP servers connected: ${mcp.connected.join(", ")}.` : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    messages: await convertToModelMessages(body.messages as UIMessage[]),
    tools: { ...tools, ...(mcp?.tools ?? {}) },
    /*
      The model may call a tool, read the result and call another — resolving a city
      before comparing it, for instance. Without a step budget it would answer from
      the first tool result alone; with an unbounded one a loop costs real money.
    */
    stopWhen: ({ steps }) => steps.length >= 6,
  });

  if ("failed" in attempt) {
    /*
      Every model in the chain refused. Logged with each reason, because "the
      assistant is broken" is unactionable and "all three returned 429" is not.
    */
    await mcp?.close();
    console.error("every model in the chain failed", attempt.failed);
    return NextResponse.json({ error: "no_model_available" }, { status: 503 });
  }

  if (attempt.skipped.length > 0) {
    console.warn(
      `fell back to ${attempt.used.gateway}/${attempt.used.model}`,
      attempt.skipped,
    );
  }

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: attempt.stream,
      /*
        Closed when the stream ends, not in a `streamText` callback: the fallback owns
        the stream now, so a callback passed to `streamText` would fire on the probe's
        copy and leave the real transports open.
      */
      onEnd: async () => {
        await mcp?.close();
      },
    }),
  });
}

/**
 * The chain to try, admin's choice first.
 *
 * An empty or unreadable setting falls back to the code default rather than to
 * nothing: a misconfigured row must not take the assistant offline. Entries naming a
 * gateway we do not know are dropped here, so a stale setting degrades to whatever
 * still resolves instead of failing the whole chain.
 */
async function resolveChain(): Promise<readonly ModelRef[]> {
  if (!isSupabaseConfigured()) return DEFAULT_CHAIN;
  try {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase.from("ai_settings").select("model_chain").maybeSingle();
    const raw = Array.isArray(data?.model_chain) ? data.model_chain : [];
    const chain = (raw as unknown[]).flatMap((entry) => {
      if (typeof entry !== "object" || entry === null) return [];
      const { gateway, model } = entry as Record<string, unknown>;
      if (typeof gateway !== "string" || typeof model !== "string") return [];
      if (!gatewayById(gateway)) return [];
      return [{ gateway, model } as ModelRef];
    });
    return chain.length > 0 ? chain : DEFAULT_CHAIN;
  } catch {
    return DEFAULT_CHAIN;
  }
}

/**
 * Who is asking.
 *
 * Read from the session, never from the request. `admin` comes from a column on the
 * profile rather than a list of emails in the code, so granting it does not need a
 * deploy — and so nobody can grant it to themselves by editing a request.
 */
async function resolveRole(): Promise<Role> {
  if (!isSupabaseConfigured()) return "guest";
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return "guest";

    const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    return data?.role === "admin" ? "admin" : "member";
  } catch {
    // A database that will not answer must not promote anyone.
    return "guest";
  }
}

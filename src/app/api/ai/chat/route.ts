import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";
import { isAiConfigured, resolveModel, type ModelChoice } from "@/lib/ai/models";
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
  if (!isAiConfigured()) {
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
  const tools = toolsFor(role, toolNames);

  /*
    MCP is admin-only and additive. A server that is down contributes nothing and
    the conversation continues; the alternative — failing the request — would make
    the assistant hostage to somebody else's uptime.
  */
  const mcp = can(role, "useMcpServers") ? await openMcpSession() : null;
  if (mcp?.failed.length) {
    console.warn("MCP servers unreachable", mcp.failed);
  }

  const result = streamText({
    model: resolveModel(body.model as ModelChoice | undefined, can(role, "chooseModel")),
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
    onFinish: async () => {
      await mcp?.close();
    },
    onError: async (error) => {
      // Close the transports even when the stream fails, or each error leaks one.
      await mcp?.close();
      console.error("ai chat failed", error);
    },
  });

  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
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

import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";

/**
 * The current conversation, kept so that closing the panel does not lose it.
 *
 * Only for signed-in people, and only their own: a guest's conversation stays in the
 * browser and disappears with it, which is the honest default — we have nowhere to put
 * it that is theirs.
 *
 * GET returns the most recent thread. POST replaces its messages with what the client
 * has. Replacing rather than appending because the client already holds the whole
 * thread and is the only one who knows the final shape of a streamed message; making
 * the server reconcile partial appends would invent a synchronisation problem that
 * does not otherwise exist.
 */

const Body = z.object({
  /** The UIMessage array, verbatim, so the tool trace survives. */
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        parts: z.array(z.any()),
      }),
    )
    .max(200),
});

/** Guards every handler and yields the caller, or the response that refuses them. */
async function requireUser() {
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ error: "supabase_not_configured" }, { status: 503 }) };
  }
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "not signed in" }, { status: 401 }) };
  return { supabase, user };
}

export async function GET() {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase } = guard;

  const { data: thread } = await supabase
    .from("ai_conversations")
    .select("id, updated_at")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!thread) return NextResponse.json({ id: null, messages: [] });

  const { data: messages } = await supabase
    .from("ai_messages")
    .select("role, parts")
    .eq("conversation_id", thread.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ id: thread.id, messages: messages ?? [] });
}

export async function POST(request: Request) {
  const guard = await requireUser();
  if ("error" in guard) return guard.error;
  const { supabase, user } = guard;

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("ai_conversations")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let threadId = existing?.id;
  if (!threadId) {
    /*
      The title is the opening question, trimmed. Asking a model to name the thread
      would cost a call and produce something the person never said.
    */
    const first = body.messages.find((m) => m.role === "user");
    const title = firstText(first?.parts)?.slice(0, 80) ?? null;
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ user_id: user.id, title })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: "could not save" }, { status: 500 });
    threadId = data.id;
  }

  // Replace: the client is the authority on the thread's final shape.
  await supabase.from("ai_messages").delete().eq("conversation_id", threadId);
  const { error } = await supabase.from("ai_messages").insert(
    body.messages.map((m) => ({ conversation_id: threadId, role: m.role, parts: m.parts })),
  );
  if (error) return NextResponse.json({ error: "could not save" }, { status: 500 });

  // Bumps updated_at through the trigger, so "most recent" stays meaningful.
  await supabase.from("ai_conversations").update({ title: undefined }).eq("id", threadId);

  return NextResponse.json({ id: threadId, saved: body.messages.length });
}

/** The first text part of a message, which is what a person actually typed. */
function firstText(parts: unknown): string | undefined {
  if (!Array.isArray(parts)) return undefined;
  for (const part of parts) {
    if (part && typeof part === "object" && (part as { type?: string }).type === "text") {
      const text = (part as { text?: unknown }).text;
      if (typeof text === "string") return text;
    }
  }
  return undefined;
}

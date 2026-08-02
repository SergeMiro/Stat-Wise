import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Keeps a simulation for the signed-in household.
 *
 * The user id is never taken from the body: it comes from the session cookie, and
 * the row-level policy checks it again in the database. Two independent checks for
 * the same thing, because "whose row is this" is the one question that must not be
 * answerable by whoever is asking.
 *
 * The payload is a simulation input — a salary, a rent, a child count. It is stored
 * only when someone presses save, never as a side effect of running the simulator.
 */

const Summary = z.object({
  currentCity: z.string().min(1).max(80),
  targetCity: z.string().min(1).max(80),
  targetDistrict: z.string().min(1).max(80),
  deltaResteAVivre: z.number().finite(),
  currentResteAVivre: z.number().finite(),
  targetResteAVivre: z.number().finite(),
});

const Body = z.object({
  kind: z.enum(["job", "quartier", "family"]),
  // The engine input is a large, evolving shape; the engine validates it by using
  // it. What matters here is that it is an object and that it is not enormous.
  input: z.record(z.string(), z.unknown()),
  summary: Summary,
  engineVersion: z.string().min(1).max(32),
  datasetVersion: z.string().min(1).max(64),
});

const MAX_BYTES = 64 * 1024;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  let parsed: z.infer<typeof Body>;
  try {
    parsed = Body.parse(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const { data, error } = await supabase
    .from("simulations")
    .insert({
      user_id: user.id,
      kind: parsed.kind,
      input: parsed.input,
      summary: parsed.summary,
      engine_version: parsed.engineVersion,
      dataset_version: parsed.datasetVersion,
    })
    .select("id")
    .single();

  if (error) {
    // Do not echo the database message: it can name columns and policies.
    return NextResponse.json({ error: "could not save" }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  // The policy restricts this to the owner's rows; the filter is belt and braces.
  const { error } = await supabase.from("simulations").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "could not delete" }, { status: 500 });

  return NextResponse.json({ ok: true });
}

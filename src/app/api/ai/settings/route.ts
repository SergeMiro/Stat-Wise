import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";
import { gatewayById } from "@/lib/ai/providers";

/**
 * Saves the model chain. Admin only, checked here and again by the row policy.
 *
 * The order of the array is the fallback order, so it is stored as given rather than
 * sorted or deduplicated into something the admin did not choose.
 */
const Body = z.object({
  chain: z
    .array(
      z.object({
        gateway: z.string().min(1).max(40),
        model: z.string().min(1).max(120),
      }),
    )
    .max(5),
});

export async function PUT(request: Request) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  /*
    An unknown gateway is refused rather than stored and skipped later. Silently
    dropping it would let an admin save a chain of three and get a chain of two with
    nothing on screen to explain the difference.
  */
  const unknown = body.chain.filter((entry) => !gatewayById(entry.gateway));
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: "unknown_gateway", gateways: unknown.map((u) => u.gateway) },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "not signed in" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { error } = await supabase
    .from("ai_settings")
    .update({ model_chain: body.chain, updated_by: user.id })
    .eq("id", true);

  if (error) {
    console.error("could not save the model chain", error);
    return NextResponse.json({ error: "could not save" }, { status: 500 });
  }

  return NextResponse.json({ saved: body.chain.length });
}

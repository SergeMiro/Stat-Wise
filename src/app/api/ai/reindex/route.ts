import { NextResponse } from "next/server";
import { getDictionary, locales } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";
import { buildCorpus } from "@/lib/ai/documents";

/**
 * Rebuilds the retrieval index from the pages' own copy.
 *
 * Runs as the signed-in admin, not with a service key, so re-indexing after a copy
 * change is a button in the admin panel and not a secret passed around a terminal.
 * Authorisation is checked here *and* by the row-level policy, which is the same
 * belt-and-braces the rest of the API uses: the route decides what to offer, the
 * database decides what is permitted.
 */
export async function POST() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
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

  // Both locales: a question in English should find the English copy.
  const chunks = locales.flatMap((locale) => buildCorpus(locale, getDictionary(locale)));

  /*
    Upsert on the natural key. Delete-then-insert would leave the assistant with an
    empty index while the write is in flight, and permanently empty if it failed
    halfway — the one failure mode that turns a working feature into a silent one.
  */
  const { error } = await supabase
    .from("ai_documents")
    .upsert(
      chunks.map((c) => ({ ...c, updated_at: new Date().toISOString() })),
      { onConflict: "source_path,heading,locale" },
    );

  if (error) {
    // The message can name columns and policies; the count cannot.
    console.error("reindex failed", error);
    return NextResponse.json({ error: "could not index" }, { status: 500 });
  }

  const { count } = await supabase
    .from("ai_documents")
    .select("*", { count: "exact", head: true });

  return NextResponse.json({ indexed: chunks.length, total: count ?? null });
}

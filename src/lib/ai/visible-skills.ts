import "server-only";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";
import { skillsFor } from "./skills";
import type { Role } from "./roles";

/**
 * The skills to show in the panel, for this visitor.
 *
 * Resolved on the server for the same reason the route resolves the role there: the
 * panel showing a switch it may not use would be a lie, and a client claiming a role
 * would be worse. The route repeats the check regardless — this decides what is
 * *offered*, not what is *permitted*.
 */
export async function visibleSkills(): Promise<
  { id: string; label: string; defaultOn: boolean }[]
> {
  const role = await currentRole();
  // French labels for now; the panel is rendered per locale and the dictionary
  // carries the visible strings, so this only needs the id and the default.
  return skillsFor(role).map((s) => ({
    id: s.id,
    label: s.label.fr,
    defaultOn: s.defaultOn,
  }));
}

async function currentRole(): Promise<Role> {
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
    return "guest";
  }
}

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
export async function visibleSkills(): Promise<{
  skills: { id: string; label: string; defaultOn: boolean }[];
  /** Whether this visitor has somewhere to keep a conversation. */
  canPersist: boolean;
}> {
  const role = await currentRole();
  // French labels for now; the panel is rendered per locale and the dictionary
  // carries the visible strings, so this only needs the id and the default.
  return {
    skills: skillsFor(role).map((s) => ({
      id: s.id,
      label: s.label.fr,
      defaultOn: s.defaultOn,
    })),
    /*
      A guest has no thread to restore, and asking for one puts a 401 in every
      visitor's console. Nothing breaks, but a console full of expected errors is how
      a real one goes unnoticed.
    */
    canPersist: role !== "guest",
  };
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

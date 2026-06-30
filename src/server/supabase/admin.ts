import { createClient } from "@supabase/supabase-js";
import { getPublicSupabaseEnv, getServiceRoleKey } from "./env";

/**
 * Service-role client for trusted server jobs (imports, admin operations).
 * Bypasses RLS — never import this from client code or expose its key.
 */
export function createSupabaseAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("createSupabaseAdminClient must only run on the server");
  }
  const { url } = getPublicSupabaseEnv();
  return createClient(url, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

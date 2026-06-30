import { createBrowserClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "./env";

/** Supabase client for use in Client Components (browser). Anon key only. */
export function createSupabaseBrowserClient() {
  const { url, anonKey } = getPublicSupabaseEnv();
  return createBrowserClient(url, anonKey);
}

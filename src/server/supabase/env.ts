/**
 * Whether accounts are available in this environment.
 *
 * A preview deploy or a fresh clone has no Supabase keys, and a sign-in page that
 * answers 500 is worse than one that says the feature is not wired up here. Pages
 * ask this first and degrade; only code that has already checked calls the getter.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Public Supabase configuration, safe to expose to the browser. */
export function getPublicSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (see .env.example)",
    );
  }
  return { url, anonKey };
}

/** Service-role key — server runtime / jobs only. Never imported in client code. */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY (server-only secret)");
  return key;
}

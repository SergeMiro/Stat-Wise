import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/server/supabase/server";

/**
 * Where the button in the confirmation email lands.
 *
 * Supabase sends a one-time code; this exchanges it for a session cookie and
 * sends the reader on. It is the only place a session is created, which is why
 * the redirect target is checked rather than trusted: `next` arrives in a URL
 * the user clicked in an email, and an open redirect there would let someone
 * else's link carry a freshly signed-in visitor to a page of their choosing.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");

  // Relative paths only, and no protocol-relative "//evil.com" either.
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : "/fr/app/account";

  if (!code) {
    return NextResponse.redirect(new URL("/fr/sign-in?error=missing_code", url.origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    // Expired or already-used links are the common case, not an incident.
    return NextResponse.redirect(new URL("/fr/sign-in?error=link_expired", url.origin));
  }

  return NextResponse.redirect(new URL(target, url.origin));
}

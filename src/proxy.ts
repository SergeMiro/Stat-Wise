import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { locales, negotiateLocale } from "@/lib/i18n";

/**
 * Locale routing (Next 16 renamed `middleware` -> `proxy`). Redirects any path
 * without a locale prefix to the visitor's preferred locale (fr default).
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return NextResponse.next();

  const locale = negotiateLocale(request.headers.get("accept-language"));
  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  /*
    Skip Next internals, the API, the auth callback, and any file with an
    extension (static assets).

    `/auth/callback` has to be excluded explicitly: it is the URL inside the
    confirmation email, and it carries a single-use code. Prefixing it with a
    locale redirects the browser, and Supabase's code is consumed by — or lost
    on — that hop, so every confirmation link would fail. It is not a page and
    has nothing to translate.
  */
  matcher: ["/((?!_next|api|auth|.*\\..*).*)"],
};

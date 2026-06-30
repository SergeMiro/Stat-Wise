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
  // Skip Next internals, the API, and any file with an extension (static assets).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};

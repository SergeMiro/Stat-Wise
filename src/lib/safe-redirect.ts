/**
 * Where a confirmation link may send someone once it has signed them in.
 *
 * `next` arrives inside a URL the visitor clicked in an email, so it is attacker
 * controlled in the case that matters: a link crafted by someone else, opened by a
 * person who then lands on a page of the attacker's choosing while freshly
 * authenticated. Only same-site paths are allowed through.
 */
export function safeRedirect(next: string | null | undefined, fallback: string): string {
  if (!next) return fallback;
  // Must be a path, and not a protocol-relative "//evil.com".
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  /*
    Backslashes and control characters are the ones that get missed: browsers
    normalise "/\evil.com" into "//evil.com" and strip whitespace before resolving,
    so a naive startsWith check lets them through.
  */
  if (/[\\\s]/.test(next)) return fallback;
  return next;
}

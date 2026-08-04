/** Our own top-level routes, under a locale prefix. */
const OWN_ROUTES = [
  "app",
  "coverage",
  "methodology",
  "privacy",
  "sign-in",
  "sources",
  "terms",
] as const;

/**
 * Recovers the path from a link the model gave an absolute host.
 *
 * Observed in production: `searchDocs` returned `/fr/methodology#donnees-manquantes`
 * and the answer cited `https://wherewise.com/fr/methodology#donnees-manquantes` — a
 * domain nobody owns. Rendered as written it becomes a link off the site to a host we
 * do not control, which is a worse outcome than a broken fragment: it looks like our
 * documentation and is not.
 *
 * Only a path that matches one of our own routes under a locale is taken back. An
 * external page that merely happens to start with `/fr/` — a French section of
 * insee.fr, say — is left alone, because rewriting that would break a real citation to
 * a real source.
 */
export function ownPath(target: string): string | null {
  let url: URL;
  try {
    url = new URL(target);
  } catch {
    return null;
  }
  const match = /^\/(fr|en)\/([^/?#]+)/.exec(url.pathname);
  if (!match) return null;
  if (!OWN_ROUTES.includes(match[2] as (typeof OWN_ROUTES)[number])) return null;
  return `${url.pathname}${url.hash}`;
}

/**
 * Anchor slug for a section heading.
 *
 * Shared on purpose. The retrieval index stores an anchor per chunk so a citation can
 * link to the exact section, and the page has to put the matching `id` on that section.
 * Two copies of this function would be two things to keep in step, and the failure is
 * silent: the link resolves, the page loads, and nothing scrolls. Which is exactly what
 * happened — the index promised `/fr/methodology#donnees-manquantes` while the page
 * rendered no ids at all, so every citation the assistant produced landed at the top of
 * the page.
 */
export const slug = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

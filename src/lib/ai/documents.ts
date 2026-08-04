import type { Dictionary } from "@/lib/i18n";

/**
 * The corpus the assistant may quote from: the copy already on our own pages.
 *
 * Built from the dictionary rather than read off disk or scraped from HTML. The
 * dictionary *is* the source of that text, so an index built from it cannot drift
 * from what a reader sees, and it is bundled — which means indexing needs no
 * filesystem and works in a serverless function.
 *
 * The NOTES directory is deliberately absent. It holds engineering notes: decisions,
 * traps, security holes closed, work still owed. `ai_documents` is readable by
 * anyone, so indexing them would publish them.
 */

export type DocumentChunk = {
  source_path: string;
  title: string;
  heading: string | null;
  anchor: string | null;
  locale: "fr" | "en";
  content: string;
};

/** Anchor slug, so a citation can link to the exact section. */
const slug = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function buildCorpus(locale: "fr" | "en", dict: Dictionary): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  const prefix = `/${locale}`;

  for (const section of dict.pages.methodology.sections) {
    chunks.push({
      source_path: `${prefix}/methodology`,
      title: dict.pages.methodology.title,
      heading: section.title,
      anchor: `#${slug(section.title)}`,
      locale,
      content: section.body,
    });
  }

  for (const section of dict.pages.privacy.sections) {
    const rows = "rows" in section && section.rows ? section.rows : [];
    const items = "items" in section && section.items ? section.items : [];
    chunks.push({
      source_path: `${prefix}/privacy`,
      title: dict.pages.privacy.title,
      heading: section.title,
      anchor: null,
      locale,
      content: [
        section.body,
        ...items,
        // Flattened: a table row reads as a sentence to a search index.
        ...rows.map((r) => `${r.what} — ${r.data} — ${r.why} — ${r.basis}`),
      ].join("\n"),
    });
  }

  for (const [code, limit] of Object.entries(dict.pages.sources.limits)) {
    chunks.push({
      source_path: `${prefix}/sources`,
      title: dict.pages.sources.title,
      heading: code,
      anchor: null,
      locale,
      content: `${dict.pages.sources.limitTitle} (${code}) : ${limit}`,
    });
  }

  for (const item of dict.pages.coverage
    ? [dict.pages.coverage.intro, dict.pages.coverage.richDesc, dict.pages.coverage.limitedDesc]
    : []) {
    chunks.push({
      source_path: `${prefix}/coverage`,
      title: dict.pages.coverage.title,
      heading: item.slice(0, 60),
      anchor: null,
      locale,
      content: item,
    });
  }

  return chunks;
}

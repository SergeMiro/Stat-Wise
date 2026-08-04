import { fill, type Dictionary } from "@/lib/i18n";
import { SITE_PUBLISHER } from "@/lib/site-publisher";
import { slug } from "@/lib/slug";

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
        /*
          Substituted exactly as the page substitutes it. Indexing the raw template
          put the literal "{publisher}" into the corpus, so the assistant could quote
          a placeholder back to a reader as the name of the data controller — and it
          broke this file's own promise that an index built from the dictionary cannot
          drift from what a reader sees. Building from the same source is only half of
          that promise; rendering it the same way is the other half.
        */
        fill(section.body, { publisher: SITE_PUBLISHER.name }),
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

  /*
    Coverage as one chunk, with each line under the label the page gives it.

    It used to be three chunks whose heading was `item.slice(0, 60)` — the body text
    cut mid-word. That put "Où WhereWise dispose de données suffisantes, et où les
    résul" into the index as a section name, and two of the three chunks had a heading
    identical to their own content. A citation pointing at a truncated sentence is
    worse than no citation, because it looks like a real section.
  */
  const coverage = dict.pages.coverage;
  if (coverage) {
    chunks.push({
      source_path: `${prefix}/coverage`,
      title: coverage.title,
      heading: coverage.title,
      anchor: null,
      locale,
      content: [
        coverage.intro,
        `${coverage.richTitle} — ${coverage.richDesc}`,
        `${coverage.limitedTitle} — ${coverage.limitedDesc}`,
      ].join("\n"),
    });
  }

  return chunks;
}

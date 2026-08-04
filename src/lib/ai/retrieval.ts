import "server-only";
import { tool } from "ai";
import { z } from "zod";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";

/**
 * Retrieval, behind an interface, with the reason for the current implementation
 * written down so the next person can tell whether it still holds.
 *
 * It is Postgres full-text search with the French dictionary, not embeddings. The
 * corpus is about twenty sections of our own pages. At that size what decides answer
 * quality is whether the text is indexed at all, and Postgres brings real stemming
 * and stop words for French with no model, no GPU and no second datastore. A question
 * about "SISPEA" finds SISPEA — an embedding of a rare proper noun often does not.
 *
 * Switch to pgvector — the extension is available in this project — when either of
 * these becomes true, and not before:
 *
 *   1. the corpus passes a few hundred chunks, where keyword recall starts to thin;
 *   2. questions phrased around a word the documents never use start missing their
 *      answer. That is the failure keywords have and vectors do not.
 *
 * The interface is what makes that a new implementation rather than a rewrite.
 */

export type RetrievedChunk = {
  title: string;
  heading: string | null;
  path: string;
  anchor: string | null;
  content: string;
};

export interface Retriever {
  search(query: string, locale: "fr" | "en", limit?: number): Promise<RetrievedChunk[]>;
}

/** Ranked by Postgres, which owns both the index and the ranking. */
export const postgresRetriever: Retriever = {
  async search(query, locale, limit = 5) {
    if (!isSupabaseConfigured()) return [];
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.rpc("search_ai_documents", {
        query,
        wanted_locale: locale,
        max_rows: limit,
      });
      if (error) {
        // Retrieval failing must not fail the answer; it makes it less grounded.
        console.warn("retrieval failed", error.message);
        return [];
      }
      type Row = {
        title: string;
        heading: string | null;
        source_path: string;
        anchor: string | null;
        content: string;
      };
      return ((data ?? []) as Row[]).map((row) => ({
        title: row.title,
        heading: row.heading,
        path: row.source_path,
        anchor: row.anchor,
        content: row.content,
      }));
    } catch {
      return [];
    }
  },
};

/**
 * The tool the model calls.
 *
 * It returns the passages and their links and nothing else — no summary, no
 * "relevance" it made up. Summarising here would put a second, invisible model
 * between the document and the answer, and the citation would then point at text the
 * reader was never shown.
 */
export const searchDocsTool = (locale: "fr" | "en", retriever: Retriever = postgresRetriever) =>
  tool({
    description:
      "Search WhereWise's own published pages — methodology, sources, privacy, " +
      "coverage — for passages that answer a question about how the product works, " +
      "what it measures, or what it does with data. Quote them and cite the link.",
    inputSchema: z.object({
      query: z.string().min(2).max(200).describe("the question, in the reader's own words"),
    }),
    execute: async ({ query }) => {
      const passages = await retriever.search(query, locale);
      if (passages.length === 0) {
        return {
          passages: [],
          note: "Nothing matched. Say so rather than answering from memory.",
        };
      }
      return {
        passages: passages.map((p) => ({
          title: p.title,
          heading: p.heading,
          link: p.anchor ? `${p.path}${p.anchor}` : p.path,
          text: p.content,
        })),
      };
    },
  });

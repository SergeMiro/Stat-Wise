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

/**
 * Why this is a result type and not just an array.
 *
 * An empty array cannot say *why* it is empty, and the three reasons need different
 * answers: the question genuinely matches nothing, the index was never built, or the
 * search itself broke. Collapsing them made the assistant tell a reader "nothing
 * matched" while retrieval was in fact unreachable — a confident false statement,
 * which is the one thing this whole feature is built to avoid. Found by probing the
 * live endpoint: the index held zero rows and the answer still read like a finding.
 */
export type RetrievalOutcome =
  | { status: "ok"; chunks: RetrievedChunk[] }
  | { status: "empty" }
  | { status: "unavailable"; reason: string };

export interface Retriever {
  search(query: string, locale: "fr" | "en", limit?: number): Promise<RetrievalOutcome>;
}

/** Ranked by Postgres, which owns both the index and the ranking. */
export const postgresRetriever: Retriever = {
  async search(query, locale, limit = 5) {
    if (!isSupabaseConfigured()) {
      return { status: "unavailable", reason: "no database configured" };
    }
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.rpc("search_ai_documents", {
        query,
        wanted_locale: locale,
        max_rows: limit,
      });
      if (error) {
        // Retrieval failing must not fail the answer; it makes it ungrounded, and the
        // model has to be told which of the two it is.
        console.warn("retrieval failed", error.message);
        return { status: "unavailable", reason: error.message };
      }
      type Row = {
        title: string;
        heading: string | null;
        source_path: string;
        anchor: string | null;
        content: string;
      };
      const chunks = ((data ?? []) as Row[]).map((row) => ({
        title: row.title,
        heading: row.heading,
        path: row.source_path,
        anchor: row.anchor,
        content: row.content,
      }));
      if (chunks.length > 0) return { status: "ok", chunks };

      /*
        Nothing came back. Ask whether anything is indexed at all before calling it a
        non-match: an unbuilt index answers every question with silence, and that is a
        fact about us, not about the question.
      */
      const { count, error: countError } = await supabase
        .from("ai_documents")
        .select("*", { count: "exact", head: true })
        .eq("locale", locale);
      if (countError) return { status: "unavailable", reason: countError.message };
      return count && count > 0
        ? { status: "ok", chunks: [] }
        : { status: "empty" };
    } catch (error) {
      return {
        status: "unavailable",
        reason: error instanceof Error ? error.message : String(error),
      };
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
      const outcome = await retriever.search(query, locale);

      if (outcome.status === "unavailable") {
        return {
          passages: [],
          note:
            "Document search is unavailable right now, so this answer cannot be " +
            "grounded in our pages. Tell the reader that the search is down and " +
            "point them at /methodology and /sources. Do not answer from memory.",
        };
      }
      if (outcome.status === "empty") {
        return {
          passages: [],
          note:
            "The document index is empty — nothing has been indexed yet. This is not " +
            "an answer about the question. Say the index is not built and point the " +
            "reader at /methodology and /sources. Do not answer from memory.",
        };
      }
      if (outcome.chunks.length === 0) {
        return {
          passages: [],
          note: "Nothing matched. Say so rather than answering from memory.",
        };
      }
      return {
        passages: outcome.chunks.map((p) => ({
          title: p.title,
          heading: p.heading,
          link: p.anchor ? `${p.path}${p.anchor}` : p.path,
          text: p.content,
        })),
      };
    },
  });

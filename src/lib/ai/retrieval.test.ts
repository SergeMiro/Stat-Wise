import { describe, expect, it } from "vitest";
import { searchDocsTool, type Retriever, type RetrievalOutcome } from "./retrieval";

/**
 * These tests exist because of a real defect, not for coverage.
 *
 * The index held zero rows and `searchDocs` answered "nothing matched", so the
 * assistant told a reader its own documentation had no answer — a confident false
 * statement about our pages. The three outcomes must stay distinguishable, and the
 * note handed to the model must never invite it to fill the gap from memory.
 */

const fake = (outcome: RetrievalOutcome): Retriever => ({
  async search() {
    return outcome;
  },
});

const run = async (outcome: RetrievalOutcome) => {
  const t = searchDocsTool("fr", fake(outcome));
  /*
    The SDK passes call metadata as a second argument and nothing here reads it. Cast
    rather than construct: the real type carries a generic `context` the SDK fills in,
    and satisfying it honestly would mean asserting things about the runtime that this
    test does not exercise.
  */
  const options = { toolCallId: "test", messages: [] } as unknown as Parameters<
    NonNullable<typeof t.execute>
  >[1];
  return (await t.execute?.({ query: "données manquantes" }, options)) as {
    passages: unknown[];
    note?: string;
  };
};

describe("searchDocs", () => {
  it("says the search is down when retrieval is unavailable", async () => {
    const out = await run({ status: "unavailable", reason: "connection refused" });
    expect(out.passages).toEqual([]);
    expect(out.note).toMatch(/unavailable/i);
    // The reason can name a host or a policy; it is for our logs, not the reader.
    expect(out.note).not.toContain("connection refused");
  });

  it("says the index is not built when nothing is indexed", async () => {
    const out = await run({ status: "empty" });
    expect(out.passages).toEqual([]);
    expect(out.note).toMatch(/index is empty|not built/i);
  });

  it("distinguishes an unbuilt index from a genuine non-match", async () => {
    const empty = await run({ status: "empty" });
    const noMatch = await run({ status: "ok", chunks: [] });
    expect(noMatch.note).toMatch(/nothing matched/i);
    expect(empty.note).not.toEqual(noMatch.note);
  });

  it("never lets the model answer from memory on any empty outcome", async () => {
    for (const outcome of [
      { status: "unavailable", reason: "x" },
      { status: "empty" },
      { status: "ok", chunks: [] },
    ] as RetrievalOutcome[]) {
      const out = await run(outcome);
      expect(out.note).toMatch(/from memory/i);
    }
  });

  it("returns passages with a link built from path and anchor", async () => {
    const out = (await run({
      status: "ok",
      chunks: [
        {
          title: "Méthodologie",
          heading: "Données manquantes",
          path: "/fr/methodology",
          anchor: "#donnees-manquantes",
          content: "Une donnée absente ne compte pas pour zéro.",
        },
        {
          title: "Sources",
          heading: null,
          path: "/fr/sources",
          anchor: null,
          content: "SISPEA.",
        },
      ],
    })) as { passages: { link: string }[]; note?: string };

    expect(out.passages.map((p) => p.link)).toEqual([
      "/fr/methodology#donnees-manquantes",
      "/fr/sources",
    ]);
    expect(out.note).toBeUndefined();
  });
});

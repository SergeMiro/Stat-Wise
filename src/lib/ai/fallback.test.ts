import { describe, expect, it, vi } from "vitest";
import { MockLanguageModelV3 } from "ai/test";
import type { LanguageModelV3StreamPart } from "@ai-sdk/provider";

/**
 * These tests exist because of a real defect on production, not for coverage.
 *
 * Thinking out loud used to count as answering. The first model in the chain emitted
 * a reasoning fragment within a second, the chain committed to it, and it then spent
 * the entire sixty-second budget deliberating — 4 628 fragments, zero answer tokens —
 * until the platform killed the function mid-part. The reader saw the tool calls and
 * then nothing at all, and the two working models behind it were never tried.
 *
 * So: deliberation is not output, and a committed stream must end on its own terms
 * before the platform ends it for us.
 */

const { registry } = vi.hoisted(() => ({
  registry: new Map<string, unknown>(),
}));

vi.mock("./providers", () => ({
  buildModel: (ref: { model: string }) => registry.get(ref.model) ?? null,
}));

const { streamWithFallback } = await import("./fallback");

/** A model whose stream is exactly the parts given, in order. */
const model = (id: string, parts: LanguageModelV3StreamPart[], hang = false) => {
  registry.set(
    id,
    new MockLanguageModelV3({
      doStream: async () => ({
        stream: new ReadableStream<LanguageModelV3StreamPart>({
          start(controller) {
            for (const part of parts) controller.enqueue(part);
            // `hang` leaves the stream open forever: the deadline must be what ends it.
            if (!hang) controller.close();
          },
        }),
      }),
    }),
  );
  return { gateway: "openrouter" as const, model: id };
};

const START: LanguageModelV3StreamPart = { type: "stream-start", warnings: [] };
const FINISH: LanguageModelV3StreamPart = {
  type: "finish",
  finishReason: { unified: "stop", raw: "stop" },
  usage: {
    inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
    outputTokens: { total: 1, text: 1, reasoning: 0 },
  },
};

const thinks = (id: string, hang = false) =>
  model(
    id,
    [
      START,
      { type: "reasoning-start", id: "r" },
      ...Array.from({ length: 40 }, (): LanguageModelV3StreamPart => ({
        type: "reasoning-delta",
        id: "r",
        delta: "hmm ",
      })),
    ],
    hang,
  );

const answers = (id: string, text: string, hang = false) =>
  model(
    id,
    [
      START,
      { type: "text-start", id: "t" },
      { type: "text-delta", id: "t", delta: text },
      { type: "text-end", id: "t" },
      ...(hang ? [] : [FINISH]),
    ],
    hang,
  );

const run = (
  chain: { gateway: "openrouter"; model: string }[],
  deadline?: number,
) =>
  streamWithFallback(chain, {
    instructions: "test",
    messages: [{ role: "user", content: "combien ?" }],
    deadline,
  });

const collect = async (stream: ReadableStream<{ type: string }>) => {
  const parts: { type: string }[] = [];
  for await (const part of stream as unknown as AsyncIterable<{ type: string }>) {
    parts.push(part);
  }
  return parts;
};

describe("streamWithFallback", () => {
  it("does not commit to a model that only thinks, and moves on to one that answers", async () => {
    const result = await run([thinks("all-talk"), answers("useful", "560 €")]);

    if ("failed" in result) throw new Error("expected the second model to answer");
    expect(result.used.model).toBe("useful");
    expect(result.skipped.map((s) => s.ref.model)).toEqual(["all-talk"]);

    const parts = await collect(result.stream);
    const text = parts
      .filter((p): p is { type: string; text: string } => p.type === "text-delta")
      .map((p) => p.text)
      .join("");
    expect(text).toContain("560 €");

    /*
      And it runs to its own end. Without a deadline there is nothing to race against,
      which sounds like the trivial case and is not: `setTimeout` with an infinite
      delay fires after a millisecond, so an unguarded race cut every answer short
      here while still letting the assertion above pass on the buffered first part.
    */
    expect(parts.some((p) => p.type === "abort")).toBe(false);
    expect(parts.at(-1)?.type).toBe("finish");
  });

  it("gives up on a model that is still thinking when its window closes", async () => {
    const result = await run([thinks("never-answers", true)], Date.now() + 300);

    if (!("failed" in result)) throw new Error("expected no model to answer");
    expect(result.failed[0].reason).toMatch(/no answer in/);
  });

  it("ends a committed stream with an abort rather than letting it be cut", async () => {
    const result = await run([answers("stalls", "560 € puis", true)], Date.now() + 300);

    if ("failed" in result) throw new Error("expected the model to be committed to");
    const parts = await collect(result.stream);
    expect(parts.at(-1)).toEqual({ type: "abort", reason: "deadline" });
    expect(parts.some((p) => p.type === "text-delta")).toBe(true);
  });

  it("reports every model it could not use, rather than swallowing the reasons", async () => {
    const result = await run([
      { gateway: "openrouter", model: "no-such-key" },
      answers("useful", "560 €"),
    ]);

    if ("failed" in result) throw new Error("expected the second model to answer");
    expect(result.skipped).toEqual([
      { ref: { gateway: "openrouter", model: "no-such-key" }, reason: "no key for this gateway" },
    ]);
  });
});

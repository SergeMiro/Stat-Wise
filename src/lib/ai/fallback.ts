import "server-only";
import { streamText, type TextStreamPart, type ToolSet } from "ai";
import { buildModel, type ModelRef } from "./providers";

/**
 * Tries each model in turn and streams from the first one that actually answers.
 *
 * The hard part is not choosing a model, it is that a stream commits you. Once bytes
 * reach the browser you cannot quietly switch — the reader would see half an answer
 * from one model and half from another. So each candidate is probed *before* anything
 * is forwarded: we pull parts until the stream either fails or produces something
 * real, and only then does that stream become the response.
 *
 * What counts as a failure, in order of how often it happens on a free tier:
 *
 *   - no key for the gateway, so `buildModel` returns null and we never call it;
 *   - an `error` part, which is how the SDK reports a 401, a 429 or an unknown model;
 *   - a throw while opening the stream, which is a network or DNS failure.
 *
 * What does *not* trigger a fallback: a model that answers badly. Quality is not
 * something this can judge, and retrying on it would double the cost of every request
 * to swap one opinion for another.
 */

export type FallbackResult = {
  /** Ready to hand to `toUIMessageStream`. */
  stream: ReadableStream<TextStreamPart<ToolSet>>;
  /** The model that answered, for logging and for the panel to show. */
  used: ModelRef;
  /** The ones that did not, with why. Reported, never swallowed. */
  skipped: { ref: ModelRef; reason: string }[];
};

/**
 * What the caller supplies, minus the model this chooses.
 *
 * Spelled out rather than derived from `streamText`'s own parameter type: that type is
 * a large intersection whose `messages` is required in one branch and absent in
 * another, so `Omit` on it produces something no caller can satisfy.
 */
type StreamOptions = {
  instructions: string;
  messages: Parameters<typeof streamText>[0]["messages"];
  tools?: ToolSet;
  stopWhen?: Parameters<typeof streamText>[0]["stopWhen"];
};

/** Parts that mean the model is really answering rather than warming up. */
const isRealOutput = (part: TextStreamPart<ToolSet>): boolean =>
  part.type === "text-delta" ||
  part.type === "tool-call" ||
  part.type === "reasoning-delta" ||
  part.type === "finish";

export async function streamWithFallback(
  chain: readonly ModelRef[],
  options: StreamOptions,
): Promise<FallbackResult | { failed: { ref: ModelRef; reason: string }[] }> {
  const skipped: { ref: ModelRef; reason: string }[] = [];

  for (const ref of chain) {
    const model = buildModel(ref);
    if (!model) {
      skipped.push({ ref, reason: "no key for this gateway" });
      continue;
    }

    let result: ReturnType<typeof streamText>;
    try {
      result = streamText({ ...options, model } as Parameters<typeof streamText>[0]);
    } catch (error) {
      skipped.push({ ref, reason: describe(error) });
      continue;
    }

    const iterator = result.stream[Symbol.asyncIterator]();
    const buffered: TextStreamPart<ToolSet>[] = [];
    let usable = false;
    let failure: string | null = null;

    /*
      Probe. The loop is bounded: a stream that emits only start-ish parts forever is
      itself a failure, and waiting for it would hang the request rather than fall
      back.
    */
    for (let step = 0; step < 12 && !usable && failure === null; step += 1) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          failure = "stream ended without output";
          break;
        }
        if (value.type === "error") {
          failure = describe((value as { error?: unknown }).error);
          break;
        }
        buffered.push(value);
        if (isRealOutput(value)) usable = true;
      } catch (error) {
        failure = describe(error);
      }
    }

    if (!usable) {
      skipped.push({ ref, reason: failure ?? "no output before the probe gave up" });
      // Let go of the abandoned stream so its connection is not left open.
      await iterator.return?.().catch(() => undefined);
      continue;
    }

    /*
      Replay what the probe consumed, then hand over the rest. Without the replay the
      answer would be missing its first words — the most obvious possible bug and the
      easiest to introduce here.
    */
    const stream = new ReadableStream<TextStreamPart<ToolSet>>({
      async pull(controller) {
        if (buffered.length > 0) {
          controller.enqueue(buffered.shift()!);
          return;
        }
        try {
          const { value, done } = await iterator.next();
          if (done) controller.close();
          else controller.enqueue(value);
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel() {
        await iterator.return?.().catch(() => undefined);
      },
    });

    return { stream, used: ref, skipped };
  }

  return { failed: skipped };
}

const describe = (error: unknown): string =>
  error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200);

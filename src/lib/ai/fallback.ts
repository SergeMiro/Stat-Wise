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
 *   - a throw while opening the stream, which is a network or DNS failure;
 *   - deliberation with nothing to show for it, past `FIRST_OUTPUT_MS`.
 *
 * That last one was learned the hard way. Thinking out loud used to count as output,
 * so the first model in the chain was committed to the moment it emitted a reasoning
 * fragment — which free reasoning models do within a second. One measured request
 * streamed 4 628 fragments of deliberation and zero answer tokens before the platform
 * killed the function at sixty seconds; the reader saw the tool calls, then silence,
 * and the two healthy models behind it in the chain were never tried. A stream that
 * is thinking is alive, but being alive is not answering.
 *
 * What does *not* trigger a fallback: a model that answers badly. Quality is not
 * something this can judge, and retrying on it would double the cost of every request
 * to swap one opinion for another.
 */

/** How long a candidate gets to produce something that is not deliberation. */
const FIRST_OUTPUT_MS = 12_000;

/**
 * A ceiling on parts held during the probe, so a model that floods reasoning cannot
 * grow the buffer without bound. Generous: at the fastest rate measured (~77 parts a
 * second) this is well past `FIRST_OUTPUT_MS`, so in practice the clock decides.
 */
const MAX_BUFFERED_PARTS = 4_000;

const TIMED_OUT = Symbol("timed out");

/**
 * Resolves to `TIMED_OUT` after `ms`, and never leaves a timer behind.
 *
 * A non-finite `ms` means there is no deadline, and the promise is simply awaited.
 * The guard is not theoretical: `setTimeout(fn, Infinity)` does not wait forever, it
 * overflows the 32-bit delay and fires after **one millisecond**, which turned "no
 * deadline" into "abort immediately". Found by a test, not by reading.
 */
function race<T>(promise: Promise<T>, ms: number): Promise<T | typeof TIMED_OUT> {
  if (!Number.isFinite(ms)) return promise;
  let timer: ReturnType<typeof setTimeout>;
  const clock = new Promise<typeof TIMED_OUT>((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), ms);
  });
  return Promise.race([promise, clock]).finally(() => clearTimeout(timer));
}

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
  /**
   * When the whole attempt must be over, as an epoch millisecond.
   *
   * The caller knows what the platform will allow; this ends the stream a little
   * before that so the reader gets a finished answer and an `abort` rather than a
   * sentence cut in half by a killed function.
   */
  deadline?: number;
};

/**
 * Parts that mean the model is really answering rather than warming up.
 *
 * Two absences are deliberate. `reasoning-delta`, for the reason at the top of the
 * file. And `finish`: a stream that completes having said nothing has not answered
 * either — that is the shape of the empty-content failure already seen on this free
 * tier, and treating it as success hands the reader a blank reply while the working
 * models sit unused behind it in the chain.
 */
const isRealOutput = (part: TextStreamPart<ToolSet>): boolean =>
  part.type === "text-delta" || part.type === "tool-call";

export async function streamWithFallback(
  chain: readonly ModelRef[],
  { deadline, ...options }: StreamOptions,
): Promise<FallbackResult | { failed: { ref: ModelRef; reason: string }[] }> {
  const skipped: { ref: ModelRef; reason: string }[] = [];
  /** Time left overall, or forever when the caller set no deadline. */
  const remaining = () => (deadline === undefined ? Infinity : deadline - Date.now());

  for (const ref of chain) {
    if (remaining() <= 0) {
      skipped.push({ ref, reason: "out of time before this one was tried" });
      continue;
    }
    const model = buildModel(ref);
    if (!model) {
      skipped.push({ ref, reason: "no key for this gateway" });
      continue;
    }

    /*
      Its own controller, so abandoning a candidate actually closes the connection to
      the gateway. Releasing the iterator alone leaves the request running at the
      other end, and on a free tier that counts against the next one.
    */
    const abort = new AbortController();

    let result: ReturnType<typeof streamText>;
    try {
      result = streamText({
        ...options,
        model,
        abortSignal: abort.signal,
      } as Parameters<typeof streamText>[0]);
    } catch (error) {
      skipped.push({ ref, reason: describe(error) });
      continue;
    }

    const iterator = result.stream[Symbol.asyncIterator]();
    const abandon = async (): Promise<void> => {
      abort.abort();
      await iterator.return?.().catch(() => undefined);
    };

    const buffered: TextStreamPart<ToolSet>[] = [];
    let usable = false;
    let failure: string | null = null;

    /*
      Probe, bounded by the clock rather than by a count of parts. Counting was the
      old bound and it measured the wrong thing: twelve parts is a second of
      deliberation from one model and a whole answer from another.
    */
    const probeStarted = Date.now();
    const probeUntil = probeStarted + Math.min(FIRST_OUTPUT_MS, remaining());
    while (!usable && failure === null) {
      const left = probeUntil - Date.now();
      if (left <= 0) {
        failure = `no answer in ${((Date.now() - probeStarted) / 1000).toFixed(1)}s`;
        break;
      }
      if (buffered.length >= MAX_BUFFERED_PARTS) {
        failure = `${MAX_BUFFERED_PARTS} parts and no answer`;
        break;
      }
      try {
        const next = await race(iterator.next(), left);
        if (next === TIMED_OUT) continue;
        const { value, done } = next;
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
      await abandon();
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
        /*
          End on our own terms when the deadline arrives. The platform's own timeout
          severs the connection mid-part: the reader is left with a half sentence and
          no signal that anything went wrong, and that silence is exactly the bug this
          file now exists to prevent. An `abort` part terminates the message properly,
          keeping whatever was already said.
        */
        const left = remaining();
        if (left <= 0) {
          controller.enqueue({ type: "abort", reason: "deadline" });
          controller.close();
          await abandon();
          return;
        }
        try {
          const next = await race(iterator.next(), left);
          if (next === TIMED_OUT) {
            controller.enqueue({ type: "abort", reason: "deadline" });
            controller.close();
            await abandon();
            return;
          }
          const { value, done } = next;
          if (done) controller.close();
          else controller.enqueue(value);
        } catch (error) {
          controller.error(error);
        }
      },
      async cancel() {
        await abandon();
      },
    });

    return { stream, used: ref, skipped };
  }

  return { failed: skipped };
}

const describe = (error: unknown): string =>
  error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200);

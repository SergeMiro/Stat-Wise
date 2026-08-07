import "server-only";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { LanguageModel } from "ai";

/**
 * The gateways we can reach, and the models an admin may put in front of visitors.
 *
 * All three speak the OpenAI wire format, so one factory covers them: adding a fourth
 * is a row in `GATEWAYS`, not a new dependency. That is the same reason the Vercel AI
 * Gateway was chosen earlier and it still applies — what changes here is that the key
 * belongs to a free tier we already hold rather than to a paid account.
 *
 * A gateway with no key in the environment is not offered. Listing it would put a
 * model in the admin's chooser that answers every request with a 401.
 */

export type GatewayId = "opencode" | "openrouter" | "kilo";

type Gateway = {
  id: GatewayId;
  label: string;
  baseURL: string;
  /** Env var holding the key. Absent value means the gateway is unavailable. */
  env: string;
  /** Where the free tier is documented, for the admin console. */
  docs: string;
};

export const GATEWAYS: readonly Gateway[] = [
  {
    id: "opencode",
    label: "OpenCode Zen",
    baseURL: "https://opencode.ai/zen/v1",
    env: "OPENCODE_ZEN_API_KEY",
    docs: "https://opencode.ai/zen",
    /*
      Kept selectable but not in the default chain. Probed from this server with a
      valid key, every model returned HTTP 403 with Cloudflare error 1010, which is
      the "blocked client" code — Zen appears to refuse non-browser callers. It works
      from the OpenCode CLI on the same key, so the credential is fine and the path
      is not. Left here so it can be tried again without a code change.
    */
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    baseURL: "https://openrouter.ai/api/v1",
    env: "OPENROUTER_API_KEY",
    docs: "https://openrouter.ai/models?max_price=0",
  },
  {
    id: "kilo",
    label: "Kilo Gateway",
    /*
      Confirmed against the live endpoint, because this URL was first written from
      memory and that is exactly how the three wrong model ids got here. `/models`
      answers 347 models with this key; `kilocode.ai/api/openrouter` and
      `kilocode.ai/api/v1` both 308, and `api.kilocode.ai/v1` 404. 14 of the 347 are
      free and 11 of those take tool calls.
    */
    baseURL: "https://api.kilo.ai/api/gateway",
    env: "KILO_API_KEY",
    docs: "https://kilocode.ai/docs",
  },
];

export const gatewayById = (id: string): Gateway | undefined =>
  GATEWAYS.find((g) => g.id === id);

/** Which gateways actually have a key here. */
export const availableGateways = (): GatewayId[] =>
  GATEWAYS.filter((g) => Boolean(process.env[g.env])).map((g) => g.id);

/**
 * A model reference as the admin stores it: which gateway, which model on it.
 *
 * Two fields rather than one "provider/model" string because the model id itself
 * contains slashes on OpenRouter — `meta-llama/llama-3.3-70b-instruct:free` — and
 * splitting on the first slash would send that to a gateway called "meta-llama".
 */
export type ModelRef = { gateway: GatewayId; model: string };

/**
 * What we ask the gateways to do about the model's out-loud thinking.
 *
 * Off, and the three alternatives were each measured on the same question rather than
 * reasoned about — "combien coûte la vie à Dijon par rapport à Lyon", three runs each,
 * which is the shape of question that broke first:
 *
 *   left on          the request died at the sixty-second ceiling with no answer
 *   `effort: low`    still 1 063 to 1 956 characters of deliberation; no saving
 *   `max_tokens`     worst of all — capped mid-thought, the model spilled the rest
 *                    into the reply, once including its own system prompt
 *   off              answers, and the models that plan well still plan well
 *
 * Named, so the panel's folded reasoning block can be brought back by changing this
 * one value if a future model earns it.
 */
const REASONING = { enabled: false } as const;

/**
 * Merges the reasoning setting into every request body.
 *
 * It has to happen here rather than through `providerOptions` because `reasoning` is
 * not part of the OpenAI wire format: the SDK validates provider options against a
 * schema that admits `user`, `reasoningEffort`, `textVerbosity` and
 * `strictJsonSchema`, and drops the rest. `reasoningEffort` is the wrong lever in any
 * case — measured on `nemotron-3-nano`, `low` still produced 1 063 characters of
 * deliberation, while `{ enabled: false }` produced none.
 *
 * A body that is not JSON is passed through untouched. That should not happen on a
 * chat completion, and quietly corrupting a request we did not understand would be
 * worse than sending it as it was.
 */
const withReasoningSetting = async (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  if (typeof init?.body !== "string") return fetch(input, init);
  let body: unknown;
  try {
    body = JSON.parse(init.body);
  } catch {
    return fetch(input, init);
  }
  if (typeof body !== "object" || body === null) return fetch(input, init);
  return fetch(input, {
    ...init,
    body: JSON.stringify({ ...(body as Record<string, unknown>), reasoning: REASONING }),
  });
};

/**
 * Builds the language model, or null when its gateway has no key.
 *
 * Null rather than throwing: the caller is walking a fallback chain, and a missing
 * key is exactly the case that should move to the next link instead of ending the
 * request.
 */
export function buildModel(ref: ModelRef): LanguageModel | null {
  const gateway = gatewayById(ref.gateway);
  if (!gateway) return null;
  const apiKey = process.env[gateway.env];
  if (!apiKey) return null;

  const provider = createOpenAICompatible({
    name: gateway.id,
    baseURL: gateway.baseURL,
    apiKey,
    fetch: withReasoningSetting,
    /*
      OpenRouter asks callers to identify themselves; it is also how a free-tier
      account gets treated as a known client rather than anonymous traffic.
    */
    headers:
      gateway.id === "openrouter"
        ? {
            "HTTP-Referer": "https://wherewise-fr.vercel.app",
            "X-Title": "WhereWise",
          }
        : undefined,
  });

  return provider(ref.model);
}

/**
 * The chain used when an admin has not chosen one.
 *
 * Free models on both gateways that hold a key. Deliberately small and fast: the
 * questions here are "resolve a city, call a tool, read the number back".
 */
export const DEFAULT_CHAIN: readonly ModelRef[] = [
  /*
    Chosen by asking each gateway what is actually free and actually takes tool calls,
    then sending every candidate a real request — not from a list in my head. The first
    version of this file named three models that were all wrong: one Zen id that does
    not exist, and two OpenRouter slugs whose free tier had been withdrawn.

    The second link is on a *different gateway* on purpose. All three used to be
    OpenRouter, which meant one provider having a bad afternoon took out the whole
    chain — a fallback that shares its single point of failure is decoration.

    Order is reliability first, and the measurements are why. Nano used to lead on
    the strength of being quick to a first token — which turned out to measure the
    wrong thing entirely. Re-measured through the real route with `REASONING` off,
    three runs each of the two-city comparison that broke:

      ultra 550B (Kilo)       3/3 answered with figures, 24–54 s        → first
      super 120B (OpenRouter) 2/3 answered with figures, 10–40 s        → second
      nano 30B (OpenRouter)   0/3 called a tool at all, 1–3 s           → third

    Nano is last, not gone. Without deliberation it stops planning: it asked the
    reader to supply city ids, and in one run announced that Dijon and Lyon are not
    covered — a false statement about our own dataset, which is the one kind of wrong
    answer this product cannot afford. It stays only as the link of last resort, where
    the alternative is nothing at all, and it is quick.

    Keeping the first two on different gateways still matters for the reason it always
    did: one provider having a bad afternoon should not take out the whole chain.

    Two other free Kilo models were tried and rejected: `stepfun/step-3.7-flash:free`
    returned empty content for a plain question despite handling tool calls, and
    `cohere/north-mini-code:free` invented `https://example.com` as this site's
    hostname. `ownPath` would recover that link, but a model that fabricates hosts is
    not one to put in front of readers by default.

    Half a minute is a poor thing to ask of a reader, and it is what a correct answer
    costs on a free 550B. The budget in the route is sized for it deliberately, and
    when even that is not enough the stream now says so instead of stopping mid-word.
  */
  { gateway: "kilo", model: "nvidia/nemotron-3-ultra-550b-a55b:free" },
  { gateway: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free" },
  { gateway: "openrouter", model: "nvidia/nemotron-3-nano-30b-a3b:free" },
];

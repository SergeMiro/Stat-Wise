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
    baseURL: "https://api.kilo.ai/api/gateway",
    env: "KILO_API_KEY",
    docs: "https://kilo.ai/docs/gateway",
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
    Chosen by asking the gateway what is actually free and actually supports tool
    calling, then sending each one a real request — not from a list in my head. The
    first attempt at this file named three models that were all wrong: one Zen id that
    does not exist, and two OpenRouter slugs whose free tier had been withdrawn.

    Order is reliability first. Nano answers in a fraction of the time and this
    assistant mostly resolves a city and reads a number back. Gemma is last because it
    was rate-limited when tested: keeping it second would make every request pay for a
    failed probe before getting an answer.
  */
  { gateway: "openrouter", model: "nvidia/nemotron-3-nano-30b-a3b:free" },
  { gateway: "openrouter", model: "nvidia/nemotron-3-super-120b-a12b:free" },
  { gateway: "openrouter", model: "google/gemma-4-31b-it:free" },
];

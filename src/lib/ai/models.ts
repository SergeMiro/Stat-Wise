/**
 * Which models may be used, and where the key comes from.
 *
 * Models are plain strings — `provider/model` — because AI SDK 7 resolves them
 * through Vercel's AI Gateway. That is the reason to go through the Gateway rather
 * than install a provider package: swapping Mistral for Grok for a local Llama is a
 * one-line change and no new dependency, which is what "attach anything from the AI
 * world" actually requires in practice.
 *
 * Nothing here is secret. The key is, and it is read on the server only.
 */

export const MODELS = {
  /**
   * The default. Deliberately a cheap, fast model: most questions here are
   * "resolve a place, call a tool, read the number back", and paying for a frontier
   * model to do that would be paying for nothing.
   */
  default: "mistral/mistral-small-latest",
  /** For a question that needs actual reasoning over a comparison. */
  reasoning: "anthropic/claude-sonnet-4.5",
  /** Cheapest available, for classification or routing work later. */
  cheap: "mistral/mistral-small-latest",
} as const;

export type ModelChoice = keyof typeof MODELS;

/** Anyone may use the default; picking another needs the `chooseModel` capability. */
export const resolveModel = (choice: ModelChoice | undefined, allowed: boolean): string =>
  choice && allowed ? MODELS[choice] : MODELS.default;

/**
 * Whether the assistant can run at all in this environment.
 *
 * A preview deploy or a fresh clone has no Gateway key. The panel asks this before
 * offering anything, so an unconfigured environment shows a plain explanation
 * instead of a chat box that answers every message with a 500.
 */
export const isAiConfigured = (): boolean =>
  Boolean(process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN);

import { availableGateways } from "./providers";

/**
 * Whether the assistant can run at all in this environment.
 *
 * "Configured" now means at least one gateway holds a key — the model chain decides
 * which one is tried. This used to name a single Vercel AI Gateway model; that became
 * wrong the moment an admin could choose three of their own, and a helper that
 * answers a question nobody asks any more is worse than no helper.
 */
export const isAiConfigured = (): boolean => availableGateways().length > 0;

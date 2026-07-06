import type {
  AreaProfile,
  NeighbourhoodSimulationInput,
  SimulationResult,
} from "@/domain/types";
import { applyHardConstraints } from "./applyHardConstraints";
import { buildAreaRanking } from "./buildAreaRanking";
import { buildScoringContext } from "./calculateCategoryScores";
import { ENGINE_VERSION } from "./constants";
import { deriveWeights } from "./weights";

export { ENGINE_VERSION } from "./constants";
export { runFamilySimulation, type FamilyRunOptions } from "./runFamilySimulation";

export type RunOptions = {
  datasetVersion: string;
  /** ISO timestamp; supplied by the caller so the engine stays deterministic. */
  generatedAt: string;
  /** Number of top areas to return (clamped to 3..10 per §6.6). */
  topN?: number;
};

/**
 * Orchestrates the neighbourhood ("Trouver mon quartier") simulation:
 * hard constraints → normalization context → category scores → confidence →
 * ranking → explanation. Pure: same inputs always yield the same result.
 */
export function runNeighbourhoodSimulation(
  input: NeighbourhoodSimulationInput,
  areas: AreaProfile[],
  options: RunOptions,
): SimulationResult {
  const { kept, excluded } = applyHardConstraints(areas, input);
  const weights = deriveWeights(input.priorities);
  const ctx = buildScoringContext(kept, input);
  const ranked = buildAreaRanking(kept, ctx, weights);

  const topN = Math.min(10, Math.max(3, options.topN ?? 10));

  return {
    simulationType: "quartier",
    engineVersion: ENGINE_VERSION,
    datasetVersion: options.datasetVersion,
    generatedAt: options.generatedAt,
    rankedAreas: ranked.slice(0, topN),
    excludedAreas: excluded,
  };
}

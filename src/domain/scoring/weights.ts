import type { CategoryKey, NeighbourhoodPriorities } from "@/domain/types";

export type CategoryWeights = Record<CategoryKey, number>;

/**
 * Map the 8 user priorities (0..3) onto the 7 scored categories of the ranking
 * formula (§6.5). Most map 1:1. "Sport & loisirs" is not its own ranking axis,
 * so it is folded — at half weight — into both `services` (indoor facilities)
 * and `nature` (outdoor/leisure), the two categories whose scores already
 * include sport POIs. Weights are clamped to the 0..3 priority scale.
 */
export function deriveWeights(p: NeighbourhoodPriorities): CategoryWeights {
  const sportHalf = p.sportAndLeisure / 2;
  const clamp = (n: number) => Math.min(3, Math.max(0, n));
  return {
    housing: p.housing,
    mobility: p.mobility,
    services: clamp(p.dailyServices + sportHalf),
    health: p.health,
    tranquillity: p.tranquillity,
    family: p.family,
    nature: clamp(p.nature + sportHalf),
  };
}

/** Categories the user actually cares about (weight > 0). */
export function weightedCategories(weights: CategoryWeights): CategoryKey[] {
  return (Object.keys(weights) as CategoryKey[]).filter((k) => weights[k] > 0);
}

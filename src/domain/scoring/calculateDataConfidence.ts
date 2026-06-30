import type { AreaProfile, CategoryKey, DataConfidence } from "@/domain/types";
import type { CategoryWeights } from "./weights";

export type ConfidenceResult = {
  label: DataConfidence;
  /** Multiplier applied to the raw score (§6.5 finalScore = rawScore × confidence). */
  multiplier: number;
  /** 0..1 weighted data-quality ratio across the categories the user cares about. */
  ratio: number;
};

const availabilityQuality = (
  a: AreaProfile,
  category: CategoryKey,
): number => {
  switch (category) {
    case "housing":
      // Sale is the richer signal; rent is commune-level by nature.
      if (a.coverage.housingSale === "available") return a.housing.transactionCount >= 30 ? 1 : 0.6;
      if (a.coverage.housingRent === "available" || a.coverage.housingRent === "commune_only") return 0.6;
      return 0;
    case "mobility":
    case "services":
    case "family":
    case "nature":
      return a.coverage.poi === "available" ? 1 : a.coverage.poi === "commune_only" ? 0.6 : 0;
    case "health": {
      const poi = a.coverage.poi === "available" ? 1 : a.coverage.poi === "commune_only" ? 0.6 : 0;
      const apl = a.coverage.apl === "unavailable" ? 0 : 0.6; // APL is commune-level
      return (poi + apl) / 2;
    }
    case "tranquillity":
      // Crime is commune-level at best, so it never reads as "available" precision.
      return a.coverage.crime === "unavailable" ? 0 : 0.6;
  }
};

/**
 * Confidence is computed only over the categories the user weighted (§6.5): a
 * missing metric the user does not care about must not penalise the area.
 */
export function calculateDataConfidence(
  area: AreaProfile,
  categoryScores: Record<CategoryKey, number | null>,
  weights: CategoryWeights,
): ConfidenceResult {
  let weightedQuality = 0;
  let weightTotal = 0;

  for (const key of Object.keys(weights) as CategoryKey[]) {
    const weight = weights[key];
    if (weight <= 0) continue;
    weightTotal += weight;
    const quality = categoryScores[key] === null ? 0 : availabilityQuality(area, key);
    weightedQuality += weight * quality;
  }

  const ratio = weightTotal === 0 ? 0 : weightedQuality / weightTotal;

  if (ratio === 0) return { label: "unavailable", multiplier: 0, ratio };
  if (ratio >= 0.85) return { label: "high", multiplier: 1, ratio };
  if (ratio >= 0.6) return { label: "medium", multiplier: 0.93, ratio };
  return { label: "low", multiplier: 0.82, ratio };
}

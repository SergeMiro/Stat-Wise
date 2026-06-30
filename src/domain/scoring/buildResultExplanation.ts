import type {
  AreaProfile,
  CategoryKey,
  NeighbourhoodSimulationInput,
  SourceRef,
} from "@/domain/types";
import type { CategoryWeights } from "./weights";
import { SOURCES } from "./constants";

export type AreaExplanation = {
  /** Machine codes; localised by the presentation layer (lib/i18n). */
  strengths: string[];
  caveats: string[];
  missingData: string[];
  sources: SourceRef[];
};

const STRENGTH_THRESHOLD = 0.66;
const DEFAULT_REFERENCE_SURFACE_M2 = 60;

const STRENGTH_CODE: Record<CategoryKey, string> = {
  housing: "strong_housing",
  mobility: "strong_mobility",
  services: "strong_services",
  health: "strong_health",
  tranquillity: "calm_area",
  family: "family_friendly",
  nature: "green_area",
};

export function buildResultExplanation(
  area: AreaProfile,
  scores: Record<CategoryKey, number | null>,
  input: NeighbourhoodSimulationInput,
  weights: CategoryWeights,
): AreaExplanation {
  const strengths: string[] = [];
  const caveats: string[] = [];
  const missingData: string[] = [];

  // Strengths: weighted categories that scored strongly.
  for (const key of Object.keys(weights) as CategoryKey[]) {
    if (weights[key] <= 0) continue;
    const score = scores[key];
    if (score === null) {
      missingData.push(`missing_${key}`);
    } else if (score >= STRENGTH_THRESHOLD) {
      strengths.push(STRENGTH_CODE[key]);
    }
  }

  const wantsRent = input.housingMode === "rent" || input.housingMode === "both";
  const wantsBuy = input.housingMode === "buy" || input.housingMode === "both";

  // Housing caveats — never present commune-level rent as a precise local figure.
  if (wantsRent && area.coverage.housingRent !== "unavailable") {
    caveats.push("rent_commune_level");
  }
  if (wantsBuy && area.coverage.housingSale === "available" && area.housing.transactionCount < 30) {
    caveats.push("low_transaction_count");
  }

  // Soft budget overflow (not excluded, just flagged).
  if (!input.hardConstraints.maxBudgetStrict) {
    if (
      wantsRent &&
      input.maxMonthlyRent !== undefined &&
      area.housing.medianRentPerMonth !== null &&
      area.housing.medianRentPerMonth > input.maxMonthlyRent
    ) {
      caveats.push("over_budget_soft");
    } else if (
      wantsBuy &&
      input.maxPurchaseBudget !== undefined &&
      area.housing.medianPriceM2 !== null
    ) {
      const surface = input.minSurfaceM2 ?? DEFAULT_REFERENCE_SURFACE_M2;
      if (area.housing.medianPriceM2 * surface > input.maxPurchaseBudget) {
        caveats.push("over_budget_soft");
      }
    }
  }

  if (weights.tranquillity > 0 && area.coverage.crime !== "unavailable") {
    caveats.push("crime_commune_level");
  }
  if (weights.health > 0 && area.coverage.apl !== "unavailable") {
    caveats.push("apl_commune_level");
  }
  if (weights.family > 0) {
    if (area.poi.creches > 0) caveats.push("creche_not_guaranteed");
    if (area.poi.schoolsMaternelle + area.poi.schoolsElementaire > 0) {
      caveats.push("school_sector_not_guaranteed");
    }
  }

  return {
    strengths,
    caveats,
    missingData,
    sources: collectSources(input, weights),
  };
}

function collectSources(
  input: NeighbourhoodSimulationInput,
  weights: CategoryWeights,
): SourceRef[] {
  const refs: SourceRef[] = [SOURCES.BPE];
  const wantsRent = input.housingMode === "rent" || input.housingMode === "both";
  const wantsBuy = input.housingMode === "buy" || input.housingMode === "both";
  if (wantsBuy) refs.push(SOURCES.DVF);
  if (wantsRent) refs.push(SOURCES.LOYERS);
  if (weights.health > 0) refs.push(SOURCES.APL);
  if (weights.tranquillity > 0) refs.push(SOURCES.CRIME);
  if (weights.family > 0 || input.hardConstraints.requireSchoolNearby) refs.push(SOURCES.EDUCATION);
  return refs;
}

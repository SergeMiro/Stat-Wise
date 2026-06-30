import type {
  AreaProfile,
  ExcludedArea,
  NeighbourhoodSimulationInput,
} from "@/domain/types";
import { NEARBY_RADIUS_KM } from "./constants";

const DEFAULT_REFERENCE_SURFACE_M2 = 60;

/**
 * Hard constraints remove an area from ranking entirely. Applied BEFORE scoring
 * (§6.3 step 3-4). Budget only excludes when the user explicitly asked for a
 * strict budget; otherwise an over-budget area is kept and flagged as a caveat.
 */
export function applyHardConstraints(
  areas: AreaProfile[],
  input: NeighbourhoodSimulationInput,
): { kept: AreaProfile[]; excluded: ExcludedArea[] } {
  const kept: AreaProfile[] = [];
  const excluded: ExcludedArea[] = [];
  const c = input.hardConstraints;

  for (const a of areas) {
    const reasons: string[] = [];

    if (c.requireTransport && a.poi.transport === 0) {
      reasons.push("no_transport");
    }
    if (c.requireSchoolNearby) {
      const schools =
        a.poi.schoolsMaternelle + a.poi.schoolsElementaire + a.poi.college + a.poi.lycee;
      if (schools === 0) reasons.push("no_school_nearby");
    }
    if (c.requireCrecheNearby && a.poi.creches === 0) {
      reasons.push("no_creche_nearby");
    }

    // Strict budget: exclude when even the affordable end exceeds the budget.
    if (c.maxBudgetStrict) {
      const wantsRent = input.housingMode === "rent" || input.housingMode === "both";
      const wantsBuy = input.housingMode === "buy" || input.housingMode === "both";
      if (
        wantsRent &&
        input.maxMonthlyRent !== undefined &&
        a.housing.medianRentPerMonth !== null &&
        a.housing.medianRentPerMonth > input.maxMonthlyRent
      ) {
        reasons.push("over_rent_budget");
      }
      if (
        wantsBuy &&
        input.maxPurchaseBudget !== undefined &&
        a.housing.p25PriceM2 !== null
      ) {
        const surface = input.minSurfaceM2 ?? DEFAULT_REFERENCE_SURFACE_M2;
        const cheapest = a.housing.p25PriceM2 * surface;
        if (cheapest > input.maxPurchaseBudget) reasons.push("over_purchase_budget");
      }
    }

    if (reasons.length > 0) {
      excluded.push({ areaId: a.areaId, areaName: a.areaName, reasons });
    } else {
      kept.push(a);
    }
  }

  return { kept, excluded };
}

export { NEARBY_RADIUS_KM };

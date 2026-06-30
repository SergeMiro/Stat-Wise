import type {
  AreaProfile,
  CategoryKey,
  NeighbourhoodSimulationInput,
} from "@/domain/types";
import { combine, normalize, rangeOf, type Range } from "./normalizeMetric";

/**
 * Pre-computed normalization ranges across the comparable set of areas, plus the
 * user input. Built once, reused for every area so normalization is consistent.
 */
export type ScoringContext = {
  input: NeighbourhoodSimulationInput;
  ranges: {
    shops: Range | null;
    pharmacies: Range | null;
    adminServices: Range | null;
    sport: Range | null;
    culture: Range | null;
    libraries: Range | null;
    doctors: Range | null;
    medicalCenters: Range | null;
    creches: Range | null;
    schools: Range | null;
    parks: Range | null;
    transport: Range | null;
    distToCenter: Range | null;
    distToTransport: Range | null;
    distToHospital: Range | null;
    apl: Range | null;
    crime: Range | null;
    priceM2: Range | null;
    rent: Range | null;
  };
};

const totalSchools = (a: AreaProfile) =>
  a.poi.schoolsMaternelle + a.poi.schoolsElementaire + a.poi.college + a.poi.lycee;

export function buildScoringContext(
  areas: AreaProfile[],
  input: NeighbourhoodSimulationInput,
): ScoringContext {
  return {
    input,
    ranges: {
      shops: rangeOf(areas.map((a) => a.poi.shops)),
      pharmacies: rangeOf(areas.map((a) => a.poi.pharmacies)),
      adminServices: rangeOf(areas.map((a) => a.poi.adminServices)),
      sport: rangeOf(areas.map((a) => a.poi.sport)),
      culture: rangeOf(areas.map((a) => a.poi.culture)),
      libraries: rangeOf(areas.map((a) => a.poi.libraries)),
      doctors: rangeOf(areas.map((a) => a.poi.doctors)),
      medicalCenters: rangeOf(areas.map((a) => a.poi.medicalCenters)),
      creches: rangeOf(areas.map((a) => a.poi.creches)),
      schools: rangeOf(areas.map(totalSchools)),
      parks: rangeOf(areas.map((a) => a.poi.parks)),
      transport: rangeOf(areas.map((a) => a.poi.transport)),
      distToCenter: rangeOf(areas.map((a) => a.distancesKm.toCityCenter)),
      distToTransport: rangeOf(areas.map((a) => a.distancesKm.toNearestTransport)),
      distToHospital: rangeOf(areas.map((a) => a.distancesKm.toNearestHospital)),
      apl: rangeOf(areas.map((a) => a.apl)),
      crime: rangeOf(areas.map((a) => a.recordedCrimeRatePer1000)),
      priceM2: rangeOf(areas.map((a) => a.housing.medianPriceM2)),
      rent: rangeOf(areas.map((a) => a.housing.medianRentPerMonth)),
    },
  };
}

/** 1 when value is within budget, decaying linearly to 0 at twice the budget. */
function budgetFit(value: number | null, budget: number | undefined): number | null {
  if (value === null || budget === undefined || budget <= 0) return null;
  if (value <= budget) return 1;
  return Math.max(0, 1 - (value - budget) / budget);
}

const DEFAULT_REFERENCE_SURFACE_M2 = 60;

function housingScore(a: AreaProfile, ctx: ScoringContext): number | null {
  const { input, ranges } = ctx;
  const wantsRent = input.housingMode === "rent" || input.housingMode === "both";
  const wantsBuy = input.housingMode === "buy" || input.housingMode === "both";
  const components: Array<number | null> = [];

  if (wantsRent) {
    // Affordability: cheaper rent is better within the set.
    components.push(normalize(a.housing.medianRentPerMonth, ranges.rent, "lower_is_better"));
    const fit = budgetFit(a.housing.medianRentPerMonth, input.maxMonthlyRent);
    if (fit !== null) components.push(fit);
  }

  if (wantsBuy) {
    components.push(normalize(a.housing.medianPriceM2, ranges.priceM2, "lower_is_better"));
    if (input.maxPurchaseBudget !== undefined && a.housing.medianPriceM2 !== null) {
      const surface = input.minSurfaceM2 ?? DEFAULT_REFERENCE_SURFACE_M2;
      const estimated = a.housing.medianPriceM2 * surface;
      const fit = budgetFit(estimated, input.maxPurchaseBudget);
      if (fit !== null) components.push(fit);
    }
  }

  // Property-type match: small penalty if the requested type is not available.
  if (input.propertyType !== "any") {
    const available = a.housing.propertyTypesAvailable.includes(input.propertyType);
    components.push(available ? 1 : 0.4);
  }

  return combine(components);
}

function mobilityScore(a: AreaProfile, ctx: ScoringContext): number | null {
  const { input, ranges } = ctx;
  const transportProximity = normalize(
    a.distancesKm.toNearestTransport,
    ranges.distToTransport,
    "lower_is_better",
  );
  const transportDensity = normalize(a.poi.transport, ranges.transport, "higher_is_better");
  const centreProximity = normalize(a.distancesKm.toCityCenter, ranges.distToCenter, "lower_is_better");
  const walkableServices = normalize(a.poi.shops, ranges.shops, "higher_is_better");

  const components: Array<number | null> = [
    transportProximity,
    transportDensity,
    centreProximity,
    walkableServices,
  ];

  const base = combine(components);
  if (base === null) return null;
  // With a car, public-transport proximity matters less: blend toward a neutral 0.7.
  return input.hasCar ? base * 0.7 + 0.7 * 0.3 : base;
}

function servicesScore(a: AreaProfile, ctx: ScoringContext): number | null {
  const { ranges } = ctx;
  return combine([
    normalize(a.poi.shops, ranges.shops, "higher_is_better"),
    normalize(a.poi.pharmacies, ranges.pharmacies, "higher_is_better"),
    normalize(a.poi.adminServices, ranges.adminServices, "higher_is_better"),
    normalize(a.poi.culture, ranges.culture, "higher_is_better"),
    normalize(a.poi.sport, ranges.sport, "higher_is_better"),
    normalize(a.poi.libraries, ranges.libraries, "higher_is_better"),
  ]);
}

function healthScore(a: AreaProfile, ctx: ScoringContext): number | null {
  const { ranges } = ctx;
  return combine([
    normalize(a.poi.doctors, ranges.doctors, "higher_is_better"),
    normalize(a.poi.medicalCenters, ranges.medicalCenters, "higher_is_better"),
    normalize(a.poi.pharmacies, ranges.pharmacies, "higher_is_better"),
    normalize(a.distancesKm.toNearestHospital, ranges.distToHospital, "lower_is_better"),
    normalize(a.apl, ranges.apl, "higher_is_better"),
  ]);
}

function tranquillityScore(a: AreaProfile, ctx: ScoringContext): number | null {
  // Only the officially recorded crime rate (commune-level). Parks live in nature.
  return normalize(a.recordedCrimeRatePer1000, ctx.ranges.crime, "lower_is_better");
}

function familyScore(a: AreaProfile, ctx: ScoringContext): number | null {
  const { ranges } = ctx;
  const schools = a.poi.schoolsMaternelle + a.poi.schoolsElementaire + a.poi.college + a.poi.lycee;
  return combine([
    normalize(a.poi.creches, ranges.creches, "higher_is_better"),
    normalize(schools, ranges.schools, "higher_is_better"),
    normalize(a.poi.sport, ranges.sport, "higher_is_better"),
    normalize(a.poi.parks, ranges.parks, "higher_is_better"),
    normalize(a.poi.doctors, ranges.doctors, "higher_is_better"),
    normalize(a.poi.transport, ranges.transport, "higher_is_better"),
    normalize(a.poi.shops, ranges.shops, "higher_is_better"),
  ]);
}

function natureScore(a: AreaProfile, ctx: ScoringContext): number | null {
  const { ranges } = ctx;
  return combine([
    normalize(a.poi.parks, ranges.parks, "higher_is_better"),
    normalize(a.poi.sport, ranges.sport, "higher_is_better"),
  ]);
}

/** Compute all 7 category scores (0..1, or null when unavailable) for one area. */
export function calculateCategoryScores(
  a: AreaProfile,
  ctx: ScoringContext,
): Record<CategoryKey, number | null> {
  return {
    housing: housingScore(a, ctx),
    mobility: mobilityScore(a, ctx),
    services: servicesScore(a, ctx),
    health: healthScore(a, ctx),
    tranquillity: tranquillityScore(a, ctx),
    family: familyScore(a, ctx),
    nature: natureScore(a, ctx),
  };
}

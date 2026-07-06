import type {
  AreaProfile,
  ChildAgeGroup,
  DataConfidence,
  FamilyAreaScore,
  FamilyCategoryKey,
  FamilyPriorities,
  FamilySimulationInput,
  FamilySimulationResult,
  SourceRef,
} from "@/domain/types";
import { FAMILY_CATEGORY_KEYS } from "@/domain/types";
import { combine, normalize, rangeOf, toScore100, weightedCombine, type Range } from "./normalizeMetric";
import { ENGINE_VERSION, SOURCES } from "./constants";

export { ENGINE_VERSION } from "./constants";

export type FamilyRunOptions = {
  datasetVersion: string;
  /** ISO timestamp supplied by the caller so the engine stays deterministic. */
  generatedAt: string;
};

// ---------------------------------------------------------------------------
// Age model — this is what makes 0–2 differ from 11–14.
// ---------------------------------------------------------------------------

/** School level (or crèche) that is relevant for each age group. */
function educationCount(a: AreaProfile, age: ChildAgeGroup): number {
  switch (age) {
    case "0_2":
      return a.poi.creches;
    case "3_5":
      return a.poi.schoolsMaternelle;
    case "6_10":
      return a.poi.schoolsElementaire;
    case "11_14":
      return a.poi.college;
    case "15_17":
      return a.poi.lycee;
  }
}

/**
 * Per-age emphasis multipliers applied on top of the user's priorities. A young
 * child weighs early-childhood/health/calm; a teenager weighs education (collège/
 * lycée), mobility (autonomy) and sport. Categories not listed default to 1.
 */
const AGE_EMPHASIS: Record<ChildAgeGroup, Partial<Record<FamilyCategoryKey, number>>> = {
  "0_2": { earlyChildhood: 1.5, health: 1.3, tranquillity: 1.2, nature: 1.1, education: 0.8, sportsAndLeisure: 0.5, mobility: 0.8 },
  "3_5": { earlyChildhood: 1.2, education: 1.2, nature: 1.1, health: 1.0, sportsAndLeisure: 0.8, mobility: 0.9 },
  "6_10": { education: 1.4, sportsAndLeisure: 1.2, nature: 1.1, mobility: 1.0, health: 0.9, earlyChildhood: 0.3 },
  "11_14": { education: 1.4, mobility: 1.3, sportsAndLeisure: 1.2, dailyServices: 1.0, health: 0.8, nature: 0.9, earlyChildhood: 0.1 },
  "15_17": { education: 1.3, mobility: 1.5, sportsAndLeisure: 1.1, dailyServices: 1.1, tranquillity: 0.9, health: 0.8, nature: 0.7, earlyChildhood: 0.1 },
};

// ---------------------------------------------------------------------------
// Normalization context across the compared set (never against all of France).
// ---------------------------------------------------------------------------

type FamilyRanges = {
  creches: Range | null;
  education: Range | null;
  libraries: Range | null;
  doctors: Range | null;
  medicalCenters: Range | null;
  pharmacies: Range | null;
  distHospital: Range | null;
  apl: Range | null;
  sport: Range | null;
  culture: Range | null;
  parks: Range | null;
  transport: Range | null;
  distTransport: Range | null;
  distCenter: Range | null;
  shops: Range | null;
  adminServices: Range | null;
  crime: Range | null;
};

function buildRanges(areas: AreaProfile[], age: ChildAgeGroup): FamilyRanges {
  return {
    creches: rangeOf(areas.map((a) => a.poi.creches)),
    education: rangeOf(areas.map((a) => educationCount(a, age))),
    libraries: rangeOf(areas.map((a) => a.poi.libraries)),
    doctors: rangeOf(areas.map((a) => a.poi.doctors)),
    medicalCenters: rangeOf(areas.map((a) => a.poi.medicalCenters)),
    pharmacies: rangeOf(areas.map((a) => a.poi.pharmacies)),
    distHospital: rangeOf(areas.map((a) => a.distancesKm.toNearestHospital)),
    apl: rangeOf(areas.map((a) => a.apl)),
    sport: rangeOf(areas.map((a) => a.poi.sport)),
    culture: rangeOf(areas.map((a) => a.poi.culture)),
    parks: rangeOf(areas.map((a) => a.poi.parks)),
    transport: rangeOf(areas.map((a) => a.poi.transport)),
    distTransport: rangeOf(areas.map((a) => a.distancesKm.toNearestTransport)),
    distCenter: rangeOf(areas.map((a) => a.distancesKm.toCityCenter)),
    shops: rangeOf(areas.map((a) => a.poi.shops)),
    adminServices: rangeOf(areas.map((a) => a.poi.adminServices)),
    crime: rangeOf(areas.map((a) => a.recordedCrimeRatePer1000)),
  };
}

// ---------------------------------------------------------------------------
// Category scores (0..1, or null when unavailable).
// ---------------------------------------------------------------------------

function categoryScores(
  a: AreaProfile,
  age: ChildAgeGroup,
  r: FamilyRanges,
): Record<FamilyCategoryKey, number | null> {
  const education = combine([
    normalize(educationCount(a, age), r.education, "higher_is_better"),
    // From primary school on, nearby libraries add educational context.
    age === "0_2" || age === "3_5" ? null : normalize(a.poi.libraries, r.libraries, "higher_is_better"),
  ]);

  return {
    earlyChildhood: combine([
      normalize(a.poi.creches, r.creches, "higher_is_better"),
      normalize(a.poi.parks, r.parks, "higher_is_better"),
      normalize(a.poi.doctors, r.doctors, "higher_is_better"),
      normalize(a.recordedCrimeRatePer1000, r.crime, "lower_is_better"),
    ]),
    education,
    health: combine([
      normalize(a.poi.doctors, r.doctors, "higher_is_better"),
      normalize(a.poi.medicalCenters, r.medicalCenters, "higher_is_better"),
      normalize(a.poi.pharmacies, r.pharmacies, "higher_is_better"),
      normalize(a.distancesKm.toNearestHospital, r.distHospital, "lower_is_better"),
      normalize(a.apl, r.apl, "higher_is_better"),
    ]),
    sportsAndLeisure: combine([
      normalize(a.poi.sport, r.sport, "higher_is_better"),
      normalize(a.poi.parks, r.parks, "higher_is_better"),
      normalize(a.poi.culture, r.culture, "higher_is_better"),
    ]),
    nature: combine([
      normalize(a.poi.parks, r.parks, "higher_is_better"),
      normalize(a.poi.sport, r.sport, "higher_is_better"),
    ]),
    mobility: combine([
      normalize(a.distancesKm.toNearestTransport, r.distTransport, "lower_is_better"),
      normalize(a.poi.transport, r.transport, "higher_is_better"),
      normalize(a.distancesKm.toCityCenter, r.distCenter, "lower_is_better"),
    ]),
    tranquillity: normalize(a.recordedCrimeRatePer1000, r.crime, "lower_is_better"),
    dailyServices: combine([
      normalize(a.poi.shops, r.shops, "higher_is_better"),
      normalize(a.poi.pharmacies, r.pharmacies, "higher_is_better"),
      normalize(a.poi.adminServices, r.adminServices, "higher_is_better"),
    ]),
  };
}

// ---------------------------------------------------------------------------
// Weights, confidence, explanations.
// ---------------------------------------------------------------------------

/** Final weight per category = user priority (0..3) × age emphasis. */
function deriveFamilyWeights(
  priorities: FamilyPriorities,
  age: ChildAgeGroup,
): Record<FamilyCategoryKey, number> {
  const emphasis = AGE_EMPHASIS[age];
  const out = {} as Record<FamilyCategoryKey, number>;
  for (const key of FAMILY_CATEGORY_KEYS) {
    out[key] = priorities[key] * (emphasis[key] ?? 1);
  }
  return out;
}

const STRENGTH_THRESHOLD = 0.66;

/** Coverage-based data quality for one family category (0..1). */
function familyQuality(a: AreaProfile, cat: FamilyCategoryKey): number {
  const poi = a.coverage.poi === "available" ? 1 : a.coverage.poi === "commune_only" ? 0.6 : 0;
  if (cat === "health") {
    const apl = a.coverage.apl === "unavailable" ? 0 : 0.6;
    return (poi + apl) / 2;
  }
  if (cat === "tranquillity") {
    return a.coverage.crime === "unavailable" ? 0 : 0.6;
  }
  return poi;
}

function confidenceOf(
  a: AreaProfile,
  scores: Record<FamilyCategoryKey, number | null>,
  weights: Record<FamilyCategoryKey, number>,
): { label: DataConfidence; multiplier: number } {
  let weightedQuality = 0;
  let weightTotal = 0;
  for (const key of FAMILY_CATEGORY_KEYS) {
    const w = weights[key];
    if (w <= 0) continue;
    weightTotal += w;
    weightedQuality += w * (scores[key] === null ? 0 : familyQuality(a, key));
  }
  const ratio = weightTotal === 0 ? 0 : weightedQuality / weightTotal;
  if (ratio === 0) return { label: "unavailable", multiplier: 0 };
  if (ratio >= 0.85) return { label: "high", multiplier: 1 };
  if (ratio >= 0.6) return { label: "medium", multiplier: 0.93 };
  return { label: "low", multiplier: 0.82 };
}

function explain(
  age: ChildAgeGroup,
  scores: Record<FamilyCategoryKey, number | null>,
  weights: Record<FamilyCategoryKey, number>,
): { strengths: string[]; actionsToVerify: string[]; caveats: string[]; missingData: string[]; sources: SourceRef[] } {
  const strengths: string[] = [];
  const missingData: string[] = [];
  for (const key of FAMILY_CATEGORY_KEYS) {
    if (weights[key] <= 0) continue;
    const s = scores[key];
    if (s === null) missingData.push(`missing_${key}`);
    else if (s >= STRENGTH_THRESHOLD) strengths.push(`strong_${key}`);
  }

  const actionsToVerify: string[] = ["visit_area"];
  if (age === "0_2") actionsToVerify.push("confirm_creche_place");
  else actionsToVerify.push("verify_school_sector");
  if (age === "11_14" || age === "15_17") actionsToVerify.push("check_transport_autonomy");
  if (weights.health > 0) actionsToVerify.push("check_health_access");

  const caveats: string[] = ["family_no_guarantee"];
  if (age === "0_2") caveats.push("creche_not_guaranteed");
  else caveats.push("school_sector_not_guaranteed");
  if (weights.tranquillity > 0) caveats.push("crime_commune_level");
  if (weights.health > 0) caveats.push("apl_commune_level");

  const sources: SourceRef[] = [SOURCES.BPE, SOURCES.EDUCATION];
  if (weights.health > 0) sources.push(SOURCES.APL);
  if (weights.tranquillity > 0) sources.push(SOURCES.CRIME);

  return { strengths, actionsToVerify, caveats, missingData, sources };
}

function roundScores(
  scores: Record<FamilyCategoryKey, number | null>,
): Record<FamilyCategoryKey, number | null> {
  const out = {} as Record<FamilyCategoryKey, number | null>;
  for (const key of FAMILY_CATEGORY_KEYS) out[key] = toScore100(scores[key]);
  return out;
}

/**
 * Orchestrates the "Grandir ici" simulation: score the compared areas (1..3) for
 * the chosen age group and rank them best-first. Pure and deterministic.
 */
export function runFamilySimulation(
  input: FamilySimulationInput,
  areas: AreaProfile[],
  options: FamilyRunOptions,
): FamilySimulationResult {
  const age = input.childAgeGroup;
  const ranges = buildRanges(areas, age);
  const weights = deriveFamilyWeights(input.priorities, age);

  const scored: FamilyAreaScore[] = areas.map((area) => {
    const scores = categoryScores(area, age, ranges);
    const raw01 = weightedCombine(
      FAMILY_CATEGORY_KEYS.map((k) => [scores[k], weights[k]] as [number | null, number]),
    );
    const conf = confidenceOf(area, scores, weights);
    const final01 = raw01 === null ? null : raw01 * conf.multiplier;
    const ex = explain(age, scores, weights);
    return {
      areaId: area.areaId,
      areaName: area.areaName,
      areaType: area.areaType,
      overallScore: conf.multiplier === 0 ? null : toScore100(final01),
      confidence: conf.label,
      categoryScores: roundScores(scores),
      strengths: ex.strengths,
      actionsToVerify: ex.actionsToVerify,
      caveats: ex.caveats,
      missingData: ex.missingData,
      sources: ex.sources,
    };
  });

  scored.sort((a, b) => {
    if (a.overallScore === null && b.overallScore === null) return 0;
    if (a.overallScore === null) return 1;
    if (b.overallScore === null) return -1;
    return b.overallScore - a.overallScore;
  });

  return {
    simulationType: "family",
    engineVersion: ENGINE_VERSION,
    datasetVersion: options.datasetVersion,
    generatedAt: options.generatedAt,
    childAgeGroup: age,
    comparedAreas: scored,
  };
}

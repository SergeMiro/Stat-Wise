/**
 * StatWise domain contracts.
 *
 * This module is pure: it must not import React, Next.js, Supabase, or perform
 * any IO. Everything here is plain data the scoring engine consumes or produces.
 */

// ---------------------------------------------------------------------------
// User input
// ---------------------------------------------------------------------------

export type PriorityLevel = 0 | 1 | 2 | 3; // not / somewhat / important / critical

export type HousingMode = "rent" | "buy" | "both";
export type PropertyType = "apartment" | "house" | "any";
export type HouseholdType = "single" | "couple" | "family" | "family_with_child";

export type NeighbourhoodPriorities = {
  housing: PriorityLevel;
  mobility: PriorityLevel;
  dailyServices: PriorityLevel;
  health: PriorityLevel;
  tranquillity: PriorityLevel;
  family: PriorityLevel;
  sportAndLeisure: PriorityLevel;
  nature: PriorityLevel;
};

export type TargetPoint = {
  latitude: number;
  longitude: number;
  label?: string;
};

export type NeighbourhoodHardConstraints = {
  requireTransport?: boolean;
  requireSchoolNearby?: boolean;
  requireCrecheNearby?: boolean;
  maxDistanceToTargetKm?: number;
  maxBudgetStrict?: boolean;
};

export type NeighbourhoodSimulationInput = {
  cityId: string;
  housingMode: HousingMode;
  propertyType: PropertyType;
  maxMonthlyRent?: number;
  rentIncludesCharges?: boolean;
  maxPurchaseBudget?: number;
  minSurfaceM2?: number;
  minRooms?: number;
  householdType: HouseholdType;
  hasCar?: boolean;
  targetPoint?: TargetPoint;
  priorities: NeighbourhoodPriorities;
  hardConstraints: NeighbourhoodHardConstraints;
};

export type ChildAgeGroup = "0_2" | "3_5" | "6_10" | "11_14" | "15_17";

export type FamilyPriorities = {
  earlyChildhood: PriorityLevel;
  education: PriorityLevel;
  health: PriorityLevel;
  sportsAndLeisure: PriorityLevel;
  nature: PriorityLevel;
  mobility: PriorityLevel;
  tranquillity: PriorityLevel;
  dailyServices: PriorityLevel;
};

export type FamilySimulationInput = {
  cityId: string;
  selectedAreaIds: string[]; // 1..3
  childrenCount: "1" | "2" | "3_plus";
  childAgeGroup: ChildAgeGroup;
  priorities: FamilyPriorities;
};

// ---------------------------------------------------------------------------
// Prepared area data (the engine's input — produced by the server/import layer,
// mocked for the pilot cities in V1)
// ---------------------------------------------------------------------------

/**
 * Distinguishes "we have data" from "the source does not cover this area" from
 * "data exists but only at a coarser geography (commune)". Never collapse these
 * into a 0 — see scoring-methodology.md.
 */
export type DataAvailability = "available" | "commune_only" | "unavailable";

export type AreaType = "iris" | "commune";

export type HousingProfile = {
  /** Commune-level reference rent per month (Carte des loyers). */
  medianRentPerMonth: number | null;
  medianPriceM2: number | null;
  p25PriceM2: number | null;
  p75PriceM2: number | null;
  transactionCount: number;
  propertyTypesAvailable: Array<"apartment" | "house">;
};

export type PoiCounts = {
  transport: number;
  shops: number;
  pharmacies: number;
  adminServices: number;
  sport: number;
  culture: number;
  libraries: number;
  doctors: number;
  medicalCenters: number;
  creches: number;
  schoolsMaternelle: number;
  schoolsElementaire: number;
  college: number;
  lycee: number;
  parks: number;
};

export type AreaDistancesKm = {
  toCityCenter: number | null;
  toNearestTransport: number | null;
  toNearestHospital: number | null;
};

export type AreaCoverage = {
  housingSale: DataAvailability;
  housingRent: DataAvailability;
  poi: DataAvailability;
  crime: DataAvailability;
  apl: DataAvailability;
};

export type AreaProfile = {
  areaId: string;
  areaName: string;
  areaType: AreaType;
  centroid: { latitude: number; longitude: number };
  housing: HousingProfile;
  poi: PoiCounts;
  distancesKm: AreaDistancesKm;
  /** Accessibilité potentielle localisée — commune-level GP access. */
  apl: number | null;
  /** Recorded crime per 1000 inhabitants — commune-level. */
  recordedCrimeRatePer1000: number | null;
  coverage: AreaCoverage;
};

// ---------------------------------------------------------------------------
// Result contracts
// ---------------------------------------------------------------------------

export type DataConfidence = "high" | "medium" | "low" | "unavailable";

export const CATEGORY_KEYS = [
  "housing",
  "mobility",
  "services",
  "health",
  "tranquillity",
  "family",
  "nature",
] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export type SourceRef = {
  code: string;
  label: string;
  sourceUrl: string;
  geographicLevel: string;
  sourceVersion: string;
};

export type AreaScore = {
  areaId: string;
  areaName: string;
  areaType: AreaType;
  /** 0..100, or null when no weighted category had data. */
  overallScore: number | null;
  confidence: DataConfidence;
  categoryScores: Record<CategoryKey, number | null>;
  strengths: string[];
  caveats: string[];
  missingData: string[];
  sources: SourceRef[];
};

export type ExcludedArea = {
  areaId: string;
  areaName: string;
  reasons: string[];
};

export type SimulationResult = {
  simulationType: "quartier" | "family";
  engineVersion: string;
  datasetVersion: string;
  generatedAt: string;
  rankedAreas: AreaScore[];
  excludedAreas: ExcludedArea[];
};

// ---------------------------------------------------------------------------
// Family ("Grandir ici") result contracts
// ---------------------------------------------------------------------------

/** The eight axes the family simulator compares — mirrors FamilyPriorities. */
export const FAMILY_CATEGORY_KEYS = [
  "earlyChildhood",
  "education",
  "health",
  "sportsAndLeisure",
  "nature",
  "mobility",
  "tranquillity",
  "dailyServices",
] as const;

export type FamilyCategoryKey = (typeof FAMILY_CATEGORY_KEYS)[number];

export type FamilyAreaScore = {
  areaId: string;
  areaName: string;
  areaType: AreaType;
  /** 0..100 within the compared set, or null when no weighted category had data. */
  overallScore: number | null;
  confidence: DataConfidence;
  categoryScores: Record<FamilyCategoryKey, number | null>;
  strengths: string[];
  /** Things the user must confirm manually (school sector, crèche place, …). */
  actionsToVerify: string[];
  caveats: string[];
  missingData: string[];
  sources: SourceRef[];
};

export type FamilySimulationResult = {
  simulationType: "family";
  engineVersion: string;
  datasetVersion: string;
  generatedAt: string;
  childAgeGroup: ChildAgeGroup;
  /** The compared areas, ranked best-first for the chosen age group (1..3). */
  comparedAreas: FamilyAreaScore[];
};

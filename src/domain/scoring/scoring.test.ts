import { describe, expect, it } from "vitest";
import type {
  AreaProfile,
  NeighbourhoodPriorities,
  NeighbourhoodSimulationInput,
} from "@/domain/types";
import { combine, normalize, rangeOf, weightedCombine } from "./normalizeMetric";
import { deriveWeights } from "./weights";
import { applyHardConstraints } from "./applyHardConstraints";
import { calculateCategoryScores, buildScoringContext } from "./calculateCategoryScores";
import { calculateDataConfidence } from "./calculateDataConfidence";
import { runNeighbourhoodSimulation } from "./index";

// --- fixtures --------------------------------------------------------------

function makeArea(id: string, overrides: Partial<AreaProfile> = {}): AreaProfile {
  const base: AreaProfile = {
    areaId: id,
    areaName: `Area ${id}`,
    areaType: "iris",
    centroid: { latitude: 47.32, longitude: 5.04 },
    housing: {
      medianRentPerMonth: 800,
      medianPriceM2: 3000,
      p25PriceM2: 2500,
      p75PriceM2: 3600,
      transactionCount: 80,
      propertyTypesAvailable: ["apartment", "house"],
    },
    poi: {
      transport: 5,
      shops: 20,
      pharmacies: 3,
      adminServices: 2,
      sport: 4,
      culture: 3,
      libraries: 1,
      doctors: 6,
      medicalCenters: 1,
      creches: 2,
      schoolsMaternelle: 2,
      schoolsElementaire: 2,
      college: 1,
      lycee: 1,
      parks: 3,
    },
    distancesKm: { toCityCenter: 2, toNearestTransport: 0.3, toNearestHospital: 3 },
    apl: 4.2,
    recordedCrimeRatePer1000: 40,
    coverage: {
      housingSale: "available",
      housingRent: "commune_only",
      poi: "available",
      crime: "commune_only",
      apl: "commune_only",
    },
    ...overrides,
  };
  return base;
}

const allPriorities = (level: 0 | 1 | 2 | 3): NeighbourhoodPriorities => ({
  housing: level,
  mobility: level,
  dailyServices: level,
  health: level,
  tranquillity: level,
  family: level,
  sportAndLeisure: level,
  nature: level,
});

function makeInput(overrides: Partial<NeighbourhoodSimulationInput> = {}): NeighbourhoodSimulationInput {
  return {
    cityId: "dijon",
    housingMode: "rent",
    propertyType: "any",
    householdType: "couple",
    priorities: allPriorities(2),
    hardConstraints: {},
    ...overrides,
  };
}

// --- normalizeMetric -------------------------------------------------------

describe("normalize", () => {
  const range = rangeOf([10, 20, 30]);

  it("scales higher_is_better to 0..1", () => {
    expect(normalize(10, range, "higher_is_better")).toBe(0);
    expect(normalize(30, range, "higher_is_better")).toBe(1);
    expect(normalize(20, range, "higher_is_better")).toBeCloseTo(0.5);
  });

  it("inverts lower_is_better", () => {
    expect(normalize(10, range, "lower_is_better")).toBe(1);
    expect(normalize(30, range, "lower_is_better")).toBe(0);
  });

  it("returns null for missing values instead of substituting 0", () => {
    expect(normalize(null, range, "higher_is_better")).toBeNull();
    expect(normalize(undefined, range, "higher_is_better")).toBeNull();
  });

  it("does not divide by zero when max === min", () => {
    expect(normalize(5, rangeOf([5, 5, 5]), "higher_is_better")).toBe(1);
  });

  it("returns null when the whole set is missing", () => {
    expect(normalize(5, rangeOf([null, null]), "higher_is_better")).toBeNull();
  });
});

describe("combine / weightedCombine", () => {
  it("combine ignores nulls and returns null when empty", () => {
    expect(combine([1, null, 0])).toBeCloseTo(0.5);
    expect(combine([null, null])).toBeNull();
  });

  it("weightedCombine ignores null values and zero weights", () => {
    expect(weightedCombine([[1, 2], [0, 2], [null, 5]])).toBeCloseTo(0.5);
    expect(weightedCombine([[1, 0]])).toBeNull();
  });
});

// --- weights ---------------------------------------------------------------

describe("deriveWeights", () => {
  it("maps 1:1 and folds sport into services and nature at half weight", () => {
    const w = deriveWeights({ ...allPriorities(0), dailyServices: 2, nature: 1, sportAndLeisure: 2 });
    expect(w.services).toBe(3); // 2 + 1
    expect(w.nature).toBe(2); // 1 + 1
    expect(w.housing).toBe(0);
  });

  it("clamps folded weights to 3", () => {
    const w = deriveWeights({ ...allPriorities(3), dailyServices: 3, sportAndLeisure: 3 });
    expect(w.services).toBe(3);
  });
});

// --- hard constraints ------------------------------------------------------

describe("applyHardConstraints", () => {
  it("excludes areas without transport when required", () => {
    const areas = [makeArea("a"), makeArea("b", { poi: { ...makeArea("b").poi, transport: 0 } })];
    const { kept, excluded } = applyHardConstraints(areas, makeInput({ hardConstraints: { requireTransport: true } }));
    expect(kept.map((a) => a.areaId)).toEqual(["a"]);
    expect(excluded[0]).toMatchObject({ areaId: "b", reasons: ["no_transport"] });
  });

  it("keeps over-budget areas unless the budget is strict", () => {
    const pricey = makeArea("p", { housing: { ...makeArea("p").housing, medianRentPerMonth: 5000 } });
    const soft = applyHardConstraints([pricey], makeInput({ maxMonthlyRent: 800 }));
    expect(soft.kept).toHaveLength(1);
    const strict = applyHardConstraints(
      [pricey],
      makeInput({ maxMonthlyRent: 800, hardConstraints: { maxBudgetStrict: true } }),
    );
    expect(strict.excluded[0].reasons).toContain("over_rent_budget");
  });
});

// --- confidence ------------------------------------------------------------

describe("calculateDataConfidence", () => {
  const weights = deriveWeights(allPriorities(2));

  it("flags commune-level coverage as medium", () => {
    const area = makeArea("c");
    const scores = calculateCategoryScores(area, buildScoringContext([area], makeInput()));
    const conf = calculateDataConfidence(area, scores, weights);
    expect(["medium", "high"]).toContain(conf.label);
  });

  it("returns unavailable (and a zero multiplier) when nothing is covered", () => {
    const blank = makeArea("z", {
      coverage: {
        housingSale: "unavailable",
        housingRent: "unavailable",
        poi: "unavailable",
        crime: "unavailable",
        apl: "unavailable",
      },
    });
    const scores = calculateCategoryScores(blank, buildScoringContext([blank], makeInput()));
    const conf = calculateDataConfidence(blank, scores, weights);
    expect(conf.label).toBe("unavailable");
    expect(conf.multiplier).toBe(0);
  });
});

// --- end to end ------------------------------------------------------------

describe("runNeighbourhoodSimulation", () => {
  const options = { datasetVersion: "test-1", generatedAt: "2026-01-01T00:00:00.000Z" };

  it("ranks areas and is deterministic", () => {
    const rich = makeArea("rich", {
      poi: { ...makeArea("rich").poi, shops: 60, doctors: 20, transport: 12, parks: 10, creches: 6 },
      recordedCrimeRatePer1000: 10,
    });
    const poor = makeArea("poor", {
      poi: {
        transport: 1, shops: 2, pharmacies: 0, adminServices: 0, sport: 0, culture: 0, libraries: 0,
        doctors: 1, medicalCenters: 0, creches: 0, schoolsMaternelle: 0, schoolsElementaire: 0,
        college: 0, lycee: 0, parks: 0,
      },
      recordedCrimeRatePer1000: 90,
    });

    const r1 = runNeighbourhoodSimulation(makeInput(), [rich, poor], options);
    const r2 = runNeighbourhoodSimulation(makeInput(), [rich, poor], options);

    expect(r1.rankedAreas[0].areaId).toBe("rich");
    expect(r1).toEqual(r2); // deterministic
    expect(r1.engineVersion).toBeTypeOf("string");
  });

  it("reports missing data instead of scoring it as zero", () => {
    const noCrime = makeArea("nc", {
      recordedCrimeRatePer1000: null,
      coverage: { ...makeArea("nc").coverage, crime: "unavailable" },
    });
    const input = makeInput({
      priorities: { ...allPriorities(0), tranquillity: 3 },
    });
    const result = runNeighbourhoodSimulation(input, [noCrime], options);
    const area = result.rankedAreas[0];
    expect(area.categoryScores.tranquillity).toBeNull();
    expect(area.missingData).toContain("missing_tranquillity");
    expect(area.overallScore).toBeNull();
  });

  it("excludes areas via hard constraints and lists them", () => {
    const ok = makeArea("ok");
    const noTransport = makeArea("nt", { poi: { ...makeArea("nt").poi, transport: 0 } });
    const result = runNeighbourhoodSimulation(
      makeInput({ hardConstraints: { requireTransport: true } }),
      [ok, noTransport],
      options,
    );
    expect(result.rankedAreas.map((a) => a.areaId)).toEqual(["ok"]);
    expect(result.excludedAreas.map((a) => a.areaId)).toEqual(["nt"]);
  });
});

import { describe, expect, it } from "vitest";
import type { AreaProfile, ChildAgeGroup, FamilyPriorities } from "@/domain/types";
import { runFamilySimulation } from "./runFamilySimulation";

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
      transport: 5, shops: 20, pharmacies: 3, adminServices: 2, sport: 4, culture: 3,
      libraries: 1, doctors: 6, medicalCenters: 1, creches: 2, schoolsMaternelle: 2,
      schoolsElementaire: 2, college: 1, lycee: 1, parks: 3,
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

const allPriorities = (level: 0 | 1 | 2 | 3): FamilyPriorities => ({
  earlyChildhood: level,
  education: level,
  health: level,
  sportsAndLeisure: level,
  nature: level,
  mobility: level,
  tranquillity: level,
  dailyServices: level,
});

const options = { datasetVersion: "test-1", generatedAt: "2026-01-01T00:00:00.000Z" };

const input = (age: ChildAgeGroup, priorities = allPriorities(2)) => ({
  cityId: "dijon",
  selectedAreaIds: ["young", "teen"],
  childrenCount: "1" as const,
  childAgeGroup: age,
  priorities,
});

// Young-family-friendly: many crèches / parks / doctors, calm; few collèges/transport.
const young = makeArea("young", {
  poi: {
    transport: 4, shops: 30, pharmacies: 5, adminServices: 3, sport: 3, culture: 3,
    libraries: 1, doctors: 20, medicalCenters: 4, creches: 8, schoolsMaternelle: 3,
    schoolsElementaire: 3, college: 0, lycee: 0, parks: 8,
  },
  distancesKm: { toCityCenter: 3, toNearestTransport: 0.6, toNearestHospital: 3 },
  apl: 5,
  recordedCrimeRatePer1000: 15,
});

// Teen-friendly: collèges/lycées, transport, sport, culture; few crèches, higher crime.
const teen = makeArea("teen", {
  poi: {
    transport: 20, shops: 80, pharmacies: 6, adminServices: 6, sport: 8, culture: 10,
    libraries: 3, doctors: 8, medicalCenters: 1, creches: 0, schoolsMaternelle: 1,
    schoolsElementaire: 1, college: 3, lycee: 2, parks: 2,
  },
  distancesKm: { toCityCenter: 0.4, toNearestTransport: 0.1, toNearestHospital: 2 },
  apl: 4,
  recordedCrimeRatePer1000: 40,
});

// --- tests -----------------------------------------------------------------

describe("runFamilySimulation", () => {
  it("is deterministic", () => {
    const r1 = runFamilySimulation(input("6_10"), [young, teen], options);
    const r2 = runFamilySimulation(input("6_10"), [young, teen], options);
    expect(r1).toEqual(r2);
    expect(r1.simulationType).toBe("family");
    expect(r1.comparedAreas).toHaveLength(2);
  });

  it("ranks differently for 0–2 vs 11–14 (age changes the outcome)", () => {
    const babies = runFamilySimulation(input("0_2"), [young, teen], options);
    const teens = runFamilySimulation(input("11_14"), [young, teen], options);
    expect(babies.comparedAreas[0].areaId).toBe("young");
    expect(teens.comparedAreas[0].areaId).toBe("teen");
  });

  it("uses the age-relevant school level for the education axis", () => {
    // young has crèches but no collège; teen has collège but no crèche.
    const babies = runFamilySimulation(input("0_2"), [young, teen], options);
    const teens = runFamilySimulation(input("11_14"), [young, teen], options);
    const eduYoungFor02 = babies.comparedAreas.find((a) => a.areaId === "young")!.categoryScores.education;
    const eduTeenFor02 = babies.comparedAreas.find((a) => a.areaId === "teen")!.categoryScores.education;
    const eduYoungFor1114 = teens.comparedAreas.find((a) => a.areaId === "young")!.categoryScores.education;
    const eduTeenFor1114 = teens.comparedAreas.find((a) => a.areaId === "teen")!.categoryScores.education;
    expect(eduYoungFor02).toBeGreaterThan(eduTeenFor02 ?? 0); // crèche-rich wins for 0–2
    expect(eduTeenFor1114).toBeGreaterThan(eduYoungFor1114 ?? 0); // collège-rich wins for 11–14
  });

  it("keeps overall scores within 0..100", () => {
    const r = runFamilySimulation(input("3_5"), [young, teen], options);
    for (const a of r.comparedAreas) {
      expect(a.overallScore).not.toBeNull();
      expect(a.overallScore!).toBeGreaterThanOrEqual(0);
      expect(a.overallScore!).toBeLessThanOrEqual(100);
    }
  });

  it("emits age-appropriate verification actions", () => {
    const babies = runFamilySimulation(input("0_2"), [young, teen], options);
    expect(babies.comparedAreas[0].actionsToVerify).toContain("confirm_creche_place");
    const teens = runFamilySimulation(input("11_14"), [young, teen], options);
    expect(teens.comparedAreas[0].actionsToVerify).toContain("verify_school_sector");
    expect(teens.comparedAreas[0].actionsToVerify).toContain("check_transport_autonomy");
  });

  it("reports missing data instead of scoring it as zero", () => {
    const noCrime = makeArea("nc", {
      recordedCrimeRatePer1000: null,
      coverage: { housingSale: "available", housingRent: "commune_only", poi: "available", crime: "unavailable", apl: "commune_only" },
    });
    const r = runFamilySimulation(
      { ...input("6_10", { ...allPriorities(0), tranquillity: 3 }), selectedAreaIds: ["nc"] },
      [noCrime],
      options,
    );
    const area = r.comparedAreas[0];
    expect(area.categoryScores.tranquillity).toBeNull();
    expect(area.missingData).toContain("missing_tranquillity");
  });
});

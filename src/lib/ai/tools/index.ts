import { tool } from "ai";
import { z } from "zod";
import {
  compare,
  findCity,
  jobCities,
  listJobCities,
  type CompareInput,
} from "@/domain/reste-a-vivre";
import { DATA_SOURCES } from "@/domain/reste-a-vivre/sources";
import type { Line, SideResult } from "@/domain/reste-a-vivre/types";
import { can, type Capability, type Role } from "../roles";

/**
 * The tools the assistant may call, and what each one costs to add.
 *
 * A tool is registered with the capability it needs. `toolsFor(role)` returns only
 * what that role may use, so the model is never even told about a tool it cannot
 * call — which is both a smaller prompt and one less thing to get wrong.
 *
 * The rule these follow: a tool reads or computes, it does not invent. Every one of
 * them returns figures that come from the same engine and the same snapshot the
 * pages use, with their provenance attached, so an answer in the chat can be
 * checked against the page it came from.
 */

export type RegisteredTool = {
  /** What the caller must be allowed to do before this is offered. */
  capability: Capability;
  /** Built lazily: some tools will need a request-scoped client. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AI SDK tool types are structural
  build: () => any;
};

const listCitiesTool: RegisteredTool = {
  capability: "readPublicData",
  build: () =>
    tool({
      description:
        "List the cities and districts WhereWise has data for. Use this before any " +
        "comparison, to map what the person said onto ids the engine accepts.",
      inputSchema: z.object({}),
      execute: async () => ({
        cities: listJobCities().map((c) => ({
          id: c.id,
          name: c.name,
          department: c.department,
          districts: jobCities
            .find((x) => x.id === c.id)
            ?.districts.map((d) => ({ id: d.id, name: d.name, archetype: d.archetype })),
        })),
      }),
    }),
};

const citySnapshotTool: RegisteredTool = {
  capability: "readPublicData",
  build: () =>
    tool({
      description:
        "The measured figures for one city: rent per m² by district, fuel price, " +
        "water price, electricity, transit fares, and whether each was measured or " +
        "is still an assumption.",
      inputSchema: z.object({ cityId: z.string().describe("id from listCities") }),
      execute: async ({ cityId }) => {
        const city = findCity(cityId);
        if (!city) return { error: "unknown city", hint: "call listCities first" };
        return {
          name: city.name,
          department: city.department,
          fuelPricePerLitre: city.fuelPricePerLitre,
          waterPricePerM3: city.waterPricePerM3,
          electricityMeasured: city.electricityMeasured,
          transitNetwork: city.transitNetwork,
          transitPassMonthly: city.transitPassMonthly,
          transitFreeForResidents: city.transitFreeForResidents,
          districts: city.districts.map((d) => ({
            id: d.id,
            name: d.name,
            rentPerSqmFlat: d.rentPerSqm.appartement,
            rentRange: d.rentPerSqmRange,
            electricityKwhYear: d.electricityKwhYear,
            distanceToJobKm: d.distanceToJobKm,
            distanceToGroceryKm: d.distanceToGroceryKm,
            /* Says whether the distance was routed or modelled — never hide this. */
            distanceSource: d.distanceSource,
          })),
        };
      },
    }),
};

const compareTool: RegisteredTool = {
  capability: "runSimulations",
  build: () =>
    tool({
      description:
        "Run the reste-à-vivre comparison between the household's situation today " +
        "and a job offer elsewhere. Returns what is left each month on both sides, " +
        "the difference, the salary needed to break even, and the line-by-line " +
        "detail with each line's status.",
      inputSchema: z.object({
        currentCityId: z.string(),
        currentDistrictId: z.string(),
        currentNetSalary: z.number().min(0).max(100_000),
        currentRent: z.number().min(0).max(20_000),
        targetCityId: z.string(),
        targetNetSalary: z.number().min(0).max(100_000),
        adults: z.number().int().min(1).max(2).default(1),
        children: z.number().int().min(0).max(8).default(0),
        surfaceM2: z.number().min(9).max(400).default(65),
      }),
      execute: async (input) => {
        const built = buildCompareInput(input);
        const result = compare(built);
        if (!result) return { error: "the places given do not resolve to known ids" };
        return {
          currentResteAVivre: result.current.resteAVivre,
          targetResteAVivre: result.target.resteAVivre,
          delta: result.deltaResteAVivre,
          /* The range matters: a single figure would overstate the precision. */
          deltaRange: result.deltaRange,
          bestDistrict: result.target.districtName,
          requiredTargetSalary: result.requiredTargetSalary,
          waterfall: result.waterfall,
          fiscalComputed: result.fiscalComputed,
          omitted: result.omitted.map((l) => l.key),
          lines: {
            current: summarise(result.current),
            target: summarise(result.target),
          },
        };
      },
    }),
};

const sourcesTool: RegisteredTool = {
  capability: "readPublicData",
  build: () =>
    tool({
      description:
        "The provenance registry: for every source, its publisher, vintage, " +
        "geographic level and known caveat. Use it whenever asked where a figure " +
        "comes from or how old it is.",
      inputSchema: z.object({}),
      execute: async () => ({
        sources: Object.entries(DATA_SOURCES).map(([code, s]) => ({
          code,
          label: s.label,
          publisher: s.publisher,
          vintage: typeof s.vintage === "string" ? s.vintage : "see UI",
          geoLevel: s.geoLevel,
          url: s.url ?? null,
        })),
      }),
    }),
};

/** The registry. Adding a tool means adding one entry here and nothing else. */
export const TOOL_REGISTRY: Record<string, RegisteredTool> = {
  listCities: listCitiesTool,
  citySnapshot: citySnapshotTool,
  compareSituations: compareTool,
  dataSources: sourcesTool,
};

/** Only the tools this role is allowed to call. */
export function toolsFor(role: Role, only?: readonly string[]) {
  const entries = Object.entries(TOOL_REGISTRY).filter(
    ([name, t]) => can(role, t.capability) && (!only || only.includes(name)),
  );
  return Object.fromEntries(entries.map(([name, t]) => [name, t.build()]));
}

/* -------------------------------------------------------------- helpers ---- */

type CompareArgs = {
  currentCityId: string;
  currentDistrictId: string;
  currentNetSalary: number;
  currentRent: number;
  targetCityId: string;
  targetNetSalary: number;
  adults: number;
  children: number;
  surfaceM2: number;
};

/**
 * Fills the engine's input from the handful of things a conversation realistically
 * yields, leaving everything else at its documented default.
 *
 * The up-front block is off: nobody mentions their removal budget in passing, and
 * a fabricated 1 200 € would show up in an answer as though it had been asked for.
 */
function buildCompareInput(a: CompareArgs): CompareInput {
  const commute = { mode: "voiture" as const, daysOnSitePerWeek: 5, oneWayKm: 0 };
  return {
    current: {
      cityId: a.currentCityId,
      districtId: a.currentDistrictId,
      netSalary: a.currentNetSalary,
      partnerNetSalary: 0,
      housingType: "appartement",
      surfaceM2: a.surfaceM2,
      actualRent: a.currentRent,
      oneWayKm: 8,
    },
    target: {
      cityId: a.targetCityId,
      netSalary: a.targetNetSalary,
      partnerNetSalary: 0,
      housingType: "appartement",
      surfaceM2: a.surfaceM2,
    },
    household: {
      adults: a.adults === 2 ? 2 : 1,
      children: a.children,
      childrenInCreche: 0,
      crecheHoursPerMonth: 0,
    },
    vehicle: {
      energy: "thermique",
      litresPer100Km: 6.5,
      kwhPer100Km: 17,
      homeChargingShare: 0.8,
    },
    currentCommute: commute,
    targetCommute: commute,
    currentErrands: { mode: "voiture", tripsPerMonth: 5, bikeAmortizationPerYear: 0 },
    targetErrands: { mode: "voiture", tripsPerMonth: 5, bikeAmortizationPerYear: 0 },
    /* No family trips assumed: inventing them would move the verdict. */
    familyTravel: { currentKm: 0, targetKm: 0, tripsPerYear: 0 },
    otherMonthly: 0,
    moveCost: null,
    otherIncome: { dividendsMonthly: 0, rentalMonthly: 0, declaredBenefitsMonthly: 0 },
  };
}

/** The lines, reduced to what an answer can actually use: key, amount, status. */
function summarise(side: SideResult) {
  const pick = (lines: readonly Line[]) =>
    lines.map((l) => ({ key: l.key, amount: l.amount, status: l.status }));
  return {
    city: side.cityName,
    district: side.districtName,
    revenus: pick(side.revenus),
    depenses: pick(side.depenses),
  };
}

import {
  findCity,
  findDistrict,
  nationalParams,
  type CompareInput,
  type HousingType,
  type TravelMode,
  type VehicleEnergy,
} from "@/domain/reste-a-vivre";

/*
  v2 because the vehicle moved out of the commute and gained an energy type. The
  version is bumped rather than migrated: a stale payload would silently produce
  NaN totals, and there is nothing in a wizard draft worth a migration path.
*/
export const JOB_DRAFT_KEY = "statwise:job:draft:v2";
export const JOB_INPUT_KEY = "statwise:job:input:v2";

/**
 * Editable wizard state for "Trouver mon job".
 *
 * Flat and fully defined — every field always has a value so the controls stay
 * controlled, exactly as in the neighbourhood wizard. The asymmetry of the
 * product lives in the field names: everything prefixed `current` is a fact the
 * user gives us, everything prefixed `target` is something we will estimate.
 */
export type JobDraft = {
  currentCityId: string;
  currentDistrictId: string;
  netSalary: number;
  partnerNetSalary: number;
  housingType: HousingType;
  surfaceM2: number;
  actualRent: number;
  oneWayKm: number;

  targetCityId: string;
  targetNetSalary: number;
  targetSurfaceM2: number;

  adults: 1 | 2;
  children: number;
  childrenInCreche: number;
  crecheHoursPerMonth: number;

  currentCommuteMode: TravelMode;
  targetCommuteMode: TravelMode;
  daysOnSitePerWeek: number;

  vehicleEnergy: VehicleEnergy;
  litresPer100Km: number;
  kwhPer100Km: number;
  /** Percentage, 0–100. Converted to a 0–1 share when handed to the engine. */
  homeChargingSharePct: number;

  errandsMode: TravelMode;
  tripsPerMonth: number;
  bikeAmortizationPerYear: number;
};

/**
 * Starts on the scenario the simulator was designed around: Dijon at 2 300 €
 * with a 900 € rent and a child in nursery, against Lyon at 3 000 €. A wizard
 * that opens on a real question is faster to judge than one that opens empty.
 */
export const defaultJobDraft: JobDraft = {
  currentCityId: "dijon",
  currentDistrictId: "centre-ville",
  netSalary: 2300,
  partnerNetSalary: 0,
  housingType: "appartement",
  surfaceM2: 65,
  actualRent: 900,
  oneWayKm: 3,

  targetCityId: "lyon",
  targetNetSalary: 3000,
  targetSurfaceM2: 65,

  adults: 1,
  children: 1,
  childrenInCreche: 1,
  crecheHoursPerMonth: 160,

  currentCommuteMode: "voiture",
  targetCommuteMode: "transports",
  daysOnSitePerWeek: 5,

  vehicleEnergy: "thermique",
  litresPer100Km: 6.5,
  kwhPer100Km: nationalParams.defaultKwhPer100Km,
  homeChargingSharePct: 80,

  errandsMode: "voiture",
  tripsPerMonth: nationalParams.defaultGroceryTripsPerMonth,
  bikeAmortizationPerYear: 150,
};

/** Maps the editable draft to the engine input, or null if the places are unknown. */
export function draftToInput(draft: JobDraft): CompareInput | null {
  const currentCity = findCity(draft.currentCityId);
  if (!currentCity || !findDistrict(currentCity, draft.currentDistrictId)) return null;
  if (!findCity(draft.targetCityId)) return null;

  // A child cannot be in nursery without being a dependent child first; the
  // wizard keeps these in step, but the mapping refuses to trust that.
  const children = Math.max(0, draft.children);
  const childrenInCreche = Math.min(Math.max(0, draft.childrenInCreche), children);

  return {
    current: {
      cityId: draft.currentCityId,
      districtId: draft.currentDistrictId,
      netSalary: draft.netSalary,
      partnerNetSalary: draft.adults === 2 ? draft.partnerNetSalary : 0,
      housingType: draft.housingType,
      surfaceM2: draft.surfaceM2,
      actualRent: draft.actualRent,
      oneWayKm: draft.oneWayKm,
    },
    target: {
      cityId: draft.targetCityId,
      netSalary: draft.targetNetSalary,
      partnerNetSalary: draft.adults === 2 ? draft.partnerNetSalary : 0,
      housingType: draft.housingType,
      surfaceM2: draft.targetSurfaceM2,
    },
    household: {
      adults: draft.adults,
      children,
      childrenInCreche,
      crecheHoursPerMonth: draft.crecheHoursPerMonth,
    },
    vehicle: {
      energy: draft.vehicleEnergy,
      litresPer100Km: draft.litresPer100Km,
      kwhPer100Km: draft.kwhPer100Km,
      homeChargingShare: Math.min(Math.max(draft.homeChargingSharePct, 0), 100) / 100,
    },
    currentCommute: {
      mode: draft.currentCommuteMode,
      daysOnSitePerWeek: draft.daysOnSitePerWeek,
    },
    targetCommute: {
      mode: draft.targetCommuteMode,
      daysOnSitePerWeek: draft.daysOnSitePerWeek,
    },
    currentErrands: {
      mode: draft.errandsMode,
      tripsPerMonth: draft.tripsPerMonth,
      bikeAmortizationPerYear: draft.bikeAmortizationPerYear,
    },
    targetErrands: {
      mode: draft.errandsMode,
      tripsPerMonth: draft.tripsPerMonth,
      bikeAmortizationPerYear: draft.bikeAmortizationPerYear,
    },
  };
}

export function loadJobDraft(): JobDraft | null {
  return readJson<JobDraft>(JOB_DRAFT_KEY);
}

export function saveJobDraft(draft: JobDraft): void {
  writeJson(JOB_DRAFT_KEY, draft);
}

export function saveJobInput(input: CompareInput): void {
  writeJson(JOB_INPUT_KEY, input);
}

export function loadJobInput(): CompareInput | null {
  return readJson<CompareInput>(JOB_INPUT_KEY);
}

function readJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage may be unavailable (private mode / quota) — fail silently
  }
}

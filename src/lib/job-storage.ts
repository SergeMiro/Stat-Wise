import { ALL_SECTION_IDS, type SectionId } from "@/lib/job-sections";
import {
  findCity,
  findDistrict,
  nationalParams,
  type CompareInput,
  type MoveCostInput,
  type MoveCostItem,
  type HousingType,
  type TravelMode,
  type VehicleEnergy,
} from "@/domain/reste-a-vivre";

/*
  The version is bumped rather than migrated: a stale payload would silently produce
  NaN totals, and there is nothing in a wizard draft worth a migration path.

  v6 because the up-front block became four items with their own checkboxes, so a
  single `removalCost` no longer describes it — and because a draft that predates
  the `move` section would read as having switched it off deliberately, making the
  block vanish from a returning user's result with no explanation. Discarding the
  draft costs a re-entry; keeping it costs a wrong answer.
*/
export const JOB_DRAFT_KEY = "statwise:job:draft:v6";
export const JOB_INPUT_KEY = "statwise:job:input:v6";

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

  /** One-way km to close family, from each side, and how often they are visited. */
  familyKmCurrent: number;
  familyKmTarget: number;
  familyTripsPerYear: number;

  /**
   * Everything that does not change with the city: insurance, telecom, clothing,
   * leisure, subscriptions. One declared figure, so the absolute result stops
   * being overstated without pretending to model categories no dataset covers.
   */
  otherMonthly: number;
  /**
   * The up-front block, item by item.
   *
   * Each item is a checkbox and an amount. `amount: null` means "use the figure the
   * rules give"; a number is the household's own. Four items rather than one number
   * because the four are independent: a household can face a deposit and no removal,
   * or a removal and no letting fee.
   */
  moveItems: {
    deposit: MoveItemDraft;
    agencyFee: MoveItemDraft;
    removal: MoveItemDraft;
    rentOverlap: MoveItemDraft;
  };
  /** Set once the move section has been walked, so the list can colour it. */
  moveReviewed: boolean;

  /** Net monthly dividends. Does not change with the city, so it applies to both sides. */
  dividendsMonthly: number;
  /** Net monthly rental income (revenus fonciers). Also place-invariant. */
  rentalMonthly: number;
  /**
   * What the CAF pays today, as the household knows it. Applied to the current
   * side only: housing benefit depends on the rent and the commune's zone, so
   * carrying today's figure to another city would invent money.
   */
  declaredBenefitsMonthly: number;

  /** Which sections the user wants to walk. Required ones are always included. */
  enabledSections: SectionId[];
  /**
   * Whether these two blocks were reviewed. "Single adult, no children" and
   * "no car" are real answers that leave every field at its default, so a filled
   * section cannot be detected from the values alone.
   */
  householdReviewed: boolean;
  travelReviewed: boolean;
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

  familyKmCurrent: 30,
  familyKmTarget: 200,
  familyTripsPerYear: 6,

  otherMonthly: 420,
  /*
    Everything on and priced by the rules to begin with: the common case is a real
    move, and a household that faces less than that will say so.
  */
  moveItems: {
    deposit: { included: true, amount: null },
    agencyFee: { included: true, amount: null },
    removal: { included: true, amount: null },
    rentOverlap: { included: true, amount: null },
  },
  moveReviewed: false,

  dividendsMonthly: 0,
  rentalMonthly: 0,
  declaredBenefitsMonthly: 0,

  // Everything on by default: the list is there to be pruned, not assembled.
  enabledSections: ALL_SECTION_IDS,
  householdReviewed: false,
  travelReviewed: false,
};

/** One up-front item as the wizard stores it. */
export type MoveItemDraft = { included: boolean; amount: number | null };

/** Clamps the amounts a user can type, keeping null as "use the rules". */
function cleanMoveItems(items: JobDraft["moveItems"]): MoveCostInput {
  const clean = (item: MoveItemDraft): MoveCostItem => ({
    included: item.included,
    amount: item.amount === null ? null : Math.max(0, item.amount),
  });
  return {
    deposit: clean(items.deposit),
    agencyFee: clean(items.agencyFee),
    removal: clean(items.removal),
    rentOverlap: clean(items.rentOverlap),
  };
}

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
    familyTravel: {
      currentKm: Math.max(0, draft.familyKmCurrent),
      targetKm: Math.max(0, draft.familyKmTarget),
      tripsPerYear: Math.max(0, draft.familyTripsPerYear),
    },
    otherMonthly: Math.max(0, draft.otherMonthly),
    moveCost: draft.enabledSections.includes("move") ? cleanMoveItems(draft.moveItems) : null,
    otherIncome: {
      dividendsMonthly: Math.max(0, draft.dividendsMonthly),
      rentalMonthly: Math.max(0, draft.rentalMonthly),
      declaredBenefitsMonthly: Math.max(0, draft.declaredBenefitsMonthly),
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

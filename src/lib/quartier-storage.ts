import type {
  HouseholdType,
  HousingMode,
  NeighbourhoodHardConstraints,
  NeighbourhoodPriorities,
  NeighbourhoodSimulationInput,
  PropertyType,
} from "@/domain/types";

export const QUARTIER_DRAFT_KEY = "statwise:quartier:draft:v1";
export const QUARTIER_INPUT_KEY = "statwise:quartier:input:v1";

/** Editable wizard state. Booleans are always defined to keep controls controlled. */
export type QuartierDraft = {
  cityId?: string;
  housingMode: HousingMode;
  propertyType: PropertyType;
  maxMonthlyRent?: number;
  rentIncludesCharges: boolean;
  maxPurchaseBudget?: number;
  minSurfaceM2?: number;
  minRooms?: number;
  householdType: HouseholdType;
  hasCar: boolean;
  usesTransport: boolean;
  priorities: NeighbourhoodPriorities;
  hardConstraints: NeighbourhoodHardConstraints;
};

export const defaultDraft: QuartierDraft = {
  housingMode: "rent",
  propertyType: "any",
  rentIncludesCharges: true,
  householdType: "couple",
  hasCar: false,
  usesTransport: true,
  priorities: {
    housing: 2,
    mobility: 2,
    dailyServices: 2,
    health: 1,
    tranquillity: 1,
    family: 1,
    sportAndLeisure: 1,
    nature: 1,
  },
  hardConstraints: {},
};

/** Map the editable draft to the engine input. Returns null until a city is chosen. */
export function draftToInput(draft: QuartierDraft): NeighbourhoodSimulationInput | null {
  if (!draft.cityId) return null;
  const wantsRent = draft.housingMode === "rent" || draft.housingMode === "both";
  const wantsBuy = draft.housingMode === "buy" || draft.housingMode === "both";
  return {
    cityId: draft.cityId,
    housingMode: draft.housingMode,
    propertyType: draft.propertyType,
    maxMonthlyRent: wantsRent ? draft.maxMonthlyRent : undefined,
    rentIncludesCharges: wantsRent ? draft.rentIncludesCharges : undefined,
    maxPurchaseBudget: wantsBuy ? draft.maxPurchaseBudget : undefined,
    minSurfaceM2: draft.minSurfaceM2,
    minRooms: draft.minRooms,
    householdType: draft.householdType,
    hasCar: draft.hasCar,
    priorities: draft.priorities,
    hardConstraints: draft.hardConstraints,
  };
}

export function loadDraft(): QuartierDraft | null {
  return readJson<QuartierDraft>(QUARTIER_DRAFT_KEY);
}

export function saveDraft(draft: QuartierDraft): void {
  writeJson(QUARTIER_DRAFT_KEY, draft);
}

export function saveInput(input: NeighbourhoodSimulationInput): void {
  writeJson(QUARTIER_INPUT_KEY, input);
}

export function loadInput(): NeighbourhoodSimulationInput | null {
  return readJson<NeighbourhoodSimulationInput>(QUARTIER_INPUT_KEY);
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

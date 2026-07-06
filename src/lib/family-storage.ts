import type { ChildAgeGroup, FamilyPriorities, FamilySimulationInput } from "@/domain/types";
import { loadInput } from "@/lib/quartier-storage";

export const FAMILY_DRAFT_KEY = "statwise:family:draft:v1";
export const FAMILY_INPUT_KEY = "statwise:family:input:v1";

export const MAX_FAMILY_AREAS = 3;

/** Editable wizard state for "Grandir ici". */
export type FamilyDraft = {
  cityId?: string;
  /** 0..3 while editing; validated to 1..3 on finish. */
  selectedAreaIds: string[];
  childrenCount: "1" | "2" | "3_plus";
  childAgeGroup: ChildAgeGroup;
  priorities: FamilyPriorities;
};

export const defaultFamilyDraft: FamilyDraft = {
  selectedAreaIds: [],
  childrenCount: "1",
  childAgeGroup: "3_5",
  priorities: {
    earlyChildhood: 2,
    education: 2,
    health: 2,
    sportsAndLeisure: 1,
    nature: 1,
    mobility: 1,
    tranquillity: 1,
    dailyServices: 1,
  },
};

/**
 * Seed a fresh draft, pre-filling the city from the last "Trouver mon quartier"
 * run so the two simulators feel connected (§7.2). Read on the client only.
 */
export function initialFamilyDraft(): FamilyDraft {
  const prior = loadInput();
  return prior?.cityId ? { ...defaultFamilyDraft, cityId: prior.cityId } : defaultFamilyDraft;
}

/** Map the editable draft to the engine input. Returns null until valid (city + 1..3 areas). */
export function draftToFamilyInput(draft: FamilyDraft): FamilySimulationInput | null {
  if (!draft.cityId) return null;
  const areas = draft.selectedAreaIds.slice(0, MAX_FAMILY_AREAS);
  if (areas.length < 1) return null;
  return {
    cityId: draft.cityId,
    selectedAreaIds: areas,
    childrenCount: draft.childrenCount,
    childAgeGroup: draft.childAgeGroup,
    priorities: draft.priorities,
  };
}

export function loadFamilyDraft(): FamilyDraft | null {
  return readJson<FamilyDraft>(FAMILY_DRAFT_KEY);
}

export function saveFamilyDraft(draft: FamilyDraft): void {
  writeJson(FAMILY_DRAFT_KEY, draft);
}

export function saveFamilyInput(input: FamilySimulationInput): void {
  writeJson(FAMILY_INPUT_KEY, input);
}

export function loadFamilyInput(): FamilySimulationInput | null {
  return readJson<FamilySimulationInput>(FAMILY_INPUT_KEY);
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

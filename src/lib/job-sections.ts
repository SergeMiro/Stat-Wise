import type { JobDraft } from "@/lib/job-storage";

/**
 * The simulation as a set of sections rather than a fixed run of steps.
 *
 * Someone who does not own a car, has no dividends and receives nothing from the
 * CAF should not walk through three screens to say so. So the sections are listed
 * up front with every box ticked, any of them can be turned off before starting or
 * during the run, and the wizard walks whatever is left.
 *
 * Two sections cannot be turned off. Without today's situation there is no anchor
 * and without the offer there is nothing to compare it to — a simulation missing
 * either is not a shorter simulation, it is no simulation. Saying so in the type is
 * better than letting someone discover it at the end.
 */

export type SectionId =
  | "today"
  | "offer"
  | "household"
  | "travel"
  | "dividends"
  | "rental"
  | "aide"
  | "family"
  | "other"
  | "move";

export type Section = {
  id: SectionId;
  /** Cannot be switched off. */
  required: boolean;
  /**
   * Whether the user has actually put something in it. Drives the colour in the
   * section list — green only when there is real content, never merely visited.
   */
  isFilled: (draft: JobDraft) => boolean;
};

/** Order matters: this is the order the wizard walks. */
export const SECTIONS: Section[] = [
  {
    id: "today",
    required: true,
    isFilled: (d) => Boolean(d.currentCityId && d.currentDistrictId) && d.netSalary > 0,
  },
  {
    id: "offer",
    required: true,
    isFilled: (d) => Boolean(d.targetCityId) && d.targetNetSalary > 0,
  },
  {
    id: "household",
    required: false,
    // Touched rather than typed: a single adult with no children is a real answer,
    // so this asks whether the household block has been reviewed at all.
    isFilled: (d) => d.householdReviewed,
  },
  { id: "travel", required: false, isFilled: (d) => d.travelReviewed },
  { id: "dividends", required: false, isFilled: (d) => d.dividendsMonthly > 0 },
  { id: "rental", required: false, isFilled: (d) => d.rentalMonthly > 0 },
  { id: "aide", required: false, isFilled: (d) => d.declaredBenefitsMonthly > 0 },
  { id: "family", required: false, isFilled: (d) => d.familyTripsPerYear > 0 },
  { id: "other", required: false, isFilled: (d) => d.otherMonthly > 0 },
  /*
    Last, and switchable off, because changing job is not always moving house.
    Someone who keeps their current home and rents in the new city pays no removal;
    someone housed by their employer pays none of this block at all. Its default is
    a removal cost, so "filled" has to mean reviewed rather than non-zero.
  */
  { id: "move", required: false, isFilled: (d) => d.moveReviewed },
];

export const ALL_SECTION_IDS: SectionId[] = SECTIONS.map((s) => s.id);

export const REQUIRED_SECTION_IDS: SectionId[] = SECTIONS.filter((s) => s.required).map(
  (s) => s.id,
);

/** The sections to walk, in order, from whatever the user has enabled. */
export function activeSections(enabled: readonly SectionId[]): SectionId[] {
  const set = new Set<SectionId>([...enabled, ...REQUIRED_SECTION_IDS]);
  return ALL_SECTION_IDS.filter((id) => set.has(id));
}

export type SectionState = "filled" | "pending" | "disabled";

export function sectionState(
  section: Section,
  enabled: readonly SectionId[],
  draft: JobDraft,
): SectionState {
  if (!section.required && !enabled.includes(section.id)) return "disabled";
  return section.isFilled(draft) ? "filled" : "pending";
}

/**
 * Toggles a section, refusing to remove a required one.
 *
 * Returned rather than mutated so the caller cannot end up with a list that
 * excludes a section the wizard will walk anyway.
 */
export function toggleSection(enabled: readonly SectionId[], id: SectionId): SectionId[] {
  if (REQUIRED_SECTION_IDS.includes(id)) return [...enabled];
  return enabled.includes(id)
    ? enabled.filter((x) => x !== id)
    : ALL_SECTION_IDS.filter((x) => x === id || enabled.includes(x));
}

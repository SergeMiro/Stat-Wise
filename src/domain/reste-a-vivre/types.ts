import type { SourceCode } from "./sources";

/**
 * Types for the reste-à-vivre engine ("Trouver mon job").
 *
 * The central object is `Line`: one row of money with its provenance attached.
 * A line whose amount is `null` is *not* a line worth zero euros — it is a line
 * we cannot compute, and it must stay visible in the result so the reader knows
 * the total is incomplete. That distinction is the whole point of the missing
 * data policy in `docs/data-catalog.md`, and it is enforced by the type.
 *
 * The engine never produces human text. Like the neighbourhood engine, it emits
 * translation keys plus the numbers that go into them, so the same calculation
 * reads correctly in French and English. `Num` carries the number of decimals
 * because precision is meaningful here: 0,2016 €/kWh rounded to two decimals
 * would stop being the tariff it claims to be.
 */

/** A number destined for a sentence, with the precision it must keep. */
export type Num = { n: number; d?: number };

export type Interpolation = Record<string, string | Num>;

/** A translation key and the values to interpolate into it. */
export type Explanation = { key: string; params?: Interpolation };

export type LineKind = "revenu" | "contrainte" | "pilotable";

export type LineStatus =
  /** Entered by the user — the most reliable input we have. */
  | "user"
  /** Derived from snapshot data or a published ruleset. */
  | "computed"
  /** An assumed figure, documented and overridable. Never presented as measured. */
  | "convention"
  /** Genuinely unknown. Excluded from totals, listed in the result. */
  | "unavailable"
  /** Known not to apply to this situation (e.g. taxe foncière for a tenant). */
  | "non_applicable";

export type Line = {
  /** Stable identity, independent of language. Used to look a line up. */
  key: string;
  label: Explanation;
  kind: LineKind;
  /** Euros per month. `null` whenever status is `unavailable` or `non_applicable`. */
  amount: number | null;
  status: LineStatus;
  /** Required when the amount is null: why, in plain language. */
  reason?: Explanation;
  /** How the figure was obtained, shown in the detail panel. */
  basis?: Explanation;
  sources: SourceCode[];
};

export type HousingType = "appartement" | "maison";

/** How a journey is made. */
export type TravelMode = "voiture" | "transports" | "actif";

export type Household = {
  adults: 1 | 2;
  /** Dependent children in the household. */
  children: number;
  /** Children needing paid early-years care (crèche). Subset of `children`. */
  childrenInCreche: number;
  /** Contracted crèche hours per month. */
  crecheHoursPerMonth: number;
};

export type CommuteInput = {
  mode: TravelMode;
  daysOnSitePerWeek: number;
  /** Litres per 100 km, for the `voiture` mode. */
  litresPer100Km: number;
};

/**
 * Grocery runs. Separate from the commute because the mode is often different
 * — and because the employer's 50 % share covers the commute only, so a pass
 * already paid for work makes these trips free while a car does not.
 */
export type ErrandsInput = {
  mode: TravelMode;
  tripsPerMonth: number;
  /**
   * Yearly cost the user accepts for keeping a bicycle on the road. Chosen by
   * them from suggested starting points; 0 when they walk. No public dataset
   * publishes this, so it is always labelled a hypothesis.
   */
  bikeAmortizationPerYear: number;
};

/** The side the user already lives on — anchored on real figures. */
export type CurrentSide = {
  cityId: string;
  districtId: string;
  /** Net monthly salary before income tax. */
  netSalary: number;
  /** Second earner's net monthly salary, 0 when there is none. */
  partnerNetSalary: number;
  housingType: HousingType;
  surfaceM2: number;
  /** Rent actually paid, charges comprises. The anchor of the whole comparison. */
  actualRent: number;
  /** One-way distance actually travelled to work. */
  oneWayKm: number;
};

/** The side being considered — housing and commute come from the data. */
export type TargetSide = {
  cityId: string;
  netSalary: number;
  partnerNetSalary: number;
  housingType: HousingType;
  surfaceM2: number;
};

export type SideResult = {
  cityId: string;
  cityName: string;
  districtId: string;
  districtName: string;
  revenus: Line[];
  depenses: Line[];
  /** Lines excluded from the totals, kept for display. */
  omitted: Line[];
  totalRevenus: number;
  totalDepenses: number;
  resteAVivre: number;
  /** Hours per year spent commuting — the non-monetary axis. */
  commuteHoursPerYear: number;
  oneWayKm: number;
  oneWayMinutes: number;
  /** One-way distance to the nearest large food store, in km. */
  groceryKm: number;
};

export type Comparison = {
  current: SideResult;
  target: SideResult;
  /** Positive means the target leaves more money each month. */
  deltaResteAVivre: number;
  deltaSalary: number;
  deltaHousing: number;
  /** Positive means the target costs more commuting hours per year. */
  deltaCommuteHours: number;
  /** Every other district of the target city, best reste à vivre first. */
  alternatives: SideResult[];
  /** Lines we refuse to invent — the honest health warning. */
  omitted: Line[];
};

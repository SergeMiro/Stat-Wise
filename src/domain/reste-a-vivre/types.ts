import type { DistanceSource } from "./snapshot";
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

/**
 * A value to interpolate: a plain string, a number with its precision, or another
 * translated fragment. The nested case exists so that the sentence describing
 * *which journeys* are being charged is written once and reused by petrol,
 * home charging and public charging, instead of being duplicated per energy type.
 */
export type Interpolation = Record<string, string | Num | Explanation>;

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
};

/** What the car burns. Hybrids are treated as `thermique` — see the note below. */
export type VehicleEnergy = "thermique" | "electrique";

/**
 * The household's car. One per household, not one per journey: the commute and
 * the shopping runs share the same vehicle, which is why kilometres are pooled
 * before any per-kilometre cost is applied.
 *
 * Hybrids and plug-in hybrids are deliberately absent. The DGFiP mileage
 * allowance treats them as thermal vehicles, and modelling their real split
 * between petrol and electricity would need a figure no public dataset gives.
 * Offering a third option would look like precision we do not have.
 */
export type VehicleInput = {
  energy: VehicleEnergy;
  /** Litres per 100 km. Used when `energy` is `thermique`. */
  litresPer100Km: number;
  /** kWh per 100 km. Used when `energy` is `electrique`. */
  kwhPer100Km: number;
  /**
   * Share of charging done at home, 0 to 1. The rest is charged on public
   * points, at a very different price — which is why this is asked rather than
   * assumed. A flat without a parking space means 0.
   */
  homeChargingShare: number;
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

/**
 * Trips to close family. The largest place-driven cost nobody computes: moving
 * 400 km away turns four visits a year into real money, and it is the reason
 * people most often refuse a move.
 *
 * The distances are declared rather than routed — the user knows them, and asking
 * avoids sending an address to a geocoder for no gain.
 */
export type FamilyTravelInput = {
  /** One-way km from the current home to close family. */
  currentKm: number;
  /** One-way km from the target city. */
  targetKm: number;
  tripsPerYear: number;
};

/**
 * Income the household already has, declared rather than modelled.
 *
 * Dividends and rental income do not change with the city, so they sit on both
 * sides and cancel in the difference — they are here to make the absolute figure
 * true, not to move the verdict. Benefits are different: they depend on the rent
 * and the commune, so today's amount is applied to today's side only.
 */
export type OtherIncomeInput = {
  dividendsMonthly: number;
  rentalMonthly: number;
  declaredBenefitsMonthly: number;
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
  /**
   * Declared spending that does not change with the city — insurance, telecom,
   * clothing, leisure. Deliberately outside `depenses`, because including it
   * would corrupt the comparable total while cancelling out in the difference.
   */
  autres: Line;
  totalRevenus: number;
  totalDepenses: number;
  /** Place-driven only. This is what the verdict rests on. */
  resteAVivre: number;
  /** What the household actually has left: comparable minus declared spending. */
  resteAVivreReel: number;
  /** Hours per year spent commuting — the non-monetary axis. */
  commuteHoursPerYear: number;
  oneWayKm: number;
  oneWayMinutes: number;
  /** One-way distance to the nearest large food store, in km. */
  groceryKm: number;
  /** Whether this district's distances were measured on the road or modelled. */
  distanceSource: DistanceSource;
  /**
   * The shop the grocery distance was measured to. Shown to the reader, because
   * OpenStreetMap tags a small organic shop and a hypermarket alike: naming the
   * shop is what lets someone judge whether it is where they would do a weekly
   * shop, instead of trusting a bare number.
   */
  groceryName: string | null;
};

/**
 * Income tax from the socio-fiscal rules engine, in euros per month.
 *
 * Optional everywhere: when the engine cannot be reached the line goes back to
 * being `non chiffré`, which is what it was before this was wired in. The
 * calculation engine stays pure — it receives a number, it never makes the call.
 *
 * Benefits are absent on purpose. See `src/lib/openfisca-payload.ts`: the rules
 * engine answers for housing benefit, and the answer is wrong in a way that reads
 * as right.
 */
export type FiscalResult = {
  /** Positive when the household owes tax. */
  incomeTaxMonthly: number;
  /** Legislation year the figure was computed against. */
  year: number;
};

/** One bar of the difference, so the result answers "why" and not only "how much". */
export type WaterfallStep = { key: string; amount: number };

/**
 * Cash needed before the move. The `ponctuel` class from
 * `docs/reste-a-vivre-variables.md` §1: never spread across months, because
 * 3 200 € divided by twelve would quietly eat 267 €/month of the verdict.
 */
export type MoveCost = { lines: Line[]; total: number };

export type Comparison = {
  current: SideResult;
  target: SideResult;
  /** Positive means the target leaves more money each month. */
  deltaResteAVivre: number;
  /**
   * The same difference with the target rent at the P25 and P75 of the local
   * spread. A single figure would claim a precision a commune-level rent
   * indicator does not have.
   */
  deltaRange: { low: number; high: number };
  deltaSalary: number;
  deltaHousing: number;
  /** Positive means the target costs more commuting hours per year. */
  deltaCommuteHours: number;
  /** The difference grouped by cause, largest first. */
  waterfall: WaterfallStep[];
  /**
   * Net monthly salary in the target city that would leave exactly today's
   * amount. Null when no salary in a sane range achieves it.
   */
  requiredTargetSalary: number | null;
  moveCost: MoveCost;
  /** Every other district of the target city, best reste à vivre first. */
  alternatives: SideResult[];
  /** Lines we refuse to invent — the honest health warning. */
  omitted: Line[];
};

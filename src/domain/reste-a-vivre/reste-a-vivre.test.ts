import { describe, expect, it } from "vitest";
import { listCities } from "@/lib/mock/cities";
import { ALL_SECTION_IDS, REQUIRED_SECTION_IDS } from "@/lib/job-sections";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { en } from "@/lib/i18n/dictionaries/en";
import { compare, crecheMonthlyCost, foodMonthlyCost, type CompareInput } from "./engine";
import {
  cities,
  crecheScale,
  ELECTRICITY_VINTAGE,
  MARKET_COVERAGE,
  nationalParams,
  RENT_IS_MEASURED,
  SEWERAGE_NATIONAL,
  UTILITIES_COVERAGE,
  WATER_VINTAGE,
} from "./snapshot";
import { DATA_SOURCES, SOURCE_CODES } from "./sources";
import { gradeVerdict, isCelebration } from "./verdict";
import type { Explanation, Line, SideResult } from "./types";

/**
 * The engine decides money, so a silent sign error or a null treated as zero
 * would be invisible in the UI. These checks pin the arithmetic, the provenance
 * discipline and the two joins that make the simulator part of this app: the
 * shared city list, and the translation keys it emits.
 */

// --- fixtures --------------------------------------------------------------

/** The scenario the product was designed around: Dijon 2 300 € → Lyon 3 000 €. */
const baseInput: CompareInput = {
  current: {
    cityId: "dijon",
    districtId: "centre-ville",
    netSalary: 2300,
    partnerNetSalary: 0,
    housingType: "appartement",
    surfaceM2: 65,
    actualRent: 900,
    oneWayKm: 3,
  },
  target: {
    cityId: "lyon",
    netSalary: 3000,
    partnerNetSalary: 0,
    housingType: "appartement",
    surfaceM2: 65,
  },
  household: { adults: 2, children: 1, childrenInCreche: 1, crecheHoursPerMonth: 160 },
  vehicle: {
    energy: "thermique",
    litresPer100Km: 6.5,
    kwhPer100Km: 17,
    homeChargingShare: 0.8,
  },
  currentCommute: { mode: "voiture", daysOnSitePerWeek: 5 },
  targetCommute: { mode: "transports", daysOnSitePerWeek: 5 },
  currentErrands: { mode: "voiture", tripsPerMonth: 5, bikeAmortizationPerYear: 150 },
  targetErrands: { mode: "transports", tripsPerMonth: 5, bikeAmortizationPerYear: 150 },
  familyTravel: { currentKm: 30, targetKm: 200, tripsPerYear: 6 },
  otherMonthly: 420,
  removalCost: 1200,
  includeMoveCost: true,
  otherIncome: { dividendsMonthly: 0, rentalMonthly: 0, declaredBenefitsMonthly: 0 },
};

const electric = (over: Partial<CompareInput["vehicle"]> = {}): CompareInput => ({
  ...baseInput,
  vehicle: { ...baseInput.vehicle, energy: "electrique", ...over },
});

const sumOf = (lines: Line[]) => lines.reduce((s, l) => s + (l.amount ?? 0), 0);
const lineOf = (side: SideResult, key: string) => side.depenses.find((l) => l.key === key);

// --- barème PSU ------------------------------------------------------------

describe("barème PSU", () => {
  const hours = 100;
  const hourly = (resources: number, children: number) =>
    crecheMonthlyCost(resources, children, 1, hours) / hours;
  /** The Cnaf publishes the floors and caps to the cent, so compare to the cent. */
  const cents = (value: number) => Math.round(value * 100) / 100;

  // The published per-hour floors and caps are the rates applied to the resource
  // bounds, rounded to the cent. That is what makes the scale verifiable rather
  // than copied, so these four numbers are the real test of the whole table.
  it("derives the published hourly floor of 0,50 € for one child", () => {
    expect(cents(hourly(300, 1))).toBe(0.5);
  });

  it("derives the published hourly caps", () => {
    expect(cents(hourly(20000, 1))).toBe(5.26);
    expect(cents(hourly(20000, 2))).toBe(4.39);
    expect(cents(hourly(20000, 3))).toBe(3.51);
    expect(cents(hourly(20000, 4))).toBe(2.64);
  });

  it("clamps a child count beyond the table instead of reading undefined", () => {
    expect(cents(hourly(20000, 6))).toBe(2.64);
  });

  it("applies the rate to resources between the bounds", () => {
    expect(hourly(3000, 1)).toBeCloseTo(3000 * crecheScale.rates[0], 4);
  });

  it("charges nothing without a child in care or without hours", () => {
    expect(crecheMonthlyCost(2500, 2, 0, 160)).toBe(0);
    expect(crecheMonthlyCost(2500, 2, 1, 0)).toBe(0);
  });

  it("charges two places at twice one place", () => {
    const one = crecheMonthlyCost(3000, 2, 1, 160);
    expect(crecheMonthlyCost(3000, 2, 2, 160)).toBeCloseTo(one * 2, 2);
  });
});

// --- food ------------------------------------------------------------------

describe("food basket", () => {
  const household = {
    adults: 2 as const,
    children: 1,
    childrenInCreche: 0,
    crecheHoursPerMonth: 0,
  };

  it("counts a child as a fraction of an adult", () => {
    const units = 2 + 1 * nationalParams.foodChildCoefficient;
    expect(foodMonthlyCost(household, false)).toBeCloseTo(
      units * nationalParams.foodPerAdultMonthly,
      2,
    );
  });

  it("applies the Île-de-France premium and nothing else", () => {
    const province = foodMonthlyCost(household, false);
    expect(foodMonthlyCost(household, true)).toBeCloseTo(
      province * (1 + nationalParams.parisRegionFoodPremium),
      2,
    );
  });
});

// --- totals and provenance -------------------------------------------------

describe("comparison totals", () => {
  const result = compare(baseInput);

  it("produces a comparison", () => {
    expect(result).not.toBeNull();
  });

  for (const name of ["current", "target"] as const) {
    describe(name, () => {
      const side = () => (name === "current" ? result!.current : result!.target);

      it("totals equal the sum of the lines", () => {
        expect(side().totalRevenus).toBeCloseTo(sumOf(side().revenus), 2);
        expect(side().totalDepenses).toBeCloseTo(sumOf(side().depenses), 2);
      });

      it("reste à vivre equals revenue minus expenses", () => {
        expect(side().resteAVivre).toBeCloseTo(side().totalRevenus - side().totalDepenses, 2);
      });

      it("keeps no null line inside the totals", () => {
        expect(side().revenus.every((l) => l.amount !== null)).toBe(true);
        expect(side().depenses.every((l) => l.amount !== null)).toBe(true);
      });

      it("gives every omitted line a null amount and a reason", () => {
        expect(side().omitted.every((l) => l.amount === null && Boolean(l.reason))).toBe(true);
      });

      it("cites at least one source on every quantified line", () => {
        expect([...side().revenus, ...side().depenses].every((l) => l.sources.length > 0)).toBe(
          true,
        );
      });
    });
  }

  it("anchors the current side on the rent actually paid", () => {
    const rent = lineOf(result!.current, "loyer");
    expect(rent?.amount).toBe(900);
    expect(rent?.status).toBe("user");
  });

  it("estimates the target rent from €/m² and says so", () => {
    const rent = lineOf(result!.target, "loyer");
    expect(rent?.status).toBe("computed");
    expect(rent?.basis?.key).toBe("rent_estimated");
  });

  it("reports the delta as target minus current", () => {
    expect(result!.deltaResteAVivre).toBeCloseTo(
      result!.target.resteAVivre - result!.current.resteAVivre,
      2,
    );
    expect(result!.deltaSalary).toBeCloseTo(700, 2);
  });
});

// --- ranking ---------------------------------------------------------------

describe("district ranking", () => {
  const result = compare(baseInput)!;
  const ranked = [result.target, ...result.alternatives];

  it("ranks every district of the target city", () => {
    expect(ranked).toHaveLength(cities.find((c) => c.id === "lyon")!.districts.length);
  });

  it("orders by reste à vivre, descending", () => {
    expect(
      ranked.every((side, i) => i === 0 || ranked[i - 1].resteAVivre >= side.resteAVivre),
    ).toBe(true);
  });

  it("puts the cheapest rent first when everything else is equal", () => {
    // A property, not a fixed id: the winner depends on the seed, but with one
    // salary and one household the district with the lowest rent must lead.
    const rentOf = (side: SideResult) => lineOf(side, "loyer")!.amount!;
    const cheapest = Math.min(...ranked.map(rentOf));
    expect(rentOf(result.target)).toBe(cheapest);
  });

  it("exposes the distance to the nearest food store for every district", () => {
    expect(ranked.every((side) => side.groceryKm > 0)).toBe(true);
  });
});

// --- travel ----------------------------------------------------------------

describe("commute and errands", () => {
  const result = compare(baseInput)!;

  it("pools both purposes into one fuel line", () => {
    const fuel = lineOf(result.current, "carburant");
    expect(fuel?.basis?.key).toBe("fuel");
    // The journeys are described by a nested fragment shared with the EV lines.
    expect(fuel?.basis?.params?.purpose).toEqual(expect.objectContaining({ key: "purpose_both" }));
  });

  it("charges no fuel when the commute is by transit", () => {
    expect(lineOf(result.target, "carburant")).toBeUndefined();
  });

  it("credits the employer share only when a pass is held", () => {
    expect(result.target.revenus.some((l) => l.key === "prise_en_charge_transport")).toBe(true);
    expect(result.current.revenus.some((l) => l.key === "prise_en_charge_transport")).toBe(false);
  });

  it("makes grocery journeys free when the work pass already covers them", () => {
    const errands = lineOf(result.target, "courses_transport");
    expect(errands?.amount).toBe(0);
    expect(errands?.basis?.key).toBe("errands_covered_by_pass");
  });

  it("charges tickets, and says the 50 % does not apply, without a work pass", () => {
    const noPass = compare({
      ...baseInput,
      targetCommute: { ...baseInput.targetCommute, mode: "voiture" },
    })!;
    const tickets = lineOf(noPass.target, "courses_transport");
    expect(tickets?.amount).toBeCloseTo(10 * 2.1, 2);
    expect(tickets?.basis?.key).toBe("errands_tickets");
    expect(noPass.target.revenus.some((l) => l.key === "prise_en_charge_transport")).toBe(false);
  });

  it("charges one car once, whatever the number of purposes", () => {
    const both = compare({
      ...baseInput,
      targetCommute: { ...baseInput.targetCommute, mode: "voiture" },
      targetErrands: { ...baseInput.targetErrands, mode: "voiture" },
    })!;
    expect(both.target.depenses.filter((l) => l.key === "carburant")).toHaveLength(1);
    expect(both.target.depenses.filter((l) => l.key === "usage_vehicule")).toHaveLength(1);
  });

  it("spreads the chosen bike amortisation over twelve months as a hypothesis", () => {
    const bike = compare({
      ...baseInput,
      targetErrands: { mode: "actif", tripsPerMonth: 5, bikeAmortizationPerYear: 420 },
    })!;
    const line = lineOf(bike.target, "velo_amortissement");
    expect(line?.amount).toBeCloseTo(35, 2);
    expect(line?.status).toBe("convention");
    expect(line?.basis?.key).toBe("bike_amortization");
  });

  it("charges nothing for walking, with an explicit note", () => {
    const walking = compare({
      ...baseInput,
      targetErrands: { mode: "actif", tripsPerMonth: 5, bikeAmortizationPerYear: 0 },
    })!;
    const line = lineOf(walking.target, "velo_amortissement");
    expect(line?.amount).toBe(0);
    expect(line?.basis?.key).toBe("bike_none");
  });

  it("charges nothing for a pass where the network is free, and drops the employer share", () => {
    const toMontpellier = compare({
      ...baseInput,
      target: { ...baseInput.target, cityId: "montpellier" },
    })!;
    const pass = lineOf(toMontpellier.target, "abonnement_transport")!;
    expect(pass.amount).toBe(0);
    expect(pass.basis?.key).toBe("transit_free");
    // Nothing to reimburse, so no 0 € income line pretending to be a benefit.
    expect(toMontpellier.target.revenus.some((l) => l.key === "prise_en_charge_transport")).toBe(
      false,
    );
  });

  it("keeps one car once, whatever the energy", () => {
    const ev = compare(electric())!;
    expect(ev.current.depenses.filter((l) => l.key === "usage_vehicule")).toHaveLength(1);
    expect(ev.current.depenses.filter((l) => l.key === "carburant")).toHaveLength(0);
  });

  it("keeps the crèche line national — same income, same amount across districts", () => {
    const creche = (side: SideResult) => lineOf(side, "creche")?.amount;
    expect(creche(result.target)).toBe(creche(result.alternatives[0]));
    expect(creche(result.target)).not.toBe(creche(result.current));
  });
});

// --- electric vehicles ------------------------------------------------------

describe("electric vehicle", () => {
  /** The current side drives to work and to the shops, so the car is in use. */
  const side = (input: CompareInput) => compare(input)!.current;

  it("replaces petrol with charging, and charges the same kilometres", () => {
    const petrol = side(baseInput);
    const ev = side(electric());
    const carKm = lineOf(petrol, "carburant")!.basis!.params!.totalKm;
    expect(lineOf(ev, "carburant")).toBeUndefined();
    expect(lineOf(ev, "recharge_domicile")!.basis!.params!.totalKm).toEqual(carKm);
  });

  it("splits the energy between home and public charging at the chosen share", () => {
    const ev = side(electric({ homeChargingShare: 0.75 }));
    const home = lineOf(ev, "recharge_domicile")!;
    const pub = lineOf(ev, "recharge_publique")!;

    const km = (lineOf(ev, "usage_vehicule")!.basis!.params!.km as { n: number }).n;
    const kwh = (km * 17) / 100;
    expect(home.amount).toBeCloseTo(kwh * 0.75 * nationalParams.electricityPricePerKwh, 2);
    expect(pub.amount).toBeCloseTo(kwh * 0.25 * nationalParams.publicChargingPricePerKwh, 2);
  });

  it("prices home charging at the household tariff and public charging above it", () => {
    const ev = side(electric({ homeChargingShare: 0.5 }));
    // Same kWh on each side of a 50/50 split, so the public line must cost more.
    expect(lineOf(ev, "recharge_publique")!.amount!).toBeGreaterThan(
      lineOf(ev, "recharge_domicile")!.amount!,
    );
  });

  it("labels home charging as computed and public charging as an assumption", () => {
    const ev = side(electric({ homeChargingShare: 0.5 }));
    expect(lineOf(ev, "recharge_domicile")!.status).toBe("computed");
    expect(lineOf(ev, "recharge_publique")!.status).toBe("convention");
  });

  it("emits no empty line when charging happens entirely in one place", () => {
    const allHome = side(electric({ homeChargingShare: 1 }));
    expect(lineOf(allHome, "recharge_publique")).toBeUndefined();
    expect(lineOf(allHome, "recharge_domicile")).toBeDefined();

    const allPublic = side(electric({ homeChargingShare: 0 }));
    expect(lineOf(allPublic, "recharge_domicile")).toBeUndefined();
    expect(lineOf(allPublic, "recharge_publique")).toBeDefined();
  });

  it("applies the 20 % DGFiP uplift to running costs, as an assumption", () => {
    const petrol = lineOf(side(baseInput), "usage_vehicule")!;
    const ev = lineOf(side(electric()), "usage_vehicule")!;
    expect(ev.amount!).toBeCloseTo(petrol.amount! * (1 + nationalParams.electricVehicleUplift), 1);
    expect(ev.status).toBe("convention");
    expect(ev.basis?.key).toBe("vehicle_use_ev");
  });

  it("declares the home charging point as a one-off, not a monthly charge", () => {
    const ev = side(electric({ homeChargingShare: 0.8 }));
    const borne = ev.omitted.find((l) => l.key === "borne_domicile")!;
    expect(borne.amount).toBeNull();
    expect(borne.status).toBe("non_applicable");

    // Nobody charging at home has nothing to install.
    const noHome = side(electric({ homeChargingShare: 0 }));
    expect(noHome.omitted.find((l) => l.key === "borne_domicile")).toBeUndefined();
  });

  it("charges nothing to the car when every journey is made without it", () => {
    const noCar = compare({
      ...electric(),
      currentCommute: { ...baseInput.currentCommute, mode: "transports" },
      currentErrands: { ...baseInput.currentErrands, mode: "actif" },
    })!;
    for (const key of ["carburant", "recharge_domicile", "recharge_publique", "usage_vehicule"]) {
      expect(lineOf(noCar.current, key), key).toBeUndefined();
    }
  });
});

// --- comparable versus real ------------------------------------------------

describe("comparable and real reste à vivre", () => {
  const result = compare(baseInput)!;

  it("keeps declared place-invariant spending out of the comparable total", () => {
    // It must not appear among the expenses that feed the verdict…
    expect(result.current.depenses.some((l) => l.key === "autres_depenses")).toBe(false);
    // …but it must still be carried, with the amount the user declared.
    expect(result.current.autres.amount).toBe(420);
    expect(result.current.autres.status).toBe("user");
  });

  it("subtracts it from the real figure only", () => {
    expect(result.current.resteAVivreReel).toBeCloseTo(result.current.resteAVivre - 420, 2);
    expect(result.target.resteAVivreReel).toBeCloseTo(result.target.resteAVivre - 420, 2);
  });

  it("leaves the verdict untouched, because it cancels in the difference", () => {
    const richer = compare({ ...baseInput, otherMonthly: 1500 })!;
    expect(richer.deltaResteAVivre).toBeCloseTo(result.deltaResteAVivre, 2);
    expect(richer.current.resteAVivreReel).toBeLessThan(result.current.resteAVivreReel);
  });
});

// --- travel to family -------------------------------------------------------

describe("travel to family", () => {
  const result = compare(baseInput)!;
  const familyOf = (side: SideResult) => lineOf(side, "deplacements_famille");

  it("costs more from the city that is further away", () => {
    expect(familyOf(result.target)!.amount!).toBeGreaterThan(familyOf(result.current)!.amount!);
  });

  it("scales with the number of trips", () => {
    const twice = compare({
      ...baseInput,
      familyTravel: { ...baseInput.familyTravel, tripsPerYear: 12 },
    })!;
    expect(familyOf(twice.target)!.amount!).toBeCloseTo(familyOf(result.target)!.amount! * 2, 1);
  });

  it("emits nothing when there are no trips, rather than a zero line", () => {
    const none = compare({
      ...baseInput,
      familyTravel: { currentKm: 0, targetKm: 0, tripsPerYear: 0 },
    })!;
    expect(familyOf(none.current)).toBeUndefined();
  });

  it("is labelled an assumption, since trips per year are a habit", () => {
    expect(familyOf(result.target)!.status).toBe("convention");
  });
});

// --- the reverse question ---------------------------------------------------

describe("required salary", () => {
  const result = compare(baseInput)!;

  it("finds the salary that reproduces today's reste à vivre", () => {
    const needed = result.requiredTargetSalary!;
    expect(needed).toBeGreaterThan(0);

    const at = compare({ ...baseInput, target: { ...baseInput.target, netSalary: needed } })!;
    // Solved on the best district and rounded up to 10 €, so it must land at or
    // just above break-even — never below.
    const sameDistrict = [at.target, ...at.alternatives].find(
      (s) => s.districtId === result.target.districtId,
    )!;
    expect(sameDistrict.resteAVivre).toBeGreaterThanOrEqual(result.current.resteAVivre - 0.01);
    expect(sameDistrict.resteAVivre).toBeLessThan(result.current.resteAVivre + 20);
  });

  it("asks for less where the same life is cheaper", () => {
    const toParis = compare({ ...baseInput, target: { ...baseInput.target, cityId: "paris" } })!;
    const toLille = compare({ ...baseInput, target: { ...baseInput.target, cityId: "lille" } })!;
    expect(toParis.requiredTargetSalary!).toBeGreaterThan(toLille.requiredTargetSalary!);
  });
});

// --- waterfall, range, up-front cost ---------------------------------------

describe("how the difference is explained", () => {
  const result = compare(baseInput)!;

  it("adds the waterfall up to the headline difference", () => {
    const sum = result.waterfall.reduce((s, step) => s + step.amount, 0);
    expect(sum).toBeCloseTo(result.deltaResteAVivre, 1);
  });

  it("orders the waterfall by weight, so the reason comes first", () => {
    const sizes = result.waterfall.map((s) => Math.abs(s.amount));
    expect([...sizes].sort((a, b) => b - a)).toEqual(sizes);
  });

  it("brackets the headline with the local rent spread", () => {
    expect(result.deltaRange.low).toBeLessThan(result.deltaResteAVivre);
    expect(result.deltaRange.high).toBeGreaterThan(result.deltaResteAVivre);
  });

  it("states the cash needed up front without spreading it over months", () => {
    const { lines, total } = result.moveCost!;
    expect(total).toBeGreaterThan(0);
    // The deposit is one month excluding charges, so below the rent itself.
    const deposit = lines.find((l) => l.key === "depot_garantie")!.amount!;
    const rent = lineOf(result.target, "loyer")!.amount!;
    expect(deposit).toBeLessThan(rent);
    // Overlapping rent depends on the notice date, so it stays unquantified.
    const overlap = lines.find((l) => l.key === "double_loyer")!;
    expect(overlap.amount).toBeNull();
    expect(overlap.reason).toBeDefined();
  });

  it("caps the letting fee harder in a very tight zone", () => {
    const toParis = compare({ ...baseInput, target: { ...baseInput.target, cityId: "paris" } })!;
    const feeOf = (c: typeof result) =>
      c.moveCost!.lines.find((l) => l.key === "honoraires_agence")!.amount!;
    expect(feeOf(toParis)).toBeGreaterThan(feeOf(result));
  });
});

// --- integration with the rest of the app -----------------------------------

describe("shared geography", () => {
  it("names only cities the rest of the app knows", () => {
    const known = new Map(listCities().map((c) => [c.id, c]));
    for (const city of cities) {
      const shared = known.get(city.id);
      expect(shared, `unknown city id: ${city.id}`).toBeDefined();
      expect(shared!.name).toBe(city.name);
      expect(shared!.department).toBe(city.department);
    }
  });

  it("gives every city at least one district", () => {
    expect(cities.every((c) => c.districts.length > 0)).toBe(true);
  });

  it("keeps district ids unique inside a city", () => {
    for (const city of cities) {
      const ids = city.districts.map((d) => d.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("translation coverage", () => {
  /**
   * Every key the engine can emit must exist in both dictionaries. Without this
   * a rarely-taken branch — walking to the shops, a second salary — would render
   * a raw key in production, and only in that one branch.
   */
  const emitted = () => {
    const labels = new Set<string>();
    const basis = new Set<string>();
    const reasons = new Set<string>();

    /*
      Explanations nest: the fragment naming the journeys lives inside the params
      of the petrol and charging lines. Walking only the top level would leave
      those fragments untested, which is exactly where a missing translation would
      hide.
    */
    const walk = (into: Set<string>, explanation: Explanation) => {
      into.add(explanation.key);
      for (const value of Object.values(explanation.params ?? {})) {
        if (typeof value === "object" && "key" in value) walk(into, value);
      }
    };

    const modes = ["voiture", "transports", "actif"] as const;
    const energies = ["thermique", "electrique"] as const;
    for (const commuteMode of modes) {
      for (const errandsMode of modes) {
        for (const partnerNetSalary of [0, 1800]) {
          for (const childrenInCreche of [0, 1]) {
            // 0 € is its own branch: it is the walking case, which has a
            // different note from an amortised bike.
            for (const bike of [0, 150]) {
              for (const energy of energies) {
                // 0 and 1 are their own branches: each suppresses one charging line.
                for (const homeChargingShare of [0, 0.5, 1]) {
                  for (const cityId of cities.map((c) => c.id)) {
                    const result = compare({
                      ...baseInput,
                      target: { ...baseInput.target, cityId, partnerNetSalary },
                      current: { ...baseInput.current, partnerNetSalary },
                      household: { ...baseInput.household, childrenInCreche },
                      vehicle: { ...baseInput.vehicle, energy, homeChargingShare },
                      currentCommute: { ...baseInput.currentCommute, mode: commuteMode },
                      targetCommute: { ...baseInput.targetCommute, mode: commuteMode },
                      currentErrands: {
                        ...baseInput.currentErrands,
                        mode: errandsMode,
                        bikeAmortizationPerYear: bike,
                      },
                      targetErrands: {
                        ...baseInput.targetErrands,
                        mode: errandsMode,
                        bikeAmortizationPerYear: bike,
                      },
                    });
                    if (!result) continue;
                    const all = [
                      ...result.current.revenus,
                      ...result.current.depenses,
                      ...result.current.omitted,
                      ...result.target.revenus,
                      ...result.target.depenses,
                      result.current.autres,
                      ...(result.moveCost?.lines ?? []),
                    ];
                    for (const line of all) {
                      walk(labels, line.label);
                      if (line.basis) walk(basis, line.basis);
                      if (line.reason) walk(reasons, line.reason);
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return { labels, basis, reasons };
  };

  const { labels, basis, reasons } = emitted();

  it("exercises every branch of the engine", () => {
    // A guard on the guard: if this collapses, the coverage checks below become
    // vacuous without failing.
    expect(labels.size).toBeGreaterThanOrEqual(18);
    expect(basis.size).toBeGreaterThanOrEqual(14);
  });

  for (const [locale, dict] of [
    ["fr", fr],
    ["en", en],
  ] as const) {
    it(`translates every line label in ${locale}`, () => {
      const table = dict.job.lines as Record<string, string>;
      for (const key of labels) expect(table[key], `${locale}.job.lines.${key}`).toBeTruthy();
    });

    it(`translates every basis in ${locale}`, () => {
      const table = dict.job.basis as Record<string, string>;
      for (const key of basis) expect(table[key], `${locale}.job.basis.${key}`).toBeTruthy();
    });

    it(`translates every reason in ${locale}`, () => {
      const table = dict.job.reasons as Record<string, string>;
      for (const key of reasons) expect(table[key], `${locale}.job.reasons.${key}`).toBeTruthy();
    });

    it(`translates every source caveat and prose vintage in ${locale}`, () => {
      const caveats = dict.job.sourceCaveats as Record<string, string>;
      const terms = dict.job.terms as Record<string, string>;
      for (const code of SOURCE_CODES) {
        const source = DATA_SOURCES[code];
        expect(caveats[source.caveat.key], `${locale}.job.sourceCaveats.${code}`).toBeTruthy();
        for (const field of [source.vintage, source.refresh]) {
          if (typeof field !== "string")
            expect(terms[field.key], `${locale}.job.terms.${field.key}`).toBeTruthy();
        }
      }
    });
  }
});

// --- how the outcome is graded ----------------------------------------------

describe("verdict grading", () => {
  /** Builds a comparison-shaped stub: only the four fields the grader reads. */
  const graded = (delta: number, real: number, comparable = real) =>
    gradeVerdict({
      deltaResteAVivre: delta,
      current: { resteAVivreReel: real, resteAVivre: comparable },
    } as Parameters<typeof gradeVerdict>[0]);

  it("grades against what the household actually has left", () => {
    // 200 € on top of 1 000 € is 20 % — the top tier.
    expect(graded(200, 1000).tier).toBe("excellent");
    expect(graded(200, 1000).ratio).toBeCloseTo(0.2, 3);
  });

  it("separates the four positive bands at their boundaries", () => {
    expect(graded(150, 1000).tier).toBe("excellent"); // 15 %
    expect(graded(149, 1000).tier).toBe("good");
    expect(graded(100, 1000).tier).toBe("good"); // 10 %
    expect(graded(99, 1000).tier).toBe("modest");
    expect(graded(50, 1000).tier).toBe("modest"); // 5 %
    expect(graded(49, 1000).tier).toBe("marginal");
    expect(graded(0, 1000).tier).toBe("marginal");
  });

  it("calls a loss a loss", () => {
    expect(graded(-1, 1000).tier).toBe("negative");
    expect(graded(-400, 1000).tier).toBe("negative");
  });

  it("never celebrates on a denominator too small to divide by", () => {
    /*
      The trap: 60 € more when only 10 € is left is a 600 % ratio, which would
      fire confetti on a household that is barely afloat. With no sane basis the
      grade must fall back to the sign alone.
    */
    const v = graded(60, 10, 20);
    expect(v.ratio).toBeNull();
    expect(v.signOnly).toBe(true);
    expect(v.tier).toBe("marginal");
    expect(isCelebration(v.tier)).toBe(false);
  });

  it("falls back to the comparable figure when the real one is too small", () => {
    // Declared spending eats the remainder: real 10 €, comparable 800 €.
    const v = graded(200, 10, 800);
    expect(v.basis).toBe(800);
    expect(v.tier).toBe("excellent");
    expect(v.signOnly).toBe(false);
  });

  it("still reports a loss when the household is underwater", () => {
    const v = graded(-50, -200, -100);
    expect(v.tier).toBe("negative");
    expect(v.ratio).toBeNull();
  });

  it("reserves confetti for the top tier alone", () => {
    expect(isCelebration("excellent")).toBe(true);
    for (const tier of ["good", "modest", "marginal", "negative"] as const) {
      expect(isCelebration(tier)).toBe(false);
    }
  });
});

describe("verdict — an outsized gain", () => {
  const graded = (delta: number, real: number, comparable = real) =>
    gradeVerdict({
      deltaResteAVivre: delta,
      current: { resteAVivreReel: real, resteAVivre: comparable },
    } as Parameters<typeof gradeVerdict>[0]);

  it("flags a gain at least as large as what is left today", () => {
    // The reference scenario: 570 € more when 278 € is left — a true 205 %.
    const v = graded(570, 278);
    expect(v.tier).toBe("excellent");
    expect(v.outsized).toBe(true);
    expect(v.ratio).toBeGreaterThan(2);
  });

  it("does not flag an ordinary gain", () => {
    expect(graded(200, 1000).outsized).toBe(false);
    expect(graded(999, 1000).outsized).toBe(false);
    expect(graded(1000, 1000).outsized).toBe(true);
  });

  it("never flags a loss", () => {
    expect(graded(-5000, 1000).outsized).toBe(false);
  });
});

// --- tax and benefits from the rules engine ---------------------------------

describe("fiscal lines", () => {
  const noBenefit = {
    housingBenefitMonthly: 0,
    familyBenefitsMonthly: 0,
    assumesSteadyIncome: true,
  };
  const fiscal = {
    current: { incomeTaxMonthly: 101.5, year: 2026, ...noBenefit },
    target: { incomeTaxMonthly: 168, year: 2026, ...noBenefit },
  };
  const withFiscal = compare({ ...baseInput, fiscal })!;
  const without = compare(baseInput)!;

  it("flags whether the fiscal figures were computed, matching the lines", () => {
    // The result page picks its disclaimer from this flag. If it ever disagreed
    // with the lines, the page would deny a number printed just below it.
    expect(withFiscal.fiscalComputed).toBe(true);
    expect(lineOf(withFiscal.current, "impot_revenu")?.status).toBe("computed");

    expect(without.fiscalComputed).toBe(false);
    expect(without.current.omitted.map((l) => l.key)).toContain("impot_revenu");
  });

  it("leaves tax and benefits unquantified when the engine did not answer", () => {
    const keys = without.current.omitted.map((l) => l.key);
    expect(keys).toContain("impot_revenu");
    expect(keys).toContain("prestations");
    expect(lineOf(without.current, "impot_revenu")).toBeUndefined();
  });

  it("turns income tax into a real line once it did", () => {
    expect(lineOf(withFiscal.current, "impot_revenu")?.amount).toBeCloseTo(101.5, 2);
    expect(withFiscal.current.omitted.map((l) => l.key)).not.toContain("impot_revenu");
  });

  it("reports a zero benefit as an answer, not as a hole", () => {
    /*
      Above the thresholds a household genuinely receives nothing. That is a result,
      so the line reads 0 € and `computed`; it stays visible so nobody wonders
      whether it was forgotten. Only a silent rules engine produces a null.
    */
    const answered = withFiscal.current.omitted.find((l) => l.key === "prestations")!;
    expect(answered.amount).toBe(0);
    expect(answered.status).toBe("computed");

    const silent = without.current.omitted.find((l) => l.key === "prestations")!;
    expect(silent.amount).toBeNull();
    expect(silent.status).toBe("unavailable");
  });

  it("counts a benefit the engine did return, on the side it belongs to", () => {
    const generous = compare({
      ...baseInput,
      fiscal: {
        current: {
          incomeTaxMonthly: 0,
          housingBenefitMonthly: 303.87,
          familyBenefitsMonthly: 151.8,
          assumesSteadyIncome: true,
          year: 2026,
        },
        target: { ...fiscal.target, housingBenefitMonthly: 42 },
      },
    })!;
    expect(generous.current.revenus.find((l) => l.key === "prestations")?.amount).toBeCloseTo(
      455.67,
      2,
    );
    // An assumption about last year's income sits under it, so not `computed`.
    expect(generous.current.revenus.find((l) => l.key === "prestations")?.status).toBe(
      "convention",
    );
    // And the target side gets its own figure, computed from its own rent.
    expect(generous.target.revenus.find((l) => l.key === "prestations")?.amount).toBeCloseTo(42, 2);
  });

  it("ignores the declared figure once the engine can compute it", () => {
    // Otherwise the household would be paid its benefits twice.
    const both = compare({
      ...baseInput,
      fiscal,
      otherIncome: { ...baseInput.otherIncome, declaredBenefitsMonthly: 180 },
    })!;
    expect(both.current.revenus.some((l) => l.key === "prestations_declarees")).toBe(false);
  });

  it("counts tax as an expense, not as income", () => {
    // The rules engine returns a negative number for tax owed; if that sign leaked
    // through, paying tax would raise the reste à vivre.
    expect(withFiscal.current.resteAVivre).toBeLessThan(without.current.resteAVivre);
  });

  it("scales tax with the amount owed", () => {
    const heavier = compare({
      ...baseInput,
      fiscal: { ...fiscal, current: { incomeTaxMonthly: 300, year: 2026, ...noBenefit } },
    })!;
    expect(heavier.current.resteAVivre).toBeLessThan(withFiscal.current.resteAVivre);
  });
});

// --- declared income --------------------------------------------------------

describe("declared income", () => {
  const withIncome = (over: Partial<CompareInput["otherIncome"]>) =>
    compare({ ...baseInput, otherIncome: { ...baseInput.otherIncome, ...over } })!;

  it("puts dividends and rental income on both sides", () => {
    const r = withIncome({ dividendsMonthly: 200, rentalMonthly: 350 });
    for (const side of [r.current, r.target]) {
      expect(side.revenus.find((l) => l.key === "dividendes")?.amount).toBe(200);
      expect(side.revenus.find((l) => l.key === "revenus_fonciers")?.amount).toBe(350);
    }
  });

  it("leaves the verdict untouched, since they do not change with the city", () => {
    const plain = compare(baseInput)!;
    const rich = withIncome({ dividendsMonthly: 200, rentalMonthly: 350 });
    expect(rich.deltaResteAVivre).toBeCloseTo(plain.deltaResteAVivre, 2);
    expect(rich.current.resteAVivre).toBeGreaterThan(plain.current.resteAVivre);
  });

  it("emits no line at all for an income of zero", () => {
    const r = compare(baseInput)!;
    expect(r.current.revenus.some((l) => l.key === "dividendes")).toBe(false);
    expect(r.current.revenus.some((l) => l.key === "revenus_fonciers")).toBe(false);
  });

  it("applies declared benefits to today's side only", () => {
    /*
      Housing benefit follows the rent and the commune's zone. Repeating today's
      amount in the target city would invent money in favour of the move — the
      single most tempting mistake in this whole model.
    */
    const r = withIncome({ declaredBenefitsMonthly: 180 });
    expect(r.current.revenus.find((l) => l.key === "prestations_declarees")?.amount).toBe(180);
    expect(r.target.revenus.some((l) => l.key === "prestations_declarees")).toBe(false);
  });

  it("tells the target side why its benefits are missing instead of copying them", () => {
    const r = withIncome({ declaredBenefitsMonthly: 180 });
    expect(r.target.omitted.find((l) => l.key === "prestations")?.reason?.key).toBe(
      "prestations_target",
    );
    // No declared benefits, no special wording.
    expect(
      compare(baseInput)!.target.omitted.find((l) => l.key === "prestations")?.reason?.key,
    ).toBe("prestations");
  });

  it("makes declared benefits improve today rather than the offer", () => {
    const plain = compare(baseInput)!;
    const r = withIncome({ declaredBenefitsMonthly: 180 });
    expect(r.current.resteAVivre).toBeCloseTo(plain.current.resteAVivre + 180, 2);
    expect(r.deltaResteAVivre).toBeLessThan(plain.deltaResteAVivre);
  });
});

describe("données de marché mesurées", () => {
  /*
    The seeded litre sat ~12 % below the July 2026 readings and the seeded rents
    were wrong by up to 4 €/m². Both now come from `market.json`. If an ETL run
    loses a city, the fallback would serve the stale figure and look current — so
    the loss has to break the build instead.
  */
  it("resolves every city from the imported market data", () => {
    expect(MARKET_COVERAGE.resolved).toBe(cities.length);
    expect(MARKET_COVERAGE.missing).toEqual([]);
    expect(MARKET_COVERAGE.fuelResolved).toBe(cities.length);
    for (const city of cities) expect(RENT_IS_MEASURED(city.id)).toBe(true);
  });

  it("keeps every measured figure inside a plausible French range", () => {
    for (const city of cities) {
      // Wider than any real spread, narrow enough to catch a unit or decimal slip
      // — a price read in centimes or per 1000 L would land far outside.
      expect(city.fuelPricePerLitre).toBeGreaterThan(1.2);
      expect(city.fuelPricePerLitre).toBeLessThan(3);
      for (const district of city.districts) {
        expect(district.rentPerSqm.appartement).toBeGreaterThan(5);
        expect(district.rentPerSqm.appartement).toBeLessThan(60);
        // The published interval must bracket the figure it belongs to.
        expect(district.rentPerSqmRange.low).toBeLessThan(district.rentPerSqm.appartement);
        expect(district.rentPerSqmRange.high).toBeGreaterThan(district.rentPerSqm.appartement);
      }
    }
  });
});

describe("eau et électricité mesurées", () => {
  it("prices water for every city, from the local half plus the national one", () => {
    expect(UTILITIES_COVERAGE.water).toBe(cities.length);
    expect(UTILITIES_COVERAGE.waterMissing).toEqual([]);
    expect(SEWERAGE_NATIONAL.pricePerM3).toBeGreaterThan(0.5);
    for (const city of cities) {
      expect(WATER_VINTAGE(city.id)).not.toBeNull();
      // The full bill is always dearer than the sewerage half alone.
      expect(city.waterPricePerM3).toBeGreaterThan(SEWERAGE_NATIONAL.pricePerM3);
      expect(city.waterPricePerM3).toBeLessThan(10);
    }
  });

  it("marks a commune Enedis does not serve instead of pretending it measured it", () => {
    const modelled = cities.filter((c) => !c.electricityMeasured);
    for (const city of modelled) expect(ELECTRICITY_VINTAGE(city.id)).toBeNull();
    for (const city of cities.filter((c) => c.electricityMeasured)) {
      expect(ELECTRICITY_VINTAGE(city.id)).not.toBeNull();
    }
    expect(UTILITIES_COVERAGE.electricity).toBe(cities.length - modelled.length);
  });

  it("keeps the modelled commune inside the range of the measured ones", () => {
    /*
      The fallback used to be a national archetype constant, which made the one
      unserved city read ~30 % dearer than every measured city — a coverage
      artefact, not a real difference. It must sit among its peers, not outside.
    */
    // `residential`, not `central`: the small commune has no central district, and
    // it is also the archetype the commune average anchors on.
    const anchor = (id: string) =>
      cities.find((c) => c.id === id)!.districts.find((d) => d.archetype === "residential")!
        .electricityKwhYear;
    const measured = cities.filter((c) => c.electricityMeasured).map((c) => anchor(c.id));
    const low = Math.min(...measured);
    const high = Math.max(...measured);
    for (const city of cities.filter((c) => !c.electricityMeasured)) {
      expect(anchor(city.id)).toBeGreaterThanOrEqual(low);
      expect(anchor(city.id)).toBeLessThanOrEqual(high);
    }
  });

  it("declares heating that is not electricity rather than absorbing it", () => {
    /*
      The kWh figure is Enedis consumption, electricity only. Before it was
      measured, the seed quietly carried heating too. The gap must be visible.
    */
    const result = compare(baseInput)!;
    for (const side of [result.current, result.target]) {
      const heating = side.omitted.find((l) => l.key === "chauffage_autre");
      expect(heating).toBeDefined();
      expect(heating!.amount).toBeNull();
      expect(heating!.status).toBe("unavailable");
    }
  });
});

describe("frais d'installation en section optionnelle", () => {
  /*
    Changing job is not always moving house: someone who keeps their current home —
    letting it out, say — and rents in the new city pays no removal, and someone
    housed by their employer pays none of this block at all. So it is a section like
    the others, and switching it off has to make the block absent rather than zero.
  */
  it("is the last section, and can be switched off", () => {
    expect(ALL_SECTION_IDS[ALL_SECTION_IDS.length - 1]).toBe("move");
    expect(REQUIRED_SECTION_IDS).not.toContain("move");
  });

  it("drops the up-front block entirely rather than totalling it at zero", () => {
    const without = compare({ ...baseInput, includeMoveCost: false })!;
    expect(without.moveCost).toBeNull();

    const with_ = compare({ ...baseInput, includeMoveCost: true })!;
    expect(with_.moveCost).not.toBeNull();
    expect(with_.moveCost!.total).toBeGreaterThan(0);
  });

  it("leaves the monthly verdict untouched — this is cash up front, not a bill", () => {
    const without = compare({ ...baseInput, includeMoveCost: false })!;
    const with_ = compare({ ...baseInput, includeMoveCost: true })!;
    expect(without.deltaResteAVivre).toBe(with_.deltaResteAVivre);
    expect(without.current.resteAVivre).toBe(with_.current.resteAVivre);
    expect(without.requiredTargetSalary).toBe(with_.requiredTargetSalary);
  });

  it("still counts the deposit and the agency fee when only the removal is free", () => {
    // The scenario that prompted this: keeping the Dijon home, renting in Lyon.
    const kept = compare({ ...baseInput, removalCost: 0 })!;
    const keys = kept.moveCost!.lines.map((l) => l.key);
    expect(keys).toContain("depot_garantie");
    expect(keys).toContain("honoraires_agence");
    expect(kept.moveCost!.lines.find((l) => l.key === "demenagement")!.amount).toBe(0);
    expect(kept.moveCost!.total).toBeGreaterThan(0);
  });
});

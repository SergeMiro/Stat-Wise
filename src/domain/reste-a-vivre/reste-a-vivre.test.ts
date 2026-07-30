import { describe, expect, it } from "vitest";
import { listCities } from "@/lib/mock/cities";
import { fr } from "@/lib/i18n/dictionaries/fr";
import { en } from "@/lib/i18n/dictionaries/en";
import { compare, crecheMonthlyCost, foodMonthlyCost, type CompareInput } from "./engine";
import { cities, crecheScale, nationalParams } from "./snapshot";
import { DATA_SOURCES, SOURCE_CODES } from "./sources";
import type { Line, SideResult } from "./types";

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
  currentCommute: { mode: "voiture", daysOnSitePerWeek: 5, litresPer100Km: 6.5 },
  targetCommute: { mode: "transports", daysOnSitePerWeek: 5, litresPer100Km: 6.5 },
  currentErrands: { mode: "voiture", tripsPerMonth: 5, bikeAmortizationPerYear: 150 },
  targetErrands: { mode: "transports", tripsPerMonth: 5, bikeAmortizationPerYear: 150 },
};

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
    expect(result.target.districtId).toBe("vaise");
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
    expect(fuel?.basis?.key).toBe("fuel_both");
    expect(fuel?.basis?.params?.groceryOneWay).toBeDefined();
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

  it("keeps the crèche line national — same income, same amount across districts", () => {
    const creche = (side: SideResult) => lineOf(side, "creche")?.amount;
    expect(creche(result.target)).toBe(creche(result.alternatives[0]));
    expect(creche(result.target)).not.toBe(creche(result.current));
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

    const modes = ["voiture", "transports", "actif"] as const;
    for (const commuteMode of modes) {
      for (const errandsMode of modes) {
        for (const partnerNetSalary of [0, 1800]) {
          for (const childrenInCreche of [0, 1]) {
            // 0 € is its own branch: it is the walking case, which has a
            // different note from an amortised bike.
            for (const bike of [0, 150]) {
              for (const cityId of cities.map((c) => c.id)) {
                const result = compare({
                  ...baseInput,
                  target: { ...baseInput.target, cityId, partnerNetSalary },
                  current: { ...baseInput.current, partnerNetSalary },
                  household: { ...baseInput.household, childrenInCreche },
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
                for (const side of [result.current, result.target]) {
                  for (const line of [...side.revenus, ...side.depenses, ...side.omitted]) {
                    labels.add(line.label.key);
                    if (line.basis) basis.add(line.basis.key);
                    if (line.reason) reasons.add(line.reason.key);
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

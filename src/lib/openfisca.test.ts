import { describe, expect, it } from "vitest";
import { buildPayload, readResponse, type FiscalRequest } from "./openfisca-payload";

/**
 * The network call is not tested here — the payload and the reading of the answer
 * are, because that is where a mistake would be silent. A wrong sign on the tax or
 * a child aged into the wrong bracket produces a plausible number, not an error.
 */

const request: FiscalRequest = {
  netSalary: 2300,
  partnerNetSalary: 0,
  children: 1,
  childrenInCreche: 1,
  rent: 900,
  communeCode: "21231",
  year: 2026,
};

describe("payload", () => {
  it("declares one adult and the children as dependants", () => {
    const p = buildPayload(request);
    expect(Object.keys(p.individus)).toEqual(["vous", "enfant1"]);
    expect(p.familles.famille.parents).toEqual(["vous"]);
    expect(p.familles.famille.enfants).toEqual(["enfant1"]);
    expect(p.foyers_fiscaux.foyer.personnes_a_charge).toEqual(["enfant1"]);
  });

  it("adds the second earner only when there is one", () => {
    expect(Object.keys(buildPayload({ ...request, partnerNetSalary: 1800 }).individus)).toContain(
      "conjoint",
    );
    expect(buildPayload(request).menages.menage.conjoint).toEqual([]);
  });

  it("splits the taxable salary between the two earners", () => {
    const p = buildPayload({ ...request, netSalary: 2000, partnerNetSalary: 1000 });
    const vous = (p.individus.vous.salaire_imposable as Record<string, number>)["2026"];
    const conjoint = (p.individus.conjoint.salaire_imposable as Record<string, number>)["2026"];
    expect(vous).toBeGreaterThan(conjoint);
    // Two thirds and one third of a year of 3 000 €, grossed up for the CSG.
    expect(vous + conjoint).toBeGreaterThan(3000 * 12);
    expect(vous / (vous + conjoint)).toBeCloseTo(2 / 3, 2);
  });

  it("carries the commune code, which decides the housing benefit zone", () => {
    const p = buildPayload({ ...request, communeCode: "75056" });
    expect((p.menages.menage.depcom as Record<string, string>)["2026-01"]).toBe("75056");
  });

  it("ages a nursery child differently from an older one", () => {
    const p = buildPayload({ ...request, children: 2, childrenInCreche: 1 });
    const born = (id: string) =>
      (p.individus[id].date_naissance as Record<string, string>).ETERNITY;
    expect(born("enfant1")).toBe("2025-01-01");
    expect(born("enfant2")).toBe("2018-01-01");
  });
});

describe("reading the answer", () => {
  const answer = (tax: number, housing = 0, family = 0) => ({
    familles: { famille: { aide_logement: { "2026-01": housing }, af: { "2026-01": family } } },
    foyers_fiscaux: { foyer: { impot_revenu_restant_a_payer: { "2026": tax } } },
  });

  it("flips the sign: the engine returns tax owed as a negative", () => {
    const result = readResponse(answer(-1218), request)!;
    expect(result.incomeTaxMonthly).toBeCloseTo(101.5, 1);
  });

  it("never returns a negative tax, which would become income", () => {
    expect(readResponse(answer(500), request)!.incomeTaxMonthly).toBe(0);
  });

  it("passes benefits through per month", () => {
    const result = readResponse(answer(0, 303.87, 151.8), request)!;
    expect(result.housingBenefitMonthly).toBeCloseTo(303.87, 2);
    expect(result.familyBenefitsMonthly).toBeCloseTo(151.8, 2);
    // Flagged, because the resource base rests on an assumed previous year.
    expect(result.assumesSteadyIncome).toBe(true);
  });

  it("returns null rather than a partial answer", () => {
    expect(readResponse({ error: "boom" }, request)).toBeNull();
    expect(readResponse({}, request)).toBeNull();
    expect(readResponse({ foyers_fiscaux: { foyer: {} } }, request)).toBeNull();
  });
});

describe("the resource base", () => {
  /*
    This is the fix that made housing benefit usable, and the reason it needs a
    test of its own: with only the current year in the payload, OpenFisca built a
    resource base of 0 € and paid the maximum benefit to everyone. The base reads
    the twelve months before the month asked about, so the previous year has to be
    there. Nothing in the response would reveal the mistake — the number simply
    comes back too large.
  */
  it("supplies the previous year as well as the current one", () => {
    const p = buildPayload(request);
    const salary = p.individus.vous.salaire_imposable as Record<string, number>;
    expect(Object.keys(salary).sort()).toEqual(["2025", "2026"]);
    expect(salary["2025"]).toBe(salary["2026"]);
  });

  it("does so for the second earner too", () => {
    const p = buildPayload({ ...request, netSalary: 2000, partnerNetSalary: 1000 });
    const salary = p.individus.conjoint.salaire_imposable as Record<string, number>;
    expect(Object.keys(salary).sort()).toEqual(["2025", "2026"]);
  });

  it("asks for the benefits it now trusts", () => {
    const p = buildPayload(request);
    expect(p.familles.famille.aide_logement).toEqual({ "2026-01": null });
    expect(p.familles.famille.af).toEqual({ "2026-01": null });
  });

  it("still asks for neither RSA nor the activity bonus", () => {
    // Those need an employment status and three months of resources we never collect.
    const p = buildPayload(request);
    expect(p.familles.famille.rsa).toBeUndefined();
    expect(p.familles.famille.ppa).toBeUndefined();
  });
});

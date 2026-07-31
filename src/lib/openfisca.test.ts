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
  const answer = (tax: number) => ({
    foyers_fiscaux: { foyer: { impot_revenu_restant_a_payer: { "2026": tax } } },
  });

  it("flips the sign: the engine returns tax owed as a negative", () => {
    const result = readResponse(answer(-1218), request)!;
    expect(result.incomeTaxMonthly).toBeCloseTo(101.5, 1);
  });

  it("never returns a negative tax, which would become income", () => {
    expect(readResponse(answer(500), request)!.incomeTaxMonthly).toBe(0);
  });

  it("asks for no benefits at all", () => {
    /*
      Deliberate: the engine answers for aide_logement, and the answer is wrong in
      a way that reads as right. See the note on FiscalResult. If a future change
      re-adds them, this test is the reminder to fix the resource base first.
    */
    const payload = buildPayload(request);
    expect(payload.familles.famille.aide_logement).toBeUndefined();
    expect(payload.familles.famille.af).toBeUndefined();
  });

  it("returns null rather than a partial answer", () => {
    expect(readResponse({ error: "boom" }, request)).toBeNull();
    expect(readResponse({}, request)).toBeNull();
    expect(readResponse({ foyers_fiscaux: { foyer: {} } }, request)).toBeNull();
  });
});

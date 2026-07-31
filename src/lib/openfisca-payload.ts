/**
 * The parts of the OpenFisca integration that are pure: building the request and
 * reading the answer.
 *
 * Split out from the network call so they can be tested — which matters more here
 * than almost anywhere else in this codebase, because a wrong sign on the tax or a
 * child aged into the wrong bracket produces a plausible number rather than an
 * error. The two mistakes this file exists to prevent are both silent.
 */

/**
 * What the engine needs back, in euros per month.
 *
 * Housing benefit was broken and is now fixed, and the fix is the whole reason this
 * comment is long. Asking for `aide_logement` first returned 426,77 € for a
 * household earning 2 300 €/month with a 900 € rent — close to the maximum — and
 * the same figure on both sides. Asking the engine for the intermediate
 * `aide_logement_base_ressources` showed why: it was **0**, so no income was
 * reaching the calculation at all.
 *
 * The resource base is not built from the year being computed. Supplying salary for
 * 2026 alone left it at 0; so did 2024 plus 2026. Supplying **the previous year**
 * made it 23 300 € and the benefit fell to 0 €, which is the right answer. So the
 * window is the twelve months before the month asked about, not N-2.
 *
 * With that, three cases behave: a single parent on 1 600 €/month with two children
 * and 700 € of rent gets 303,87 €; the same household on 2 300 € gets 0 €; on
 * 3 700 € it stays 0 €. Family allowances land at 151,80 € for two children and 0 €
 * for one, which is the published rate.
 *
 * `rsa` and `ppa` remain excluded: they need an employment status and a three-month
 * resource history the wizard never asks for, and a test call returned 606 € of RSA
 * for a household earning 1 600 €/month.
 */
export type FiscalResult = {
  /** Income tax, positive when the household owes money. */
  incomeTaxMonthly: number;
  /** Aide au logement. Rests on an assumption about last year — see `assumesSteadyIncome`. */
  housingBenefitMonthly: number;
  /** Allocations familiales. */
  familyBenefitsMonthly: number;
  /**
   * Always true today, and it matters.
   *
   * The resource base needs last year's income, which the wizard does not ask for,
   * so this year's is reused. For a household whose income has been stable that is
   * right. For someone taking a pay rise it is not: their real housing benefit in
   * the first year still reflects the lower salary, so the figure shown for the
   * offer is the steady state and not the first twelve months. The line says so.
   */
  assumesSteadyIncome: boolean;
  /** Legislation year the answer was computed against. */
  year: number;
};

export type FiscalRequest = {
  /** Net monthly salary of the first earner. */
  netSalary: number;
  /** Net monthly salary of the second earner, 0 when there is none. */
  partnerNetSalary: number;
  children: number;
  /** Subset of `children` in nursery — used only to age them plausibly. */
  childrenInCreche: number;
  /** Monthly rent, charges comprises. */
  rent: number;
  /** INSEE commune code: housing benefit depends on the zone. */
  communeCode: string;
  /** Legislation year, e.g. 2026. */
  year: number;
};

/**
 * Taxable salary from net.
 *
 * `salaire_imposable` is not the net paid into the account: it adds back the
 * non-deductible part of the CSG. The ratio is close to 1.02 for an ordinary
 * private-sector salary. This is an assumption, and the line that uses the result
 * says so — it is the weakest link in this file.
 */
const NET_TO_TAXABLE = 1.02;

/**
 * Ages we assume for the children.
 *
 * Family allowances step up at 14, and the wizard never asks a child's age. A
 * child in nursery is taken as 1, any other as 8 — young enough to avoid claiming
 * a majoration the household may not be entitled to. Erring downwards keeps the
 * benefit understated rather than overstated.
 */
const AGE_IN_CRECHE = 1;
const AGE_OTHERWISE = 8;

type Payload = Record<string, Record<string, Record<string, unknown>>>;

/** Builds the request body. Pure and exported so it can be tested without the network. */
export function buildPayload(request: FiscalRequest): Payload {
  const { year } = request;
  const month = `${year}-01`;
  const taxableYear = Math.round(
    (request.netSalary + request.partnerNetSalary) * 12 * NET_TO_TAXABLE,
  );
  const firstShare =
    request.netSalary + request.partnerNetSalary > 0
      ? request.netSalary / (request.netSalary + request.partnerNetSalary)
      : 1;

  /*
    Two years of salary, not one. The housing benefit resource base reads the twelve
    months before the month asked about, so a payload carrying only the current year
    leaves that base at zero — and a zero base pays the maximum benefit to everyone.
  */
  const salaryOf = (share: number) => ({
    [year - 1]: Math.round(taxableYear * share),
    [year]: Math.round(taxableYear * share),
  });

  const individus: Record<string, Record<string, unknown>> = {
    vous: { salaire_imposable: salaryOf(firstShare) },
  };
  const parents = ["vous"];
  if (request.partnerNetSalary > 0) {
    individus.conjoint = { salaire_imposable: salaryOf(1 - firstShare) };
    parents.push("conjoint");
  }

  const enfants: string[] = [];
  for (let i = 0; i < Math.max(0, Math.round(request.children)); i++) {
    const id = `enfant${i + 1}`;
    const age = i < request.childrenInCreche ? AGE_IN_CRECHE : AGE_OTHERWISE;
    individus[id] = {
      date_naissance: { ETERNITY: `${year - age}-01-01` },
    };
    enfants.push(id);
  }

  return {
    individus,
    familles: {
      famille: {
        parents,
        enfants,
        aide_logement: { [`${year}-01`]: null },
        af: { [`${year}-01`]: null },
      },
    },
    foyers_fiscaux: {
      foyer: {
        declarants: parents,
        personnes_a_charge: enfants,
        impot_revenu_restant_a_payer: { [year]: null },
      },
    },
    menages: {
      menage: {
        personne_de_reference: ["vous"],
        conjoint: request.partnerNetSalary > 0 ? ["conjoint"] : [],
        enfants,
        loyer: { [month]: Math.round(request.rent) },
        statut_occupation_logement: { [month]: "locataire_vide" },
        depcom: { [month]: request.communeCode },
      },
    },
  };
}

/** Reads the three figures out of a response, applying the sign convention. */
export function readResponse(body: unknown, request: FiscalRequest): FiscalResult | null {
  const { year } = request;
  const month = `${year}-01`;
  const data = body as {
    familles?: { famille?: Record<string, Record<string, number>> };
    foyers_fiscaux?: { foyer?: Record<string, Record<string, number>> };
    error?: unknown;
  };
  if (!data || data.error) return null;

  const tax = data.foyers_fiscaux?.foyer?.impot_revenu_restant_a_payer?.[year];
  const housing = data.familles?.famille?.aide_logement?.[month];
  const family = data.familles?.famille?.af?.[month];
  if (typeof tax !== "number" || typeof housing !== "number" || typeof family !== "number") {
    return null;
  }

  return {
    // Negative means tax owed; the engine wants a positive expense.
    incomeTaxMonthly: Math.max(0, Math.round((-tax / 12) * 100) / 100),
    housingBenefitMonthly: Math.max(0, Math.round(housing * 100) / 100),
    familyBenefitsMonthly: Math.max(0, Math.round(family * 100) / 100),
    assumesSteadyIncome: true,
    year,
  };
}

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
 * Income tax only — benefits are deliberately absent. Asking for `aide_logement`
 * worked, but the answer was wrong in a way that looked right: with no children it
 * returned 0 €, and adding a single child jumped it to 426,77 € for a household
 * earning 2 300 €/month with a 900 € rent, on both sides of the comparison at once.
 * That is close to the maximum benefit, i.e. income stopped being counted as soon
 * as a child was declared — the resource base for housing benefit is built from
 * year N-2 and from a `parent_isolé` status this payload never establishes.
 *
 * A benefit overstated by ~400 €/month on both sides would have flattered every
 * household with children. Housing benefit, family allowances, RSA and the
 * activity bonus therefore stay `non chiffré` until the resource base is built
 * properly. Income tax is kept because it was verified to behave: 1 298 €/year
 * with no children, 371 €/year with one, moving correctly with salary.
 */
export type FiscalResult = {
  /** Income tax, positive when the household owes money. */
  incomeTaxMonthly: number;
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

  const individus: Record<string, Record<string, unknown>> = {
    vous: { salaire_imposable: { [year]: Math.round(taxableYear * firstShare) } },
  };
  const parents = ["vous"];
  if (request.partnerNetSalary > 0) {
    individus.conjoint = {
      salaire_imposable: { [year]: Math.round(taxableYear * (1 - firstShare)) },
    };
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
  const data = body as {
    foyers_fiscaux?: { foyer?: Record<string, Record<string, number>> };
    error?: unknown;
  };
  if (!data || data.error) return null;

  const tax = data.foyers_fiscaux?.foyer?.impot_revenu_restant_a_payer?.[year];
  if (typeof tax !== "number") return null;

  return {
    // Negative means tax owed; the engine wants a positive expense.
    incomeTaxMonthly: Math.max(0, Math.round((-tax / 12) * 100) / 100),
    year,
  };
}

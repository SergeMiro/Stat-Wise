import "server-only";

/**
 * Income tax and benefits from the OpenFisca-France rules engine.
 *
 * This is the one place where the product calls a live service during a user's
 * calculation, and it is a deliberate exception to the rule in
 * `STATWISE_PROJECT_PLAN.md` §2.2. That rule exists to keep statistical datasets
 * out of the request path — availability, rate limits, a figure that shifts under
 * the reader. OpenFisca is not a dataset: it is legislation expressed as code, and
 * its answer depends on the whole household, so there is nothing to precompute.
 *
 * Three commitments make the exception safe:
 *
 * 1. **It degrades, never breaks.** A failure returns null and the engine goes
 *    back to showing income tax and benefits as `non chiffré`, exactly as before
 *    this file existed. The result page must never depend on the call succeeding.
 * 2. **Only what we can defend.** Income tax, housing benefit and family
 *    allowances follow from inputs we actually hold. `rsa` and `ppa` are
 *    deliberately excluded: a test call returned 606 € of RSA for a household
 *    earning 1 600 €/month, because those two need an employment status and a
 *    three-month resource history the wizard never asks for. A confident wrong
 *    number is worse than an admitted gap.
 * 3. **Sign discipline.** `impot_revenu_restant_a_payer` is negative when tax is
 *    owed. Passing that straight through would have added tax as income.
 */

const API = "https://api.fr.openfisca.org/latest/calculate";
const TIMEOUT_MS = 8000;

import {
  buildPayload,
  readResponse,
  type FiscalRequest,
  type FiscalResult,
} from "./openfisca-payload";

export type { FiscalRequest, FiscalResult } from "./openfisca-payload";

/** Calls the rules engine. Returns null on any failure — the caller must cope. */
export async function computeFiscal(request: FiscalRequest): Promise<FiscalResult | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(request)),
      signal: controller.signal,
      // Legislation for a given year does not change between two visitors.
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return null;
    return readResponse(await response.json(), request);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

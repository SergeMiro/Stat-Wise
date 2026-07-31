import type { Comparison } from "./types";

/**
 * Grades the outcome so the result can react to it — confetti when the move is
 * clearly worth it, a flat "don't bother" when it is not.
 *
 * The grade is a **share of what the household has left today**, not an absolute
 * sum: +200 € means something entirely different to someone with 300 € left over
 * than to someone with 3 000 €.
 *
 * That ratio has a trap. The denominator is a reste à vivre, which can be tiny or
 * negative — and a small denominator turns a modest gain into a triumphant
 * "+4 000 %". So the denominator is chosen deliberately, and when no sane one
 * exists the grade falls back to the sign of the difference alone. Getting this
 * wrong would put confetti on screen for someone whose finances are underwater.
 */

export type VerdictTier = "excellent" | "good" | "modest" | "marginal" | "negative";

export type Verdict = {
  tier: VerdictTier;
  /** Gain as a share of today's remaining money, e.g. 0.18 for +18 %. Null when no sane denominator exists. */
  ratio: number | null;
  /** The figure the ratio was taken against, for the fine print. */
  basis: number | null;
  /** True when the tier came from the sign alone because no ratio was usable. */
  signOnly: boolean;
  /**
   * True when the gain is at least as large as what the household has left today.
   * A percentage is still correct there but reads as nonsense — "+205 % of what
   * you have left" — so the UI says it in words instead.
   */
  outsized: boolean;
};

/**
 * Below this, a reste à vivre is too small to divide by: the household is at or
 * near the edge, and percentages of it stop carrying meaning.
 */
const MIN_BASIS = 50;

/** Thresholds as shares of today's remaining money. */
const TIERS: Array<{ tier: VerdictTier; from: number }> = [
  { tier: "excellent", from: 0.15 },
  { tier: "good", from: 0.1 },
  { tier: "modest", from: 0.05 },
  { tier: "marginal", from: 0 },
];

export function gradeVerdict(comparison: Comparison): Verdict {
  const delta = comparison.deltaResteAVivre;

  /*
    Prefer the real figure — it is what the household recognises as its money.
    Fall back to the comparable one when the real figure is too small to divide
    by, which happens exactly when the declared "everything else" eats most of
    the remainder.
  */
  const real = comparison.current.resteAVivreReel;
  const comparable = comparison.current.resteAVivre;
  const basis = real >= MIN_BASIS ? real : comparable >= MIN_BASIS ? comparable : null;

  if (delta < 0) {
    return {
      tier: "negative",
      ratio: basis ? delta / basis : null,
      basis,
      signOnly: basis === null,
      outsized: false,
    };
  }

  if (basis === null) {
    // No trustworthy denominator: say only whether it improves, never by how much.
    return {
      tier: delta > 0 ? "marginal" : "negative",
      ratio: null,
      basis: null,
      signOnly: true,
      outsized: false,
    };
  }

  const ratio = delta / basis;
  const tier = TIERS.find((t) => ratio >= t.from)?.tier ?? "marginal";
  return { tier, ratio, basis, signOnly: false, outsized: ratio >= 1 };
}

/** True for the one tier that earns confetti. Kept here so the UI cannot drift. */
export const isCelebration = (tier: VerdictTier): boolean => tier === "excellent";

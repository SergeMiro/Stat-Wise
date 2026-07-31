"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { isCelebration, type Verdict } from "@/domain/reste-a-vivre";
import { fill, type Dictionary, type Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/formatting";
import { cn } from "@/lib/utils";

/**
 * The result, said out loud — with a reaction sized to the outcome.
 *
 * Two rules keep this from becoming a slot machine:
 *
 * 1. The tier comes from the domain (`gradeVerdict`), never from the component.
 *    A celebration is a claim about someone's money and has to be testable.
 * 2. `prefers-reduced-motion` removes every animation, confetti included. The
 *    figures and the wording stay identical — the animation is decoration on top
 *    of a result that must read the same without it.
 */

const TIER_STYLES: Record<Verdict["tier"], { ring: string; text: string; bar: string }> = {
  excellent: {
    ring: "border-confidence-high/50 bg-confidence-high/10",
    text: "text-confidence-high",
    bar: "bg-confidence-high",
  },
  good: {
    ring: "border-confidence-high/40 bg-confidence-high/5",
    text: "text-confidence-high",
    bar: "bg-confidence-high",
  },
  modest: {
    ring: "border-confidence-medium/40 bg-confidence-medium/5",
    text: "text-confidence-medium",
    bar: "bg-confidence-medium",
  },
  marginal: {
    ring: "border-border bg-muted/40",
    text: "text-muted-foreground",
    bar: "bg-confidence-unavailable",
  },
  negative: {
    ring: "border-confidence-low/40 bg-confidence-low/5",
    text: "text-confidence-low",
    bar: "bg-confidence-low",
  },
};

/** Deterministic pseudo-random so the burst is stable across re-renders. */
function jitter(i: number, salt: number): number {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

const CONFETTI_COLOURS = [
  "var(--confidence-high)",
  "var(--confidence-medium)",
  "var(--primary)",
  "var(--confidence-low)",
];

function Confetti({ count = 44 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: jitter(i, 1) * 100,
        delay: jitter(i, 2) * 0.5,
        duration: 1.6 + jitter(i, 3) * 1.2,
        drift: (jitter(i, 4) - 0.5) * 90,
        spin: (jitter(i, 5) - 0.5) * 900,
        size: 5 + jitter(i, 6) * 6,
        colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
      })),
    [count],
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute top-0 block rounded-[1px]"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.8,
            backgroundColor: p.colour,
          }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: 260, x: p.drift, opacity: [0, 1, 1, 0], rotate: p.spin }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

export function JobVerdictBanner({
  locale,
  dict,
  verdict,
  delta,
}: {
  locale: Locale;
  dict: Dictionary;
  verdict: Verdict;
  /** The monthly difference, signed. */
  delta: number;
}) {
  const reduced = useReducedMotion();
  const tiers = dict.job.result.verdictTiers as Record<
    Verdict["tier"],
    { emoji: string; title: string; body: string }
  >;
  const copy = tiers[verdict.tier];
  const style = TIER_STYLES[verdict.tier];

  const percent =
    verdict.ratio === null
      ? "—"
      : new Intl.NumberFormat(locale === "fr" ? "fr-FR" : "en-GB", {
          style: "percent",
          maximumFractionDigits: 0,
        }).format(Math.abs(verdict.ratio));

  /*
    A gain larger than the whole remainder is real, but "+205 % of what you have
    left" reads like a bug. Say it in words at that point; the tier is unchanged.
  */
  const body = verdict.outsized
    ? fill(dict.job.result.verdictOutsized, {
        amount: formatCurrency(locale, Math.abs(delta)),
      })
    : fill(copy.body, {
        amount: formatCurrency(locale, Math.abs(delta)),
        percent,
      });

  const celebrate = isCelebration(verdict.tier) && !reduced;

  return (
    <section
      className={cn("relative mb-5 overflow-hidden rounded-2xl border p-5", style.ring)}
      aria-live="polite"
    >
      <AnimatePresence>{celebrate ? <Confetti /> : null}</AnimatePresence>

      <div className="relative flex items-start gap-3">
        <motion.span
          className="text-3xl leading-none"
          aria-hidden
          initial={reduced ? false : { scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.05 }}
        >
          {copy.emoji}
        </motion.span>

        <div className="min-w-0">
          <motion.h2
            className={cn("font-heading text-xl font-semibold tracking-tight", style.text)}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            {copy.title}
          </motion.h2>

          <motion.p
            className="mt-2 text-sm leading-relaxed"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.12 }}
          >
            {body}
          </motion.p>

          {verdict.signOnly ? (
            <p className="text-muted-foreground mt-2 text-xs">{dict.job.result.verdictSignOnly}</p>
          ) : null}

          {/* A bar sized to the tier, so the grade is visible without reading. */}
          <div className="bg-muted mt-4 h-1.5 w-full max-w-[16rem] overflow-hidden rounded-full">
            <motion.span
              className={cn("block h-full rounded-full", style.bar)}
              initial={reduced ? false : { width: 0 }}
              animate={{
                width: `${
                  { excellent: 100, good: 72, modest: 46, marginal: 22, negative: 12 }[verdict.tier]
                }%`,
              }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

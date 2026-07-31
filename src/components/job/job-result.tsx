"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Briefcase, Compass, RotateCcw, TriangleAlert } from "lucide-react";
import {
  collectSources,
  compare,
  gradeVerdict,
  DATA_SOURCES,
  DISTANCES_COVERAGE,
  DISTANCES_GENERATED_AT,
  JOB_DATASET_VERSION,
  JOB_ENGINE_VERSION,
  SNAPSHOT_DATE,
  SNAPSHOT_IS_SEEDED,
  type CompareInput,
  type Line,
} from "@/domain/reste-a-vivre";
import { fill, localePath, type Dictionary, type Locale } from "@/lib/i18n";
import {
  formatCurrency,
  formatDistanceKm,
  formatNumber,
  formatSignedCurrency,
} from "@/lib/formatting";
import { loadJobInput } from "@/lib/job-storage";
import {
  geoLevelLabel,
  lineBasis,
  lineLabel,
  lineReason,
  sourceCaveat,
  statusLabel,
  term,
} from "@/lib/job-text";
import { useHydratedState } from "@/lib/use-hydrated-state";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/states";
import { JobVerdictBanner } from "./job-verdict-banner";
import { JobDownloads } from "./job-downloads";

export function JobResult({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [input, , ready] = useHydratedState<CompareInput | null>(null, () => loadJobInput());

  const result = useMemo(() => (input ? compare(input) : null), [input]);

  if (!ready) return null;

  if (!input || !result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <EmptyState
          icon={<Briefcase />}
          title={dict.job.result.empty.title}
          description={dict.job.result.empty.desc}
          action={
            <Button render={<Link href={localePath(locale, "/app/job/new")} />}>
              {dict.job.result.empty.cta}
            </Button>
          }
        />
      </div>
    );
  }

  const r = dict.job.result;
  const { current, target } = result;
  const ranked = [target, ...result.alternatives];

  const delta = result.deltaResteAVivre;
  const graded = gradeVerdict(result);
  const verdict =
    Math.abs(delta) < 10
      ? r.verdictSame
      : fill(delta > 0 ? r.verdictBetter : r.verdictWorse, {
          amount: formatCurrency(locale, Math.abs(delta)),
        });

  const sources = collectSources([
    current.revenus,
    current.depenses,
    current.omitted,
    target.revenus,
    target.depenses,
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{r.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {fill(r.subtitle, { currentCity: current.cityName, targetCity: target.cityName })}
        </p>
      </header>

      {SNAPSHOT_IS_SEEDED ? (
        <div className="border-confidence-low/40 bg-muted/40 mb-5 flex items-start gap-3 rounded-xl border p-4">
          <TriangleAlert className="text-confidence-low mt-0.5 size-4 shrink-0" />
          <div>
            <p className="text-sm font-medium">{r.seededTitle}</p>
            <p className="text-muted-foreground mt-1 text-xs">{r.seededDesc}</p>
          </div>
        </div>
      ) : null}

      <JobVerdictBanner locale={locale} dict={dict} verdict={graded} delta={delta} />

      {/* Verdict */}
      <section className="bg-card mb-5 rounded-2xl border p-5">
        <p className="font-heading text-xl font-semibold tracking-tight text-balance">{verdict}</p>
        <p className="text-muted-foreground mt-1.5 text-sm">
          {fill(r.rangeLabel, {
            low: formatSignedCurrency(locale, result.deltaRange.low),
            high: formatSignedCurrency(locale, result.deltaRange.high),
          })}
        </p>
        <p className="text-muted-foreground mt-2 text-xs">{r.verdictNote}</p>

        {/*
          Two numbers, not one. The comparable figure is what the verdict rests on;
          the real one is what the household actually has left once the declared,
          place-invariant part of the budget is taken off.
        */}
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[19rem] text-sm">
            <thead className="text-muted-foreground text-xs">
              <tr>
                <th scope="col" className="py-1 text-left font-medium" />
                <th scope="col" className="py-1 text-right font-medium">
                  {r.here}
                </th>
                <th scope="col" className="py-1 text-right font-medium">
                  {r.there}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className="py-1.5 text-left font-medium">
                  {r.comparable}
                </th>
                <td className="tabular py-1.5 text-right">
                  {formatCurrency(locale, current.resteAVivre)}
                </td>
                <td className="tabular py-1.5 text-right">
                  {formatCurrency(locale, target.resteAVivre)}
                </td>
              </tr>
              <tr className="border-t">
                <th scope="row" className="py-1.5 text-left font-medium">
                  {r.real}
                </th>
                <td className="tabular py-1.5 text-right font-semibold">
                  {formatCurrency(locale, current.resteAVivreReel)}
                </td>
                <td className="tabular py-1.5 text-right font-semibold">
                  {formatCurrency(locale, target.resteAVivreReel)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-muted-foreground mt-2 text-xs">{r.realHint}</p>

        {/*
          The per-item differences deliberately live in the waterfall below and
          nowhere else. Showing "rent −11 €" here and "rent +11 €" there would be
          two correct numbers with opposite signs — cost difference against effect
          on what is left — and the reader should not have to work that out.
        */}
        <dl className="mt-5 grid grid-cols-2 gap-4 border-t pt-4">
          <Cell label={r.bestDistrict}>{target.districtName}</Cell>
          <Cell label={r.commuteDelta}>
            <span className="text-base font-medium">
              {fill(r.hoursPerYear, { hours: formatNumber(locale, current.commuteHoursPerYear) })}
              {" → "}
              {fill(r.hoursPerYear, { hours: formatNumber(locale, target.commuteHoursPerYear) })}
            </span>
          </Cell>
        </dl>
      </section>

      {/* The figure to take into a negotiation */}
      {result.requiredTargetSalary !== null ? (
        <section className="bg-accent/40 mb-5 rounded-2xl border p-5">
          <h2 className="font-heading text-base font-semibold">{r.requiredSalaryTitle}</h2>
          <p className="mt-2 text-sm">
            {fill(r.requiredSalary, {
              city: target.cityName,
              amount: formatCurrency(locale, result.requiredTargetSalary),
            })}
          </p>
        </section>
      ) : null}

      {/* Where the difference comes from */}
      {result.waterfall.length > 0 ? (
        <section className="mb-5">
          <h2 className="font-heading text-base font-semibold">{r.waterfallTitle}</h2>
          <ul className="mt-3 space-y-1.5">
            {result.waterfall.map((step) => {
              const widest = Math.max(...result.waterfall.map((s) => Math.abs(s.amount)));
              const width = widest > 0 ? (Math.abs(step.amount) / widest) * 100 : 0;
              const up = step.amount >= 0;
              return (
                <li key={step.key} className="flex items-center gap-3 text-sm">
                  <span className="w-32 shrink-0 truncate sm:w-40">
                    {(r.waterfall as Record<string, string>)[step.key] ?? step.key}
                  </span>
                  <span className="bg-muted h-2.5 flex-1 overflow-hidden rounded-full">
                    <span
                      className={
                        up ? "bg-confidence-high block h-full" : "bg-confidence-low block h-full"
                      }
                      style={{ width: `${width}%` }}
                    />
                  </span>
                  <span
                    className={
                      up
                        ? "tabular text-confidence-high w-20 shrink-0 text-right"
                        : "tabular text-confidence-low w-20 shrink-0 text-right"
                    }
                  >
                    {formatSignedCurrency(locale, step.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* One-off cost of the move */}
      <section className="bg-muted/30 mb-5 rounded-2xl border p-5">
        <h2 className="font-heading text-base font-semibold">{r.moveCostTitle}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{r.moveCostDesc}</p>
        <ul className="mt-4 space-y-2.5">
          {result.moveCost.lines.map((line) => (
            <li key={line.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm">{lineLabel(locale, dict, line)}</span>
                <span className="tabular shrink-0 text-sm font-medium">
                  {line.amount === null
                    ? statusLabel(dict, line.status)
                    : formatCurrency(locale, line.amount)}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                {lineBasis(locale, dict, line) ?? lineReason(locale, dict, line)}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-3 flex items-baseline justify-between gap-3 border-t pt-3 text-sm font-semibold">
          <span>{r.moveCostTotal}</span>
          <span className="tabular">{formatCurrency(locale, result.moveCost.total)}</span>
        </p>
      </section>

      {/* District ranking */}
      <section className="mb-5">
        <h2 className="font-heading text-base font-semibold">
          {fill(r.rankingTitle, { city: target.cityName })}
        </h2>
        <p className="text-muted-foreground mt-1 mb-3 text-sm">{r.rankingDesc}</p>

        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[34rem] text-sm">
            <thead className="bg-muted/50 text-muted-foreground text-xs">
              <tr>
                <th scope="col" className="px-3 py-2 text-left font-medium">
                  {r.colDistrict}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {r.colRent}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {r.colCommute}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {r.colGrocery}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {r.colResteAVivre}
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  {r.colVsCurrent}
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((side, i) => {
                const rent = side.depenses.find((l) => l.key === "loyer")?.amount ?? 0;
                const vs = side.resteAVivre - current.resteAVivre;
                return (
                  <tr key={side.districtId} className={i === 0 ? "bg-accent/40" : undefined}>
                    <th scope="row" className="px-3 py-2 text-left font-medium">
                      {side.districtName}
                      <span className="text-muted-foreground ml-2 font-mono text-[10px] font-normal">
                        {side.distanceSource === "measured" ? r.measuredBadge : r.derivedBadge}
                      </span>
                      {i === 0 ? (
                        <span className="text-primary ml-2 text-xs font-normal">
                          {r.bestDistrict}
                        </span>
                      ) : null}
                    </th>
                    <td className="tabular px-3 py-2 text-right">{formatCurrency(locale, rent)}</td>
                    <td className="tabular text-muted-foreground px-3 py-2 text-right">
                      {formatDistanceKm(locale, side.oneWayKm)}
                    </td>
                    <td className="text-muted-foreground px-3 py-2 text-right">
                      <span className="tabular">{formatDistanceKm(locale, side.groceryKm)}</span>
                      {side.groceryName ? (
                        <span className="block max-w-[9rem] truncate text-[10px]">
                          {side.groceryName}
                        </span>
                      ) : null}
                    </td>
                    <td className="tabular px-3 py-2 text-right font-medium">
                      {formatCurrency(locale, side.resteAVivre)}
                    </td>
                    <td
                      className={
                        vs >= 0
                          ? "tabular text-confidence-high px-3 py-2 text-right"
                          : "tabular text-confidence-low px-3 py-2 text-right"
                      }
                    >
                      {formatSignedCurrency(locale, vs)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Line by line */}
      <Accordion className="mb-3 rounded-xl border px-3">
        <AccordionItem>
          <AccordionTrigger className="text-sm hover:no-underline">
            {r.breakdownTitle}
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-6 pb-2">
              {(
                [
                  [`${r.here} · ${current.cityName}`, current],
                  [`${r.there} · ${target.cityName} · ${target.districtName}`, target],
                ] as const
              ).map(([heading, side]) => (
                <div key={heading}>
                  <p className="mb-2 text-sm font-medium">{heading}</p>
                  <LineList
                    locale={locale}
                    dict={dict}
                    title={r.revenues}
                    lines={side.revenus}
                    total={side.totalRevenus}
                  />
                  <LineList
                    locale={locale}
                    dict={dict}
                    title={r.expenses}
                    lines={side.depenses}
                    total={side.totalDepenses}
                  />
                  {/* Shown after the comparable total, because it is not part of it. */}
                  <LineList
                    locale={locale}
                    dict={dict}
                    title={r.real}
                    lines={[side.autres]}
                    total={side.resteAVivreReel}
                  />
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* What is missing */}
      <Accordion className="mb-3 rounded-xl border px-3">
        <AccordionItem>
          <AccordionTrigger className="text-sm hover:no-underline">
            {r.omittedTitle}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground mb-3 text-xs">{r.omittedDesc}</p>
            <ul className="space-y-3 pb-2">
              {result.omitted.map((line) => (
                <li key={line.key}>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm font-medium">{lineLabel(locale, dict, line)}</span>
                    <span className="text-muted-foreground font-mono text-[11px] uppercase">
                      {statusLabel(dict, line.status)}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {lineReason(locale, dict, line)}
                  </p>
                </li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Data freshness — the year behind every figure */}
      <Accordion className="mb-6 rounded-xl border px-3">
        <AccordionItem>
          <AccordionTrigger className="text-sm hover:no-underline">
            {r.freshnessTitle}
          </AccordionTrigger>
          <AccordionContent>
            <p className="text-muted-foreground mb-1 text-xs">{r.freshnessDesc}</p>
            <p className="text-muted-foreground mb-1 font-mono text-[11px]">
              {fill(r.snapshotDate, { date: SNAPSHOT_DATE })}
            </p>
            <p className="text-muted-foreground mb-3 text-xs">
              <span className="font-medium">{r.distancesTitle}: </span>
              {DISTANCES_COVERAGE.measured > 0
                ? fill(r.distancesMeasured, {
                    measured: DISTANCES_COVERAGE.measured,
                    total: DISTANCES_COVERAGE.districts,
                    date: DISTANCES_GENERATED_AT,
                  })
                : r.distancesNone}
            </p>
            <ul className="space-y-3 pb-2">
              {sources.map((code) => {
                const source = DATA_SOURCES[code];
                return (
                  <li
                    key={code}
                    className="border-border/60 border-t pt-3 first:border-0 first:pt-0"
                  >
                    <p className="text-sm font-medium">{source.label}</p>
                    <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                      {source.publisher} · {r.vintage} {term(dict, source.vintage)} · {r.refresh}{" "}
                      {term(dict, source.refresh)} · {r.level}{" "}
                      {geoLevelLabel(dict, source.geoLevel)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">{sourceCaveat(dict, code)}</p>
                    {source.url ? (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary mt-1 inline-block font-mono text-[11px] break-all hover:underline"
                      >
                        {source.url}
                      </a>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <JobDownloads locale={locale} dict={dict} result={result} verdict={graded} />

      {/* Actions */}
      <div className="grid gap-2 sm:grid-cols-2">
        <Button variant="outline" render={<Link href={localePath(locale, "/app/quartier/new")} />}>
          <Compass />
          {r.goToQuartier}
        </Button>
        <Button variant="outline" render={<Link href={localePath(locale, "/app/job/new")} />}>
          <RotateCcw />
          {r.restart}
        </Button>
      </div>

      <p className="text-muted-foreground mt-6 text-xs">{r.disclaimer}</p>
      <p className="text-muted-foreground mt-2 text-center text-xs">
        {dict.brand.name} · {JOB_ENGINE_VERSION} · {JOB_DATASET_VERSION}
      </p>
    </div>
  );
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="tabular mt-0.5 text-lg font-semibold">{children}</dd>
    </div>
  );
}

function LineList({
  locale,
  dict,
  title,
  lines,
  total,
}: {
  locale: Locale;
  dict: Dictionary;
  title: string;
  lines: Line[];
  total: number;
}) {
  return (
    <div className="mt-3">
      <p className="text-muted-foreground font-mono text-[11px] uppercase">{title}</p>
      <ul className="mt-1 space-y-2.5">
        {lines.map((line) => {
          const basis = lineBasis(locale, dict, line);
          return (
            <li key={line.key}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm">{lineLabel(locale, dict, line)}</span>
                <span className="tabular shrink-0 text-sm font-medium">
                  {formatCurrency(locale, line.amount ?? 0)}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-[11px]">
                <span className="font-mono uppercase">{statusLabel(dict, line.status)}</span>
                {basis ? ` · ${basis}` : null}
              </p>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 flex items-baseline justify-between gap-3 border-t pt-2 text-sm font-medium">
        <span>{title}</span>
        <span className="tabular">{formatCurrency(locale, total)}</span>
      </p>
    </div>
  );
}

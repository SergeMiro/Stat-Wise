"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Info, ListChecks, RotateCcw, Sparkles, Users } from "lucide-react";
import type { FamilySimulationInput } from "@/domain/types";
import { FAMILY_CATEGORY_KEYS } from "@/domain/types";
import { runFamilySimulation } from "@/domain/scoring";
import { DATASET_VERSION, findCity, getCityAreas } from "@/lib/mock/cities";
import { fill, localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { loadFamilyInput } from "@/lib/family-storage";
import { useHydratedState } from "@/lib/use-hydrated-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/states";
import { DataConfidenceBadge } from "@/components/score/data-confidence-badge";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import CountUp from "@/components/reactbits/CountUp";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";

export function FamilyResult({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [input, , ready] = useHydratedState<FamilySimulationInput | null>(null, () =>
    loadFamilyInput(),
  );

  const result = useMemo(() => {
    if (!input) return null;
    const selected = getCityAreas(input.cityId).filter((a) =>
      input.selectedAreaIds.includes(a.areaId),
    );
    if (selected.length === 0) return null;
    return runFamilySimulation(input, selected, {
      datasetVersion: DATASET_VERSION,
      generatedAt: new Date().toISOString(),
    });
  }, [input]);

  if (!ready) return null;

  const f = dict.family;

  if (!input || !result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <EmptyState
          icon={<Users />}
          title={f.result.empty.title}
          description={f.result.empty.desc}
          action={
            <Button render={<Link href={localePath(locale, "/app/family/new")} />}>
              {f.result.empty.cta}
            </Button>
          }
        />
      </div>
    );
  }

  const city = findCity(input.cityId);
  const ageLabel = f.ages[result.childAgeGroup].label;
  const multi = result.comparedAreas.length > 1;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-5">
        <TextEffect
          as="h1"
          per="word"
          preset="fade-in-blur"
          className="font-heading text-2xl font-semibold tracking-tight"
        >
          {f.result.title}
        </TextEffect>
        <p className="mt-1 text-sm text-muted-foreground">
          {fill(f.result.subtitle, { age: ageLabel, city: city?.name ?? "" })}
        </p>
      </header>

      <AnimatedGroup
        preset="blur-slide"
        className={cn("grid gap-4", multi ? "sm:grid-cols-2 lg:grid-cols-3" : "max-w-md")}
      >
        {result.comparedAreas.map((area, i) => (
          <SpotlightCard key={area.areaId} className="flex flex-col gap-4 p-5">
            {/* Header */}
            <div className="space-y-2">
              {i === 0 && multi ? (
                <span className="inline-flex w-fit items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-xs font-medium text-primary">
                  <Sparkles className="size-3" />
                  {f.result.bestForAge}
                </span>
              ) : null}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <h2 className="min-w-0 truncate font-heading text-base font-semibold">{area.areaName}</h2>
                </div>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {area.areaType === "commune" ? dict.result.commune : dict.result.analysedArea}
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="flex items-end justify-between gap-3">
              <div>
                <span className="text-xs text-muted-foreground">{fill(f.result.forAge, { age: ageLabel })}</span>
                <div className="flex items-baseline gap-1">
                  {area.overallScore === null ? (
                    <span className="text-3xl font-semibold tabular">—</span>
                  ) : (
                    <CountUp
                      to={area.overallScore}
                      duration={1.1}
                      className="text-4xl font-semibold tabular text-foreground"
                    />
                  )}
                  {area.overallScore !== null ? (
                    <span className="text-sm text-muted-foreground">/100</span>
                  ) : null}
                </div>
              </div>
              <DataConfidenceBadge confidence={area.confidence} dict={dict} />
            </div>

            {/* Strengths */}
            {area.strengths.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {area.strengths.map((code) => (
                  <span
                    key={code}
                    className="rounded-full bg-accent/60 px-2 py-0.5 text-xs text-foreground"
                  >
                    {f.strengths[code as keyof typeof f.strengths] ?? code}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Category breakdown */}
            <Accordion className="rounded-xl border px-3">
              <AccordionItem>
                <AccordionTrigger className="text-sm hover:no-underline">
                  {f.result.categoriesTitle}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pb-2">
                    {FAMILY_CATEGORY_KEYS.map((k) => {
                      const v = area.categoryScores[k];
                      return (
                        <div key={k} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>{f.categories[k]}</span>
                            <span className="tabular text-muted-foreground">{v === null ? "—" : v}</span>
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: v === null ? "0%" : `${v}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* To verify */}
            <div className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <ListChecks className="size-3.5" />
                {f.result.toVerifyTitle}
              </span>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {area.actionsToVerify.map((code) => (
                  <li key={code} className="flex gap-1.5">
                    <span aria-hidden>·</span>
                    <span>{f.actions[code as keyof typeof f.actions] ?? code}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SpotlightCard>
        ))}
      </AnimatedGroup>

      {/* Disclaimer */}
      <div className="mt-6 flex items-start gap-2 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-4 shrink-0" />
        <p>{f.result.disclaimer}</p>
      </div>

      {/* Actions */}
      <div className="mt-6">
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          render={<Link href={localePath(locale, "/app/family/new")} />}
        >
          <RotateCcw />
          {f.result.restart}
        </Button>
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        {dict.brand.name} · {result.engineVersion} · {result.datasetVersion}
      </p>
    </div>
  );
}

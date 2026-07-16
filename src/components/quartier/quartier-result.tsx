"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bus,
  GitCompareArrows,
  Home,
  MapPinned,
  RotateCcw,
  Save,
  TreePine,
  Users,
  Wallet,
} from "lucide-react";
import type { NeighbourhoodSimulationInput } from "@/domain/types";
import { runNeighbourhoodSimulation } from "@/domain/scoring";
import { DATASET_VERSION, findCity, getCityAreas } from "@/lib/mock/cities";
import { fill, localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { loadInput, saveInput } from "@/lib/quartier-storage";
import { StatWiseIllustration } from "@/components/visuals/statwise-illustration";
import { useHydratedState } from "@/lib/use-hydrated-state";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { EmptyState } from "@/components/states";
import { AreaCard } from "@/components/score/area-card";
import { AreaComparison } from "@/components/score/area-comparison";

const MAX_COMPARE = 3;

export function QuartierResult({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [input, setInput, ready] = useHydratedState<NeighbourhoodSimulationInput | null>(null, () =>
    loadInput(),
  );
  const [selected, setSelected] = useState<string[]>([]);

  const result = useMemo(() => {
    if (!input) return null;
    return runNeighbourhoodSimulation(input, getCityAreas(input.cityId), {
      datasetVersion: DATASET_VERSION,
      generatedAt: new Date().toISOString(),
    });
  }, [input]);

  if (!ready) return null;

  if (!input || !result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <EmptyState
          icon={<MapPinned />}
          title={dict.result.title}
          description={dict.wizard.steps.city.desc}
          action={
            <Button render={<Link href={localePath(locale, "/app/quartier/new")} />}>
              {dict.home.startQuartier}
            </Button>
          }
        />
      </div>
    );
  }

  const city = findCity(input.cityId);
  const selectedAreas = result.rankedAreas.filter((a) => selected.includes(a.areaId));
  const topArea = result.rankedAreas[0];

  function toggleCompare(id: string) {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, id],
    );
  }

  /** Clone the current input, change a single field, persist it and recompute. */
  function applyScenario(next: NeighbourhoodSimulationInput) {
    saveInput(next);
    setInput(next);
    setSelected([]);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const scenarios = [
    {
      key: "budget",
      icon: <Wallet />,
      label: dict.result.scenarioBudgetTighter,
      disabled: input.maxMonthlyRent == null && input.maxPurchaseBudget == null,
      build: (): NeighbourhoodSimulationInput => ({
        ...input,
        maxMonthlyRent:
          input.maxMonthlyRent != null
            ? Math.round(input.maxMonthlyRent * 0.9)
            : input.maxMonthlyRent,
        maxPurchaseBudget:
          input.maxPurchaseBudget != null
            ? Math.round(input.maxPurchaseBudget * 0.9)
            : input.maxPurchaseBudget,
      }),
    },
    {
      key: "no-car",
      icon: <Bus />,
      label: dict.result.scenarioWithoutCar,
      disabled: input.hasCar === false,
      build: (): NeighbourhoodSimulationInput => ({ ...input, hasCar: false }),
    },
    {
      key: "nature",
      icon: <TreePine />,
      label: dict.result.scenarioMoreNature,
      disabled: input.priorities.nature === 3,
      build: (): NeighbourhoodSimulationInput => ({
        ...input,
        priorities: { ...input.priorities, nature: 3 },
      }),
    },
    {
      key: "buy",
      icon: <Home />,
      label: dict.result.scenarioBuyInstead,
      disabled: input.housingMode === "buy",
      build: (): NeighbourhoodSimulationInput => ({ ...input, housingMode: "buy" }),
    },
  ];

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{dict.result.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {fill(dict.result.subtitle, { city: city?.name ?? "" })}
        </p>
      </header>

      {/* Visual summary — a product preview, not exact geography */}
      <section className="bg-card mb-5 overflow-hidden rounded-2xl border">
        <div className="grid items-center gap-5 p-5 md:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-sm">{city?.name}</p>
            {topArea ? (
              <p className="font-heading tabular text-3xl font-semibold">
                {topArea.overallScore ?? "—"}
                <span className="text-muted-foreground ml-1 text-base font-normal">/ 100</span>
              </p>
            ) : null}
            {topArea ? (
              <p className="text-sm">
                <span className="font-medium">{topArea.areaName}</span>
                <span className="text-primary ml-2 text-xs">{dict.result.topMatch}</span>
              </p>
            ) : null}
            <p className="text-muted-foreground text-xs">
              {fill(dict.result.summaryAreas, { count: result.rankedAreas.length })}
            </p>
            <p className="text-muted-foreground pt-1 text-xs">{dict.result.summaryNote}</p>
          </div>
          <StatWiseIllustration
            src="/illustrations/hero/result-preview.svg"
            alt=""
            width={720}
            height={520}
            className="mx-auto max-w-[440px]"
          />
        </div>
      </section>

      {result.excludedAreas.length > 0 && (
        <Accordion className="mb-4 rounded-xl border px-3">
          <AccordionItem>
            <AccordionTrigger className="text-sm hover:no-underline">
              {fill(dict.result.excludedTitle, { count: result.excludedAreas.length })}
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground mb-2 text-xs">{dict.result.excludedDesc}</p>
              <ul className="space-y-1 text-sm">
                {result.excludedAreas.map((a) => (
                  <li key={a.areaId} className="flex flex-wrap items-center gap-x-2">
                    <span className="font-medium">{a.areaName}</span>
                    <span className="text-muted-foreground text-xs">
                      {a.reasons
                        .map((r) => (dict.explanations.excluded as Record<string, string>)[r] ?? r)
                        .join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {selected.length > 0 ? (
        <p className="text-muted-foreground mb-3 text-xs">{dict.result.compareHint}</p>
      ) : null}

      <div className="space-y-4">
        {result.rankedAreas.map((area, i) => (
          <AreaCard
            key={area.areaId}
            rank={i + 1}
            area={area}
            dict={dict}
            selected={selected.includes(area.areaId)}
            onToggleCompare={() => toggleCompare(area.areaId)}
            compareDisabled={selected.length >= MAX_COMPARE}
          />
        ))}
      </div>

      {/* Repeat-run scenarios */}
      <section className="bg-muted/30 mt-8 rounded-2xl border p-5 md:p-6">
        <div className="grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <StatWiseIllustration
            src="/illustrations/rerun/scenario-cards.svg"
            alt=""
            width={640}
            height={380}
            className="mx-auto max-w-[400px]"
          />
          <div>
            <h2 className="font-heading text-xl font-semibold">
              {dict.result.tryAnotherScenarioTitle}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm">
              {dict.result.tryAnotherScenarioDescription}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {scenarios.map((s) => (
                <Button
                  key={s.key}
                  variant="outline"
                  className="justify-start"
                  disabled={s.disabled}
                  onClick={() => applyScenario(s.build())}
                >
                  {s.icon}
                  {s.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Button variant="outline" render={<Link href={localePath(locale, "/app/family/new")} />}>
          <Users />
          {dict.result.goToFamily}
        </Button>
        <Button variant="outline" render={<Link href={localePath(locale, "/app/quartier/new")} />}>
          <RotateCcw />
          {dict.result.restart}
        </Button>
      </div>
      <div className="mt-2">
        <Button variant="ghost" className="w-full" onClick={() => toast.info(dict.result.saveHint)}>
          <Save />
          {dict.result.saveCta}
        </Button>
      </div>

      <p className="text-muted-foreground mt-6 text-center text-xs">
        {dict.brand.name} · {result.engineVersion} · {result.datasetVersion}
      </p>

      {/* Sticky compare bar */}
      {selected.length >= 2 && (
        <div className="fixed inset-x-0 bottom-20 z-30 flex justify-center px-4 md:bottom-6">
          <Sheet>
            <SheetTrigger
              render={
                <Button size="lg" className="shadow-lg">
                  <GitCompareArrows />
                  {dict.result.compare} ({selected.length})
                </Button>
              }
            />
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{dict.result.compareTitle}</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">
                <AreaComparison areas={selectedAreas} dict={dict} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </div>
  );
}

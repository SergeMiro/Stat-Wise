"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { GitCompareArrows, MapPinned, RotateCcw, Save, Users } from "lucide-react";
import type { NeighbourhoodSimulationInput } from "@/domain/types";
import { runNeighbourhoodSimulation } from "@/domain/scoring";
import { DATASET_VERSION, findCity, getCityAreas } from "@/lib/mock/cities";
import { fill, localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { loadInput } from "@/lib/quartier-storage";
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
  const [input, , ready] = useHydratedState<NeighbourhoodSimulationInput | null>(null, () =>
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

  function toggleCompare(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= MAX_COMPARE ? prev : [...prev, id],
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <header className="mb-5">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{dict.result.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {fill(dict.result.subtitle, { city: city?.name ?? "" })}
        </p>
      </header>

      {result.excludedAreas.length > 0 && (
        <Accordion className="mb-4 rounded-xl border px-3">
          <AccordionItem>
            <AccordionTrigger className="text-sm hover:no-underline">
              {fill(dict.result.excludedTitle, { count: result.excludedAreas.length })}
            </AccordionTrigger>
            <AccordionContent>
              <p className="mb-2 text-xs text-muted-foreground">{dict.result.excludedDesc}</p>
              <ul className="space-y-1 text-sm">
                {result.excludedAreas.map((a) => (
                  <li key={a.areaId} className="flex flex-wrap items-center gap-x-2">
                    <span className="font-medium">{a.areaName}</span>
                    <span className="text-xs text-muted-foreground">
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
        <p className="mb-3 text-xs text-muted-foreground">{dict.result.compareHint}</p>
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

      {/* Actions */}
      <div className="mt-8 grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          render={<Link href={localePath(locale, "/app/family/new")} />}
        >
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

      <p className="mt-6 text-center text-xs text-muted-foreground">
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

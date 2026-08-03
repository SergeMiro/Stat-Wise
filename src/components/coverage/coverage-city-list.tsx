"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import type { City } from "@/lib/mock/cities";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CoverageArea = {
  areaId: string;
  areaName: string;
};

export type CoverageCity = City & {
  areas: CoverageArea[];
};

export type CoverageLabels = {
  richTitle: string;
  richDesc: string;
  limitedTitle: string;
  limitedDesc: string;
  citySearchPlaceholder: string;
  areaSearchPlaceholder: string;
  showMoreCities: string;
  showFewerCities: string;
  noCities: string;
  noAreas: string;
  analysedArea: string;
  limitedConfidence: string;
};

function includesQuery(value: string, query: string): boolean {
  return value.toLocaleLowerCase("fr").includes(query);
}

function cityMatchesQuery(city: City, query: string): boolean {
  return [city.name, city.department, ...city.postalCodes].some((value) =>
    includesQuery(value, query),
  );
}

export function CoverageCityList({
  richCities,
  limitedCities,
  labels,
}: {
  richCities: CoverageCity[];
  limitedCities: City[];
  labels: CoverageLabels;
}) {
  const [globalQuery, setGlobalQuery] = useState("");
  const [areaQueries, setAreaQueries] = useState<Record<string, string>>({});
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [showAllCities, setShowAllCities] = useState(false);

  const normalizedGlobalQuery = globalQuery.trim().toLocaleLowerCase("fr");

  const matchingRichCities = useMemo(() => {
    if (!normalizedGlobalQuery) return richCities;

    return richCities.filter(
      (city) =>
        cityMatchesQuery(city, normalizedGlobalQuery) ||
        city.areas.some((area) => includesQuery(area.areaName, normalizedGlobalQuery)),
    );
  }, [normalizedGlobalQuery, richCities]);

  const visibleRichCities = normalizedGlobalQuery
    ? matchingRichCities
    : showAllCities
      ? richCities
      : richCities.slice(0, 4);

  const matchingLimitedCities = useMemo(() => {
    if (!normalizedGlobalQuery) return limitedCities;
    return limitedCities.filter((city) => cityMatchesQuery(city, normalizedGlobalQuery));
  }, [limitedCities, normalizedGlobalQuery]);

  function toggleCity(cityId: string) {
    setExpandedCities((current) => {
      const next = new Set(current);
      if (next.has(cityId)) next.delete(cityId);
      else next.add(cityId);
      return next;
    });
  }

  function setAreaQuery(cityId: string, value: string) {
    setAreaQueries((current) => ({ ...current, [cityId]: value }));
  }

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={globalQuery}
          onChange={(event) => setGlobalQuery(event.target.value)}
          placeholder={labels.citySearchPlaceholder}
          aria-label={labels.citySearchPlaceholder}
          className="h-10 pl-9"
        />
      </div>

      <section>
        <h2 className="font-heading text-base font-semibold">{labels.richTitle}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{labels.richDesc}</p>

        {visibleRichCities.length > 0 ? (
          <ul className="space-y-2">
            {visibleRichCities.map((city) => {
              const cityMatchesGlobal = cityMatchesQuery(city, normalizedGlobalQuery);
              const areaQuery = areaQueries[city.id]?.trim().toLocaleLowerCase("fr") ?? "";
              const matchingGlobalAreas = normalizedGlobalQuery && !cityMatchesGlobal
                ? city.areas.filter((area) => includesQuery(area.areaName, normalizedGlobalQuery))
                : city.areas;
              const areas = areaQuery
                ? matchingGlobalAreas.filter((area) => includesQuery(area.areaName, areaQuery))
                : matchingGlobalAreas;
              const isExpanded =
                expandedCities.has(city.id) ||
                (Boolean(normalizedGlobalQuery) && matchingGlobalAreas.length > 0);

              return (
                <li key={city.id} className="overflow-hidden rounded-lg border">
                  <button
                    type="button"
                    onClick={() => toggleCity(city.id)}
                    aria-expanded={isExpanded}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                      isExpanded && "bg-muted/30",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block font-medium">{city.name}</span>
                      <span className="text-xs text-muted-foreground">{city.department}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge variant="secondary" className="tabular">
                        {city.areas.length} {labels.analysedArea}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUp className="size-4 text-muted-foreground" aria-hidden />
                      ) : (
                        <ChevronDown className="size-4 text-muted-foreground" aria-hidden />
                      )}
                    </span>
                  </button>

                  {isExpanded ? (
                    <div className="border-t bg-muted/10 p-3">
                      <div className="relative mb-2">
                        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          value={areaQueries[city.id] ?? ""}
                          onChange={(event) => setAreaQuery(city.id, event.target.value)}
                          placeholder={labels.areaSearchPlaceholder}
                          aria-label={`${labels.areaSearchPlaceholder} — ${city.name}`}
                          className="h-8 pl-8 text-sm"
                        />
                      </div>
                      {areas.length > 0 ? (
                        <ul className="max-h-44 space-y-1 overflow-y-auto pr-1">
                          {areas.map((area) => (
                            <li
                              key={area.areaId}
                              className="rounded-md bg-background px-2.5 py-1.5 text-sm"
                            >
                              {area.areaName}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="px-1 py-2 text-center text-xs text-muted-foreground">
                          {labels.noAreas}
                        </p>
                      )}
                    </div>
                  ) : null}
                </li>
              );
            })}
            {!normalizedGlobalQuery ? (
              <li>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-center gap-2"
                  onClick={() => setShowAllCities((current) => !current)}
                  aria-expanded={showAllCities}
                >
                  {showAllCities ? (
                    <ChevronUp className="size-4" aria-hidden />
                  ) : (
                    <ChevronDown className="size-4" aria-hidden />
                  )}
                  {showAllCities ? labels.showFewerCities : labels.showMoreCities}
                </Button>
              </li>
            ) : null}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
            {labels.noCities}
          </p>
        )}
      </section>

      {matchingLimitedCities.length > 0 ? (
        <section>
          <h2 className="font-heading text-base font-semibold">{labels.limitedTitle}</h2>
          <p className="mb-3 text-sm text-muted-foreground">{labels.limitedDesc}</p>
          <ul className="space-y-2">
            {matchingLimitedCities.map((city) => (
              <li
                key={city.id}
                className="flex items-center justify-between rounded-lg border border-dashed p-3"
              >
                <span>
                  <span className="font-medium">{city.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{city.department}</span>
                </span>
                <Badge variant="outline" className="text-confidence-low">
                  {labels.limitedConfidence}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

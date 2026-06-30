"use client";

import { Check, Plus } from "lucide-react";
import type { AreaScore } from "@/domain/types";
import { fill, type Dictionary } from "@/lib/i18n";
import { CATEGORY_COLOR, CATEGORY_ORDER } from "@/lib/categories";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CategoryBar } from "./category-bar";
import { DataConfidenceBadge } from "./data-confidence-badge";
import { ScoreGauge } from "./score-gauge";
import { SourceDisclosure } from "./source-disclosure";

function lookup(map: Record<string, string>, code: string): string {
  return map[code] ?? code;
}

export function AreaCard({
  rank,
  area,
  dict,
  selected,
  onToggleCompare,
  compareDisabled,
}: {
  rank: number;
  area: AreaScore;
  dict: Dictionary;
  selected: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
}) {
  const isTop = rank === 1;
  const areaTypeLabel = area.areaType === "iris" ? dict.result.analysedArea : dict.result.commune;
  const verifyItems = [
    ...area.caveats.map((c) => lookup(dict.explanations.caveats, c)),
    ...area.missingData.map((m) => {
      const key = m.replace("missing_", "");
      const category = (dict.categories as Record<string, string>)[key] ?? key;
      return fill(dict.result.missingCategory, { category });
    }),
  ];

  return (
    <Card className={cn(isTop && "ring-2 ring-primary")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular",
                isTop ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {rank}
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-heading text-base font-semibold leading-tight">{area.areaName}</h3>
              <p className="text-xs text-muted-foreground">{areaTypeLabel}</p>
            </div>
          </div>
          <ScoreGauge score={area.overallScore} label={dict.result.overallMatch} />
        </div>
        {isTop ? (
          <span className="mt-1 inline-flex w-fit rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {dict.result.topMatch}
          </span>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <DataConfidenceBadge confidence={area.confidence} dict={dict} />
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {CATEGORY_ORDER.map((key) => (
            <CategoryBar
              key={key}
              label={dict.categories[key]}
              score={area.categoryScores[key]}
              colorClass={CATEGORY_COLOR[key]}
            />
          ))}
        </div>

        {area.strengths.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">{dict.result.whyItFits}</p>
            <ul className="space-y-1">
              {area.strengths.map((code) => (
                <li key={code} className="flex items-start gap-1.5 text-sm">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-confidence-high" />
                  <span>{lookup(dict.explanations.strengths, code)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {verifyItems.length > 0 ? (
          <Accordion>
            <AccordionItem>
              <AccordionTrigger className="text-sm hover:no-underline">
                {dict.result.thingsToVerify} ({verifyItems.length})
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {verifyItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : null}

        <SourceDisclosure title={dict.result.sources} sources={area.sources} />
      </CardContent>

      <div className="px-(--card-spacing)">
        <Button
          variant={selected ? "secondary" : "outline"}
          size="sm"
          className="w-full"
          onClick={onToggleCompare}
          disabled={!selected && compareDisabled}
        >
          {selected ? <Check /> : <Plus />}
          {selected ? dict.result.removeFromCompare : dict.result.addToCompare}
        </Button>
      </div>
    </Card>
  );
}

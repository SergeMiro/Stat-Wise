"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Baby,
  Backpack,
  Blocks,
  BookOpen,
  Check,
  GraduationCap,
  MapPin,
  Search,
} from "lucide-react";
import type { ChildAgeGroup, FamilyPriorities, PriorityLevel } from "@/domain/types";
import { fill, localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { getCityAreas, type City } from "@/lib/mock/cities";
import {
  defaultFamilyDraft,
  draftToFamilyInput,
  initialFamilyDraft,
  loadFamilyDraft,
  MAX_FAMILY_AREAS,
  saveFamilyDraft,
  saveFamilyInput,
  type FamilyDraft,
} from "@/lib/family-storage";
import { useHydratedState } from "@/lib/use-hydrated-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChoiceGroup } from "@/components/quartier/choice-group";
import { PrioritySelector } from "@/components/quartier/priority-selector";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";
import GradientButton from "@/components/kokonutui/gradient-button";

const STEP_KEYS = ["areas", "child", "priorities"] as const;

const AGE_ICONS: Record<ChildAgeGroup, ReactNode> = {
  "0_2": <Baby className="size-4" />,
  "3_5": <Blocks className="size-4" />,
  "6_10": <Backpack className="size-4" />,
  "11_14": <BookOpen className="size-4" />,
  "15_17": <GraduationCap className="size-4" />,
};

const AGE_ORDER: ChildAgeGroup[] = ["0_2", "3_5", "6_10", "11_14", "15_17"];

const PRIORITY_KEYS: Array<keyof FamilyPriorities> = [
  "earlyChildhood",
  "education",
  "health",
  "sportsAndLeisure",
  "nature",
  "mobility",
  "tranquillity",
  "dailyServices",
];

export function FamilyWizard({
  locale,
  dict,
  cities,
}: {
  locale: Locale;
  dict: Dictionary;
  cities: City[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [draft, setDraft, hydrated] = useHydratedState<FamilyDraft>(defaultFamilyDraft, () => {
    const stored = loadFamilyDraft();
    return stored ?? initialFamilyDraft();
  });
  const [cityQuery, setCityQuery] = useState("");

  useEffect(() => {
    if (hydrated) saveFamilyDraft(draft);
  }, [draft, hydrated]);

  const update = (patch: Partial<FamilyDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setPriority = (key: keyof FamilyPriorities, level: PriorityLevel) =>
    setDraft((d) => ({ ...d, priorities: { ...d.priorities, [key]: level } }));

  const total = STEP_KEYS.length;
  const stepKey = STEP_KEYS[step];
  const f = dict.family;
  const stepMeta = f.steps[stepKey];
  const pct = ((step + 1) / total) * 100;

  const areas = useMemo(() => (draft.cityId ? getCityAreas(draft.cityId) : []), [draft.cityId]);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) => c.name.toLowerCase().includes(q) || c.postalCodes.some((p) => p.includes(q)),
    );
  }, [cities, cityQuery]);

  const canProceed =
    stepKey === "areas" ? Boolean(draft.cityId) && draft.selectedAreaIds.length >= 1 : true;

  function toggleArea(id: string) {
    setDraft((d) => {
      const has = d.selectedAreaIds.includes(id);
      if (has) return { ...d, selectedAreaIds: d.selectedAreaIds.filter((x) => x !== id) };
      if (d.selectedAreaIds.length >= MAX_FAMILY_AREAS) return d;
      return { ...d, selectedAreaIds: [...d.selectedAreaIds, id] };
    });
  }

  function onFinish() {
    const input = draftToFamilyInput(draft);
    if (!input) return;
    saveFamilyInput(input);
    router.push(localePath(locale, "/app/family/result"));
  }

  function back() {
    if (step === 0) router.push(localePath(locale, "/app"));
    else setStep((n) => n - 1);
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      {/* Progress header */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{fill(dict.wizard.stepOf, { current: step + 1, total })}</span>
          {hydrated && draft.selectedAreaIds.length > 0 ? <span>{dict.wizard.draftSaved}</span> : null}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mb-4">
        <TextEffect
          key={stepKey}
          as="h1"
          per="word"
          preset="fade-in-blur"
          className="font-heading text-xl font-semibold tracking-tight"
        >
          {stepMeta.title}
        </TextEffect>
        <p className="mt-1 text-sm text-muted-foreground">{stepMeta.desc}</p>
      </div>

      <Card>
        <CardContent className="space-y-5 py-5">
          {/* ---- Areas ---- */}
          {stepKey === "areas" && (
            <div className="space-y-4">
              {!draft.cityId ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={cityQuery}
                      onChange={(e) => setCityQuery(e.target.value)}
                      placeholder={dict.wizard.steps.city.searchPlaceholder}
                      className="h-10 pl-8"
                      aria-label={dict.wizard.steps.city.searchPlaceholder}
                    />
                  </div>
                  <ul className="space-y-2">
                    {filteredCities.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => update({ cityId: c.id, selectedAreaIds: [] })}
                          className="flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/60"
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{c.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {c.postalCodes.join(", ")} · {c.department}
                            </span>
                          </span>
                          <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium">
                      <MapPin className="size-4 text-primary" />
                      {cities.find((c) => c.id === draft.cityId)?.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => update({ cityId: undefined, selectedAreaIds: [] })}
                    >
                      {f.steps.areas.changeCity}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {f.steps.areas.selectHint}{" "}
                    <span className="text-foreground">
                      {fill(f.steps.areas.selectedCount, { count: draft.selectedAreaIds.length })}
                    </span>
                  </p>
                  <AnimatedGroup preset="blur-slide" className="space-y-2">
                    {areas.map((a) => {
                      const selected = draft.selectedAreaIds.includes(a.areaId);
                      const atMax = draft.selectedAreaIds.length >= MAX_FAMILY_AREAS;
                      return (
                        <button
                          key={a.areaId}
                          type="button"
                          aria-pressed={selected}
                          disabled={!selected && atMax}
                          onClick={() => toggleArea(a.areaId)}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                            selected
                              ? "border-primary bg-accent/60 ring-1 ring-primary"
                              : "hover:bg-muted/60",
                            !selected && atMax && "cursor-not-allowed opacity-50",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{a.areaName}</span>
                            <span className="block text-xs text-muted-foreground">
                              {a.areaType === "commune" ? dict.result.commune : dict.result.analysedArea}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full border",
                              selected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border",
                            )}
                            aria-hidden
                          >
                            {selected ? <Check className="size-3.5" /> : null}
                          </span>
                        </button>
                      );
                    })}
                  </AnimatedGroup>
                </div>
              )}
            </div>
          )}

          {/* ---- Child ---- */}
          {stepKey === "child" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>{f.steps.child.count}</Label>
                <ChoiceGroup<"1" | "2" | "3_plus">
                  ariaLabel={f.steps.child.count}
                  columns={3}
                  value={draft.childrenCount}
                  onChange={(v) => update({ childrenCount: v })}
                  options={[
                    { value: "1", label: f.steps.child.count1 },
                    { value: "2", label: f.steps.child.count2 },
                    { value: "3_plus", label: f.steps.child.count3 },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>{f.steps.child.age}</Label>
                <ChoiceGroup<ChildAgeGroup>
                  ariaLabel={f.steps.child.age}
                  value={draft.childAgeGroup}
                  onChange={(v) => update({ childAgeGroup: v })}
                  options={AGE_ORDER.map((age) => ({
                    value: age,
                    label: f.ages[age].label,
                    description: f.ages[age].desc,
                    icon: AGE_ICONS[age],
                  }))}
                />
              </div>
            </div>
          )}

          {/* ---- Priorities ---- */}
          {stepKey === "priorities" && (
            <div className="space-y-4">
              {PRIORITY_KEYS.map((key) => (
                <PrioritySelector
                  key={key}
                  label={f.categories[key]}
                  value={draft.priorities[key]}
                  onChange={(level) => setPriority(key, level)}
                  levelLabels={dict.priorityLevels}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Nav */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <Button variant="ghost" onClick={back}>
          <ArrowLeft />
          {dict.common.back}
        </Button>
        {step < total - 1 ? (
          <Button onClick={() => setStep((n) => n + 1)} disabled={!canProceed} size="lg">
            {dict.common.next}
            <ArrowRight />
          </Button>
        ) : (
          <GradientButton
            label={f.generate}
            variant="emerald"
            onClick={onFinish}
            disabled={draftToFamilyInput(draft) === null}
          />
        )}
      </div>
    </div>
  );
}

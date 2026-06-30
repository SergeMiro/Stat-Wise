"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowLeftRight,
  Baby,
  Building2,
  Check,
  House,
  KeyRound,
  Search,
  Shuffle,
  Sparkles,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import type {
  HouseholdType,
  HousingMode,
  NeighbourhoodPriorities,
  PriorityLevel,
  PropertyType,
} from "@/domain/types";
import { fill, localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { formatCurrency } from "@/lib/formatting";
import type { City } from "@/lib/mock/cities";
import {
  defaultDraft,
  draftToInput,
  loadDraft,
  saveDraft,
  saveInput,
  type QuartierDraft,
} from "@/lib/quartier-storage";
import { useHydratedState } from "@/lib/use-hydrated-state";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChoiceGroup } from "./choice-group";
import { PrioritySelector } from "./priority-selector";

const STEP_KEYS = ["city", "housing", "budget", "situation", "priorities", "constraints"] as const;
const RENT_DEFAULT = 900;
const PURCHASE_DEFAULT = 250000;

const sliderValue = (v: number | readonly number[]): number => (Array.isArray(v) ? v[0] : (v as number));

export function QuartierWizard({
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
  const [draft, setDraft, hydrated] = useHydratedState<QuartierDraft>(defaultDraft, () => {
    const stored = loadDraft();
    return stored ? { ...defaultDraft, ...stored } : null;
  });
  const [cityQuery, setCityQuery] = useState("");

  useEffect(() => {
    if (hydrated) saveDraft(draft);
  }, [draft, hydrated]);

  const update = (patch: Partial<QuartierDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const setPriority = (key: keyof NeighbourhoodPriorities, level: PriorityLevel) =>
    setDraft((d) => ({ ...d, priorities: { ...d.priorities, [key]: level } }));
  const setConstraint = (key: keyof QuartierDraft["hardConstraints"], value: boolean) =>
    setDraft((d) => ({ ...d, hardConstraints: { ...d.hardConstraints, [key]: value } }));

  const total = STEP_KEYS.length;
  const stepKey = STEP_KEYS[step];
  const s = dict.wizard.steps;
  const stepMeta = s[stepKey];
  const canProceed = stepKey === "city" ? Boolean(draft.cityId) : true;
  const pct = ((step + 1) / total) * 100;

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter(
      (c) => c.name.toLowerCase().includes(q) || c.postalCodes.some((p) => p.includes(q)),
    );
  }, [cities, cityQuery]);

  const wantsRent = draft.housingMode === "rent" || draft.housingMode === "both";
  const wantsBuy = draft.housingMode === "buy" || draft.housingMode === "both";

  function onFinish() {
    const input = draftToInput(draft);
    if (!input) return;
    saveInput(input);
    router.push(localePath(locale, "/app/quartier/result"));
  }

  function back() {
    if (step === 0) router.push(localePath(locale, "/app"));
    else setStep((n) => n - 1);
  }

  const priorityRows: Array<{ key: keyof NeighbourhoodPriorities; label: string }> = [
    { key: "housing", label: dict.categories.housing },
    { key: "mobility", label: dict.categories.mobility },
    { key: "dailyServices", label: dict.categories.services },
    { key: "health", label: dict.categories.health },
    { key: "tranquillity", label: dict.categories.tranquillity },
    { key: "family", label: dict.categories.family },
    { key: "sportAndLeisure", label: s.priorities.sportLabel },
    { key: "nature", label: dict.categories.nature },
  ];

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      {/* Progress header */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{fill(dict.wizard.stepOf, { current: step + 1, total })}</span>
          {hydrated && draft.cityId ? <span>{dict.wizard.draftSaved}</span> : null}
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mb-4">
        <h1 className="font-heading text-xl font-semibold tracking-tight">{stepMeta.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{stepMeta.desc}</p>
      </div>

      <Card>
        <CardContent className="space-y-5 py-5">
          {/* ---- City ---- */}
          {stepKey === "city" && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={cityQuery}
                  onChange={(e) => setCityQuery(e.target.value)}
                  placeholder={s.city.searchPlaceholder}
                  className="h-10 pl-8"
                  aria-label={s.city.searchPlaceholder}
                />
              </div>
              {filteredCities.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{s.city.noResults}</p>
              ) : (
                <ul className="space-y-2">
                  {filteredCities.map((c) => {
                    const selected = draft.cityId === c.id;
                    return (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => update({ cityId: c.id })}
                          aria-pressed={selected}
                          className={cn(
                            "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                            selected ? "border-primary bg-accent/60 ring-1 ring-primary" : "hover:bg-muted/60",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{c.name}</span>
                            <span className="block text-xs text-muted-foreground">
                              {c.postalCodes.join(", ")} · {c.department}
                            </span>
                            {c.coverageLevel === "limited" ? (
                              <span className="mt-1 block text-xs text-confidence-low">{s.city.limited}</span>
                            ) : null}
                          </span>
                          <span
                            className={cn(
                              "flex size-5 shrink-0 items-center justify-center rounded-full border",
                              selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
                            )}
                            aria-hidden
                          >
                            {selected ? <Check className="size-3.5" /> : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {/* ---- Housing ---- */}
          {stepKey === "housing" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>{s.housing.mode}</Label>
                <ChoiceGroup<HousingMode>
                  ariaLabel={s.housing.mode}
                  value={draft.housingMode}
                  onChange={(v) => update({ housingMode: v })}
                  options={[
                    { value: "rent", label: s.housing.modeRent, icon: <KeyRound className="size-4" /> },
                    { value: "buy", label: s.housing.modeBuy, icon: <House className="size-4" /> },
                    { value: "both", label: s.housing.modeBoth, icon: <ArrowLeftRight className="size-4" /> },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <Label>{s.housing.type}</Label>
                <ChoiceGroup<PropertyType>
                  ariaLabel={s.housing.type}
                  value={draft.propertyType}
                  onChange={(v) => update({ propertyType: v })}
                  options={[
                    { value: "apartment", label: s.housing.typeApartment, icon: <Building2 className="size-4" /> },
                    { value: "house", label: s.housing.typeHouse, icon: <House className="size-4" /> },
                    { value: "any", label: s.housing.typeAny, icon: <Shuffle className="size-4" /> },
                  ]}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rooms">{s.housing.rooms}</Label>
                  <Select
                    items={{ any: dict.common.optional, "1": "1", "2": "2", "3": "3", "4": "4", "5": "5+" }}
                    value={draft.minRooms ? String(draft.minRooms) : "any"}
                    onValueChange={(v) => update({ minRooms: v === "any" ? undefined : Number(v) })}
                  >
                    <SelectTrigger id="rooms" className="h-10 w-full">
                      <SelectValue placeholder={dict.common.optional} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">{dict.common.optional}</SelectItem>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n}
                          {n === 5 ? "+" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="surface">{s.housing.surface}</Label>
                  <Input
                    id="surface"
                    type="number"
                    inputMode="numeric"
                    min={10}
                    className="h-10"
                    placeholder={dict.common.optional}
                    value={draft.minSurfaceM2 ?? ""}
                    onChange={(e) =>
                      update({ minSurfaceM2: e.target.value ? Number(e.target.value) : undefined })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---- Budget ---- */}
          {stepKey === "budget" && (
            <div className="space-y-6">
              {wantsRent && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="rent-toggle" className="font-medium">
                      {s.budget.rentMax}
                    </Label>
                    <Switch
                      id="rent-toggle"
                      checked={draft.maxMonthlyRent !== undefined}
                      onCheckedChange={(c) => update({ maxMonthlyRent: c ? RENT_DEFAULT : undefined })}
                    />
                  </div>
                  {draft.maxMonthlyRent !== undefined && (
                    <div className="space-y-3">
                      <div className="flex items-baseline justify-between">
                        <span className="tabular text-lg font-semibold">
                          {formatCurrency(locale, draft.maxMonthlyRent)}
                        </span>
                        <span className="text-xs text-muted-foreground">{s.budget.perMonth}</span>
                      </div>
                      <Slider
                        value={[draft.maxMonthlyRent]}
                        min={300}
                        max={2500}
                        step={50}
                        onValueChange={(v) => update({ maxMonthlyRent: sliderValue(v) })}
                      />
                      <div className="flex items-center gap-2">
                        <Switch
                          id="charges"
                          checked={draft.rentIncludesCharges}
                          onCheckedChange={(c) => update({ rentIncludesCharges: c })}
                        />
                        <Label htmlFor="charges" className="text-sm font-normal text-muted-foreground">
                          {s.budget.rentCharges}
                        </Label>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {wantsBuy && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="buy-toggle" className="font-medium">
                      {s.budget.purchaseMax}
                    </Label>
                    <Switch
                      id="buy-toggle"
                      checked={draft.maxPurchaseBudget !== undefined}
                      onCheckedChange={(c) => update({ maxPurchaseBudget: c ? PURCHASE_DEFAULT : undefined })}
                    />
                  </div>
                  {draft.maxPurchaseBudget !== undefined && (
                    <div className="space-y-3">
                      <span className="tabular text-lg font-semibold">
                        {formatCurrency(locale, draft.maxPurchaseBudget)}
                      </span>
                      <Slider
                        value={[draft.maxPurchaseBudget]}
                        min={50000}
                        max={800000}
                        step={10000}
                        onValueChange={(v) => update({ maxPurchaseBudget: sliderValue(v) })}
                      />
                    </div>
                  )}
                </div>
              )}

              {draft.maxMonthlyRent === undefined && draft.maxPurchaseBudget === undefined ? (
                <p className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{s.budget.noBudget}</p>
              ) : null}
            </div>
          )}

          {/* ---- Situation ---- */}
          {stepKey === "situation" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>{s.situation.household}</Label>
                <ChoiceGroup<HouseholdType>
                  ariaLabel={s.situation.household}
                  value={draft.householdType}
                  onChange={(v) => update({ householdType: v })}
                  options={[
                    { value: "single", label: s.situation.single, icon: <User className="size-4" /> },
                    { value: "couple", label: s.situation.couple, icon: <Users className="size-4" /> },
                    { value: "family", label: s.situation.family, icon: <UsersRound className="size-4" /> },
                    { value: "family_with_child", label: s.situation.familyChild, icon: <Baby className="size-4" /> },
                  ]}
                />
              </div>
              <div className="space-y-2">
                <ToggleRow
                  id="hasCar"
                  label={s.situation.hasCar}
                  checked={draft.hasCar}
                  onChange={(c) => update({ hasCar: c })}
                />
                <ToggleRow
                  id="usesTransport"
                  label={s.situation.usesTransport}
                  checked={draft.usesTransport}
                  onChange={(c) => update({ usesTransport: c })}
                />
              </div>
            </div>
          )}

          {/* ---- Priorities ---- */}
          {stepKey === "priorities" && (
            <div className="space-y-4">
              {priorityRows.map((row) => (
                <PrioritySelector
                  key={row.key}
                  label={row.label}
                  value={draft.priorities[row.key]}
                  onChange={(level) => setPriority(row.key, level)}
                  levelLabels={dict.priorityLevels}
                />
              ))}
            </div>
          )}

          {/* ---- Constraints ---- */}
          {stepKey === "constraints" && (
            <div className="space-y-2">
              <ToggleRow
                id="c-transport"
                label={s.constraints.requireTransport}
                checked={Boolean(draft.hardConstraints.requireTransport)}
                onChange={(c) => setConstraint("requireTransport", c)}
              />
              <ToggleRow
                id="c-school"
                label={s.constraints.requireSchool}
                checked={Boolean(draft.hardConstraints.requireSchoolNearby)}
                onChange={(c) => setConstraint("requireSchoolNearby", c)}
              />
              <ToggleRow
                id="c-creche"
                label={s.constraints.requireCreche}
                checked={Boolean(draft.hardConstraints.requireCrecheNearby)}
                onChange={(c) => setConstraint("requireCrecheNearby", c)}
              />
              <ToggleRow
                id="c-budget"
                label={s.constraints.strictBudget}
                checked={Boolean(draft.hardConstraints.maxBudgetStrict)}
                onChange={(c) => setConstraint("maxBudgetStrict", c)}
              />
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
          <Button onClick={onFinish} disabled={!draft.cityId} size="lg">
            <Sparkles />
            {dict.wizard.generate}
          </Button>
        )}
      </div>
    </div>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

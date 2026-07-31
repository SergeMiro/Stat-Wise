"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Building2,
  Bus,
  Car,
  Fuel,
  House,
  Sparkles,
  User,
  Users,
  Zap,
} from "lucide-react";
import {
  bikeAmortizationPresets,
  compare,
  findCity,
  type CompareInput,
  listJobCities,
  type HousingType,
  type TravelMode,
  type VehicleEnergy,
} from "@/domain/reste-a-vivre";
import { fill, localePath, type Dictionary, type Locale } from "@/lib/i18n";
import {
  defaultJobDraft,
  draftToInput,
  loadJobDraft,
  saveJobDraft,
  saveJobInput,
  type JobDraft,
} from "@/lib/job-storage";
import { useHydratedState } from "@/lib/use-hydrated-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChoiceGroup } from "@/components/quartier/choice-group";
import { JobSectionButton, JobSectionPicker } from "./job-section-picker";
import { activeSections, SECTIONS, sectionState, type SectionId } from "@/lib/job-sections";

/**
 * The wizard walks whatever sections are enabled, in registry order.
 *
 * `phase` matters more than it looks: the picker is shown before the run and again
 * on demand, and returning from it must land the user back on the section they
 * were on — not at the start, and not past the ones they have just switched on.
 * `sectionIndex` is therefore held as a section *id*, not a number, because the
 * number means something different once the list changes underneath it.
 */
type Phase = "picking" | "running" | "editing";

/**
 * Legislation year asked of the rules engine. Bumped deliberately rather than
 * read from the clock: a result computed against next year's draft law on the 1st
 * of January would change without anyone deciding to change it.
 */
const FISCAL_YEAR = 2026;

/**
 * The rent the winning district will actually charge.
 *
 * Housing benefit is driven by the rent, so asking the rules engine about the
 * first district in the list while the result shows a different one would compute
 * a benefit for a flat nobody is moving into. The engine is pure and cheap, so it
 * is run once without tax to find the winner, and its rent is what gets sent.
 */
function targetRentOfWinner(input: CompareInput): number {
  const first = compare(input);
  const rent = first?.target.depenses.find((line) => line.key === "loyer")?.amount;
  return Math.round(rent ?? input.current.actualRent);
}

export function JobWizard({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("picking");
  const [currentSection, setCurrentSection] = useState<SectionId>("today");
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft, hydrated] = useHydratedState<JobDraft>(defaultJobDraft, () => {
    const stored = loadJobDraft();
    return stored ? { ...defaultJobDraft, ...stored } : null;
  });

  useEffect(() => {
    if (hydrated) saveJobDraft(draft);
  }, [draft, hydrated]);

  const update = (patch: Partial<JobDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const cities = listJobCities();
  const f = dict.job.fields;
  const walk = activeSections(draft.enabledSections);
  const index = Math.max(0, walk.indexOf(currentSection));
  const stepKey = walk[index] ?? "today";
  const total = walk.length;
  const stepMeta = (dict.job.steps as Record<string, { title: string; desc: string }>)[stepKey];
  const pct = ((index + 1) / total) * 100;
  const pendingCount = SECTIONS.filter(
    (section) => sectionState(section, draft.enabledSections, draft) === "pending",
  ).length;

  const currentCity = useMemo(() => findCity(draft.currentCityId), [draft.currentCityId]);
  const districts = currentCity?.districts ?? [];

  const cityItems = useMemo(() => Object.fromEntries(cities.map((c) => [c.id, c.name])), [cities]);
  const districtItems = useMemo(
    () => Object.fromEntries((currentCity?.districts ?? []).map((d) => [d.id, d.name])),
    [currentCity],
  );

  const modeOptions: Array<{ value: TravelMode; label: string; icon: React.ReactNode }> = [
    { value: "voiture", label: dict.job.modes.voiture, icon: <Car className="size-4" /> },
    { value: "transports", label: dict.job.modes.transports, icon: <Bus className="size-4" /> },
    { value: "actif", label: dict.job.modes.actif, icon: <Bike className="size-4" /> },
  ];

  /** Changing city invalidates the district, so pick the first one of the new city. */
  function selectCurrentCity(cityId: string) {
    const city = findCity(cityId);
    update({
      currentCityId: cityId,
      currentDistrictId: city?.districts[0]?.id ?? "",
    });
  }

  const usesCar =
    draft.currentCommuteMode === "voiture" ||
    draft.targetCommuteMode === "voiture" ||
    draft.errandsMode === "voiture";
  const usesBike =
    draft.currentCommuteMode === "actif" ||
    draft.targetCommuteMode === "actif" ||
    draft.errandsMode === "actif";

  /*
    Tax and benefits are fetched here rather than on the result page, so the result
    is complete on first paint instead of shifting under the reader a second later.
    A failure is not an error the user has to deal with: the comparison goes ahead
    and those lines stay `non chiffré`, exactly as before the rules engine existed.
  */
  async function onFinish() {
    markReviewed(stepKey);
    const input = draftToInput(draft);
    if (!input) return;
    setSubmitting(true);
    try {
      const response = await fetch("/api/fiscal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: FISCAL_YEAR,
          children: input.household.children,
          childrenInCreche: input.household.childrenInCreche,
          current: {
            cityId: input.current.cityId,
            netSalary: input.current.netSalary,
            partnerNetSalary: input.current.partnerNetSalary,
            rent: input.current.actualRent,
          },
          target: {
            cityId: input.target.cityId,
            netSalary: input.target.netSalary,
            partnerNetSalary: input.target.partnerNetSalary,
            // The target rent is our estimate, so the benefit it drives is too.
            rent: targetRentOfWinner(input),
          },
        }),
      });
      const body = (await response.json()) as { fiscal?: CompareInput["fiscal"] };
      if (body.fiscal) input.fiscal = body.fiscal;
    } catch {
      // Deliberately silent: the comparison is still worth showing without it.
    }
    saveJobInput(input);
    router.push(localePath(locale, "/app/job/result"));
  }

  /** Leaving a section is what marks it reviewed — no effect, no visit tracking. */
  function markReviewed(id: SectionId) {
    if (id === "household" && !draft.householdReviewed) update({ householdReviewed: true });
    if (id === "travel" && !draft.travelReviewed) update({ travelReviewed: true });
  }

  function goNext() {
    markReviewed(stepKey);
    const next = walk[index + 1];
    if (next) setCurrentSection(next);
  }

  function back() {
    const previous = walk[index - 1];
    if (previous) setCurrentSection(previous);
    else setPhase("picking");
  }

  if (phase !== "running") {
    return (
      <JobSectionPicker
        dict={dict}
        draft={draft}
        mode={phase === "picking" ? "start" : "edit"}
        onToggle={(enabledSections) => update({ enabledSections })}
        onConfirm={() => {
          /*
            Where to land after the picker.
            
            Switching a section on is a request to fill it, and the registry order
            means it may sit *behind* the current position — where "Continue" would
            never reach it again. So the return lands on the first enabled section
            that is still empty; only when everything is filled does it stay put.
            Without this, re-enabling a section from the last screen silently did
            nothing, which is how this was found.
          */
          const next = activeSections(draft.enabledSections);
          const firstPending = SECTIONS.find(
            (section) =>
              next.includes(section.id) &&
              sectionState(section, draft.enabledSections, draft) === "pending",
          );
          if (firstPending) setCurrentSection(firstPending.id);
          else if (!next.includes(currentSection)) setCurrentSection(next[0] ?? "today");
          setPhase("running");
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs">
          {(dict.job.sections.names as Record<string, string>)[stepKey]}
        </span>
        <JobSectionButton dict={dict} onOpen={() => setPhase("editing")} pending={pendingCount} />
      </div>

      {/* Progress header */}
      <div className="mb-4 space-y-2">
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>{fill(dict.wizard.stepOf, { current: index + 1, total })}</span>
          {hydrated ? <span>{dict.wizard.draftSaved}</span> : null}
        </div>
        <div className="bg-muted h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="mb-4">
        <h1 className="font-heading text-xl font-semibold tracking-tight">{stepMeta.title}</h1>
        <p className="text-muted-foreground mt-1 text-sm">{stepMeta.desc}</p>
      </div>

      <Card>
        <CardContent className="space-y-5 py-5">
          {/* ---- Today ---- */}
          {stepKey === "today" && (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field id="current-city" label={f.city}>
                  <Select
                    items={cityItems}
                    value={draft.currentCityId}
                    onValueChange={(v) => selectCurrentCity(String(v))}
                  >
                    <SelectTrigger id="current-city" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field id="current-district" label={f.district} hint={f.districtHint}>
                  <Select
                    items={districtItems}
                    value={draft.currentDistrictId}
                    onValueChange={(v) => update({ currentDistrictId: String(v) })}
                  >
                    <SelectTrigger id="current-district" className="h-10 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <NumberField
                id="net-salary"
                label={f.netSalary}
                hint={f.netSalaryHint}
                suffix="€"
                value={draft.netSalary}
                min={0}
                step={50}
                onChange={(netSalary) => update({ netSalary })}
              />

              <NumberField
                id="rent"
                label={f.rent}
                suffix="€"
                value={draft.actualRent}
                min={0}
                step={10}
                onChange={(actualRent) => update({ actualRent })}
              />

              <div className="space-y-2">
                <Label>{f.housingType}</Label>
                <ChoiceGroup<HousingType>
                  ariaLabel={f.housingType}
                  columns={2}
                  value={draft.housingType}
                  onChange={(housingType) => update({ housingType })}
                  options={[
                    {
                      value: "appartement",
                      label: f.apartment,
                      icon: <Building2 className="size-4" />,
                    },
                    { value: "maison", label: f.house, icon: <House className="size-4" /> },
                  ]}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField
                  id="surface"
                  label={f.surface}
                  value={draft.surfaceM2}
                  min={9}
                  step={1}
                  onChange={(surfaceM2) => update({ surfaceM2 })}
                />
                <NumberField
                  id="one-way-km"
                  label={f.oneWayKm}
                  value={draft.oneWayKm}
                  min={0}
                  step={0.5}
                  onChange={(oneWayKm) => update({ oneWayKm })}
                />
              </div>
            </div>
          )}

          {/* ---- The offer ---- */}
          {stepKey === "offer" && (
            <div className="space-y-5">
              <Field id="target-city" label={f.targetCity}>
                <Select
                  items={cityItems}
                  value={draft.targetCityId}
                  onValueChange={(v) => update({ targetCityId: String(v) })}
                >
                  <SelectTrigger id="target-city" className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <NumberField
                id="target-salary"
                label={f.targetSalary}
                hint={f.netSalaryHint}
                suffix="€"
                value={draft.targetNetSalary}
                min={0}
                step={50}
                onChange={(targetNetSalary) => update({ targetNetSalary })}
              />

              <NumberField
                id="target-surface"
                label={f.targetSurface}
                value={draft.targetSurfaceM2}
                min={9}
                step={1}
                onChange={(targetSurfaceM2) => update({ targetSurfaceM2 })}
              />
            </div>
          )}

          {/* ---- Household ---- */}
          {stepKey === "household" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>{f.adults}</Label>
                <ChoiceGroup<"1" | "2">
                  ariaLabel={f.adults}
                  columns={2}
                  value={String(draft.adults) as "1" | "2"}
                  onChange={(v) => update({ adults: v === "2" ? 2 : 1 })}
                  options={[
                    { value: "1", label: "1", icon: <User className="size-4" /> },
                    { value: "2", label: "2", icon: <Users className="size-4" /> },
                  ]}
                />
              </div>

              {draft.adults === 2 ? (
                <NumberField
                  id="partner-salary"
                  label={f.partnerSalary}
                  hint={f.partnerSalaryNone}
                  suffix="€"
                  value={draft.partnerNetSalary}
                  min={0}
                  step={50}
                  onChange={(partnerNetSalary) => update({ partnerNetSalary })}
                />
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <CountField
                  id="children"
                  label={f.children}
                  max={4}
                  value={draft.children}
                  onChange={(children) =>
                    update({
                      children,
                      childrenInCreche: Math.min(draft.childrenInCreche, children),
                    })
                  }
                />
                <CountField
                  id="children-creche"
                  label={f.childrenInCreche}
                  max={draft.children}
                  value={draft.childrenInCreche}
                  onChange={(childrenInCreche) => update({ childrenInCreche })}
                />
              </div>

              {draft.childrenInCreche > 0 ? (
                <NumberField
                  id="creche-hours"
                  label={f.crecheHours}
                  value={draft.crecheHoursPerMonth}
                  min={0}
                  step={10}
                  onChange={(crecheHoursPerMonth) => update({ crecheHoursPerMonth })}
                />
              ) : null}
            </div>
          )}

          {/* ---- Travel ---- */}
          {stepKey === "travel" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>
                  {f.commuteMode} — {dict.job.result.here}
                </Label>
                <ChoiceGroup<TravelMode>
                  ariaLabel={`${f.commuteMode} — ${dict.job.result.here}`}
                  value={draft.currentCommuteMode}
                  onChange={(currentCommuteMode) => update({ currentCommuteMode })}
                  options={modeOptions}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  {f.commuteMode} — {dict.job.result.there}
                </Label>
                <ChoiceGroup<TravelMode>
                  ariaLabel={`${f.commuteMode} — ${dict.job.result.there}`}
                  value={draft.targetCommuteMode}
                  onChange={(targetCommuteMode) => update({ targetCommuteMode })}
                  options={modeOptions}
                />
              </div>

              <div className="space-y-2">
                <Label>{f.errandsMode}</Label>
                <ChoiceGroup<TravelMode>
                  ariaLabel={f.errandsMode}
                  value={draft.errandsMode}
                  onChange={(errandsMode) => update({ errandsMode })}
                  options={modeOptions}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <CountField
                  id="days-on-site"
                  label={f.daysOnSite}
                  min={1}
                  max={5}
                  value={draft.daysOnSitePerWeek}
                  onChange={(daysOnSitePerWeek) => update({ daysOnSitePerWeek })}
                />
                <NumberField
                  id="trips"
                  label={f.tripsPerMonth}
                  value={draft.tripsPerMonth}
                  min={0}
                  step={1}
                  onChange={(tripsPerMonth) => update({ tripsPerMonth })}
                />
              </div>

              {usesCar ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>{f.vehicleEnergy}</Label>
                    <ChoiceGroup<VehicleEnergy>
                      ariaLabel={f.vehicleEnergy}
                      columns={2}
                      value={draft.vehicleEnergy}
                      onChange={(vehicleEnergy) => update({ vehicleEnergy })}
                      options={[
                        {
                          value: "thermique",
                          label: f.thermique,
                          icon: <Fuel className="size-4" />,
                        },
                        {
                          value: "electrique",
                          label: f.electrique,
                          icon: <Zap className="size-4" />,
                        },
                      ]}
                    />
                    <p className="text-muted-foreground text-xs">{f.hybridNote}</p>
                  </div>

                  {draft.vehicleEnergy === "thermique" ? (
                    <NumberField
                      id="litres"
                      label={f.litresPer100Km}
                      value={draft.litresPer100Km}
                      min={0}
                      step={0.1}
                      onChange={(litresPer100Km) => update({ litresPer100Km })}
                    />
                  ) : (
                    <>
                      <NumberField
                        id="kwh"
                        label={f.kwhPer100Km}
                        value={draft.kwhPer100Km}
                        min={0}
                        step={0.5}
                        onChange={(kwhPer100Km) => update({ kwhPer100Km })}
                      />
                      <div className="space-y-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <Label htmlFor="home-charging">{f.homeChargingShare}</Label>
                          <span className="tabular text-sm font-semibold">
                            {draft.homeChargingSharePct} %
                          </span>
                        </div>
                        <Slider
                          id="home-charging"
                          value={[draft.homeChargingSharePct]}
                          min={0}
                          max={100}
                          step={5}
                          onValueChange={(v) =>
                            update({
                              homeChargingSharePct: Array.isArray(v) ? v[0] : (v as number),
                            })
                          }
                        />
                        <p className="text-muted-foreground text-xs">{f.homeChargingHint}</p>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {usesBike ? (
                <div className="space-y-2">
                  <Label>{f.bikeAmortization}</Label>
                  <p className="text-muted-foreground text-xs">{f.bikeAmortizationHint}</p>
                  <ChoiceGroup<string>
                    ariaLabel={f.bikeAmortization}
                    value={
                      bikeAmortizationPresets.find(
                        (preset) => preset.perYear === draft.bikeAmortizationPerYear,
                      )?.key ?? ""
                    }
                    onChange={(key) => {
                      const preset = bikeAmortizationPresets.find((x) => x.key === key);
                      if (preset) update({ bikeAmortizationPerYear: preset.perYear });
                    }}
                    options={bikeAmortizationPresets.map((preset) => ({
                      value: preset.key,
                      label: (dict.job.bike as Record<string, string>)[preset.key],
                      description: `${preset.perYear} ${f.perYear}`,
                    }))}
                  />
                  <NumberField
                    id="bike-custom"
                    label={f.bikeCustom}
                    value={draft.bikeAmortizationPerYear}
                    min={0}
                    step={10}
                    onChange={(bikeAmortizationPerYear) => update({ bikeAmortizationPerYear })}
                  />
                </div>
              ) : null}
            </div>
          )}
          {/* ---- Trips to close family ---- */}
          {stepKey === "family" && (
            <div className="space-y-3">
              <p className="text-muted-foreground text-xs">{f.familyHint}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <NumberField
                  id="family-km-current"
                  label={f.familyKmCurrent}
                  value={draft.familyKmCurrent}
                  min={0}
                  step={10}
                  onChange={(familyKmCurrent) => update({ familyKmCurrent })}
                />
                <NumberField
                  id="family-km-target"
                  label={f.familyKmTarget}
                  value={draft.familyKmTarget}
                  min={0}
                  step={10}
                  onChange={(familyKmTarget) => update({ familyKmTarget })}
                />
              </div>
              <NumberField
                id="family-trips"
                label={f.familyTripsPerYear}
                value={draft.familyTripsPerYear}
                min={0}
                step={1}
                onChange={(familyTripsPerYear) => update({ familyTripsPerYear })}
              />
            </div>
          )}

          {/* ---- Dividends ---- */}
          {stepKey === "dividends" && (
            <NumberField
              id="dividends"
              label={f.dividendsMonthly}
              hint={f.placeInvariantHint}
              suffix="€"
              value={draft.dividendsMonthly}
              min={0}
              step={50}
              onChange={(dividendsMonthly) => update({ dividendsMonthly })}
            />
          )}

          {/* ---- Rental income ---- */}
          {stepKey === "rental" && (
            <NumberField
              id="rental"
              label={f.rentalMonthly}
              hint={f.placeInvariantHint}
              suffix="€"
              value={draft.rentalMonthly}
              min={0}
              step={50}
              onChange={(rentalMonthly) => update({ rentalMonthly })}
            />
          )}

          {/* ---- Benefits already received ---- */}
          {stepKey === "aide" && (
            <NumberField
              id="benefits"
              label={f.declaredBenefitsMonthly}
              hint={f.declaredBenefitsHint}
              suffix="€"
              value={draft.declaredBenefitsMonthly}
              min={0}
              step={20}
              onChange={(declaredBenefitsMonthly) => update({ declaredBenefitsMonthly })}
            />
          )}

          {/* ---- The rest of the budget ---- */}
          {stepKey === "other" && (
            <div className="space-y-5">
              <NumberField
                id="other-monthly"
                label={f.otherMonthly}
                hint={f.otherMonthlyHint}
                suffix="€"
                value={draft.otherMonthly}
                min={0}
                step={20}
                onChange={(otherMonthly) => update({ otherMonthly })}
              />
              <NumberField
                id="removal-cost"
                label={f.removalCost}
                suffix="€"
                value={draft.removalCost}
                min={0}
                step={100}
                onChange={(removalCost) => update({ removalCost })}
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
        {index < total - 1 ? (
          <Button onClick={goNext} size="lg">
            {dict.common.next}
            <ArrowRight />
          </Button>
        ) : (
          <Button onClick={onFinish} size="lg" disabled={submitting}>
            <Sparkles />
            {submitting ? dict.job.computing : dict.job.generate}
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
    </div>
  );
}

function NumberField({
  id,
  label,
  hint,
  suffix,
  value,
  min,
  step,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  suffix?: string;
  value: number;
  min: number;
  step: number;
  onChange: (next: number) => void;
}) {
  return (
    <Field id={id} label={label} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          className="h-10"
          value={value}
          onChange={(e) => {
            // An empty field must not become NaN and poison every total.
            const next = e.target.value === "" ? min : Number(e.target.value);
            onChange(Number.isFinite(next) ? next : min);
          }}
        />
        {suffix ? (
          <span
            className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm"
            aria-hidden
          >
            {suffix}
          </span>
        ) : null}
      </div>
    </Field>
  );
}

/** A small integer chosen from buttons — faster than a stepper on a phone. */
function CountField({
  id,
  label,
  min = 0,
  max,
  value,
  onChange,
}: {
  id: string;
  label: string;
  min?: number;
  max: number;
  value: number;
  onChange: (next: number) => void;
}) {
  const options = Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => min + i);
  return (
    <div className="space-y-1.5">
      <Label id={`${id}-label`}>{label}</Label>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className="border-border flex overflow-hidden rounded-xl border"
      >
        {options.length === 0 ? (
          <span className="text-muted-foreground px-3 py-2 text-sm">—</span>
        ) : (
          options.map((n) => {
            const selected = value === n;
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange(n)}
                className={
                  selected
                    ? "bg-primary text-primary-foreground flex-1 px-3 py-2 text-sm font-medium"
                    : "hover:bg-muted/60 flex-1 px-3 py-2 text-sm transition-colors"
                }
              >
                {n}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

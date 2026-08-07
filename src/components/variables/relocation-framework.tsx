import {
  ArrowRight,
  BadgeEuro,
  BanknoteArrowDown,
  CalendarSync,
  Car,
  Check,
  CircleEqual,
  House,
  MapPin,
  ReceiptText,
  ShieldCheck,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";

type Copy = Dictionary["pages"]["variables"]["relocation"];

const GROUP_ICONS = [House, Car, CalendarSync, MapPin, ShieldCheck, BadgeEuro];

function ItemList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-sm leading-relaxed">
          <Check className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function RelocationFramework({ copy }: { copy: Copy }) {
  return (
    <>
      <section aria-labelledby="relocation-rule" className="border-y py-7">
        <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div>
            <p className="text-primary text-xs font-semibold uppercase">{copy.eyebrow}</p>
            <h2 id="relocation-rule" className="font-heading mt-2 text-xl font-semibold">
              {copy.ruleTitle}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl leading-relaxed">{copy.ruleBody}</p>

            <dl className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="border-brand-cyan border-l-2 pl-4">
                <dt className="flex items-center gap-2 text-sm font-semibold">
                  <CalendarSync className="size-4" aria-hidden />
                  {copy.monthlyTitle}
                </dt>
                <dd className="mt-2 font-mono text-sm">{copy.monthlyFormula}</dd>
                <dd className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  {copy.monthlyHelp}
                </dd>
              </div>
              <div className="border-chart-6 border-l-2 pl-4">
                <dt className="flex items-center gap-2 text-sm font-semibold">
                  <BanknoteArrowDown className="size-4" aria-hidden />
                  {copy.oneOffTitle}
                </dt>
                <dd className="mt-2 font-mono text-sm">{copy.oneOffFormula}</dd>
                <dd className="text-muted-foreground mt-2 text-xs leading-relaxed">
                  {copy.oneOffHelp}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-card rounded-lg border">
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{copy.exampleTitle}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{copy.exampleIntro}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-sm font-medium">
                Dijon <ArrowRight className="size-4" aria-hidden /> Lyon
              </div>
            </div>
            <div className="px-4 py-2">
              {copy.exampleRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-baseline justify-between gap-4 border-b py-2.5 text-sm last:border-0"
                >
                  <span>{row.label}</span>
                  <span
                    className={`font-mono font-medium tabular-nums ${row.tone === "saving" ? "text-emerald-700 dark:text-emerald-400" : ""}`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
            <div className="bg-muted/40 flex items-baseline justify-between gap-4 border-t px-4 py-3">
              <span className="text-sm font-semibold">{copy.exampleTotal}</span>
              <span className="font-heading text-lg font-semibold tabular-nums">+395 €/mois</span>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="monthly-variables" className="py-9">
        <div className="max-w-3xl">
          <p className="text-primary text-xs font-semibold uppercase">{copy.includedEyebrow}</p>
          <h2 id="monthly-variables" className="font-heading mt-2 text-xl font-semibold">
            {copy.includedTitle}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{copy.includedIntro}</p>
        </div>

        <div className="mt-6 grid gap-x-8 gap-y-7 md:grid-cols-2 lg:grid-cols-3">
          {copy.monthlyGroups.map((group, index) => {
            const Icon = GROUP_ICONS[index] ?? ReceiptText;
            return (
              <section key={group.title} className="border-t pt-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="text-primary size-4" aria-hidden />
                  {group.title}
                </h3>
                <ItemList items={group.items} />
              </section>
            );
          })}
        </div>
      </section>

      <section
        aria-labelledby="baseline-variables"
        className="bg-muted/35 -mx-4 px-4 py-9 sm:rounded-lg sm:px-6"
      >
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <div className="bg-background flex size-9 items-center justify-center rounded-md border">
              <CircleEqual className="size-5" aria-hidden />
            </div>
            <h2 id="baseline-variables" className="font-heading mt-4 text-xl font-semibold">
              {copy.baselineTitle}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {copy.baselineIntro}
            </p>
            <p className="mt-4 font-mono text-sm font-semibold">{copy.baselineFormula}</p>
          </div>
          <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
            {copy.baselineGroups.map((group) => (
              <section key={group.title} className="border-t pt-3">
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {group.items.join(" · ")}
                </p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="one-off-costs" className="py-9">
        <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr]">
          <div>
            <h2 id="one-off-costs" className="font-heading text-xl font-semibold">
              {copy.setupTitle}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{copy.setupIntro}</p>
          </div>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {copy.setupItems.map((item) => (
              <div key={item} className="flex gap-2 border-t py-3 text-sm">
                <ReceiptText className="text-chart-6 mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="split-categories" className="border-y py-9">
        <div className="max-w-3xl">
          <h2 id="split-categories" className="font-heading text-xl font-semibold">
            {copy.splitTitle}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{copy.splitIntro}</p>
        </div>
        <div className="mt-6 grid gap-x-8 md:grid-cols-2">
          {copy.splitRows.map((row) => (
            <div key={row.label} className="grid grid-cols-[7rem_1fr] gap-3 border-t py-3 text-sm">
              <p className="font-semibold">{row.label}</p>
              <p className="text-muted-foreground leading-relaxed">{row.rule}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="calculation-guards" className="py-9">
        <h2 id="calculation-guards" className="font-heading text-lg font-semibold">
          {copy.guardsTitle}
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {copy.guards.map((guard, index) => {
            const Icon = [CircleEqual, ShieldCheck, Car][index] ?? ShieldCheck;
            return (
              <div key={guard.title} className="border-primary border-l-2 pl-4">
                <Icon className="text-primary size-4" aria-hidden />
                <h3 className="mt-2 text-sm font-semibold">{guard.title}</h3>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{guard.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

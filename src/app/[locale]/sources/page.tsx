import { notFound } from "next/navigation";
import {
  ArrowUpRight,
  Database,
  GraduationCap,
  Home,
  MapPin,
  ShieldAlert,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { SOURCES } from "@/domain/scoring/constants";
import { PageShell } from "@/components/layout/page-shell";

/**
 * One card per dataset: what it is, at what level, from what year, and what it does
 * not tell you.
 *
 * That last part is why this page was rewritten. Its own intro promised "leurs
 * limites" while the list showed a name, a level and a vintage — so the page
 * advertised a caution it never gave. The limits are written out now, one line per
 * dataset, keyed by source code so that reordering the list cannot attach the wrong
 * caveat to the wrong source.
 */
const ICONS: Record<string, LucideIcon> = {
  insee_bpe: MapPin,
  dvf: Home,
  carte_loyers: Home,
  education_nationale: GraduationCap,
  apl: Stethoscope,
  delinquance: ShieldAlert,
};

export default async function SourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const s = dict.pages.sources;
  const sources = Object.values(SOURCES);
  const limits: Record<string, string | undefined> = s.limits;

  return (
    <PageShell title={s.title} intro={s.intro}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {sources.map((source) => {
          const Icon = ICONS[source.code] ?? Database;
          const limit = limits[source.code];
          return (
            <li
              key={source.code}
              /*
                The id a citation points at. The assistant was seen citing
                /fr/sources#carte_loyers in production while this page carried no ids at
                all — it had guessed the fragment from the source code, and the link
                landed at the top of the page. Guessing right is now enough.
              */
              id={source.code}
              className="flex scroll-mt-24 flex-col rounded-xl border p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <span className="bg-primary/10 text-primary flex size-8 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden />
                </span>
                <a
                  href={source.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={s.openInNewTab}
                  className="hover:text-primary touch:min-h-11 group min-w-0 flex-1 text-sm font-semibold transition-colors"
                >
                  {/*
                    The arrow trails the last word instead of being pushed to the
                    right edge: on a two-line title it was floating off in the
                    corner, detached from the words it belongs to.
                  */}
                  {source.label}
                  <ArrowUpRight
                    className="ml-1 inline size-3.5 shrink-0 align-[-0.1em] opacity-50 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </a>
              </div>

              {/* Level and vintage as labelled facts, not one run-on line. */}
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
                <div>
                  <dt className="text-muted-foreground font-mono text-[11px] uppercase">
                    {s.columns.level}
                  </dt>
                  <dd className="text-sm">{source.geographicLevel}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground font-mono text-[11px] uppercase">
                    {s.vintage}
                  </dt>
                  <dd className="tabular text-sm">{source.sourceVersion}</dd>
                </div>
              </dl>

              {limit ? (
                <div className="border-border/70 mt-auto border-t pt-3 [&:not(:first-child)]:mt-3">
                  <p className="text-muted-foreground font-mono text-[11px] uppercase">
                    {s.limitTitle}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{limit}</p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </PageShell>
  );
}

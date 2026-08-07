import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { CATALOG_SOURCES, countByAvailability } from "@/domain/catalog";
import type { Availability, CatalogSourceCode } from "@/domain/catalog";
import { PageShell } from "@/components/layout/page-shell";
import { AVAILABILITY_STYLE, Tag, VariablesTable } from "@/components/variables/variables-table";

/**
 * Every variable that decides what a household has left at the end of the month,
 * and where each one would come from.
 *
 * The page exists because the catalogue was living in a document nobody outside
 * the repository could read, while the product's whole claim is that its figures
 * have a provenance. A claim kept in a private file is not a claim.
 *
 * The counters at the top are the point of the page as much as the table is. They
 * say, in one line, how many quantities we can download, how many we can compute
 * from a published rule, how many somebody has to read off a town-hall website by
 * hand, and how many do not exist at all. The last number is the one competitors
 * do not print, and it is the reason to trust the others.
 */

const ORDER: Availability[] = [
  "open_data",
  "official_rule",
  "curated",
  "user_input",
  "third_party",
  "hypothesis",
  "unavailable",
];

export default async function VariablesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const copy = dict.pages.variables;
  const counts = countByAvailability();
  const total = ORDER.reduce((sum, key) => sum + counts[key], 0);

  return (
    <PageShell title={copy.title} intro={copy.intro} wide>
      <section aria-labelledby="counts" className="mb-8">
        <h2 id="counts" className="font-heading text-lg font-semibold">
          {copy.countsTitle}
        </h2>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm">{copy.countsIntro}</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ORDER.map((key) => (
            <li key={key} className="rounded-xl border p-3">
              <div className="flex items-baseline justify-between gap-2">
                <Tag className={AVAILABILITY_STYLE[key]}>{copy.availability[key].label}</Tag>
                <span className="font-heading text-lg font-semibold tabular-nums">
                  {counts[key]}
                </span>
              </div>
              <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
                {copy.availability[key].help}
              </p>
            </li>
          ))}
          <li className="bg-muted/30 rounded-xl border p-3">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium">{copy.tableTitle}</span>
              <span className="font-heading text-lg font-semibold tabular-nums">{total}</span>
            </div>
          </li>
        </ul>
      </section>

      <section aria-labelledby="donnees">
        <h2 id="donnees" className="font-heading text-lg font-semibold">
          {copy.tableTitle}
        </h2>
        <p className="text-muted-foreground mt-1 mb-4 max-w-3xl text-sm">{copy.tableIntro}</p>
        <VariablesTable copy={copy} locale={locale} />
      </section>

      <section aria-labelledby="sources" className="mt-10">
        <h2 id="sources" className="font-heading text-lg font-semibold">
          {copy.sourcesTitle}
        </h2>
        <p className="text-muted-foreground mt-1 mb-4 max-w-3xl text-sm">{copy.sourcesIntro}</p>
        <ul className="grid gap-4 md:grid-cols-2">
          {(Object.keys(CATALOG_SOURCES) as CatalogSourceCode[]).map((code) => {
            const source = CATALOG_SOURCES[code];
            return (
              <li
                key={code}
                /*
                  The anchor the table's source links point at. Same discipline as
                  the /sources page: the id is the source code, so a link written
                  by guessing the code lands on the right card.
                */
                id={`src-${code}`}
                className="flex scroll-mt-24 flex-col rounded-xl border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold">{source.label}</h3>
                    <p className="text-muted-foreground text-xs">{source.publisher}</p>
                  </div>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={copy.openInNewTab}
                      className="text-muted-foreground hover:text-primary shrink-0 transition-colors"
                    >
                      <ArrowUpRight className="size-4" aria-hidden />
                      <span className="sr-only">{copy.openInNewTab}</span>
                    </a>
                  ) : null}
                </div>

                <dl className="text-muted-foreground mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                  <dt className="font-medium">{copy.sourceVintage}</dt>
                  <dd>{source.vintage[locale]}</dd>
                  <dt className="font-medium">{copy.sourceRefresh}</dt>
                  <dd>{source.refresh[locale]}</dd>
                  <dt className="font-medium">{copy.sourceLevel}</dt>
                  <dd>{copy.geoLevel[source.geoLevel]}</dd>
                  <dt className="font-medium">{copy.sourceLicence}</dt>
                  <dd>{copy.licence[source.licence]}</dd>
                </dl>

                <p className="mt-3 border-t pt-3 text-xs leading-relaxed">
                  {source.caveat[locale]}
                </p>

                {source.url ? null : (
                  <p className="text-muted-foreground mt-2 text-xs italic">{copy.noSourceUrl}</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </PageShell>
  );
}

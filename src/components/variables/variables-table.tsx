import { Fragment } from "react";
import { CATALOG, catalogSource, relocationScope } from "@/domain/catalog";
import type { Availability, Mesure, Poste, RelocationScope } from "@/domain/catalog";
import type { Dictionary, Locale } from "@/lib/i18n";

/**
 * The catalogue as the reader asked for it: domain, item, quantity, source —
 * with the first, second and fourth columns spanning their rows so that the
 * hierarchy is visible rather than repeated.
 *
 * Two decisions worth keeping:
 *
 *  - The colour of a row's badge encodes availability, not importance. Green is
 *    "you can download this", red is "this does not exist anywhere". A reader
 *    scanning the table should be able to see the size of the gap without reading
 *    a word, because that gap is the argument.
 *  - The source cell links to an anchor further down the page rather than
 *    carrying the caveat inline. Caveats are long — they are the useful part —
 *    and inlining them would make the table unreadable, while dropping them would
 *    make it dishonest.
 */

type Copy = Dictionary["pages"]["variables"];

const AVAILABILITY_STYLE: Record<Availability, string> = {
  open_data: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  official_rule: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  curated: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  user_input: "bg-muted text-muted-foreground",
  third_party: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  hypothesis: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  unavailable: "bg-destructive/10 text-destructive",
};

const RELOCATION_STYLE: Record<RelocationScope, string> = {
  monthly: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  one_off: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  baseline: "bg-muted text-muted-foreground",
  mixed: "bg-cyan-500/10 text-cyan-800 dark:text-cyan-300",
  context: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
};

function Tag({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] leading-4 font-medium ${className}`}
    >
      {children}
    </span>
  );
}

function MesureCell({ mesure, copy, locale }: { mesure: Mesure; copy: Copy; locale: Locale }) {
  return (
    <>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="font-medium">{mesure.label[locale]}</span>
        <span className="text-muted-foreground text-xs">
          {mesure.unit} · {copy.stat[mesure.stat]}
        </span>
      </div>
      <div className="mt-1.5">
        <Tag className={AVAILABILITY_STYLE[mesure.availability]}>
          {copy.availability[mesure.availability].label}
        </Tag>
      </div>
      {mesure.note ? (
        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
          {mesure.note[locale]}
        </p>
      ) : null}
    </>
  );
}

function SourceCell({ poste, copy, locale }: { poste: Poste; copy: Copy; locale: Locale }) {
  return (
    <ul className="space-y-2">
      {poste.sources.map((code) => {
        const source = catalogSource(code);
        return (
          <li key={code} className="text-xs leading-relaxed">
            <a
              href={`#src-${code}`}
              className="hover:text-primary font-medium underline-offset-2 transition-colors hover:underline"
            >
              {source.label}
            </a>
            <span className="text-muted-foreground block">
              {source.publisher} · {source.vintage[locale]} · {copy.geoLevel[source.geoLevel]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function VariablesTable({ copy, locale }: { copy: Copy; locale: Locale }) {
  return (
    /*
      The table is wider than a phone and must stay so — squeezing four columns of
      prose into 360 px turns every cell into a single word per line. It scrolls
      inside its own box instead, which keeps the page itself from scrolling
      sideways.
    */
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-[62rem] border-collapse text-sm">
        <thead className="bg-muted/50">
          <tr className="text-left">
            <th scope="col" className="w-[15%] px-3 py-2.5 font-semibold">
              {copy.columns.domaine}
            </th>
            <th scope="col" className="w-[14%] px-3 py-2.5 font-semibold">
              {copy.columns.poste}
            </th>
            <th scope="col" className="w-[39%] px-3 py-2.5 font-semibold">
              {copy.columns.mesure}
            </th>
            <th scope="col" className="w-[32%] px-3 py-2.5 font-semibold">
              {copy.columns.source}
            </th>
          </tr>
        </thead>
        <tbody>
          {CATALOG.map((domaine) => {
            const domaineRows = domaine.postes.reduce((n, p) => n + p.mesures.length, 0);
            return (
              <Fragment key={domaine.key}>
                {domaine.postes.map((poste, posteIndex) => (
                  <Fragment key={poste.key}>
                    {poste.mesures.map((mesure, mesureIndex) => (
                      <tr key={mesure.key} className="border-t align-top [&>td]:px-3 [&>td]:py-2.5">
                        {posteIndex === 0 && mesureIndex === 0 ? (
                          <td
                            rowSpan={domaineRows}
                            id={`domaine-${domaine.key}`}
                            className="bg-muted/20 scroll-mt-24 border-r"
                          >
                            <div className="font-heading font-semibold">
                              {domaine.label[locale]}
                            </div>
                            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                              {domaine.summary[locale]}
                            </p>
                          </td>
                        ) : null}

                        {mesureIndex === 0 ? (
                          <td rowSpan={poste.mesures.length} className="border-r">
                            <div className="font-medium">{poste.label[locale]}</div>
                            <div className="text-muted-foreground mt-1.5 text-xs">
                              {copy.flow[poste.flow]} · {poste.tier}
                            </div>
                            <div className="mt-2">
                              <Tag className={RELOCATION_STYLE[relocationScope(poste)]}>
                                {copy.relocation.scope[relocationScope(poste)]}
                              </Tag>
                            </div>
                          </td>
                        ) : null}

                        <td className="border-r">
                          <MesureCell mesure={mesure} copy={copy} locale={locale} />
                        </td>

                        {mesureIndex === 0 ? (
                          <td rowSpan={poste.mesures.length}>
                            <SourceCell poste={poste} copy={copy} locale={locale} />
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export { AVAILABILITY_STYLE, Tag };

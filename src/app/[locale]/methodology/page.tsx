import { notFound } from "next/navigation";
import { slug } from "@/lib/slug";
import {
  Check,
  Gauge,
  Map as MapIcon,
  Scale,
  SlidersHorizontal,
  Split,
  X,
  type LucideIcon,
} from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { ENGINE_VERSION } from "@/domain/scoring";
import { PageShell } from "@/components/layout/page-shell";

/**
 * The methodology page, laid out so its shape carries some of the meaning.
 *
 * It was an undifferentiated stack of seven headings and seven paragraphs, which
 * made "what we calculate" and "what we do not" look like the same kind of
 * statement. They are the opposite of each other, and the pair is the most
 * important thing on the page — so they sit side by side, one ticked and one
 * crossed. The five rules that follow are a grid of cards.
 *
 * Icons are chosen by the section's key, not by its position, so reordering or
 * translating the list cannot silently pair a rule with the wrong symbol.
 */
const ICONS: Record<string, LucideIcon> = {
  geo_levels: MapIcon,
  reliability: Gauge,
  weighting: SlidersHorizontal,
  missing: Scale,
  no_mixing: Split,
};

export default async function MethodologyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const m = dict.pages.methodology;

  const find = (key: string) => m.sections.find((s) => s.key === key);
  const yes = find("computed");
  const no = find("not_computed");
  const rules = m.sections.filter((s) => s.key !== "computed" && s.key !== "not_computed");

  return (
    <PageShell title={m.title} intro={m.intro}>
      {/* The promise and its limit, as one comparison rather than two paragraphs. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {yes ? (
          <section
            id={slug(yes.title)}
            className="border-confidence-high/30 bg-confidence-high/5 scroll-mt-24 rounded-xl border p-4 sm:p-5"
          >
            <h2 className="flex items-start gap-2 text-sm font-semibold">
              <Check className="text-confidence-high mt-0.5 size-4 shrink-0" aria-hidden />
              {yes.title}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{yes.body}</p>
          </section>
        ) : null}
        {no ? (
          <section
            id={slug(no.title)}
            className="border-confidence-low/30 bg-confidence-low/5 scroll-mt-24 rounded-xl border p-4 sm:p-5"
          >
            <h2 className="flex items-start gap-2 text-sm font-semibold">
              <X className="text-confidence-low mt-0.5 size-4 shrink-0" aria-hidden />
              {no.title}
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{no.body}</p>
          </section>
        ) : null}
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {rules.map((section, index) => {
          const Icon = ICONS[section.key];
          /*
            Five cards in two columns leaves the last one alone beside a hole. The
            odd one out spans the row instead — which suits it, since "do not mix
            the indicators" is the caution a reader should leave with.
          */
          const spans = index === rules.length - 1 && rules.length % 2 === 1;
          return (
            <section
              key={section.key}
              /*
                The id the retrieval index cites. `scroll-mt` keeps the heading clear of
                the sticky header, without which the link lands with the title hidden
                behind it — arriving at the wrong place looks the same as not arriving.
              */
              id={slug(section.title)}
              className={`scroll-mt-24 rounded-xl border p-4 sm:p-5 ${spans ? "sm:col-span-2" : ""}`}
            >
              <h2 className="flex items-start gap-2.5 text-sm font-semibold">
                {Icon ? (
                  <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-lg">
                    <Icon className="size-4" aria-hidden />
                  </span>
                ) : null}
                <span className="mt-1">{section.title}</span>
              </h2>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{section.body}</p>
            </section>
          );
        })}
      </div>

      <p className="text-muted-foreground bg-muted/50 mt-6 inline-flex items-center gap-2 rounded-lg px-3 py-2 font-mono text-xs">
        {m.engineVersion}
        <span className="text-foreground font-semibold">{ENGINE_VERSION}</span>
      </p>
    </PageShell>
  );
}

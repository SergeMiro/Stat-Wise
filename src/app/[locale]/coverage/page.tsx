import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getCityAreas, listCities } from "@/lib/mock/cities";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";

export default async function CoveragePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const c = dict.pages.coverage;

  const cities = listCities();
  const rich = cities.filter((x) => x.coverageLevel === "rich");
  const limited = cities.filter((x) => x.coverageLevel === "limited");

  return (
    <PageShell title={c.title} intro={c.intro}>
      <section className="mb-6">
        <h2 className="font-heading text-base font-semibold">{c.richTitle}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{c.richDesc}</p>
        <ul className="space-y-2">
          {rich.map((city) => (
            <li key={city.id} className="flex items-center justify-between rounded-lg border p-3">
              <span>
                <span className="font-medium">{city.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{city.department}</span>
              </span>
              <Badge variant="secondary" className="tabular">
                {getCityAreas(city.id).length} {dict.result.analysedArea}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-base font-semibold">{c.limitedTitle}</h2>
        <p className="mb-3 text-sm text-muted-foreground">{c.limitedDesc}</p>
        <ul className="space-y-2">
          {limited.map((city) => (
            <li key={city.id} className="flex items-center justify-between rounded-lg border border-dashed p-3">
              <span>
                <span className="font-medium">{city.name}</span>
                <span className="ml-2 text-xs text-muted-foreground">{city.department}</span>
              </span>
              <Badge variant="outline" className="text-confidence-low">
                {dict.confidence.low.label}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </PageShell>
  );
}

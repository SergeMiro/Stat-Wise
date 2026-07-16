import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getCityAreas, listCities } from "@/lib/mock/cities";
import { PageShell } from "@/components/layout/page-shell";
import { Badge } from "@/components/ui/badge";
import { StatWiseIllustration } from "@/components/visuals/statwise-illustration";

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
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <StatWiseIllustration
            src="/illustrations/coverage/france.svg"
            alt=""
            width={480}
            height={480}
            className="mx-auto max-w-[380px]"
          />
        </div>
        <div>
          <section className="mb-6">
            <h2 className="font-heading text-base font-semibold">{c.richTitle}</h2>
            <p className="text-muted-foreground mb-3 text-sm">{c.richDesc}</p>
            <ul className="space-y-2">
              {rich.map((city) => (
                <li
                  key={city.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <span>
                    <span className="font-medium">{city.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{city.department}</span>
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
            <p className="text-muted-foreground mb-3 text-sm">{c.limitedDesc}</p>
            <ul className="space-y-2">
              {limited.map((city) => (
                <li
                  key={city.id}
                  className="flex items-center justify-between rounded-lg border border-dashed p-3"
                >
                  <span>
                    <span className="font-medium">{city.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{city.department}</span>
                  </span>
                  <Badge variant="outline" className="text-confidence-low">
                    {dict.confidence.low.label}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PageShell>
  );
}

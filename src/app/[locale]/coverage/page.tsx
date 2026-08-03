import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { getCityAreas, listCities } from "@/lib/mock/cities";
import { PageShell } from "@/components/layout/page-shell";
import { CoverageCityList, type CoverageCity } from "@/components/coverage/coverage-city-list";
import { WhereWiseIllustration } from "@/components/visuals/wherewise-illustration";

export default async function CoveragePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const c = dict.pages.coverage;

  const cities = listCities();
  const rich = cities.filter((x) => x.coverageLevel === "rich");
  const limited = cities.filter((x) => x.coverageLevel === "limited");
  const richCoverage: CoverageCity[] = rich.map((city) => ({
    ...city,
    areas: getCityAreas(city.id).map(({ areaId, areaName }) => ({ areaId, areaName })),
  }));

  return (
    <PageShell title={c.title} intro={c.intro}>
      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="lg:sticky lg:top-24 lg:self-start">
          <WhereWiseIllustration
            src="/illustrations/coverage/france.svg"
            alt=""
            width={480}
            height={480}
            className="mx-auto max-w-[380px]"
          />
        </div>
        <div>
          <CoverageCityList
            richCities={richCoverage}
            limitedCities={limited}
            labels={{
              richTitle: c.richTitle,
              richDesc: c.richDesc,
              limitedTitle: c.limitedTitle,
              limitedDesc: c.limitedDesc,
              citySearchPlaceholder: c.citySearchPlaceholder,
              areaSearchPlaceholder: c.areaSearchPlaceholder,
              showMoreCities: c.showMoreCities,
              showFewerCities: c.showFewerCities,
              noCities: c.noCities,
              noAreas: c.noAreas,
              analysedArea: dict.result.analysedArea,
              limitedConfidence: dict.confidence.low.label,
            }}
          />
        </div>
      </div>
    </PageShell>
  );
}

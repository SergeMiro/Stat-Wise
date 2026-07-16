import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Baby, Compass, Database, ShieldCheck } from "lucide-react";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatWiseIllustration } from "@/components/visuals/statwise-illustration";

const stepImages = [
  "/illustrations/steps/01-profile.svg",
  "/illustrations/steps/02-analysis.svg",
  "/illustrations/steps/03-result.svg",
];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="grid items-center gap-10 py-10 sm:py-16 lg:grid-cols-[1fr_0.95fr]">
        <div className="max-w-2xl">
          <p className="bg-accent text-accent-foreground mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <ShieldCheck className="size-3.5" />
            {dict.brand.slogan}
          </p>
          <h1 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
            {dict.home.heroTitle}
          </h1>
          <p className="text-muted-foreground mt-4 max-w-xl text-base text-pretty">
            {dict.home.heroSubtitle}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button size="lg" render={<Link href={localePath(locale, "/app/quartier/new")} />}>
              <Compass />
              {dict.home.startQuartier}
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href={localePath(locale, "/app/family/new")} />}
            >
              <Baby />
              {dict.home.startFamily}
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[560px]">
          <StatWiseIllustration
            src="/illustrations/hero/result-preview.svg"
            alt=""
            width={720}
            height={520}
            priority
            className="drop-shadow-sm"
          />
        </div>
      </section>

      {/* Simulator cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        <SimulatorCard
          image="/illustrations/simulators/quartier.svg"
          icon={<Compass className="size-5" />}
          title={dict.home.quartierTitle}
          description={dict.home.quartierDesc}
          cta={dict.common.start}
          href={localePath(locale, "/app/quartier/new")}
        />
        <SimulatorCard
          image="/illustrations/simulators/family.svg"
          icon={<Baby className="size-5" />}
          title={dict.home.familyTitle}
          description={dict.home.familyDesc}
          cta={dict.common.start}
          href={localePath(locale, "/app/family/new")}
        />
      </section>

      {/* How it works */}
      <section className="py-12">
        <h2 className="font-heading mb-6 text-xl font-semibold tracking-tight">
          {dict.home.howTitle}
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {dict.home.steps.map((step, i) => (
            <li key={i} className="space-y-2">
              <StatWiseIllustration
                src={stepImages[i]}
                alt=""
                width={400}
                height={300}
                className="mb-3 max-w-[240px]"
              />
              <span className="bg-primary/10 text-primary tabular flex size-8 items-center justify-center rounded-full text-sm font-semibold">
                {i + 1}
              </span>
              <h3 className="font-heading text-base font-medium">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Data block */}
      <section className="bg-muted/30 mb-12 rounded-2xl border p-6">
        <div className="flex items-start gap-3">
          <span className="bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Database className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold">{dict.home.dataTitle}</h2>
            <p className="text-muted-foreground mt-1 text-sm">{dict.home.dataDesc}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link
                href={localePath(locale, "/methodology")}
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                {dict.home.seeMethodology}
                <ArrowRight className="size-3.5" />
              </Link>
              <Link
                href={localePath(locale, "/sources")}
                className="text-primary inline-flex items-center gap-1 hover:underline"
              >
                {dict.home.seeSources}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <p className="text-muted-foreground mb-10 text-xs">{dict.home.disclaimer}</p>
    </div>
  );
}

function SimulatorCard({
  image,
  icon,
  title,
  description,
  cta,
  href,
}: {
  image: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <Card className="group overflow-hidden transition-shadow hover:shadow-md">
      <div className="bg-muted/40 px-5 pt-5">
        <StatWiseIllustration
          src={image}
          alt=""
          width={640}
          height={400}
          className="transition-transform duration-300 group-hover:scale-[1.025]"
        />
      </div>
      <CardHeader>
        <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
          {icon}
        </span>
        <CardTitle className="mt-2 text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" size="sm" render={<Link href={href} />}>
          {cta}
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}

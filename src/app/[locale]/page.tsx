import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Baby, Compass, Database, ShieldCheck } from "lucide-react";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="py-10 sm:py-16">
        <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <ShieldCheck className="size-3.5" />
          {dict.brand.slogan}
        </p>
        <h1 className="max-w-2xl text-balance font-heading text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-4 max-w-xl text-pretty text-base text-muted-foreground">{dict.home.heroSubtitle}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button size="lg" render={<Link href={localePath(locale, "/app/quartier/new")} />}>
            <Compass />
            {dict.home.startQuartier}
          </Button>
          <Button size="lg" variant="outline" render={<Link href={localePath(locale, "/app/family/new")} />}>
            <Baby />
            {dict.home.startFamily}
          </Button>
        </div>
      </section>

      {/* Simulator cards */}
      <section className="grid gap-4 sm:grid-cols-2">
        <SimulatorCard
          icon={<Compass className="size-5" />}
          title={dict.home.quartierTitle}
          description={dict.home.quartierDesc}
          cta={dict.common.start}
          href={localePath(locale, "/app/quartier/new")}
        />
        <SimulatorCard
          icon={<Baby className="size-5" />}
          title={dict.home.familyTitle}
          description={dict.home.familyDesc}
          cta={dict.common.start}
          href={localePath(locale, "/app/family/new")}
        />
      </section>

      {/* How it works */}
      <section className="py-12">
        <h2 className="mb-6 font-heading text-xl font-semibold tracking-tight">{dict.home.howTitle}</h2>
        <ol className="grid gap-5 sm:grid-cols-3">
          {dict.home.steps.map((step, i) => (
            <li key={i} className="space-y-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary tabular">
                {i + 1}
              </span>
              <h3 className="font-heading text-base font-medium">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Data block */}
      <section className="mb-12 rounded-2xl border bg-muted/30 p-6">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Database className="size-5" />
          </span>
          <div>
            <h2 className="font-heading text-base font-semibold">{dict.home.dataTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{dict.home.dataDesc}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <Link href={localePath(locale, "/methodology")} className="inline-flex items-center gap-1 text-primary hover:underline">
                {dict.home.seeMethodology}
                <ArrowRight className="size-3.5" />
              </Link>
              <Link href={localePath(locale, "/sources")} className="inline-flex items-center gap-1 text-primary hover:underline">
                {dict.home.seeSources}
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <p className="mb-10 text-xs text-muted-foreground">{dict.home.disclaimer}</p>
    </div>
  );
}

function SimulatorCard({
  icon,
  title,
  description,
  cta,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  cta: string;
  href: string;
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">{icon}</span>
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

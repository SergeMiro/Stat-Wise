import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Baby, Compass } from "lucide-react";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AppHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const simulators = [
    {
      icon: <Compass className="size-5" />,
      title: dict.home.quartierTitle,
      desc: dict.home.quartierDesc,
      href: localePath(locale, "/app/quartier/new"),
    },
    {
      icon: <Baby className="size-5" />,
      title: dict.home.familyTitle,
      desc: dict.home.familyDesc,
      href: localePath(locale, "/app/family/new"),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-heading text-2xl font-semibold tracking-tight">{dict.nav.simulate}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {simulators.map((sim) => (
          <Card key={sim.href} className="transition-shadow hover:shadow-md">
            <CardHeader>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {sim.icon}
              </span>
              <CardTitle className="mt-2 text-lg">{sim.title}</CardTitle>
              <CardDescription>{sim.desc}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" size="sm" render={<Link href={sim.href} />}>
                {dict.common.start}
                <ArrowRight />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

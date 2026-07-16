import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Baby, Compass } from "lucide-react";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatWiseIllustration } from "@/components/visuals/statwise-illustration";

export default async function AppHubPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  const simulators = [
    {
      image: "/illustrations/simulators/quartier.svg",
      icon: <Compass className="size-5" />,
      title: dict.home.quartierTitle,
      desc: dict.home.quartierDesc,
      href: localePath(locale, "/app/quartier/new"),
    },
    {
      image: "/illustrations/simulators/family.svg",
      icon: <Baby className="size-5" />,
      title: dict.home.familyTitle,
      desc: dict.home.familyDesc,
      href: localePath(locale, "/app/family/new"),
    },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-heading mb-6 text-2xl font-semibold tracking-tight">
        {dict.nav.simulate}
      </h1>
      <div className="grid gap-6 md:grid-cols-2">
        {simulators.map((sim) => (
          <Card key={sim.href} className="group overflow-hidden transition-shadow hover:shadow-md">
            <div className="bg-muted/40 px-5 pt-5">
              <StatWiseIllustration
                src={sim.image}
                alt=""
                width={640}
                height={400}
                className="transition-transform duration-300 group-hover:scale-[1.025]"
              />
            </div>
            <CardHeader>
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
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

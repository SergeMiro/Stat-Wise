import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { listCities } from "@/lib/mock/cities";
import { QuartierWizard } from "@/components/quartier/quartier-wizard";

export default async function QuartierNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return <QuartierWizard locale={locale} dict={dict} cities={listCities()} />;
}

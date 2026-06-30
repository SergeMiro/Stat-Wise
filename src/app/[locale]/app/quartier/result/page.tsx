import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { QuartierResult } from "@/components/quartier/quartier-result";

export default async function QuartierResultPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return <QuartierResult locale={locale} dict={dict} />;
}

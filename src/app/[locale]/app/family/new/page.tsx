import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function FamilyNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  return <ComingSoon title={dict.wizard.familyTitle} locale={locale} dict={dict} />;
}

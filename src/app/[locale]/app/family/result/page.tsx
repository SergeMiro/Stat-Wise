import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { FamilyResult } from "@/components/family/family-result";

export default async function FamilyResultPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return <FamilyResult locale={locale} dict={dict} />;
}

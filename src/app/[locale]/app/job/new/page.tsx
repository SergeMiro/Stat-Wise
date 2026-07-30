import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { JobWizard } from "@/components/job/job-wizard";

export default async function JobNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return <JobWizard locale={locale} dict={dict} />;
}

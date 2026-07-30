import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { JobResult } from "@/components/job/job-result";

export default async function JobResultPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return <JobResult locale={locale} dict={dict} />;
}

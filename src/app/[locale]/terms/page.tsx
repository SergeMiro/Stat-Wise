import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { PageShell } from "@/components/layout/page-shell";

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const t = dict.pages.terms;

  return (
    <PageShell title={t.title} intro={t.intro}>
      <p className="text-sm text-muted-foreground">{t.body}</p>
    </PageShell>
  );
}

import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { PageShell } from "@/components/layout/page-shell";

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const p = dict.pages.privacy;

  return (
    <PageShell title={p.title} intro={p.intro}>
      <div className="grid gap-4 sm:grid-cols-2">
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 font-heading text-base font-semibold">{p.collectedTitle}</h2>
          <ul className="space-y-2 text-sm">
            {p.collected.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 size-4 shrink-0 text-confidence-high" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border p-4">
          <h2 className="mb-3 font-heading text-base font-semibold">{p.notCollectedTitle}</h2>
          <ul className="space-y-2 text-sm">
            {p.notCollected.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <X className="mt-0.5 size-4 shrink-0 text-destructive" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </PageShell>
  );
}

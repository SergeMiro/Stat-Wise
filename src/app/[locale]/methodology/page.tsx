import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { ENGINE_VERSION } from "@/domain/scoring";
import { PageShell } from "@/components/layout/page-shell";

export default async function MethodologyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const m = dict.pages.methodology;

  return (
    <PageShell title={m.title} intro={m.intro}>
      <div className="space-y-6">
        {m.sections.map((section, i) => (
          <section key={i} className="space-y-1">
            <h2 className="font-heading text-base font-semibold">{section.title}</h2>
            <p className="text-sm text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
      <p className="mt-8 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground tabular">
        {m.engineVersion}: {ENGINE_VERSION}
      </p>
    </PageShell>
  );
}

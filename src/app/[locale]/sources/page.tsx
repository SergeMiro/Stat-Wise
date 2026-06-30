import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getDictionary, isLocale } from "@/lib/i18n";
import { SOURCES } from "@/domain/scoring/constants";
import { PageShell } from "@/components/layout/page-shell";

export default async function SourcesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  const sources = Object.values(SOURCES);

  return (
    <PageShell title={dict.pages.sources.title} intro={dict.pages.sources.intro}>
      <ul className="space-y-3">
        {sources.map((s) => (
          <li key={s.code} className="rounded-xl border p-4">
            <a
              href={s.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium hover:text-primary"
            >
              {s.label}
              <ExternalLink className="size-3.5 shrink-0" />
            </a>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span>
                {dict.pages.sources.columns.level}: {s.geographicLevel}
              </span>
              <span>{s.sourceVersion}</span>
            </div>
          </li>
        ))}
      </ul>
    </PageShell>
  );
}

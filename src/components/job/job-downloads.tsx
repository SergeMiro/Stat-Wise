"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, ImageDown } from "lucide-react";
import type { Comparison, Verdict } from "@/domain/reste-a-vivre";
import type { Dictionary, Locale } from "@/lib/i18n";
import { downloadPdf, downloadShareImage, downloadSpreadsheet } from "@/lib/job-export";
import { Button } from "@/components/ui/button";

/**
 * Three ways to take the result away.
 *
 * The heavy writers (jsPDF, SheetJS) are imported inside the handlers, so someone
 * who never clicks a button never downloads them — the result page is the one
 * page that must stay fast on a phone.
 */

type Kind = "image" | "pdf" | "xlsx";

export function JobDownloads({
  locale,
  dict,
  result,
  verdict,
}: {
  locale: Locale;
  dict: Dictionary;
  result: Comparison;
  verdict: Verdict;
}) {
  const [pending, setPending] = useState<Kind | null>(null);
  const [failed, setFailed] = useState(false);
  const r = dict.job.result;

  async function run(kind: Kind) {
    setPending(kind);
    setFailed(false);
    try {
      const context = { locale, dict, result, verdict };
      if (kind === "image") await downloadShareImage(context);
      else if (kind === "pdf") await downloadPdf(context);
      else await downloadSpreadsheet(context);
    } catch {
      // Canvas, blob URLs and dynamic imports can all fail — private mode, a
      // blocked download, an offline second visit. Say so instead of going quiet.
      setFailed(true);
    } finally {
      setPending(null);
    }
  }

  const items: Array<{ kind: Kind; label: string; icon: React.ReactNode }> = [
    { kind: "image", label: r.downloadImage, icon: <ImageDown /> },
    { kind: "pdf", label: r.downloadPdf, icon: <FileText /> },
    { kind: "xlsx", label: r.downloadXlsx, icon: <FileSpreadsheet /> },
  ];

  return (
    <section className="bg-muted/30 mb-5 rounded-2xl border p-5">
      <h2 className="font-heading text-base font-semibold">{r.downloadTitle}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{r.downloadDesc}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {items.map((item) => (
          <Button
            key={item.kind}
            variant="outline"
            className="justify-start"
            disabled={pending !== null}
            onClick={() => run(item.kind)}
          >
            {item.icon}
            {pending === item.kind ? r.downloadPending : item.label}
          </Button>
        ))}
      </div>

      <p aria-live="polite" className="text-confidence-low mt-2 text-xs">
        {failed ? r.downloadFailed : null}
      </p>
    </section>
  );
}

import type { DataConfidence } from "@/domain/types";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STYLES: Record<DataConfidence, string> = {
  high: "bg-confidence-high/12 text-confidence-high",
  medium: "bg-confidence-medium/18 text-confidence-medium",
  low: "bg-confidence-low/18 text-confidence-low",
  unavailable: "bg-confidence-unavailable/12 text-confidence-unavailable",
};

export function DataConfidenceBadge({
  confidence,
  dict,
}: {
  confidence: DataConfidence;
  dict: Dictionary;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        STYLES[confidence],
      )}
      title={dict.confidence[confidence].desc}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {dict.confidence[confidence].label}
    </span>
  );
}

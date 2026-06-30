"use client";

import type { PriorityLevel } from "@/domain/types";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LEVELS: PriorityLevel[] = [0, 1, 2, 3];

export function PrioritySelector({
  label,
  value,
  onChange,
  levelLabels,
}: {
  label: string;
  value: PriorityLevel;
  onChange: (next: PriorityLevel) => void;
  levelLabels: Dictionary["priorityLevels"];
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">{levelLabels[String(value) as "0" | "1" | "2" | "3"]}</span>
      </div>
      <div
        role="radiogroup"
        aria-label={label}
        className="grid grid-cols-4 gap-1 rounded-lg bg-muted p-1"
      >
        {LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={value === level}
            aria-label={levelLabels[String(level) as "0" | "1" | "2" | "3"]}
            onClick={() => onChange(level)}
            className={cn(
              "h-8 rounded-md text-xs font-medium transition-colors",
              value === level
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="flex items-center justify-center gap-0.5" aria-hidden>
              {Array.from({ length: level || 1 }).map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "size-1.5 rounded-full",
                    value === level ? "bg-primary" : "bg-muted-foreground/40",
                    level === 0 && "opacity-30",
                  )}
                />
              ))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type Choice<T extends string> = {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
};

export function ChoiceGroup<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  columns = 1,
}: {
  value: T | undefined;
  onChange: (next: T) => void;
  options: Array<Choice<T>>;
  ariaLabel: string;
  columns?: 1 | 2 | 3;
}) {
  const cols = columns === 3 ? "grid-cols-3" : columns === 2 ? "grid-cols-2" : "grid-cols-1";
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("grid gap-2", cols)}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
              selected
                ? "border-primary bg-accent/60 ring-1 ring-primary"
                : "border-border hover:bg-muted/60",
            )}
          >
            {opt.icon ? (
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", selected ? "bg-primary/12 text-primary" : "bg-muted text-muted-foreground")}>
                {opt.icon}
              </span>
            ) : null}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{opt.label}</span>
              {opt.description ? (
                <span className="block text-xs text-muted-foreground">{opt.description}</span>
              ) : null}
            </span>
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border",
                selected ? "border-primary bg-primary text-primary-foreground" : "border-border",
              )}
              aria-hidden
            >
              {selected ? <Check className="size-3.5" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

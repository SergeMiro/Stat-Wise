"use client";

import { Check, Lock, Plus, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import {
  SECTIONS,
  sectionState,
  toggleSection,
  type SectionId,
  type SectionState,
} from "@/lib/job-sections";
import type { JobDraft } from "@/lib/job-storage";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The list of sections, used twice: once before the simulation starts and again
 * from the header while it is running.
 *
 * One component for both, because a second list that drifted from the first would
 * be worse than no list at all. The colours mean something specific and are
 * computed from the draft, never from whether a screen was visited:
 *
 *   green   — there is content in it
 *   orange  — it is on, and still empty
 *   red     — it is off, and will be skipped
 */

const STATE_STYLE: Record<SectionState, { box: string; dot: string }> = {
  filled: {
    box: "border-confidence-high/50 bg-confidence-high/10",
    dot: "bg-confidence-high text-white",
  },
  pending: {
    box: "border-confidence-medium/50 bg-confidence-medium/10",
    dot: "bg-confidence-medium text-white",
  },
  disabled: {
    box: "border-confidence-low/40 bg-confidence-low/5 opacity-70",
    dot: "bg-confidence-low text-white",
  },
};

export function JobSectionPicker({
  dict,
  draft,
  onToggle,
  onConfirm,
  mode,
}: {
  dict: Dictionary;
  draft: JobDraft;
  onToggle: (next: SectionId[]) => void;
  onConfirm: () => void;
  /** `start` is the screen before the run; `edit` is the one opened from the header. */
  mode: "start" | "edit";
}) {
  const s = dict.job.sections;
  const names = s.names as Record<SectionId, string>;
  const descriptions = s.descriptions as Record<SectionId, string>;

  return (
    <div className="mx-auto max-w-xl px-4 py-5">
      <h1 className="font-heading text-xl font-semibold tracking-tight">
        {mode === "start" ? s.startTitle : s.editTitle}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        {mode === "start" ? s.reassurance : s.editDesc}
      </p>

      {mode === "edit" ? (
        <ul className="text-muted-foreground mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <li>
            <span className="bg-confidence-high mr-1.5 inline-block size-2 rounded-full" />
            {s.legendFilled}
          </li>
          <li>
            <span className="bg-confidence-medium mr-1.5 inline-block size-2 rounded-full" />
            {s.legendPending}
          </li>
          <li>
            <span className="bg-confidence-low mr-1.5 inline-block size-2 rounded-full" />
            {s.legendDisabled}
          </li>
        </ul>
      ) : null}

      <ul className="mt-5 space-y-2">
        {SECTIONS.map((section) => {
          const state = sectionState(section, draft.enabledSections, draft);
          const style = STATE_STYLE[state];
          const on = state !== "disabled";
          return (
            <li key={section.id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={section.required}
                onClick={() => onToggle(toggleSection(draft.enabledSections, section.id))}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                  style.box,
                  section.required ? "cursor-default" : "hover:brightness-[0.98]",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
                    style.dot,
                  )}
                  aria-hidden
                >
                  {section.required ? (
                    <Lock className="size-3" />
                  ) : on ? (
                    <Check className="size-3.5" />
                  ) : (
                    <X className="size-3.5" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{names[section.id]}</span>
                  <span className="text-muted-foreground block text-xs">
                    {descriptions[section.id]}
                  </span>
                  {section.required ? (
                    <span className="text-muted-foreground mt-1 block text-[11px] italic">
                      {s.requiredNote}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5">
        <Button size="lg" className="w-full" onClick={onConfirm}>
          {mode === "start" ? s.startCta : s.editCta}
        </Button>
      </div>
    </div>
  );
}

/** The header control that reopens the list mid-run. */
export function JobSectionButton({
  dict,
  onOpen,
  pending,
}: {
  dict: Dictionary;
  onOpen: () => void;
  /** How many enabled sections are still empty — shown so the button says something. */
  pending: number;
}) {
  return (
    <Button variant="outline" size="sm" onClick={onOpen}>
      <Plus />
      {dict.job.sections.headerButton}
      {pending > 0 ? (
        <span className="bg-confidence-medium ml-1.5 rounded-full px-1.5 text-[11px] text-white">
          {pending}
        </span>
      ) : null}
    </Button>
  );
}

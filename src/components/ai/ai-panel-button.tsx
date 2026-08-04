"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAiPanel } from "./ai-panel-provider";

/** The one way in, from the header. Reflects the panel's state for a screen reader. */
export function AiPanelButton({ label }: { label: string }) {
  const { open, toggle } = useAiPanel();
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={open}
      title={label}
      onClick={toggle}
    >
      <Sparkles />
    </Button>
  );
}

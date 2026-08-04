"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Rebuilds the retrieval index.
 *
 * Reports the count it wrote rather than a bare "done": the useful question after
 * re-indexing is not whether it ran but whether the number changed, which is how you
 * notice that a page's copy never made it into the corpus.
 */
export function AdminIndexButton({
  labels,
}: {
  labels: { run: string; running: string; done: string; failed: string };
}) {
  const [state, setState] = useState<"idle" | "running" | "done" | "failed">("idle");
  const [count, setCount] = useState<number | null>(null);

  async function run() {
    setState("running");
    const response = await fetch("/api/ai/reindex", { method: "POST" }).catch(() => null);
    if (!response || !response.ok) {
      setState("failed");
      return;
    }
    const body = (await response.json()) as { indexed?: number; total?: number };
    setCount(body.total ?? body.indexed ?? null);
    setState("done");
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button onClick={run} disabled={state === "running"} variant="outline">
        <RefreshCw className={state === "running" ? "animate-spin" : undefined} />
        {state === "running" ? labels.running : labels.run}
      </Button>
      {state === "done" ? (
        <span className="text-confidence-high text-sm">
          {labels.done}
          {count === null ? "" : ` · ${count}`}
        </span>
      ) : null}
      {state === "failed" ? (
        <span className="text-confidence-low text-sm" role="alert">
          {labels.failed}
        </span>
      ) : null}
    </div>
  );
}

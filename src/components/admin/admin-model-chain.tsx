"use client";

import { useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Gateway = { id: string; label: string; docs: string; ready: boolean };
type Slot = { gateway: string; model: string };

/**
 * The three models, in the order they will be tried.
 *
 * Three rows rather than an add/remove list: the order is the whole point, and a
 * fixed number of numbered slots makes "second choice" a position on screen instead
 * of something to infer from a list. Empty rows are dropped on save, so using one or
 * two is just leaving the rest blank.
 *
 * A gateway with no key is shown and disabled rather than hidden. Hiding it would make
 * "why is Kilo not there" a question with no answer on the page.
 */
export function AdminModelChain({
  gateways,
  initial,
  labels,
}: {
  gateways: Gateway[];
  initial: Slot[];
  labels: Record<
    | "slot"
    | "gateway"
    | "model"
    | "placeholder"
    | "save"
    | "saving"
    | "saved"
    | "failed"
    | "noKey"
    | "usingDefault",
    string
  >;
}) {
  const firstReady = gateways.find((g) => g.ready)?.id ?? gateways[0]?.id ?? "";
  const [slots, setSlots] = useState<Slot[]>(() =>
    [0, 1, 2].map((i) => initial[i] ?? { gateway: firstReady, model: "" }),
  );
  const [state, setState] = useState<"idle" | "saving" | "saved" | "failed">("idle");

  const update = (index: number, patch: Partial<Slot>) =>
    setSlots((current) => current.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  async function save() {
    setState("saving");
    // Blank rows are not a chain of three with holes; they are a shorter chain.
    const chain = slots.filter((s) => s.model.trim() !== "").map((s) => ({
      gateway: s.gateway,
      model: s.model.trim(),
    }));
    const response = await fetch("/api/ai/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chain }),
    }).catch(() => null);
    setState(response?.ok ? "saved" : "failed");
  }

  const empty = slots.every((s) => s.model.trim() === "");

  return (
    <div>
      <ol className="space-y-3">
        {slots.map((slot, index) => (
          <li key={index} className="rounded-xl border p-3 sm:p-4">
            <p className="text-muted-foreground font-mono text-[11px] uppercase">
              {labels.slot} {index + 1}
            </p>
            <div className="mt-2 grid gap-3 sm:grid-cols-[minmax(0,14rem)_1fr]">
              <label className="block">
                <span className="text-muted-foreground text-xs">{labels.gateway}</span>
                <select
                  value={slot.gateway}
                  onChange={(event) => update(index, { gateway: event.target.value })}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 touch:min-h-11 mt-1 h-9 w-full rounded-lg border bg-transparent px-2 text-sm outline-none focus-visible:ring-3"
                >
                  {gateways.map((gateway) => (
                    <option key={gateway.id} value={gateway.id} disabled={!gateway.ready}>
                      {gateway.label}
                      {gateway.ready ? "" : ` — ${labels.noKey}`}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-muted-foreground text-xs">{labels.model}</span>
                <Input
                  className="mt-1"
                  value={slot.model}
                  placeholder={labels.placeholder}
                  onChange={(event) => update(index, { model: event.target.value })}
                />
              </label>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={state === "saving"} variant="outline">
          <Save />
          {state === "saving" ? labels.saving : labels.save}
        </Button>
        {state === "saved" ? (
          <span className="text-confidence-high text-sm">{labels.saved}</span>
        ) : null}
        {state === "failed" ? (
          <span className="text-confidence-low text-sm" role="alert">
            {labels.failed}
          </span>
        ) : null}
        {empty ? (
          <span className="text-muted-foreground text-sm">{labels.usingDefault}</span>
        ) : null}
      </div>

      <ul className="text-muted-foreground mt-3 space-y-1 text-xs">
        {gateways.map((gateway) => (
          <li key={gateway.id}>
            <a
              href={gateway.docs}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground underline"
            >
              {gateway.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

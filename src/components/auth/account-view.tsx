"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, LogOut } from "lucide-react";
import { formatCurrency, formatSignedCurrency } from "@/lib/formatting";
import { fill, localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { clearPending, readPending, type PendingSimulation } from "@/lib/pending-simulation";
import { useHydratedState } from "@/lib/use-hydrated-state";
import { createSupabaseBrowserClient } from "@/server/supabase/client";
import { Button } from "@/components/ui/button";

export type SavedSimulation = {
  id: string;
  created_at: string;
  summary: {
    currentCity: string;
    targetCity: string;
    targetDistrict: string;
    deltaResteAVivre: number;
    targetResteAVivre: number;
  };
};

/**
 * The account, and the first thing it does on arrival: finish the save that the
 * confirmation email interrupted.
 *
 * Someone presses "keep this result", goes to their inbox, clicks a link and lands
 * here. Between those two moments there was no session, so nothing could be
 * written. The run waited in local storage; this is where it gets picked up. If it
 * fails, it stays put rather than being dropped — a retry costs nothing, a silent
 * loss costs the promise we just made.
 */
export function AccountView({
  locale,
  dict,
  email,
  firstName,
  saved,
}: {
  locale: Locale;
  dict: Dictionary;
  email: string;
  firstName: string | null;
  saved: SavedSimulation[];
}) {
  const t = dict.auth.account;
  const router = useRouter();
  /*
    Read through the project's hydration hook rather than in an effect: local
    storage does not exist during SSR, and this is the one pattern the codebase
    already uses for that. The fetch below then only ever sets state from a
    callback, never synchronously while the effect runs.
  */
  const [pending, setPending] = useHydratedState<PendingSimulation | null>(null, readPending);
  const [flushed, setFlushed] = useState(false);
  const flushing = pending !== null && !flushed;

  useEffect(() => {
    if (pending === null || flushed) return;
    let cancelled = false;
    fetch("/api/simulations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pending),
    })
      .then((response) => {
        if (cancelled || !response.ok) return;
        clearPending();
        setFlushed(true);
        setPending(null);
        router.refresh();
      })
      .catch(() => {
        // Left in storage on purpose: the next visit tries again.
      });
    return () => {
      cancelled = true;
    };
  }, [pending, flushed, router, setPending]);

  async function signOut() {
    await createSupabaseBrowserClient().auth.signOut();
    router.push(localePath(locale, "/"));
    router.refresh();
  }

  async function remove(id: string) {
    const response = await fetch(`/api/simulations?id=${id}`, { method: "DELETE" });
    if (response.ok) router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {firstName ? fill(t.helloNamed, { name: firstName }) : t.hello}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{email}</p>
        </div>
        <Button variant="ghost" onClick={signOut}>
          <LogOut />
          {t.signOut}
        </Button>
      </div>

      <h2 className="font-heading mt-8 text-base font-semibold">{t.savedTitle}</h2>

      {flushing ? <p className="text-muted-foreground mt-2 text-sm">{t.flushing}</p> : null}

      {saved.length === 0 && !flushing ? (
        <div className="bg-card mt-3 rounded-2xl border p-6 text-center">
          <p className="text-muted-foreground text-sm">{t.empty}</p>
          <Button
            className="mt-4"
            onClick={() => router.push(localePath(locale, "/app/job/new"))}
          >
            {t.runOne}
          </Button>
        </div>
      ) : (
        <ul className="mt-3 space-y-3">
          {saved.map((simulation) => (
            <li key={simulation.id} className="bg-card rounded-2xl border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {simulation.summary.currentCity} → {simulation.summary.targetCity} ·{" "}
                    {simulation.summary.targetDistrict}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {fill(t.line, {
                      delta: formatSignedCurrency(locale, simulation.summary.deltaResteAVivre),
                      left: formatCurrency(locale, simulation.summary.targetResteAVivre),
                    })}
                  </p>
                  <p className="text-muted-foreground mt-1 text-[11px]">
                    {new Date(simulation.created_at).toLocaleDateString(
                      locale === "fr" ? "fr-FR" : "en-GB",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={t.remove}
                  onClick={() => remove(simulation.id)}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-muted-foreground mt-8 text-xs">{t.dataNote}</p>
    </div>
  );
}

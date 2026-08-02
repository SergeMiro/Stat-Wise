"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Check } from "lucide-react";
import type { Comparison, CompareInput } from "@/domain/reste-a-vivre";
import { JOB_DATASET_VERSION, JOB_ENGINE_VERSION } from "@/domain/reste-a-vivre";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { savePending, type PendingSimulation } from "@/lib/pending-simulation";
import { createSupabaseBrowserClient } from "@/server/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * The offer to keep this result, made at the only moment it is obviously worth
 * something: when the reader is looking at their own numbers.
 *
 * A visitor who is already signed in saves in one click. One who is not has the
 * run put aside first, so that after the round trip through their inbox they come
 * back to the thing they were promised rather than to an empty account.
 */
export function JobSaveCta({
  locale,
  dict,
  input,
  result,
}: {
  locale: Locale;
  dict: Dictionary;
  input: CompareInput;
  result: Comparison;
}) {
  const t = dict.auth.save;
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    let cancelled = false;
    let client: ReturnType<typeof createSupabaseBrowserClient>;
    try {
      client = createSupabaseBrowserClient();
    } catch {
      return;
    }
    client.auth
      .getUser()
      .then(({ data }) => {
        if (!cancelled) setSignedIn(Boolean(data.user));
      })
      .catch(() => {
        // No Supabase configured in this environment — `createSupabaseBrowserClient`
        // throws on the missing keys. Offer nothing rather than a button that
        // cannot work.
        if (!cancelled) setSignedIn(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pending: PendingSimulation = {
    kind: "job",
    input,
    summary: {
      currentCity: result.current.cityName,
      targetCity: result.target.cityName,
      targetDistrict: result.target.districtName,
      deltaResteAVivre: result.deltaResteAVivre,
      currentResteAVivre: result.current.resteAVivre,
      targetResteAVivre: result.target.resteAVivre,
    },
    engineVersion: JOB_ENGINE_VERSION,
    datasetVersion: JOB_DATASET_VERSION,
  };

  async function saveNow() {
    setState("saving");
    const response = await fetch("/api/simulations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pending),
    }).catch(() => null);

    if (!response || !response.ok) {
      setState("error");
      return;
    }
    setState("saved");
  }

  function createAccount() {
    savePending(pending);
    const next = localePath(locale, "/app/account");
    router.push(`${localePath(locale, "/sign-in")}?next=${encodeURIComponent(next)}`);
  }

  if (signedIn === null) return null;

  if (state === "saved") {
    return (
      <section className="bg-card mb-5 rounded-2xl border p-5">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Check className="text-confidence-high size-4" aria-hidden />
          {t.savedTitle}
        </p>
        <Button
          variant="ghost"
          className="mt-2 px-0"
          onClick={() => router.push(localePath(locale, "/app/account"))}
        >
          {t.seeSaved}
        </Button>
      </section>
    );
  }

  return (
    <section className="bg-card mb-5 rounded-2xl border p-5">
      <h2 className="font-heading text-base font-semibold">{t.title}</h2>
      <p className="text-muted-foreground mt-1 text-sm">{signedIn ? t.bodySignedIn : t.body}</p>

      {signedIn ? null : (
        <ul className="text-muted-foreground mt-3 space-y-1 text-xs">
          {dict.auth.benefits.map((benefit) => (
            <li key={benefit} className="flex gap-2">
              <span aria-hidden>·</span>
              {benefit}
            </li>
          ))}
        </ul>
      )}

      <Button
        className="mt-4 w-full sm:w-auto"
        size="lg"
        onClick={signedIn ? saveNow : createAccount}
        disabled={state === "saving"}
      >
        <BookmarkPlus />
        {signedIn ? (state === "saving" ? t.saving : t.saveNow) : t.createAccount}
      </Button>

      {state === "error" ? (
        <p className="text-confidence-low mt-2 text-sm" role="alert">
          {t.error}
        </p>
      ) : null}
    </section>
  );
}

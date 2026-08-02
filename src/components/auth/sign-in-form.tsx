"use client";

import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/server/supabase/client";
import { localePath, type Dictionary, type Locale } from "@/lib/i18n";
import { loadJobDraft } from "@/lib/job-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * One screen for signing in and signing up, because to the visitor they are the
 * same act: type your address, click the button in the email.
 *
 * There is no password. The email link both proves the address and opens the
 * session, which is the flow the product needs anyway — an unconfirmed account is
 * worth nothing — and it means we never store a credential we could leak.
 *
 * The name and the home city are asked here rather than in the simulator. Nothing
 * in the calculation needs them, and the simulator promises two minutes without
 * documents; the moment to ask for a name is when someone wants their results
 * kept, not before.
 */
export function SignInForm({
  locale,
  dict,
  next,
  googleEnabled,
}: {
  locale: Locale;
  dict: Dictionary;
  next?: string;
  googleEnabled: boolean;
}) {
  const t = dict.auth;
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const redirectTo = () => {
    const target = next ?? localePath(locale, "/app/account");
    return `${window.location.origin}/auth/callback?next=${encodeURIComponent(target)}`;
  };

  async function sendLink(event: React.FormEvent) {
    event.preventDefault();
    setState("sending");
    setMessage("");

    const supabase = createSupabaseBrowserClient();
    /*
      The home city comes from the simulation the visitor has just run, which is
      the one piece of profile data they have already given us. Asking for it a
      second time would be asking them to repeat themselves.
    */
    const draft = loadJobDraft();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: redirectTo(),
        data: {
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          home_city_id: draft?.currentCityId ?? null,
          locale,
        },
      },
    });

    if (error) {
      setState("error");
      // Rate limiting is the failure people actually hit, so it gets its own words.
      setMessage(error.status === 429 ? t.errorTooMany : t.errorGeneric);
      return;
    }
    setState("sent");
  }

  async function withGoogle() {
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) {
      setState("error");
      setMessage(t.errorGeneric);
    }
  }

  if (state === "sent") {
    return (
      <div className="bg-card rounded-2xl border p-5 text-center">
        <CheckCircle2 className="text-confidence-high mx-auto size-10" aria-hidden />
        <h2 className="font-heading mt-3 text-lg font-semibold">{t.sentTitle}</h2>
        <p className="text-muted-foreground mt-2 text-sm">{t.sentBody.replace("{email}", email)}</p>
        <p className="text-muted-foreground mt-4 text-xs">{t.sentHint}</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border p-5">
      {googleEnabled ? (
        <>
          <Button variant="outline" className="w-full" onClick={withGoogle} type="button">
            {t.withGoogle}
          </Button>
          <div className="text-muted-foreground my-5 flex items-center gap-3 text-xs">
            <span className="bg-border h-px flex-1" />
            {t.or}
            <span className="bg-border h-px flex-1" />
          </div>
        </>
      ) : null}

      <form onSubmit={sendLink} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first-name">{t.firstName}</Label>
            <Input
              id="first-name"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last-name">{t.lastName}</Label>
            <Input
              id="last-name"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">{t.email}</Label>
          <Input
            id="email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={state === "sending"}>
          <Mail />
          {state === "sending" ? t.sending : t.sendLink}
          <ArrowRight />
        </Button>

        {state === "error" ? (
          <p className="text-confidence-low text-sm" role="alert">
            {message}
          </p>
        ) : null}

        <p className="text-muted-foreground text-xs">{t.consent}</p>
      </form>
    </div>
  );
}

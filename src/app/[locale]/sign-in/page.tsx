import { notFound, redirect } from "next/navigation";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";
import { SignInForm } from "@/components/auth/sign-in-form";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next, error } = await searchParams;
  const dict = getDictionary(locale);
  const t = dict.auth;

  // Nowhere to create an account against: say so rather than fail.
  if (!isSupabaseConfigured()) {
    return <ComingSoon title={dict.nav.signIn} locale={locale} dict={dict} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Already signed in: this page has nothing to offer.
  if (user) redirect(localePath(locale, "/app/account"));

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-8 sm:py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
        {t.title}
      </h1>
      <p className="text-muted-foreground mt-2 text-sm">{t.subtitle}</p>

      <ul className="text-muted-foreground mt-4 space-y-1.5 text-sm">
        {t.benefits.map((benefit) => (
          <li key={benefit} className="flex gap-2">
            <span aria-hidden>·</span>
            {benefit}
          </li>
        ))}
      </ul>

      {error ? (
        <p className="text-confidence-low mt-4 text-sm" role="alert">
          {error === "link_expired" ? t.errorExpired : t.errorGeneric}
        </p>
      ) : null}

      <div className="mt-6">
        <SignInForm
          locale={locale}
          dict={dict}
          next={next}
          /*
            The Google button only exists once the provider is configured, both in
            Google Cloud and in Supabase. Rendering it before then would offer a
            door that opens onto an error page.
          */
          googleEnabled={process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN === "1"}
        />
      </div>
    </div>
  );
}

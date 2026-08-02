import { notFound, redirect } from "next/navigation";
import { getDictionary, isLocale, localePath } from "@/lib/i18n";
import { createSupabaseServerClient } from "@/server/supabase/server";
import { isSupabaseConfigured } from "@/server/supabase/env";
import { ComingSoon } from "@/components/layout/coming-soon";
import { AccountView, type SavedSimulation } from "@/components/auth/account-view";

export default async function AccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  if (!isSupabaseConfigured()) {
    return <ComingSoon title={dict.nav.account} locale={locale} dict={dict} />;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = encodeURIComponent(localePath(locale, "/app/account"));
    redirect(`${localePath(locale, "/sign-in")}?next=${next}`);
  }

  // Both reads are scoped by row-level policies to this user; the session cookie
  // is the only thing that decides whose rows come back.
  const [{ data: profile }, { data: simulations }] = await Promise.all([
    supabase.from("profiles").select("first_name").eq("id", user.id).maybeSingle(),
    supabase
      .from("simulations")
      .select("id, created_at, summary")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <AccountView
      locale={locale}
      dict={dict}
      email={user.email ?? ""}
      firstName={profile?.first_name ?? null}
      saved={(simulations ?? []) as SavedSimulation[]}
    />
  );
}

import { notFound } from "next/navigation";
import { getDictionary, isLocale } from "@/lib/i18n";
import { ComingSoon } from "@/components/layout/coming-soon";

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);
  return <ComingSoon title={dict.nav.signIn} locale={locale} dict={dict} />;
}

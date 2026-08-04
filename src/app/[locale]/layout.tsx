import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";

import { getDictionary, isLocale, locales } from "@/lib/i18n";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { MobileBottomNavigation } from "@/components/layout/mobile-bottom-navigation";
import { AiPanelProvider } from "@/components/ai/ai-panel-provider";
import { AiPanel } from "@/components/ai/ai-panel";
import { isAiConfigured } from "@/lib/ai/models";
import { visibleSkills } from "@/lib/ai/visible-skills";

/*
  Two faces, each for what it is good at.

  Headings use Bricolage Grotesque — a contemporary grotesque with enough character
  to look like a brand rather than a default, and a variable weight axis so a title
  can be heavy without a second file.

  Body text stays on Geist. This product is mostly numbers: rents, euros, kWh,
  distances, all in columns that have to line up. Geist's figures are even-width,
  and swapping it for a display face would cost legibility in the one place the
  reader is actually working.

  `latin-ext` on both, or French accents fall back to a different font mid-word.
*/
const heading = Bricolage_Grotesque({
  variable: "--font-heading-family",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});
const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});
const geistMono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getDictionary(isLocale(locale) ? locale : "fr");
  return {
    title: { default: `${dict.brand.name} — ${dict.brand.slogan}`, template: `%s · ${dict.brand.name}` },
    description: dict.home.heroSubtitle,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} ${heading.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <TooltipProvider>
          {/*
            The provider wraps everything because the header button, the keyboard
            shortcut and the panel all share one open state, and because the page's
            right padding is driven from it.
          */}
          <AiPanelProvider>
            <SiteHeader locale={locale} dict={dict} />
            <main className="flex-1 pb-20 md:pb-0">{children}</main>
            <SiteFooter locale={locale} dict={dict} />
            <MobileBottomNavigation locale={locale} labels={dict.nav} />
            <AiPanel
              locale={locale}
              dict={dict}
              configured={isAiConfigured()}
              /* Resolved on the server: the client is not the authority on its role. */
              skills={await visibleSkills()}
            />
          </AiPanelProvider>
        </TooltipProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

import type { Locale } from "@/lib/i18n";

const INTL_LOCALE: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

/** 1 250 € (fr) / €1,250 (en) — no decimals for budgets. */
export function formatCurrency(locale: Locale, amount: number): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

/** 3,2 km (fr) / 3.2 km (en). */
export function formatDistanceKm(locale: Locale, km: number): string {
  const n = new Intl.NumberFormat(INTL_LOCALE[locale], {
    maximumFractionDigits: 1,
  }).format(km);
  return `${n} km`;
}

export function formatNumber(locale: Locale, n: number): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale]).format(n);
}

export function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

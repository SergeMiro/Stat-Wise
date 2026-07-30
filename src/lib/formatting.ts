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

/**
 * A number with an exact number of decimals — 14,20 (fr) / 14.20 (en).
 *
 * Used inside explanation sentences, where the precision carries meaning: an
 * electricity tariff of 0,2016 €/kWh rounded to two decimals would stop being
 * the tariff it claims to be.
 */
export function formatDecimal(locale: Locale, n: number, digits: number): string {
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
}

/** A signed amount: +120 € / −85 €. Uses the real minus sign, not a hyphen. */
export function formatSignedCurrency(locale: Locale, amount: number): string {
  const formatted = formatCurrency(locale, Math.abs(amount));
  if (amount === 0) return formatted;
  return `${amount > 0 ? "+" : "−"}${formatted}`;
}

export function formatDate(locale: Locale, iso: string): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}

/**
 * The acquisition map: every variable that takes money out of a household, the
 * exact quantities we need to measure it, and where those quantities come from.
 *
 * This is deliberately a *wider* document than `src/domain/reste-a-vivre/sources.ts`.
 * That registry answers "what does the engine read today"; this one answers "what
 * would it take to compute a life", including the rows nothing reads yet and the
 * rows nothing ever will, because the data does not exist. A catalogue that only
 * listed what already works would hide the part that decides what to build next.
 *
 * Two rules carried over from `docs/reste-a-vivre-variables.md`, both load-bearing:
 *
 *  1. A quantity that no source publishes is written down as absent, never as a
 *     plausible number. `availability` is what enforces that here.
 *  2. The statistic is part of the variable. "Prix au m²" is not a variable —
 *     "médiane du prix au m²" is one, "P25" is another, and a source that gives
 *     the first does not give the second. `stat` is what keeps those apart.
 *
 * Labels are bilingual inline rather than translation keys. The engine emits keys
 * because its sentences are prose that has to read naturally in two languages; a
 * catalogue row is a term, and roughly half of these terms are French
 * administrative proper nouns ("taxe foncière", "barème kilométrique") that stay
 * as they are in English anyway. Two hundred keys in the dictionaries would buy
 * nothing and would put the label a long way from the source it describes.
 */

import type { CatalogSourceCode } from "./sources";

/** A term written once in both languages, kept next to what it names. */
export type Text = { fr: string; en: string };

/**
 * Which statistic of a distribution the variable actually is.
 *
 * The distinction between `mean`, `median` and the quartiles is not pedantry: on
 * rents and property prices the mean is pulled by a handful of outliers, which is
 * why the project rule is median plus quartiles. `min` and `max` appear where a
 * reader expects them, and their notes say when they are real and when they are a
 * single freak transaction wearing the costume of a statistic.
 */
export type Stat =
  | "min"
  | "max"
  | "mean"
  | "median"
  | "p25"
  | "p75"
  | "count"
  /** A single published figure with no distribution behind it — a tariff, a rate. */
  | "value"
  /** A ratio between two situations, e.g. +7 % Île-de-France versus province. */
  | "coefficient"
  /** Computed from a published ruleset rather than observed. */
  | "rule";

/**
 * How obtainable the quantity is. This is about the *data*, not about a
 * particular calculation — the engine's `LineStatus` answers the second question
 * and the two must not be collapsed, because a variable can be `open_data` here
 * and still `unavailable` in a given simulation for want of a user input.
 */
export type Availability =
  /** Published, downloadable, redistributable. The good case. */
  | "open_data"
  /** A published barème or law. Exact, but someone has to keep it current. */
  | "official_rule"
  /** Exists officially but scattered — we maintain a table by hand, with a review date. */
  | "curated"
  /** Only the household knows it. Asked, never guessed. */
  | "user_input"
  /** Published by a named third party that is not a public authority. Attribution required. */
  | "third_party"
  /** No source at any granularity. Shown as an assumption the reader can change. */
  | "hypothesis"
  /** Nothing exists and no assumption is defensible. Shown as "non chiffré". */
  | "unavailable";

/** How urgently the row has to work. Mirrors the tiers in the variables document. */
export type Tier = "T1" | "T2" | "T3";

/** What the quantity does to the household's money. */
export type Flow =
  /** Money coming in. */
  | "revenu"
  /** Barely compressible, and largely decided by where you live. */
  | "contrainte"
  /** Compressible by choice; place moves it only a little. */
  | "pilotable"
  /** One-off. Shown apart, never smeared across the months. */
  | "ponctuel"
  /** Not money. Informs the decision without entering the total. */
  | "contexte";

/** One measurable quantity — a row of the third column. */
export type Mesure = {
  key: string;
  label: Text;
  /** "€/m²", "€/mois", "€/L", "%", "km"… written as the reader would see it. */
  unit: string;
  stat: Stat;
  availability: Availability;
  /** The one thing a reader must know before trusting this quantity. */
  note?: Text;
};

/** One expense or income item — a row group of the second column. */
export type Poste = {
  key: string;
  label: Text;
  flow: Flow;
  tier: Tier;
  mesures: Mesure[];
  /** Where the quantities come from — the fourth column, spanning the group. */
  sources: CatalogSourceCode[];
};

/** One area of life — the first column. */
export type Domaine = {
  key: string;
  label: Text;
  /** One line on why this area moves the result, shown under the domain name. */
  summary: Text;
  postes: Poste[];
};

import type { Poste } from "./types";

/** How a catalogue item participates in a move comparison. */
export type RelocationScope = "monthly" | "one_off" | "baseline" | "mixed" | "context";

/**
 * Classification is deliberately separate from `Flow`.
 *
 * `Flow` describes the household budget; this describes the comparison between
 * two places. A phone bill is a constrained expense, for example, but it is
 * normally a baseline with a relocation delta of zero. Mixed items are split in
 * the calculation: only their local component enters the delta.
 */
export const RELOCATION_SCOPE_BY_POSTE: Readonly<Record<string, RelocationScope>> = {
  salaire: "monthly",
  prestations: "monthly",
  avantages_employeur: "monthly",
  risque_emploi: "context",

  location_appartement: "monthly",
  location_maison: "monthly",
  achat: "mixed",
  charges_logement: "mixed",
  taxes_locales: "monthly",

  electricite: "monthly",
  chauffage: "monthly",
  eau: "monthly",
  telecom: "mixed",

  trajet_domicile_travail: "monthly",
  voiture: "mixed",
  transports_publics: "monthly",
  courses_et_actif: "monthly",
  peages_stationnement: "monthly",

  panier_reference: "baseline",
  ecart_geographique: "monthly",
  ecart_enseignes: "monthly",
  prix_releves: "monthly",
  acces_commerces: "context",

  garde_jeune_enfant: "monthly",
  scolarite: "monthly",
  sante: "mixed",

  bateau_taxe: "baseline",
  bateau_exploitation: "mixed",
  deux_roues: "mixed",
  piscine_annexes: "mixed",
  animaux: "mixed",
  sport_culture: "mixed",

  securite: "context",
  environnement: "context",
  temps: "context",
};

export function relocationScope(poste: Poste): RelocationScope {
  const scope = RELOCATION_SCOPE_BY_POSTE[poste.key];
  if (!scope) throw new Error(`Missing relocation scope for catalogue item: ${poste.key}`);
  return scope;
}

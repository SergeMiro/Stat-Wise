import type { Availability, Domaine, Mesure, Poste } from "./types";
import { revenus } from "./domains/revenus";
import { logement } from "./domains/logement";
import { energie } from "./domains/energie";
import { mobilite } from "./domains/mobilite";
import { alimentation } from "./domains/alimentation";
import { famille } from "./domains/famille";
import { possessions } from "./domains/possessions";
import { contexte } from "./domains/contexte";

export type { Availability, Domaine, Flow, Mesure, Poste, Stat, Text, Tier } from "./types";
export { CATALOG_SOURCES, catalogSource } from "./sources";
export type { CatalogSource, CatalogSourceCode, GeoLevel, Licence } from "./sources";

/**
 * The catalogue, in the order it should be read.
 *
 * Income first because it is the largest lever and the one that is exactly
 * computable; housing second because it is the largest measured gap; then the
 * items in descending order of what they actually move. Context sits last on
 * purpose — it belongs to the decision, not to the total.
 */
export const CATALOG: readonly Domaine[] = [
  revenus,
  logement,
  energie,
  mobilite,
  alimentation,
  famille,
  possessions,
  contexte,
];

export const allPostes = (): Poste[] => CATALOG.flatMap((domaine) => domaine.postes);

export const allMesures = (): Mesure[] => allPostes().flatMap((poste) => poste.mesures);

/**
 * How many quantities sit in each state of availability.
 *
 * This is the number that keeps the project honest, and it is shown on the page
 * rather than kept in a document: the count of rows we cannot compute is the
 * distance between what a life costs and what we can prove it costs. A catalogue
 * that only counted its successes would grow by adding easy rows.
 */
export const countByAvailability = (): Record<Availability, number> => {
  const counts: Record<Availability, number> = {
    open_data: 0,
    official_rule: 0,
    curated: 0,
    user_input: 0,
    third_party: 0,
    hypothesis: 0,
    unavailable: 0,
  };
  for (const mesure of allMesures()) counts[mesure.availability] += 1;
  return counts;
};

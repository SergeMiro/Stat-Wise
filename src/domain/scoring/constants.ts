import type { SourceRef } from "@/domain/types";

/** Bump whenever the scoring math changes so results stay reproducible. */
export const ENGINE_VERSION = "0.1.0";

/** Radius (km) within which a POI counts as "nearby" for hard constraints. */
export const NEARBY_RADIUS_KM = 1.2;

/**
 * Source catalogue used to annotate results. In production these are read from
 * reference.data_sources; mirrored here so the pure engine can attach citations
 * without a DB round-trip.
 */
export const SOURCES: Record<string, SourceRef> = {
  BPE: {
    code: "insee_bpe",
    label: "INSEE — Base permanente des équipements (BPE)",
    sourceUrl: "https://www.insee.fr/fr/metadonnees/source/serie/s1161",
    geographicLevel: "point / commune",
    sourceVersion: "BPE 2023",
  },
  DVF: {
    code: "dvf",
    label: "DVF — Demandes de valeurs foncières (agrégées)",
    sourceUrl: "https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres",
    geographicLevel: "agrégé IRIS / commune",
    sourceVersion: "DVF 2024-S1",
  },
  LOYERS: {
    code: "carte_loyers",
    label: "Carte des loyers — indicateurs de loyers d'annonce",
    sourceUrl:
      "https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025",
    geographicLevel: "commune",
    sourceVersion: "Loyers 2025",
  },
  EDUCATION: {
    code: "education_nationale",
    label: "Annuaire de l'Éducation nationale",
    sourceUrl:
      "https://data.education.gouv.fr/explore/assets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre/",
    geographicLevel: "point",
    sourceVersion: "Annuaire 2024",
  },
  APL: {
    code: "apl",
    label: "APL — Accessibilité potentielle localisée (médecins)",
    sourceUrl: "https://www.data.gouv.fr/datasets/laccessibilite-potentielle-localisee-apl",
    geographicLevel: "commune",
    sourceVersion: "APL 2023",
  },
  CRIME: {
    code: "delinquance",
    label: "Délinquance enregistrée (police et gendarmerie)",
    sourceUrl:
      "https://www.data.gouv.fr/datasets/bases-statistiques-communale-departementale-et-regionale-de-la-delinquance-enregistree-par-la-police-et-la-gendarmerie-nationales",
    geographicLevel: "commune / département",
    sourceVersion: "SSMSI 2023",
  },
};

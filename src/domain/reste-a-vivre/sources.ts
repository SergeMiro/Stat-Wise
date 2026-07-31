/**
 * Source registry for the reste-à-vivre engine.
 *
 * Every euro the simulator shows must point back to one of these entries, and
 * every entry must carry the vintage of the data — the period the figures
 * describe, not the day we downloaded them — plus the geographic level it is
 * actually measured at. The result page renders this verbatim in its data panel,
 * so a source with no vintage is a bug, not a cosmetic omission.
 *
 * Dataset names and publishers are official proper nouns and stay as they are in
 * both languages. Everything that is prose — the caveat, and the vintages and
 * refresh rates that are wording rather than a year — is a translation key, so
 * the honesty layer reads in English too.
 *
 * See `docs/reste-a-vivre-variables.md` for the full variable catalogue and
 * `docs/data-catalog.md` for the missing-data policy these codes rely on.
 */

export type GeoLevel =
  "national" | "region" | "departement" | "zone_emploi" | "commune" | "iris" | "point" | "user";

/** Either a literal (a year, a date) or a key into `dict.job.terms`. */
export type Translatable = string | { key: string };

export type DataSource = {
  /** Official dataset name, used in the fine print. */
  label: string;
  publisher: string;
  vintage: Translatable;
  refresh: Translatable;
  geoLevel: GeoLevel;
  url?: string;
  /** The one limitation a reader must know before trusting the figure. */
  caveat: { key: string };
};

const SOURCES = {
  carte_loyers: {
    label: "Carte des loyers — indicateurs de loyers d'annonce",
    publisher: "ANIL / CEREMA",
    vintage: "2025",
    refresh: { key: "annual" },
    geoLevel: "commune",
    url: "https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025",
    caveat: { key: "carte_loyers" },
  },
  insee_salaires: {
    label: "Base Tous salariés",
    publisher: "Insee",
    vintage: "2024",
    refresh: { key: "annual" },
    geoLevel: "zone_emploi",
    url: "https://www.insee.fr/fr/statistiques/8657156",
    caveat: { key: "insee_salaires" },
  },
  france_travail_offres: {
    label: "API Offres d'emploi",
    publisher: "France Travail",
    vintage: { key: "realtime_feed" },
    refresh: { key: "continuous" },
    geoLevel: "commune",
    url: "https://francetravail.io/data/api/offres-emploi",
    caveat: { key: "france_travail_offres" },
  },
  enedis_conso: {
    label: "Consommation annuelle résidentielle par adresse",
    publisher: "Enedis",
    vintage: "2024",
    refresh: { key: "annual" },
    // Published per address; we read the commune average the publisher computes.
    geoLevel: "commune",
    url: "https://opendata.enedis.fr/explore/dataset/consommation-annuelle-residentielle-par-adresse/",
    caveat: { key: "enedis_conso" },
  },
  tarif_electricite: {
    label: "Tarif de l'électricité (part variable et abonnement)",
    publisher: "CRE / fournisseurs",
    vintage: { key: "tariff_in_force" },
    refresh: { key: "biannual_revision" },
    geoLevel: "national",
    caveat: { key: "tarif_electricite" },
  },
  sispea_eau: {
    label: "Prix de l'eau et de l'assainissement",
    publisher: "SISPEA / Hub'Eau (OFB)",
    /*
      Not a typo and not stale bookkeeping: SISPEA's last published year through
      Hub'Eau is 2019, and most communes last filed in 2018. Claiming 2024 here
      would be the one lie this registry exists to prevent.
    */
    vintage: "2015–2019 selon la commune",
    refresh: { key: "annual" },
    geoLevel: "commune",
    url: "https://api.gouv.fr/les-api/api_hubeau_indic_EP_Asst",
    caveat: { key: "sispea_eau" },
  },
  prix_carburants: {
    label: "Prix des carburants — flux instantané",
    publisher: "Ministère de l'Économie",
    vintage: { key: "daily_reading" },
    refresh: { key: "every_10_min" },
    geoLevel: "point",
    url: "https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/",
    caveat: { key: "prix_carburants" },
  },
  bareme_kilometrique: {
    label: "Barème kilométrique",
    publisher: "DGFiP",
    vintage: { key: "scale_in_force" },
    refresh: { key: "annual" },
    geoLevel: "national",
    caveat: { key: "bareme_kilometrique" },
  },
  irve_bornes: {
    label: "Base nationale des infrastructures de recharge (IRVE)",
    publisher: "transport.data.gouv.fr / Etalab",
    vintage: { key: "consolidated_file" },
    refresh: { key: "continuous" },
    geoLevel: "point",
    url: "https://transport.data.gouv.fr/datasets/fichier-consolide-des-bornes-de-recharge-pour-vehicules-electriques",
    caveat: { key: "irve_bornes" },
  },
  gtfs_tarifs: {
    label: "Tarifs des réseaux de transport public",
    publisher: "Réseaux locaux / transport.data.gouv.fr",
    vintage: { key: "tariff_table_collected" },
    refresh: { key: "manual" },
    geoLevel: "commune",
    url: "https://transport.data.gouv.fr/",
    caveat: { key: "gtfs_tarifs" },
  },
  code_travail_transport: {
    label: "Prise en charge employeur de l'abonnement transport (50 %)",
    publisher: "Code du travail",
    vintage: { key: "rule_in_force" },
    refresh: { key: "legislative" },
    geoLevel: "national",
    caveat: { key: "code_travail_transport" },
  },
  bareme_psu_cnaf: {
    label: "Barème national des participations familiales (PSU)",
    publisher: "Cnaf",
    vintage: "2025",
    refresh: { key: "annual" },
    geoLevel: "national",
    caveat: { key: "bareme_psu_cnaf" },
  },
  insee_bpe: {
    label: "Base permanente des équipements",
    publisher: "Insee",
    vintage: "2024",
    refresh: { key: "annual" },
    geoLevel: "point",
    caveat: { key: "insee_bpe" },
  },
  ban_itineraire: {
    label: "Base Adresse Nationale et calcul d'itinéraire",
    publisher: "DINUM / IGN",
    vintage: { key: "current_reference" },
    refresh: { key: "continuous" },
    geoLevel: "point",
    url: "https://adresse.data.gouv.fr/",
    caveat: { key: "ban_itineraire" },
  },
  insee_ecsp: {
    label: "Enquête de comparaison spatiale des niveaux de prix",
    publisher: "Insee",
    vintage: "2022",
    refresh: { key: "every_5_6_years" },
    geoLevel: "region",
    url: "https://www.insee.fr/fr/statistiques/7649921",
    caveat: { key: "insee_ecsp" },
  },
  openfisca: {
    label: "Règles socio-fiscales (impôt sur le revenu, prestations)",
    publisher: "OpenFisca-France",
    vintage: { key: "legislation_2026" },
    refresh: { key: "on_legislative_change" },
    geoLevel: "national",
    url: "https://openfisca.org/",
    caveat: { key: "openfisca" },
  },
  convention_statwise: {
    label: "Convention de calcul StatWise",
    publisher: "StatWise",
    vintage: { key: "documented_in_docs" },
    refresh: { key: "on_method_revision" },
    geoLevel: "national",
    caveat: { key: "convention_statwise" },
  },
  saisie_utilisateur: {
    label: "Valeur saisie par vous",
    publisher: "StatWise",
    vintage: { key: "your_situation" },
    refresh: { key: "on_input" },
    geoLevel: "user",
    caveat: { key: "saisie_utilisateur" },
  },
} as const satisfies Record<string, DataSource>;

export type SourceCode = keyof typeof SOURCES;

/*
  Widened to `DataSource` on the way out: the literal object keeps `satisfies`
  honest about every entry, while consumers see one uniform shape instead of a
  union where the optional `url` disappears on the entries that lack it.
*/
export const DATA_SOURCES: Record<SourceCode, DataSource> = SOURCES;

export const sourceOf = (code: SourceCode): DataSource => DATA_SOURCES[code];

export const SOURCE_CODES = Object.keys(SOURCES) as SourceCode[];

/**
 * Date the seeded snapshot was assembled. Displayed next to every figure so a
 * stale deployment is visible rather than silently trusted.
 */
export const SNAPSHOT_DATE = "2026-07-31";

/** Deduplicated source codes behind a set of lines, in first-seen order. */
export const collectSources = (
  lineGroups: { sources: readonly SourceCode[] }[][],
): SourceCode[] => {
  const seen = new Set<SourceCode>();
  for (const group of lineGroups) {
    for (const line of group) {
      for (const code of line.sources) seen.add(code);
    }
  }
  return [...seen];
};

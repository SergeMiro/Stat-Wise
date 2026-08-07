import type { Text } from "./types";

/**
 * Where the numbers would come from.
 *
 * Broader than the engine's own registry in `src/domain/reste-a-vivre/sources.ts`,
 * and separate from it on purpose: that one is a promise ("every euro we show
 * points at one of these"), this one is a map ("here is what exists"). Merging
 * them would let a source that nothing reads look like a source something reads.
 * Codes are kept identical where the two overlap, so the day a row moves from the
 * map into the promise, it keeps its name.
 *
 * `url` is optional and is left out rather than guessed. A dataset landing page
 * that 404s reads as carelessness about exactly the thing this product sells, and
 * a source is still usable when the reader has to search the publisher's portal
 * for it.
 *
 * `licence` is here because it decides what we may redistribute. Most of these are
 * open licences; two are not, and those two can be cited and read but their
 * figures may not be republished as if they were ours.
 */

export type Licence =
  /** Licence Ouverte / Open Licence (Etalab) or equivalent — reusable with attribution. */
  | "open"
  /** Open Database Licence — reusable, share-alike. */
  | "odbl"
  /** Law or published barème. Not a dataset; the text itself is public. */
  | "public_rule"
  /** Copyrighted study by a named third party. Cite and link; do not republish figures. */
  | "restricted"
  /** Not published at all. Listed so the gap has a name. */
  | "none";

export type GeoLevel =
  | "national"
  | "region"
  | "departement"
  | "zone_emploi"
  | "commune"
  | "iris"
  | "point"
  | "user";

export type CatalogSource = {
  /** Official name of the dataset or ruleset. A proper noun; identical in both languages. */
  label: string;
  publisher: string;
  /** The period the data describes — not the day we downloaded it. */
  vintage: Text;
  /** How often a new edition appears. */
  refresh: Text;
  geoLevel: GeoLevel;
  licence: Licence;
  url?: string;
  /** The single limitation that would otherwise turn this source into a wrong number. */
  caveat: Text;
};

const SOURCES = {
  /* ---------------------------------------------------------------- Revenus */

  openfisca: {
    label: "OpenFisca-France",
    publisher: "Etalab / communauté OpenFisca",
    vintage: { fr: "législation en vigueur", en: "legislation in force" },
    refresh: { fr: "à chaque loi de finances", en: "with each budget act" },
    geoLevel: "national",
    licence: "open",
    url: "https://fr.openfisca.org/",
    caveat: {
      fr: "Calcule des règles, pas des statistiques : le résultat est exact pour un foyer décrit exactement.",
      en: "Computes rules, not statistics: the result is exact for a household described exactly.",
    },
  },
  insee_salaires: {
    label: "Base Tous salariés",
    publisher: "Insee",
    vintage: { fr: "2024", en: "2024" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "zone_emploi",
    licence: "open",
    url: "https://www.insee.fr/fr/statistiques/8657156",
    caveat: {
      fr: "Salaires en équivalent temps plein, pas les salaires affichés dans les offres.",
      en: "Full-time-equivalent pay, not the pay advertised in job offers.",
    },
  },
  france_travail_offres: {
    label: "API Offres d'emploi",
    publisher: "France Travail",
    vintage: { fr: "flux temps réel", en: "real-time feed" },
    refresh: { fr: "continue", en: "continuous" },
    geoLevel: "commune",
    licence: "open",
    url: "https://francetravail.io/data/api/offres-emploi",
    caveat: {
      fr: "Le salaire n'est renseigné que dans une partie des offres.",
      en: "Pay is stated in only some of the offers.",
    },
  },
  code_travail_transport: {
    label: "Code du travail — participation employeur aux abonnements de transport",
    publisher: "Légifrance",
    vintage: { fr: "en vigueur", en: "in force" },
    refresh: { fr: "sur modification législative", en: "on legislative change" },
    geoLevel: "national",
    licence: "public_rule",
    caveat: {
      fr: "Couvre l'abonnement domicile-travail, jamais le carburant ni les trajets privés.",
      en: "Covers the commute season ticket only — never fuel, never private journeys.",
    },
  },

  /* --------------------------------------------------------------- Logement */

  carte_loyers: {
    label: "Carte des loyers — indicateurs de loyers d'annonce",
    publisher: "ANIL / CEREMA",
    vintage: { fr: "2025", en: "2025" },
    refresh: { fr: "annuelle depuis 2022", en: "annual since 2022" },
    geoLevel: "commune",
    licence: "open",
    url: "https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025",
    caveat: {
      fr: "Loyer d'annonce charges comprises : c'est un prix demandé, pas un loyer payé, et les charges sont déjà dedans.",
      en: "Advertised rent including charges: an asking price, not a paid rent, and charges are already inside it.",
    },
  },
  dvf: {
    label: "Demandes de valeurs foncières (DVF)",
    publisher: "DGFiP",
    vintage: { fr: "fenêtre glissante de 5 ans", en: "rolling five-year window" },
    refresh: { fr: "deux publications par an", en: "published twice a year" },
    geoLevel: "iris",
    licence: "open",
    url: "https://www.data.gouv.fr/datasets/demandes-de-valeurs-foncieres/",
    caveat: {
      fr: "Ventes réelles, donc agrégats seulement : au-dessous d'une poignée de transactions une médiane ne veut plus rien dire, et les mutations à prix symbolique polluent les extrêmes.",
      en: "Real sales, so aggregates only: below a handful of transactions a median means nothing, and token-price transfers poison the extremes.",
    },
  },
  cerema_foncier: {
    label: "API et outils Données foncières",
    publisher: "CEREMA",
    vintage: { fr: "suit DVF", en: "follows DVF" },
    refresh: { fr: "deux fois par an", en: "twice a year" },
    geoLevel: "iris",
    licence: "open",
    url: "https://datafoncier.cerema.fr/",
    caveat: {
      fr: "Accès aux données enrichies soumis à convention selon le périmètre demandé.",
      en: "Access to the enriched data is subject to an agreement, depending on scope.",
    },
  },
  dgfip_rei: {
    label: "Fiscalité directe locale (REI) — taux de taxe foncière et de TEOM",
    publisher: "DGFiP",
    vintage: { fr: "millésimes 2021-2025", en: "2021-2025 editions" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "commune",
    licence: "open",
    caveat: {
      fr: "Donne le taux voté, pas l'impôt : il faut encore la valeur locative cadastrale du logement, que le dataset ne contient pas.",
      en: "Gives the voted rate, not the bill: the property's cadastral rental value is still needed, and the dataset does not carry it.",
    },
  },
  zones_tendues: {
    label: "Décret zones tendues et communes en encadrement des loyers",
    publisher: "Légifrance / ministère du Logement",
    vintage: { fr: "décrets en vigueur", en: "decrees in force" },
    refresh: { fr: "sur décret", en: "by decree" },
    geoLevel: "commune",
    licence: "public_rule",
    caveat: {
      fr: "La liste change par décret ; un encadrement peut aussi être suspendu par le juge.",
      en: "The list changes by decree, and a rent cap can also be suspended by a court.",
    },
  },
  loi_alur_honoraires: {
    label: "Plafonds d'honoraires de location (loi ALUR)",
    publisher: "Légifrance",
    vintage: { fr: "décret en vigueur", en: "decree in force" },
    refresh: { fr: "sur décret", en: "by decree" },
    geoLevel: "commune",
    licence: "public_rule",
    caveat: {
      fr: "Plafond par m², pas un tarif : l'agence peut demander moins.",
      en: "A ceiling per m², not a price: an agency may charge less.",
    },
  },
  anil_charges: {
    label: "Études sur les charges locatives et de copropriété",
    publisher: "ANIL / observatoires",
    vintage: { fr: "publications ponctuelles", en: "occasional publications" },
    refresh: { fr: "irrégulière", en: "irregular" },
    geoLevel: "national",
    licence: "restricted",
    caveat: {
      fr: "Moyennes nationales issues d'études : rien de géolocalisé, rien d'opposable à un immeuble donné.",
      en: "National averages from studies: nothing geolocated, nothing that holds for a given building.",
    },
  },

  /* ---------------------------------------------------------- Énergie & eau */

  enedis_conso: {
    label: "Consommation annuelle résidentielle par adresse",
    publisher: "Enedis",
    vintage: { fr: "2024", en: "2024" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "commune",
    licence: "open",
    url: "https://opendata.enedis.fr/explore/dataset/consommation-annuelle-residentielle-par-adresse/",
    caveat: {
      fr: "Agrégé pour préserver l'anonymat : rien n'est publié en dessous d'une dizaine de points de livraison actifs.",
      en: "Aggregated to preserve anonymity: nothing is published below about ten active delivery points.",
    },
  },
  enedis_thermosensibilite: {
    label: "Consommation et thermosensibilité à la maille IRIS",
    publisher: "Enedis",
    vintage: { fr: "2011-2024", en: "2011-2024" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "iris",
    licence: "open",
    url: "https://opendata.enedis.fr/",
    caveat: {
      fr: "Économétrie de quartier : dit combien le quartier consomme par degré, pas ce que coûtera un logement précis.",
      en: "Neighbourhood econometrics: says what the area consumes per degree, not what one dwelling will cost.",
    },
  },
  ademe_dpe: {
    label: "API DPE logements existants",
    publisher: "ADEME",
    vintage: { fr: "depuis juillet 2021", en: "since July 2021" },
    refresh: { fr: "mensuelle", en: "monthly" },
    geoLevel: "point",
    licence: "open",
    url: "https://data.ademe.fr/datasets/dpe03existant",
    caveat: {
      fr: "Le « coût annuel 5 usages » est une estimation conventionnelle, pas une facture constatée.",
      en: "The “annual cost, five uses” figure is a conventional estimate, not an observed bill.",
    },
  },
  tarif_electricite: {
    label: "Tarifs réglementés et offres de fourniture d'électricité",
    publisher: "CRE / fournisseurs",
    vintage: { fr: "tarif en vigueur", en: "tariff in force" },
    refresh: { fr: "révision deux fois par an", en: "revised twice a year" },
    geoLevel: "national",
    licence: "public_rule",
    caveat: {
      fr: "National : le prix du kWh ne varie pas d'une commune à l'autre, seule la consommation varie.",
      en: "National: the kWh price does not vary between communes — only consumption does.",
    },
  },
  grdf_reseau: {
    label: "Communes desservies en gaz naturel",
    publisher: "GRDF",
    vintage: { fr: "édition annuelle", en: "annual edition" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "commune",
    licence: "open",
    url: "https://opendata.grdf.fr/",
    caveat: {
      fr: "Une commune desservie ne veut pas dire un logement raccordé.",
      en: "A commune being served does not mean a given dwelling is connected.",
    },
  },
  france_chaleur_urbaine: {
    label: "France Chaleur Urbaine — tracés et tarifs des réseaux",
    publisher: "Ministère de la Transition écologique",
    vintage: { fr: "mise à jour continue", en: "continuously updated" },
    refresh: { fr: "continue", en: "continuous" },
    geoLevel: "point",
    licence: "open",
    url: "https://france-chaleur-urbaine.beta.gouv.fr/",
    caveat: {
      fr: "Couverture fragmentaire, et le raccordement dépend de la distance au réseau.",
      en: "Patchy coverage, and connection depends on the distance to the network.",
    },
  },
  meteo_france_dju: {
    label: "Données publiques — normales climatiques et degrés-jours unifiés",
    publisher: "Météo-France",
    vintage: { fr: "normales 1991-2020 et séries courantes", en: "1991-2020 normals and current series" },
    refresh: { fr: "continue", en: "continuous" },
    geoLevel: "point",
    licence: "open",
    url: "https://donneespubliques.meteofrance.fr/",
    caveat: {
      fr: "Mesuré à la station : rattacher une station à une commune introduit une erreur qu'il faut assumer.",
      en: "Measured at a weather station: tying a station to a commune introduces an error that has to be owned.",
    },
  },
  sispea_eau: {
    label: "Indicateurs eau potable et assainissement (SISPEA)",
    publisher: "OFB / Hub'Eau",
    vintage: { fr: "dernier exercice validé", en: "latest validated year" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "commune",
    licence: "open",
    url: "https://hubeau.eaufrance.fr/",
    caveat: {
      fr: "Le périmètre est le service, pas la commune, et la validation prend un à deux ans.",
      en: "The perimeter is the utility, not the commune, and validation lags by a year or two.",
    },
  },

  /* --------------------------------------------------------------- Mobilité */

  prix_carburants: {
    label: "Prix des carburants — flux instantané",
    publisher: "Ministère de l'Économie",
    vintage: { fr: "relevé du jour", en: "same-day reading" },
    refresh: { fr: "toutes les dix minutes", en: "every ten minutes" },
    geoLevel: "point",
    licence: "open",
    url: "https://www.data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/",
    caveat: {
      fr: "Un prix du jour n'est pas un prix d'année : à moyenner sur une période et à dater.",
      en: "A price today is not a price for the year: average it over a period and stamp the date.",
    },
  },
  bareme_kilometrique: {
    label: "Barème kilométrique (voitures et deux-roues)",
    publisher: "DGFiP",
    vintage: { fr: "barème annuel en vigueur", en: "annual scale in force" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "national",
    licence: "public_rule",
    caveat: {
      fr: "Officiel et complet — carburant, entretien, assurance, usure — mais national : il ignore l'écart d'assurance entre départements.",
      en: "Official and all-in — fuel, servicing, insurance, wear — but national: it ignores the insurance gap between départements.",
    },
  },
  ademe_carlabelling: {
    label: "Car Labelling — consommations et émissions homologuées",
    publisher: "ADEME",
    vintage: { fr: "millésime courant", en: "current edition" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "national",
    licence: "open",
    url: "https://carlabelling.ademe.fr/",
    caveat: {
      fr: "Consommation homologuée : la consommation réelle est systématiquement plus élevée.",
      en: "Type-approval consumption: real-world consumption is consistently higher.",
    },
  },
  ban_itineraire: {
    label: "Base Adresse Nationale et calcul d'itinéraire",
    publisher: "DINUM / IGN",
    vintage: { fr: "à jour", en: "current" },
    refresh: { fr: "continue", en: "continuous" },
    geoLevel: "point",
    licence: "open",
    url: "https://api-adresse.data.gouv.fr/",
    caveat: {
      fr: "Une distance routière n'est pas un temps vécu : le trafic aux heures de pointe n'y est pas.",
      en: "A road distance is not a lived duration: rush-hour traffic is not in it.",
    },
  },
  gtfs_tarifs: {
    label: "Données GTFS des réseaux de transport",
    publisher: "transport.data.gouv.fr",
    vintage: { fr: "selon le réseau", en: "varies by network" },
    refresh: { fr: "selon le réseau", en: "varies by network" },
    geoLevel: "point",
    licence: "open",
    url: "https://transport.data.gouv.fr/",
    caveat: {
      fr: "Contient au mieux le ticket à l'unité, et seulement pour une partie des réseaux : les abonnements mensuels n'y sont pas.",
      en: "Carries the single ticket at best, and only for some networks: monthly passes are absent.",
    },
  },
  tarifs_reseaux_tc: {
    label: "Grilles tarifaires des réseaux de transport urbain",
    publisher: "Autorités organisatrices de la mobilité",
    vintage: { fr: "tarif affiché, avec date de relevé", en: "published tariff, with reading date" },
    refresh: { fr: "manuelle, par réseau", en: "manual, per network" },
    geoLevel: "commune",
    licence: "none",
    caveat: {
      fr: "Aucun format commun : chaque réseau publie sa grille sur son site, à relever à la main et à dater.",
      en: "No common format: each network publishes its own grid on its own site, to be read by hand and dated.",
    },
  },
  irve_bornes: {
    label: "Fichier consolidé des bornes de recharge",
    publisher: "data.gouv.fr / Etalab",
    vintage: { fr: "consolidation continue", en: "continuously consolidated" },
    refresh: { fr: "continue", en: "continuous" },
    geoLevel: "point",
    licence: "open",
    url: "https://www.data.gouv.fr/datasets/fichier-consolide-des-bornes-de-recharge-pour-vehicules-electriques/",
    caveat: {
      fr: "Donne l'emplacement et la puissance, rarement le prix réel au kWh.",
      en: "Gives location and power, seldom the actual price per kWh.",
    },
  },
  zfe: {
    label: "Base nationale des zones à faibles émissions",
    publisher: "transport.data.gouv.fr",
    vintage: { fr: "arrêtés en vigueur", en: "orders in force" },
    refresh: { fr: "sur arrêté local", en: "on local order" },
    geoLevel: "commune",
    licence: "open",
    url: "https://transport.data.gouv.fr/",
    caveat: {
      fr: "Le calendrier de restriction change par arrêté d'agglomération, parfois avec du retard.",
      en: "The restriction timetable changes by local order, sometimes late.",
    },
  },
  carte_grise: {
    label: "Taxe régionale sur les certificats d'immatriculation",
    publisher: "Conseils régionaux / ANTS",
    vintage: { fr: "tarif du cheval fiscal voté par la région", en: "per-horsepower rate voted by each région" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "region",
    licence: "public_rule",
    url: "https://immatriculation.ants.gouv.fr/",
    caveat: {
      fr: "Un des rares coûts automobiles qui varie vraiment selon le lieu — par région, et une seule fois à l'achat.",
      en: "One of the few car costs that genuinely varies by place — by région, and only once, at purchase.",
    },
  },
  peages: {
    label: "Tarifs des péages autoroutiers",
    publisher: "Sociétés concessionnaires",
    vintage: { fr: "grille en vigueur", en: "grid in force" },
    refresh: { fr: "annuelle, au 1er février", en: "annual, on 1 February" },
    geoLevel: "point",
    licence: "none",
    caveat: {
      fr: "Publié société par société, sans API commune : à relever par axe pour les trajets qui en dépendent.",
      en: "Published operator by operator with no common API: read per route for the journeys that depend on it.",
    },
  },
  stationnement: {
    label: "Tarifs de stationnement résidentiel et de voirie",
    publisher: "Communes",
    vintage: { fr: "délibération en vigueur", en: "council decision in force" },
    refresh: { fr: "sur délibération", en: "on council decision" },
    geoLevel: "commune",
    licence: "none",
    caveat: {
      fr: "Aucun référentiel national : chaque ville fixe et publie sa grille comme elle l'entend.",
      en: "No national reference: each city sets and publishes its own grid however it likes.",
    },
  },

  /* ----------------------------------------------------------- Alimentation */

  insee_ipgd: {
    label: "Indice des prix dans la grande distribution (IPGD)",
    publisher: "Insee",
    vintage: { fr: "série mensuelle", en: "monthly series" },
    refresh: { fr: "mensuelle", en: "monthly" },
    geoLevel: "national",
    licence: "open",
    url: "https://www.insee.fr/fr/statistiques/documentation/IPGD_Note%20m%C3%A9thodologique_2020_VF.pdf",
    caveat: {
      fr: "Construit sur les données de caisses, donc solide — mais c'est une évolution, pas un niveau, et il ne descend ni à l'enseigne ni au magasin.",
      en: "Built on checkout data, so solid — but it is an evolution, not a level, and it goes down neither to the chain nor to the store.",
    },
  },
  insee_ecsp: {
    label: "Comparaison spatiale des niveaux de prix",
    publisher: "Insee",
    vintage: { fr: "2022", en: "2022" },
    refresh: { fr: "tous les cinq à six ans", en: "every five to six years" },
    geoLevel: "region",
    licence: "open",
    caveat: {
      fr: "Le seul écart de niveau de prix officiel — et il s'arrête à Île-de-France / province / DOM. Rien n'existe par ville, encore moins par quartier.",
      en: "The only official price-level gap — and it stops at Île-de-France / the provinces / the overseas départements. Nothing exists per city, let alone per neighbourhood.",
    },
  },
  insee_budget_famille: {
    label: "Budget de famille / comptes nationaux — structure de consommation",
    publisher: "Insee",
    vintage: { fr: "dernière enquête publiée", en: "latest published survey" },
    refresh: { fr: "périodique", en: "periodic" },
    geoLevel: "national",
    licence: "open",
    caveat: {
      fr: "Moyenne nationale par configuration de ménage : dit la taille du panier, jamais son prix ici.",
      en: "A national average per household type: it gives the size of the basket, never its price here.",
    },
  },
  insee_ipc: {
    label: "Indice des prix à la consommation (IPC) et IPCH",
    publisher: "Insee / Eurostat",
    vintage: { fr: "série mensuelle, base 2025 = 100 depuis janvier 2026", en: "monthly series, 2025 = 100 base since January 2026" },
    refresh: { fr: "mensuelle", en: "monthly" },
    geoLevel: "national",
    licence: "open",
    caveat: {
      fr: "Sert à ramener des millésimes différents en euros d'aujourd'hui ; le changement de base et de nomenclature casse le raccord des séries anciennes.",
      en: "Used to bring different vintages into today's euros; the change of base and classification breaks the splice with older series.",
    },
  },
  ufc_palmares: {
    label: "Palmarès annuel des enseignes de la grande distribution",
    publisher: "UFC-Que Choisir",
    vintage: { fr: "édition annuelle", en: "annual edition" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "national",
    licence: "restricted",
    url: "https://www.quechoisir.org/",
    caveat: {
      fr: "La seule comparaison publique de niveau entre enseignes, et elle n'est ni officielle ni librement rediffusable : association de consommateurs, panier et méthode qui lui appartiennent. À citer, pas à recopier.",
      en: "The only public price-level comparison between chains, and it is neither official nor freely redistributable: a consumer association, with its own basket and method. Cite it; do not copy it.",
    },
  },
  open_prices: {
    label: "Open Prices",
    publisher: "Open Food Facts",
    vintage: { fr: "contributions continues", en: "continuous contributions" },
    refresh: { fr: "quotidienne", en: "daily" },
    geoLevel: "point",
    licence: "odbl",
    url: "https://prices.openfoodfacts.org/",
    caveat: {
      fr: "Le seul prix rattaché à un magasin précis, et il est bénévole : la couverture est trouée et très inégale selon les villes.",
      en: "The only price attached to an actual store, and it is volunteered: coverage is patchy and very uneven between cities.",
    },
  },
  insee_bpe: {
    label: "Base permanente des équipements (BPE)",
    publisher: "Insee",
    vintage: { fr: "millésime annuel", en: "annual edition" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "iris",
    licence: "open",
    url: "https://www.insee.fr/fr/metadonnees/source/serie/s1161",
    caveat: {
      fr: "Recense les équipements, pas leur qualité, leur assortiment ni leurs prix.",
      en: "Counts facilities — not their quality, their range, or their prices.",
    },
  },

  /* -------------------------------------------------------- Enfants & santé */

  bareme_psu_cnaf: {
    label: "Barème national des participations familiales (PSU)",
    publisher: "Cnaf",
    vintage: { fr: "barème annuel", en: "annual scale" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "national",
    licence: "public_rule",
    caveat: {
      fr: "Formule exacte au centime, mais assise sur les ressources N-2 et sur le nombre d'heures du contrat.",
      en: "Exact to the cent, but based on income from two years back and on the contracted hours.",
    },
  },
  cnaf_eaje: {
    label: "Données ouvertes Cnaf — établissements d'accueil du jeune enfant",
    publisher: "Cnaf",
    vintage: { fr: "millésime annuel", en: "annual edition" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "commune",
    licence: "open",
    url: "https://data.caf.fr/",
    caveat: {
      fr: "Donne des places existantes, jamais une place disponible pour votre enfant.",
      en: "Gives places that exist — never a place available for your child.",
    },
  },
  cnaf_assmat: {
    label: "Observatoire de la petite enfance — tarifs des assistantes maternelles",
    publisher: "Cnaf",
    vintage: { fr: "millésime annuel", en: "annual edition" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "departement",
    licence: "open",
    caveat: {
      fr: "Moyenne départementale ; le tarif réel se négocie contrat par contrat.",
      en: "A département average; the real rate is negotiated contract by contract.",
    },
  },
  education_annuaire: {
    label: "Annuaire de l'éducation",
    publisher: "Ministère de l'Éducation nationale",
    vintage: { fr: "année scolaire courante", en: "current school year" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "point",
    licence: "open",
    url: "https://data.education.gouv.fr/",
    caveat: {
      fr: "Adresses des établissements : ni la sectorisation, ni l'affectation de votre enfant.",
      en: "School addresses: neither the catchment map nor your child's placement.",
    },
  },
  tarifs_municipaux: {
    label: "Tarifs municipaux — cantine, périscolaire, centres de loisirs",
    publisher: "Communes",
    vintage: { fr: "délibération en vigueur", en: "council decision in force" },
    refresh: { fr: "annuelle, par commune", en: "annual, per commune" },
    geoLevel: "commune",
    licence: "none",
    caveat: {
      fr: "Aucun référentiel national, et le plus souvent une grille au quotient familial : à relever ville par ville.",
      en: "No national reference, and usually a means-tested grid: to be read city by city.",
    },
  },
  drees_apl: {
    label: "Accessibilité potentielle localisée aux médecins (APL)",
    publisher: "DREES",
    vintage: { fr: "millésime annuel", en: "annual edition" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "commune",
    licence: "open",
    url: "https://data.drees.solidarites-sante.gouv.fr/",
    caveat: {
      fr: "Mesure une accessibilité théorique, pas un rendez-vous obtenu.",
      en: "Measures theoretical access, not an appointment obtained.",
    },
  },
  ameli_annuaire: {
    label: "Annuaire santé — secteurs de conventionnement",
    publisher: "Assurance Maladie",
    vintage: { fr: "mise à jour régulière", en: "regularly updated" },
    refresh: { fr: "régulière", en: "regular" },
    geoLevel: "point",
    licence: "open",
    url: "https://www.data.ameli.fr/",
    caveat: {
      fr: "Le secteur indique un droit à dépassement, pas le montant que vous paierez.",
      en: "The sector indicates a right to charge above the tariff, not the amount you will pay.",
    },
  },

  /* --------------------------------------------- Possessions & équipements */

  taemup: {
    label: "Taxe annuelle sur les engins maritimes à usage personnel (TAEMUP)",
    publisher: "DGAMPA — articles L. 423-4 à L. 423-37 du code des impositions sur les biens et services",
    vintage: { fr: "barème en vigueur", en: "scale in force" },
    refresh: { fr: "annuelle, réforme annoncée", en: "annual, reform announced" },
    geoLevel: "national",
    licence: "public_rule",
    url: "https://www.mer.gouv.fr/la-taxe-annuelle-sur-les-engins-maritimes-usage-personnel-taemup",
    caveat: {
      fr: "Remplace depuis 2022 l'ancien droit de francisation (DAFN) et l'ancien droit de passeport ; se calcule exactement à partir de la longueur de coque et de la puissance administrative, avec abattement de vétusté et seuil de mise en recouvrement.",
      en: "Since 2022 it replaces the former registration duty (DAFN) and passport duty; it computes exactly from hull length and administrative power, with an age abatement and a collection threshold.",
    },
  },
  ports_plaisance: {
    label: "Tarifs des ports de plaisance",
    publisher: "Ports (régies, concessions, sociétés)",
    vintage: { fr: "tarif affiché, avec date de relevé", en: "published tariff, with reading date" },
    refresh: { fr: "annuelle, port par port", en: "annual, port by port" },
    geoLevel: "point",
    licence: "none",
    caveat: {
      fr: "Aucune base nationale : chaque port publie sa grille, et le prix affiché ne vaut rien sans la file d'attente, qui se compte souvent en années.",
      en: "No national database: each port publishes its own grid, and the posted price means little without the waiting list, often counted in years.",
    },
  },
  taxe_amenagement: {
    label: "Taxe d'aménagement — valeurs forfaitaires (piscine, abri, annexe)",
    publisher: "DGALN / DGFiP",
    vintage: { fr: "valeurs forfaitaires annuelles", en: "annual flat values" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "commune",
    licence: "public_rule",
    caveat: {
      fr: "Valeur forfaitaire nationale, taux votés par la commune et le département : le calcul est exact, l'assiette est conventionnelle.",
      en: "A national flat value with rates voted locally: the calculation is exact, the base is conventional.",
    },
  },
  icad: {
    label: "Fichier national d'identification des carnivores domestiques (I-CAD)",
    publisher: "I-CAD",
    vintage: { fr: "registre continu", en: "continuous register" },
    refresh: { fr: "continue", en: "continuous" },
    geoLevel: "national",
    licence: "restricted",
    url: "https://www.i-cad.fr/",
    caveat: {
      fr: "Un registre d'animaux identifiés, pas un observatoire de dépenses : le coût d'un animal n'est publié par aucune source officielle.",
      en: "A register of identified animals, not a spending observatory: the cost of a pet is published by no official source.",
    },
  },

  /* ------------------------------------------------- Télécom, assurances, impôts */

  arcep_connexion: {
    label: "Ma connexion internet — éligibilité et technologies",
    publisher: "ARCEP",
    vintage: { fr: "mise à jour régulière", en: "regularly updated" },
    refresh: { fr: "trimestrielle", en: "quarterly" },
    geoLevel: "point",
    licence: "open",
    url: "https://maconnexioninternet.arcep.fr/",
    caveat: {
      fr: "Éligible ne veut pas dire raccordé, et le dataset ne contient aucun prix.",
      en: "Eligible does not mean connected, and the dataset carries no prices.",
    },
  },
  marche_assurances: {
    label: "Primes d'assurance habitation, automobile et complémentaire santé",
    publisher: "Assureurs",
    vintage: { fr: "non publié", en: "not published" },
    refresh: { fr: "sans objet", en: "not applicable" },
    geoLevel: "departement",
    licence: "none",
    caveat: {
      fr: "Les écarts géographiques sont réels et connus des assureurs, mais leurs tarifs ne sont pas des données ouvertes : seule la saisie de l'utilisateur est honnête ici.",
      en: "The geographic gaps are real and known to insurers, but their pricing is not open data: only the user's own figure is honest here.",
    },
  },
  saisie_utilisateur: {
    label: "Saisie de l'utilisateur",
    publisher: "—",
    vintage: { fr: "situation déclarée", en: "as declared" },
    refresh: { fr: "à chaque simulation", en: "each simulation" },
    geoLevel: "user",
    licence: "none",
    caveat: {
      fr: "La donnée la plus fiable du calcul : c'est un fait, pas une estimation. Elle n'est jamais remplacée par une moyenne.",
      en: "The most reliable figure in the calculation: a fact, not an estimate. It is never replaced by an average.",
    },
  },
  convention_wherewise: {
    label: "Hypothèse WhereWise",
    publisher: "WhereWise",
    vintage: { fr: "documentée et modifiable", en: "documented and adjustable" },
    refresh: { fr: "à chaque revue", en: "at each review" },
    geoLevel: "national",
    licence: "none",
    caveat: {
      fr: "Ce n'est pas une mesure. Affiché comme hypothèse, avec sa valeur par défaut visible et modifiable par le lecteur.",
      en: "Not a measurement. Shown as an assumption, with its default value visible and adjustable by the reader.",
    },
  },

  /* ------------------------------------------------------ Contexte non monétaire */

  ssmsi_delinquance: {
    label: "Bases statistiques de la délinquance enregistrée",
    publisher: "SSMSI",
    vintage: { fr: "millésime annuel", en: "annual edition" },
    refresh: { fr: "annuelle", en: "annual" },
    geoLevel: "commune",
    licence: "open",
    url: "https://www.data.gouv.fr/datasets/bases-statistiques-communale-et-departementale-de-la-delinquance-enregistree-par-la-police-et-la-gendarmerie-nationales/",
    caveat: {
      fr: "Ce sont des faits enregistrés, donc autant une mesure de l'activité policière et du dépôt de plainte que de la délinquance elle-même.",
      en: "These are recorded offences — as much a measure of police activity and reporting habits as of crime itself.",
    },
  },
  qualite_air: {
    label: "Géod'air et réseaux Atmo — qualité de l'air",
    publisher: "Ineris / AASQA",
    vintage: { fr: "mesures quotidiennes", en: "daily measurements" },
    refresh: { fr: "quotidienne", en: "daily" },
    geoLevel: "point",
    licence: "open",
    url: "https://www.geodair.fr/",
    caveat: {
      fr: "Mesuré en quelques stations puis interpolé : la valeur d'un quartier est modélisée.",
      en: "Measured at a few stations then interpolated: a neighbourhood value is modelled.",
    },
  },
  georisques: {
    label: "Géorisques — risques naturels et technologiques",
    publisher: "BRGM / ministère de la Transition écologique",
    vintage: { fr: "mise à jour continue", en: "continuously updated" },
    refresh: { fr: "continue", en: "continuous" },
    geoLevel: "point",
    licence: "open",
    url: "https://www.georisques.gouv.fr/",
    caveat: {
      fr: "Un aléa n'est pas un dommage — mais il pèse sur la prime d'assurance et sur la revente.",
      en: "A hazard is not damage — but it weighs on the insurance premium and on resale.",
    },
  },
  bruit: {
    label: "Cartes de bruit stratégiques",
    publisher: "Bruitparif et observatoires régionaux",
    vintage: { fr: "par cycle réglementaire", en: "by regulatory cycle" },
    refresh: { fr: "quinquennale", en: "every five years" },
    geoLevel: "point",
    licence: "open",
    url: "https://www.bruitparif.fr/",
    caveat: {
      fr: "Couverture limitée aux grandes agglomérations et aux axes classés.",
      en: "Coverage limited to large conurbations and classified transport routes.",
    },
  },
} as const satisfies Record<string, CatalogSource>;

export type CatalogSourceCode = keyof typeof SOURCES;

export const CATALOG_SOURCES: Record<CatalogSourceCode, CatalogSource> = SOURCES;

export const catalogSource = (code: CatalogSourceCode): CatalogSource => SOURCES[code];

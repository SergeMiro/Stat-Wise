import type { Domaine } from "../types";

/**
 * Housing. The largest gap between two cities, and the one place where the
 * difference between "moyen", "médian" and "minimal" decides whether a figure is
 * honest.
 *
 * The three quantities a reader always asks for — minimum, maximum, average price
 * per m² — are written down here as they were asked, and then answered truthfully
 * rather than quietly replaced:
 *
 *  - the **average** is not what the rent source publishes, and should not be: it
 *    is pulled by a few very expensive listings. Carte des loyers publishes a
 *    median, and a median is what we show.
 *  - the **minimum and maximum** of asking prices exist in no published dataset,
 *    and would be worthless if they did — the cheapest listing in a commune is a
 *    cellar with a window. What the dataset does carry is a confidence interval
 *    around the median, which looks like a range and is not one: it measures how
 *    sure the statistician is, not how cheap the market gets. Presenting that
 *    interval as "from … to …" would be the single most tempting lie on this page.
 *  - on purchase the picture is different, because DVF is a file of actual sales:
 *    real quartiles can be computed. The extremes still cannot be used — a
 *    property transferred between relatives for one euro is in there too.
 */
export const logement: Domaine = {
  key: "logement",
  label: { fr: "Immobilier", en: "Housing" },
  summary: {
    fr: "Le premier poste et le premier écart entre deux villes : de 200 à 1 200 € par mois pour le même ménage.",
    en: "The biggest item and the biggest gap between two cities: €200 to €1,200 a month for the same household.",
  },
  postes: [
    {
      key: "location_appartement",
      label: { fr: "Location — appartement", en: "Renting — flat" },
      flow: "contrainte",
      tier: "T1",
      sources: ["carte_loyers", "insee_ipc"],
      mesures: [
        {
          key: "loyer_median_m2",
          label: { fr: "Loyer médian au m², charges comprises", en: "Median rent per m², charges included" },
          unit: "€/m²/mois",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "Publié par commune et par type de logement. C'est un loyer d'annonce : ce que les bailleurs demandent, pas ce que les locataires en place paient.",
            en: "Published per commune and dwelling type. This is an asking rent: what landlords ask, not what sitting tenants pay.",
          },
        },
        {
          key: "loyer_moyen_m2",
          label: { fr: "Loyer moyen au m²", en: "Mean rent per m²" },
          unit: "€/m²/mois",
          stat: "mean",
          availability: "unavailable",
          note: {
            fr: "Volontairement non retenu. La moyenne d'un marché locatif est tirée vers le haut par quelques annonces très chères ; à Paris comme à Dijon elle dépasse la médiane. Nous affichons la médiane et le disons.",
            en: "Deliberately not used. The mean of a rental market is pulled up by a few very expensive listings; in Paris as in Dijon it sits above the median. We show the median, and say so.",
          },
        },
        {
          key: "loyer_ic_bas",
          label: { fr: "Borne basse de l'intervalle de confiance", en: "Lower bound of the confidence interval" },
          unit: "€/m²/mois",
          stat: "min",
          availability: "open_data",
          note: {
            fr: "Attention : c'est l'incertitude sur la médiane, pas le loyer le moins cher de la commune. L'afficher comme « à partir de » serait faux.",
            en: "Careful: this is the uncertainty around the median, not the cheapest rent in the commune. Showing it as “from …” would be false.",
          },
        },
        {
          key: "loyer_ic_haut",
          label: { fr: "Borne haute de l'intervalle de confiance", en: "Upper bound of the confidence interval" },
          unit: "€/m²/mois",
          stat: "max",
          availability: "open_data",
        },
        {
          key: "loyer_extremes",
          label: { fr: "Loyer minimal et maximal réellement pratiqués", en: "Lowest and highest rents actually charged" },
          unit: "€/m²/mois",
          stat: "min",
          availability: "unavailable",
          note: {
            fr: "N'existe dans aucune source publique, et n'aurait aucune valeur : le minimum d'un marché est un logement indécent, le maximum un bien atypique. Affiché comme non disponible plutôt que remplacé par les bornes de l'intervalle.",
            en: "Exists in no public source, and would carry no meaning: a market's minimum is an unfit dwelling, its maximum an outlier. Shown as unavailable rather than replaced by the interval bounds.",
          },
        },
        {
          key: "loyer_observations",
          label: { fr: "Nombre d'observations de la commune", en: "Number of observations for the commune" },
          unit: "annonces",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "Le garde-fou : au-dessous du seuil de publication, la commune n'a pas d'indicateur et ne doit pas en recevoir un emprunté à sa voisine.",
            en: "The safeguard: below the publication threshold a commune has no indicator, and must not be lent its neighbour's.",
          },
        },
        {
          key: "surface_necessaire",
          label: { fr: "Surface nécessaire selon la composition du ménage", en: "Floor area needed for the household" },
          unit: "m²",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Le multiplicateur du loyer au m². Assis sur la norme de décence, pas sur la surface souhaitée.",
            en: "The multiplier on the per-m² rent. Based on the legal fitness standard, not on the area anyone would want.",
          },
        },
      ],
    },
    {
      key: "location_maison",
      label: { fr: "Location — maison", en: "Renting — house" },
      flow: "contrainte",
      tier: "T1",
      sources: ["carte_loyers"],
      mesures: [
        {
          key: "loyer_maison_median_m2",
          label: { fr: "Loyer médian au m², charges comprises", en: "Median rent per m², charges included" },
          unit: "€/m²/mois",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "Segment publié séparément de l'appartement, et c'est indispensable : au m² une maison est moins chère, mais elle est plus grande et chauffe plus.",
            en: "Published as a separate segment from flats, and it has to be: per m² a house is cheaper, but it is larger and costs more to heat.",
          },
        },
        {
          key: "loyer_maison_ic",
          label: { fr: "Bornes de l'intervalle de confiance", en: "Confidence interval bounds" },
          unit: "€/m²/mois",
          stat: "min",
          availability: "open_data",
        },
        {
          key: "loyer_maison_observations",
          label: { fr: "Nombre d'observations", en: "Number of observations" },
          unit: "annonces",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "Plus souvent sous le seuil que pour l'appartement : dans beaucoup de communes le segment maison n'est tout simplement pas publié.",
            en: "Below the threshold more often than flats: in many communes the house segment is simply not published.",
          },
        },
      ],
    },
    {
      key: "achat",
      label: { fr: "Achat d'un logement", en: "Buying a home" },
      flow: "ponctuel",
      tier: "T2",
      sources: ["dvf", "cerema_foncier"],
      mesures: [
        {
          key: "prix_median_m2",
          label: { fr: "Prix de vente médian au m²", en: "Median sale price per m²" },
          unit: "€/m²",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "Calculable à l'IRIS, donc au quartier — c'est la seule statistique de prix disponible à ce niveau de finesse.",
            en: "Computable at IRIS level, so per neighbourhood — the only price statistic available at that resolution.",
          },
        },
        {
          key: "prix_p25_m2",
          label: { fr: "Prix au m² — 1er quartile (P25)", en: "Price per m² — first quartile (P25)" },
          unit: "€/m²",
          stat: "p25",
          availability: "open_data",
          note: {
            fr: "Le vrai « pas cher » du quartier, et il est calculable ici parce que DVF contient les ventes une par une.",
            en: "The genuine “cheap end” of a neighbourhood, computable here because DVF holds the sales one by one.",
          },
        },
        {
          key: "prix_p75_m2",
          label: { fr: "Prix au m² — 3e quartile (P75)", en: "Price per m² — third quartile (P75)" },
          unit: "€/m²",
          stat: "p75",
          availability: "open_data",
        },
        {
          key: "prix_extremes_m2",
          label: { fr: "Prix minimal et maximal au m²", en: "Lowest and highest price per m²" },
          unit: "€/m²",
          stat: "min",
          availability: "unavailable",
          note: {
            fr: "Techniquement calculable, délibérément écarté : DVF contient des mutations à prix symbolique entre proches et des ventes de parkings comptés en logement. Le minimum d'un IRIS est presque toujours une aberration, pas une affaire.",
            en: "Technically computable, deliberately dropped: DVF contains token-price transfers between relatives and parking sales counted as dwellings. An IRIS minimum is nearly always an artefact, not a bargain.",
          },
        },
        {
          key: "nb_transactions",
          label: { fr: "Nombre de transactions sur la période", en: "Number of transactions over the period" },
          unit: "ventes",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "En dessous d'une poignée de ventes, aucune médiane n'est publiée : le quartier est affiché comme non couvert.",
            en: "Below a handful of sales no median is published: the neighbourhood is shown as not covered.",
          },
        },
        {
          key: "frais_notaire",
          label: { fr: "Frais de notaire (droits de mutation inclus)", en: "Notary and transfer costs" },
          unit: "% du prix",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Formule légale exacte, mais le taux départemental des droits de mutation varie et a bougé récemment : à revérifier à chaque millésime.",
            en: "An exact legal formula, but the départemental transfer-duty rate varies and has moved recently: recheck it every edition.",
          },
        },
      ],
    },
    {
      key: "charges_logement",
      label: { fr: "Charges et assurances du logement", en: "Housing charges and insurance" },
      flow: "contrainte",
      tier: "T2",
      sources: ["anil_charges", "loi_alur_honoraires", "saisie_utilisateur", "convention_wherewise"],
      mesures: [
        {
          key: "charges_copro",
          label: { fr: "Charges de copropriété", en: "Service charges" },
          unit: "€/mois",
          stat: "mean",
          availability: "hypothesis",
          note: {
            fr: "Aucune source géolocalisée n'existe. Estimé par approche indirecte — DPE du bâtiment, prix de l'eau, moyennes nationales — et affiché comme hypothèse. Attention au double comptage : sur un loyer charges comprises, elles sont déjà dedans.",
            en: "No geolocated source exists. Estimated indirectly — building energy rating, water price, national averages — and shown as an assumption. Beware double counting: on a charges-included rent they are already there.",
          },
        },
        {
          key: "assurance_habitation",
          label: { fr: "Assurance habitation", en: "Home insurance" },
          unit: "€/mois",
          stat: "value",
          availability: "user_input",
          note: {
            fr: "Obligatoire pour un locataire, et pourtant introuvable en données ouvertes : les tarifs appartiennent aux assureurs. La prime réelle du ménage est la seule valeur défendable.",
            en: "Compulsory for a tenant, and yet absent from open data: pricing belongs to insurers. The household's actual premium is the only defensible figure.",
          },
        },
        {
          key: "depot_garantie",
          label: { fr: "Dépôt de garantie", en: "Security deposit" },
          unit: "€",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Un mois de loyer hors charges en location nue. Récupérable, mais il faut l'avoir le jour de la signature : compté en dépense ponctuelle, jamais dans le reste à vivre mensuel.",
            en: "One month's rent excluding charges for an unfurnished let. Refundable, but needed on signing day: counted as a one-off, never inside the monthly balance.",
          },
        },
        {
          key: "honoraires_agence",
          label: { fr: "Honoraires d'agence", en: "Agency fees" },
          unit: "€/m²",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Plafonné au m² par zone. Le plafond est connu ; ce qui sera facturé ne l'est pas.",
            en: "Capped per m² by zone. The cap is known; what will actually be charged is not.",
          },
        },
        {
          key: "cout_demenagement",
          label: { fr: "Coût du déménagement", en: "Cost of moving" },
          unit: "€",
          stat: "value",
          availability: "user_input",
        },
      ],
    },
    {
      key: "taxes_locales",
      label: { fr: "Taxes locales du logement", en: "Local property taxes" },
      flow: "contrainte",
      tier: "T2",
      sources: ["dgfip_rei", "zones_tendues"],
      mesures: [
        {
          key: "taux_taxe_fonciere",
          label: { fr: "Taux de taxe foncière voté", en: "Voted property tax rate" },
          unit: "%",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Le taux est ouvert, l'impôt ne l'est pas : il faut la valeur locative cadastrale du logement, qui n'est pas publiée. Sans elle, la ligne reste une estimation.",
            en: "The rate is open, the bill is not: it needs the dwelling's cadastral rental value, which is not published. Without it the line stays an estimate.",
          },
        },
        {
          key: "teom",
          label: { fr: "Taxe d'enlèvement des ordures ménagères", en: "Household waste collection tax" },
          unit: "%",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Chez un locataire elle est le plus souvent déjà dans les charges : la compter à part serait la compter deux fois.",
            en: "For a tenant it is usually already inside the service charges: counting it separately would count it twice.",
          },
        },
        {
          key: "taxe_habitation",
          label: { fr: "Taxe d'habitation sur la résidence principale", en: "Residence tax on a main home" },
          unit: "€",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Zéro depuis 2023. Elle figure ici pour une raison : beaucoup de calculateurs en ligne la facturent encore.",
            en: "Zero since 2023. It is listed here for one reason: many online calculators still charge for it.",
          },
        },
        {
          key: "encadrement_loyers",
          label: { fr: "Commune en zone tendue ou en encadrement des loyers", en: "Commune in a tight zone or under rent control" },
          unit: "oui / non",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Décide d'un plafond légal au loyer et change le préavis. Se lit dans un décret, pas dans une statistique.",
            en: "Sets a legal rent ceiling and changes the notice period. Read from a decree, not from a statistic.",
          },
        },
      ],
    },
  ],
};

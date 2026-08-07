import type { Domaine } from "../types";

/**
 * What you own, and what owning it costs every year whether you use it or not.
 *
 * This domain did not exist in the first catalogue, and its absence was a real
 * hole: a household with a boat, a motorbike and a dog has several hundred euros
 * a month of obligations that no salary comparison sees. They are not exotic —
 * they are simply invisible to anyone who models a household as rent plus food.
 *
 * The boat is the instructive case, because it splits cleanly into the two halves
 * this whole project is built on:
 *
 *  - **The tax is exactly computable.** The annual tax on personal maritime craft
 *    replaced the old registration duty in 2022 and is written into the tax code:
 *    a hull term by length band, an engine term by administrative horsepower, an
 *    abatement by age, a floor below which nothing is collected. Give it a hull
 *    length and an engine and the answer is a number, not an estimate — the same
 *    quality of figure as an income tax computation.
 *  - **The berth is not published anywhere.** Every marina sets and posts its own
 *    grid, there is no national dataset, and the posted price is meaningless
 *    without the waiting list, which on the Mediterranean is measured in years.
 *    Between the Atlantic and the Côte d'Azur the same boat pays a multiple, so
 *    this is the largest line in the domain *and* the one with no source. It is
 *    curated by hand for the ports we cover, dated, or shown as unknown.
 *
 * That pairing — an exact rule next to an honest gap — is the shape of nearly
 * every row below.
 */
export const possessions: Domaine = {
  key: "possessions",
  label: { fr: "Possessions et loisirs", en: "Possessions and leisure" },
  summary: {
    fr: "Ce que l'on possède coûte tous les mois, même à l'arrêt. Invisible dans toute comparaison de salaires, et parfois plus lourd qu'une voiture.",
    en: "What you own costs every month, even parked. Invisible in any salary comparison, and sometimes heavier than a car.",
  },
  postes: [
    {
      key: "bateau_taxe",
      label: { fr: "Bateau — taxe annuelle (TAEMUP)", en: "Boat — annual tax (TAEMUP)" },
      flow: "contrainte",
      tier: "T2",
      sources: ["taemup"],
      mesures: [
        {
          key: "droit_coque",
          label: { fr: "Part « coque » selon la longueur", en: "Hull term, by length band" },
          unit: "€/an",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Forfait par tranche de longueur de coque, de moins de 7 mètres — exonéré — jusqu'aux unités de 15 mètres et plus.",
            en: "A flat amount per hull-length band, from under 7 metres — exempt — up to craft of 15 metres and over.",
          },
        },
        {
          key: "droit_moteur",
          label: { fr: "Part « moteur » selon la puissance administrative", en: "Engine term, by administrative horsepower" },
          unit: "€/an",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Barème par cheval fiscal, avec un abattement des premiers chevaux en dessous d'un seuil de puissance. Les véhicules nautiques à moteur ont leur propre barème, au kilowatt.",
            en: "A scale per fiscal horsepower, with the first few deducted below a power threshold. Personal watercraft have their own scale, per kilowatt.",
          },
        },
        {
          key: "abattement_vetuste",
          label: { fr: "Abattement pour vétusté", en: "Age abatement" },
          unit: "%",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Réduction par tranche d'ancienneté du navire, qui peut retirer la plus grande partie de la taxe sur une unité ancienne.",
            en: "A reduction by age band, which can remove most of the tax on an older craft.",
          },
        },
        {
          key: "seuil_recouvrement",
          label: { fr: "Seuil de mise en recouvrement", en: "Collection threshold" },
          unit: "€",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "En dessous du seuil, rien n'est dû. Beaucoup de petites unités sortent du calcul par ce seuil plutôt que par une exonération.",
            en: "Below the threshold nothing is owed. Many small craft leave the calculation through this floor rather than through an exemption.",
          },
        },
        {
          key: "exoneration",
          label: { fr: "Cas d'exonération", en: "Exemption cases" },
          unit: "oui / non",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Notamment coque de moins de 7 mètres avec un moteur de faible puissance, propulsion à la voile ou à l'aviron, et navigation intérieure seule.",
            en: "Notably a hull under 7 metres with a low-powered engine, sail or oar propulsion, and inland navigation only.",
          },
        },
        {
          key: "revision_bareme",
          label: { fr: "Date de la prochaine vérification du barème", en: "Date of the next scale review" },
          unit: "date",
          stat: "value",
          availability: "curated",
          note: {
            fr: "Une réforme de cette taxe est engagée : le barème doit avoir un propriétaire et une date de revue, sinon il pourrit en un budget.",
            en: "A reform of this tax is under way: the scale needs an owner and a review date, or it rots within one budget cycle.",
          },
        },
      ],
    },
    {
      key: "bateau_exploitation",
      label: { fr: "Bateau — place, entretien, navigation", en: "Boat — berth, upkeep, running" },
      flow: "contrainte",
      tier: "T3",
      sources: ["ports_plaisance", "marche_assurances", "saisie_utilisateur", "prix_carburants"],
      mesures: [
        {
          key: "place_port_annuelle",
          label: { fr: "Place à flot à l'année selon la longueur", en: "Year-round berth, by length" },
          unit: "€/an",
          stat: "median",
          availability: "curated",
          note: {
            fr: "De loin le premier poste, et sans aucune base nationale : à relever port par port, avec la date. L'écart entre une façade et une autre se compte en multiples, pas en pourcents.",
            en: "By far the largest item, and with no national database: read port by port, with the date. The gap between one coast and another is a multiple, not a percentage.",
          },
        },
        {
          key: "attente_place",
          label: { fr: "Délai d'attente pour une place", en: "Waiting time for a berth" },
          unit: "années",
          stat: "median",
          availability: "unavailable",
          note: {
            fr: "Le prix affiché ne veut rien dire sans lui, et il n'est publié nulle part de façon comparable. Ne jamais laisser entendre qu'une place est disponible — même règle que pour les places en crèche.",
            en: "The posted price means nothing without it, and it is published nowhere comparably. Never imply a berth is available — the same rule as for nursery places.",
          },
        },
        {
          key: "hivernage",
          label: { fr: "Hivernage à terre, grutage, carénage", en: "Winter storage, lifting, hull cleaning" },
          unit: "€/an",
          stat: "mean",
          availability: "curated",
        },
        {
          key: "assurance_bateau",
          label: { fr: "Assurance plaisance", en: "Pleasure craft insurance" },
          unit: "€/an",
          stat: "value",
          availability: "user_input",
          note: {
            fr: "Non obligatoire en France pour la plupart des unités, mais exigée par presque tous les ports. Tarifs non publiés : saisie de l'utilisateur.",
            en: "Not compulsory in France for most craft, but required by nearly every marina. Pricing is unpublished: the user's own figure.",
          },
        },
        {
          key: "carburant_bateau",
          label: { fr: "Carburant consommé en navigation", en: "Fuel burnt under way" },
          unit: "€/an",
          stat: "value",
          availability: "hypothesis",
          note: {
            fr: "Le prix au litre est connu à la station, le nombre d'heures de navigation ne l'est que du propriétaire : l'un est mesuré, l'autre est déclaré.",
            en: "The price per litre is known at the pump, the hours under way only to the owner: one is measured, the other declared.",
          },
        },
        {
          key: "controle_technique_bateau",
          label: { fr: "Contrôle technique périodique", en: "Periodic roadworthiness test" },
          unit: "€/an",
          stat: "value",
          availability: "unavailable",
          note: {
            fr: "N'existe pas : la plaisance française n'a pas d'équivalent du contrôle technique automobile. La ligne est là pour empêcher qu'on l'invente par analogie avec la voiture.",
            en: "Does not exist: French pleasure boating has no equivalent of the car roadworthiness test. The row is here to stop anyone inventing one by analogy with the car.",
          },
        },
      ],
    },
    {
      key: "deux_roues",
      label: { fr: "Moto, scooter, camping-car", en: "Motorbike, scooter, campervan" },
      flow: "contrainte",
      tier: "T2",
      sources: ["bareme_kilometrique", "carte_grise", "marche_assurances"],
      mesures: [
        {
          key: "bareme_deux_roues",
          label: { fr: "Coût kilométrique officiel deux-roues", en: "Official per-kilometre cost, two-wheelers" },
          unit: "€/km",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Le barème fiscal a une grille propre aux deux-roues : c'est un coût complet officiel, entretien et assurance compris.",
            en: "The tax scale has its own grid for two-wheelers: an official all-in cost, servicing and insurance included.",
          },
        },
        {
          key: "taxe_carte_grise",
          label: { fr: "Taxe régionale du certificat d'immatriculation", en: "Regional vehicle registration tax" },
          unit: "€/CV",
          stat: "value",
          availability: "official_rule",
          note: {
            fr: "L'un des rares coûts de véhicule qui dépend vraiment du lieu : le prix du cheval fiscal est voté par chaque région. Ponctuel, à l'achat.",
            en: "One of the few vehicle costs that genuinely depends on place: the per-horsepower price is voted by each région. One-off, at purchase.",
          },
        },
        {
          key: "assurance_deux_roues",
          label: { fr: "Assurance du véhicule", en: "Vehicle insurance" },
          unit: "€/an",
          stat: "value",
          availability: "user_input",
        },
      ],
    },
    {
      key: "piscine_annexes",
      label: { fr: "Piscine, abri, annexe", en: "Pool, shed, outbuilding" },
      flow: "contrainte",
      tier: "T3",
      sources: ["taxe_amenagement", "dgfip_rei", "saisie_utilisateur"],
      mesures: [
        {
          key: "taxe_amenagement_piscine",
          label: { fr: "Taxe d'aménagement à la construction", en: "Development tax on building" },
          unit: "€",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Valeur forfaitaire nationale au m², taux votés par la commune et le département : exact, ponctuel, et régulièrement oublié par les acheteurs.",
            en: "A national flat value per m² with locally voted rates: exact, one-off, and regularly forgotten by buyers.",
          },
        },
        {
          key: "effet_taxe_fonciere",
          label: { fr: "Effet sur la taxe foncière", en: "Effect on the property tax" },
          unit: "€/an",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Une piscine enterrée augmente la base cadastrale, donc l'impôt tous les ans. C'est le coût récurrent, pas la taxe de construction.",
            en: "An in-ground pool raises the cadastral base, so the tax rises every year. That is the recurring cost — not the building tax.",
          },
        },
        {
          key: "entretien_eau_energie",
          label: { fr: "Entretien, eau et énergie", en: "Upkeep, water and energy" },
          unit: "€/an",
          stat: "value",
          availability: "hypothesis",
          note: {
            fr: "Le volume d'eau et la consommation de la pompe se calculent ; le produit et la main-d'œuvre relèvent de la déclaration.",
            en: "Water volume and pump consumption can be computed; chemicals and labour are declared.",
          },
        },
      ],
    },
    {
      key: "animaux",
      label: { fr: "Animaux domestiques", en: "Pets" },
      flow: "pilotable",
      tier: "T3",
      sources: ["icad", "saisie_utilisateur", "convention_wherewise"],
      mesures: [
        {
          key: "cout_annuel_animal",
          label: { fr: "Coût annuel d'un animal", en: "Annual cost of a pet" },
          unit: "€/an",
          stat: "mean",
          availability: "hypothesis",
          note: {
            fr: "Aucune statistique publique. Les seuls chiffres qui circulent viennent d'enquêtes de la filière : utilisables comme ordre de grandeur affiché, jamais comme mesure.",
            en: "No public statistic. The only figures in circulation come from industry surveys: usable as a stated order of magnitude, never as a measurement.",
          },
        },
        {
          key: "identification",
          label: { fr: "Identification obligatoire", en: "Compulsory identification" },
          unit: "€",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Obligatoire et enregistrée dans un fichier national — mais ce fichier recense des animaux, il ne publie pas de dépenses.",
            en: "Compulsory and recorded in a national register — but that register counts animals, it does not publish spending.",
          },
        },
      ],
    },
    {
      key: "sport_culture",
      label: { fr: "Sport, culture, abonnements", en: "Sport, culture, subscriptions" },
      flow: "pilotable",
      tier: "T3",
      sources: ["insee_bpe", "tarifs_municipaux", "saisie_utilisateur"],
      mesures: [
        {
          key: "equipements_proximite",
          label: { fr: "Équipements sportifs et culturels à proximité", en: "Sports and cultural facilities nearby" },
          unit: "équipements",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "Recensé, donc comparable entre quartiers — mais c'est de l'accès, pas une dépense.",
            en: "Counted, so comparable between neighbourhoods — but it is access, not spending.",
          },
        },
        {
          key: "tarifs_municipaux_loisirs",
          label: { fr: "Tarifs municipaux d'accès", en: "Municipal access charges" },
          unit: "€/an",
          stat: "value",
          availability: "curated",
          note: {
            fr: "Souvent au quotient familial, publiés commune par commune : à relever à la main pour les villes couvertes.",
            en: "Often means-tested and published commune by commune: read by hand for the cities we cover.",
          },
        },
        {
          key: "abonnements_prives",
          label: { fr: "Abonnements privés (salle, clubs, streaming)", en: "Private subscriptions (gym, clubs, streaming)" },
          unit: "€/mois",
          stat: "value",
          availability: "user_input",
        },
      ],
    },
  ],
};

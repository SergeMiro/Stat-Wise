import type { Domaine } from "../types";

/**
 * Getting about. The third largest gap between two places, and the one where
 * open data is at its best: fuel prices are published per petrol station every
 * ten minutes, and the full cost of running a car has an official all-in scale.
 *
 * Two traps are written into the rows below because both have been got wrong in
 * public calculators.
 *
 *  - **The commute is not the only journey.** A cheap neighbourhood far from a
 *    supermarket hands back in fuel what it saved on rent. The shopping runs are
 *    modelled separately, on purpose: the employer's legal half-share covers the
 *    commute alone, so a season ticket already paid for work makes those trips
 *    free while a car does not.
 *  - **Fuel is the small half of a car.** Insurance, servicing, tyres, the annual
 *    test and depreciation together outweigh what goes in the tank. The tax
 *    authority's mileage scale covers all of it and is official — its limit is
 *    that it is national, so it cannot see that insuring a car in one département
 *    costs noticeably more than in another. That gap is real, and the insurers'
 *    pricing that would measure it is not public.
 */
export const mobilite: Domaine = {
  key: "mobilite",
  label: { fr: "Mobilité", en: "Getting around" },
  summary: {
    fr: "Le poste où les données ouvertes sont les meilleures — prix à la station, barème officiel du coût complet — et où l'erreur classique est de ne compter que le carburant.",
    en: "Where open data is at its best — per-station prices, an official all-in scale — and where the classic mistake is to count only fuel.",
  },
  postes: [
    {
      key: "trajet_domicile_travail",
      label: { fr: "Trajet domicile — travail", en: "Home-to-work journey" },
      flow: "contrainte",
      tier: "T1",
      sources: ["ban_itineraire"],
      mesures: [
        {
          key: "distance_routiere",
          label: { fr: "Distance sur le réseau routier", en: "Distance over the road network" },
          unit: "km",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Calculée d'adresse à adresse, à la demande, puis mise en cache. Jamais à vol d'oiseau : l'écart atteint facilement 30 %.",
            en: "Computed address to address, on request, then cached. Never as the crow flies: the gap easily reaches 30 %.",
          },
        },
        {
          key: "temps_trajet",
          label: { fr: "Temps de trajet", en: "Journey time" },
          unit: "min",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "Sans trafic dans la plupart des moteurs : un trajet d'heure de pointe est plus long que ce qui est affiché.",
            en: "Without traffic in most engines: a rush-hour trip is longer than what is shown.",
          },
        },
        {
          key: "cout_en_temps",
          label: { fr: "Heures passées en trajet sur l'année", en: "Hours spent commuting per year" },
          unit: "h/an",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "La deuxième dimension du résultat, et elle reste en heures. La convertir en euros donnerait un chiffre unique impossible à défendre.",
            en: "The result's second dimension, and it stays in hours. Turning it into euros would produce a single number impossible to defend.",
          },
        },
      ],
    },
    {
      key: "voiture",
      label: { fr: "Voiture", en: "Car" },
      flow: "contrainte",
      tier: "T1",
      sources: ["prix_carburants", "bareme_kilometrique", "ademe_carlabelling", "irve_bornes"],
      mesures: [
        {
          key: "prix_carburant_min",
          label: { fr: "Prix du litre le moins cher dans le rayon", en: "Cheapest price per litre within the radius" },
          unit: "€/L",
          stat: "min",
          availability: "open_data",
          note: {
            fr: "Ici le minimum a un sens, contrairement à l'immobilier : c'est une station réelle où l'on peut aller, pas un point aberrant.",
            en: "Here a minimum is meaningful, unlike in housing: it is a real station one can drive to, not an outlier.",
          },
        },
        {
          key: "prix_carburant_median",
          label: { fr: "Prix médian du litre dans le rayon", en: "Median price per litre within the radius" },
          unit: "€/L",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "La valeur retenue par défaut : personne ne fait tous ses pleins à la station la moins chère du secteur.",
            en: "The default figure: nobody fills up every time at the cheapest station around.",
          },
        },
        {
          key: "prix_carburant_max",
          label: { fr: "Prix maximal du litre dans le rayon", en: "Highest price per litre within the radius" },
          unit: "€/L",
          stat: "max",
          availability: "open_data",
        },
        {
          key: "date_releve_carburant",
          label: { fr: "Date du relevé", en: "Reading date" },
          unit: "date",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Le flux bouge toutes les dix minutes : un prix sans sa date n'est pas une donnée, c'est un souvenir.",
            en: "The feed moves every ten minutes: a price without its date is not data, it is a memory.",
          },
        },
        {
          key: "consommation",
          label: { fr: "Consommation du véhicule", en: "Vehicle consumption" },
          unit: "L/100 km",
          stat: "value",
          availability: "user_input",
          note: {
            fr: "La valeur homologuée existe en base ouverte, mais elle est systématiquement optimiste : la consommation constatée par le conducteur est meilleure.",
            en: "The type-approval figure is available as open data, but it is consistently optimistic: the driver's observed consumption is better.",
          },
        },
        {
          key: "cout_complet_km",
          label: { fr: "Coût complet au kilomètre", en: "All-in cost per kilometre" },
          unit: "€/km",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Assurance, entretien, pneus, contrôle technique et usure compris — c'est-à-dire plus que le carburant. National : il ne voit pas l'écart d'assurance entre départements.",
            en: "Insurance, servicing, tyres, the annual test and wear included — that is, more than fuel. National: it cannot see the insurance gap between départements.",
          },
        },
        {
          key: "assurance_auto_locale",
          label: { fr: "Écart d'assurance auto selon le département", en: "Car insurance gap by département" },
          unit: "%",
          stat: "coefficient",
          availability: "unavailable",
          note: {
            fr: "L'écart est réel et connu des assureurs ; leurs tarifs ne sont pas ouverts. Affiché comme non disponible plutôt que remplacé par un chiffre de presse.",
            en: "The gap is real and known to insurers; their pricing is not open. Shown as unavailable rather than replaced by a press figure.",
          },
        },
        {
          key: "recharge_electrique",
          label: { fr: "Part de recharge à domicile et prix des bornes publiques", en: "Share charged at home, and public charging prices" },
          unit: "%",
          stat: "value",
          availability: "user_input",
          note: {
            fr: "L'écart de prix entre la prise du garage et la borne rapide est tel qu'il faut le demander : un appartement sans place de parking, c'est zéro.",
            en: "The price gap between a home socket and a fast charger is wide enough to require asking: a flat with no parking space means zero.",
          },
        },
      ],
    },
    {
      key: "transports_publics",
      label: { fr: "Transports en commun", en: "Public transport" },
      flow: "contrainte",
      tier: "T1",
      sources: ["tarifs_reseaux_tc", "gtfs_tarifs", "code_travail_transport"],
      mesures: [
        {
          key: "abonnement_mensuel",
          label: { fr: "Abonnement mensuel du réseau", en: "Monthly network pass" },
          unit: "€/mois",
          stat: "value",
          availability: "curated",
          note: {
            fr: "Trou surprenant des données ouvertes : le format d'échange des réseaux contient le ticket à l'unité, et seulement chez une partie d'entre eux. Les abonnements se relèvent à la main, réseau par réseau, avec la date.",
            en: "A surprising gap in open data: the networks' exchange format carries the single ticket, and only for some of them. Passes are read by hand, network by network, with the date.",
          },
        },
        {
          key: "ticket_unite",
          label: { fr: "Ticket à l'unité", en: "Single ticket" },
          unit: "€",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Sert aux trajets qui ne sont pas domicile-travail — les courses, notamment, sur lesquelles la participation de l'employeur ne s'applique pas.",
            en: "Used for journeys that are not commutes — shopping runs in particular, on which the employer's share does not apply.",
          },
        },
        {
          key: "desserte",
          label: { fr: "Desserte autour du logement (arrêts, fréquence)", en: "Service around the home (stops, frequency)" },
          unit: "arrêts",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "Décide si une deuxième voiture devient nécessaire — souvent le plus gros effet caché d'un déménagement. Un arrêt n'est pas une desserte : il faut la fréquence.",
            en: "Decides whether a second car becomes necessary — often a move's largest hidden effect. A stop is not a service: frequency is what counts.",
          },
        },
      ],
    },
    {
      key: "courses_et_actif",
      label: { fr: "Courses et modes actifs", en: "Shopping runs and active travel" },
      flow: "contrainte",
      tier: "T1",
      sources: ["insee_bpe", "ban_itineraire", "convention_wherewise", "saisie_utilisateur"],
      mesures: [
        {
          key: "distance_commerce",
          label: { fr: "Distance jusqu'au commerce alimentaire le plus proche", en: "Distance to the nearest food shop" },
          unit: "km",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "C'est la ligne qui traduit « il y a un supermarché à côté » en euros, honnêtement et sans inventer de prix.",
            en: "The row that turns “there's a supermarket nearby” into euros, honestly and without inventing prices.",
          },
        },
        {
          key: "sorties_par_mois",
          label: { fr: "Nombre de sorties courses par mois", en: "Shopping trips per month" },
          unit: "trajets",
          stat: "value",
          availability: "user_input",
          note: {
            fr: "Une habitude, pas une mesure : valeur par défaut proposée, modifiable.",
            en: "A habit, not a measurement: a default is offered and can be changed.",
          },
        },
        {
          key: "amortissement_velo",
          label: { fr: "Amortissement du vélo", en: "Bicycle depreciation" },
          unit: "€/an",
          stat: "value",
          availability: "hypothesis",
          note: {
            fr: "Le seul coût réel du mode actif, et aucune source officielle ne le publie. Le lecteur choisit parmi des repères affichés ; la ligne porte la mention « hypothèse ».",
            en: "The only real cost of active travel, and no official source publishes it. The reader picks from stated reference points; the row is labelled “assumption”.",
          },
        },
        {
          key: "relief",
          label: { fr: "Relief et praticabilité du trajet", en: "Terrain and practicality of the route" },
          unit: "m de dénivelé",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Décide si le vélo est un mode ou une idée. Ne dit rien de la sécurité ni de la saison.",
            en: "Decides whether cycling is a mode or an idea. Says nothing about safety or season.",
          },
        },
      ],
    },
    {
      key: "peages_stationnement",
      label: { fr: "Péages, stationnement, ZFE", en: "Tolls, parking, low-emission zones" },
      flow: "contrainte",
      tier: "T2",
      sources: ["peages", "stationnement", "zfe"],
      mesures: [
        {
          key: "peage_trajet",
          label: { fr: "Péage sur le trajet quotidien", en: "Toll on the daily route" },
          unit: "€/mois",
          stat: "value",
          availability: "unavailable",
          note: {
            fr: "Publié société par société, sans interface commune : à saisir par le lecteur pour les trajets concernés.",
            en: "Published operator by operator with no common interface: entered by the reader for the routes concerned.",
          },
        },
        {
          key: "stationnement_residentiel",
          label: { fr: "Stationnement résidentiel", en: "Residents' parking" },
          unit: "€/mois",
          stat: "value",
          availability: "curated",
          note: {
            fr: "Réel et parfois lourd dans les grandes villes, sans aucun référentiel national : à relever ville par ville.",
            en: "Real and sometimes heavy in large cities, with no national reference at all: read city by city.",
          },
        },
        {
          key: "restriction_zfe",
          label: { fr: "Restriction de circulation applicable au véhicule", en: "Traffic restriction applying to the vehicle" },
          unit: "oui / non",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Pas un coût mensuel mais un couperet : un véhicule non éligible transforme un déménagement en changement de voiture.",
            en: "Not a monthly cost but a cliff edge: an ineligible vehicle turns a move into a change of car.",
          },
        },
      ],
    },
  ],
};

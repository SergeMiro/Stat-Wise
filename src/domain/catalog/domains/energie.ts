import type { Domaine } from "../types";

/**
 * Energy, water, waste and the connection to the outside world.
 *
 * The interesting asymmetry here: the *price* of electricity is national and the
 * *consumption* is intensely local. Nothing about a commune changes the price of
 * a kilowatt-hour, but the same household in the same square metres will burn a
 * very different number of them depending on the climate, the building stock and
 * whether the street has a gas main. So the geography of an energy bill hides
 * entirely inside consumption, and any model that varies the tariff by city is
 * inventing something.
 *
 * Water is the opposite, and the strongest small-item finding in the catalogue:
 * the price per cubic metre genuinely differs by a factor of two between
 * neighbouring communes, and it is published. The catch is that the perimeter is
 * the utility, not the commune, so the mapping has to be done and cannot be
 * assumed.
 */
export const energie: Domaine = {
  key: "energie",
  label: { fr: "Énergie, eau et connexion", en: "Energy, water and connectivity" },
  summary: {
    fr: "Le prix du kWh est national, la consommation est locale : toute la géographie d'une facture d'énergie est dans le bâti et le climat, pas dans le tarif.",
    en: "The kWh price is national, consumption is local: the whole geography of an energy bill sits in the building and the climate, not in the tariff.",
  },
  postes: [
    {
      key: "electricite",
      label: { fr: "Électricité", en: "Electricity" },
      flow: "contrainte",
      tier: "T1",
      sources: ["enedis_conso", "tarif_electricite", "enedis_thermosensibilite", "meteo_france_dju"],
      mesures: [
        {
          key: "conso_moyenne",
          label: { fr: "Consommation annuelle moyenne du secteur", en: "Average annual consumption in the area" },
          unit: "kWh/an",
          stat: "mean",
          availability: "open_data",
          note: {
            fr: "Publié jusqu'à la maille du quartier, avec un seuil d'anonymat en dessous duquel rien ne sort. C'est le porteur de toute la variation géographique de la facture.",
            en: "Published down to neighbourhood level, with an anonymity threshold below which nothing is released. It carries all the geographic variation in the bill.",
          },
        },
        {
          key: "prix_kwh",
          label: { fr: "Prix du kWh et abonnement", en: "Price per kWh and standing charge" },
          unit: "€/kWh",
          stat: "value",
          availability: "official_rule",
          note: {
            fr: "National, révisé deux fois par an. À afficher avec quatre décimales : arrondi à deux, ce n'est plus le tarif.",
            en: "National, revised twice a year. Shown to four decimals: rounded to two it stops being the tariff.",
          },
        },
        {
          key: "thermosensibilite",
          label: { fr: "Thermosensibilité du secteur", en: "Thermal sensitivity of the area" },
          unit: "kWh/°C",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Ce qui transforme le climat d'une ville en euros. C'est de l'économétrie de quartier, pas la facture d'un logement précis.",
            en: "What turns a city's climate into euros. Neighbourhood econometrics, not one dwelling's bill.",
          },
        },
        {
          key: "dju",
          label: { fr: "Degrés-jours de chauffage", en: "Heating degree days" },
          unit: "DJU",
          stat: "mean",
          availability: "open_data",
          note: {
            fr: "Mesuré en station : rattacher une station à une commune ajoute une erreur qu'il faut assumer plutôt que masquer.",
            en: "Measured at a weather station: tying one to a commune adds an error to be owned rather than hidden.",
          },
        },
      ],
    },
    {
      key: "chauffage",
      label: { fr: "Mode de chauffage disponible", en: "Available heating" },
      flow: "contrainte",
      tier: "T2",
      sources: ["grdf_reseau", "france_chaleur_urbaine", "ademe_dpe"],
      mesures: [
        {
          key: "gaz_disponible",
          label: { fr: "Commune desservie en gaz naturel", en: "Commune served by mains gas" },
          unit: "oui / non",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Sans réseau, le chauffage bascule sur l'électricité, le fioul ou une pompe à chaleur — et le coût du chauffage change de nature, pas seulement de montant.",
            en: "With no mains, heating shifts to electricity, oil or a heat pump — and the cost of heating changes in kind, not just in amount.",
          },
        },
        {
          key: "reseau_chaleur",
          label: { fr: "Raccordement possible à un réseau de chaleur", en: "Possible connection to a district heating network" },
          unit: "oui / non",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Souvent moins cher et plus stable, mais la couverture est fragmentaire et dépend de la distance au tracé.",
            en: "Often cheaper and steadier, but coverage is patchy and depends on distance to the pipe.",
          },
        },
        {
          key: "dpe_cout_5_usages",
          label: { fr: "Coût annuel estimé des cinq usages (DPE)", en: "Estimated annual cost, five uses (energy rating)" },
          unit: "€/an",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Disponible à l'adresse pour les logements diagnostiqués depuis 2021 — le seul chiffre d'énergie rattaché à un bâtiment précis. C'est une estimation conventionnelle, pas une facture.",
            en: "Available per address for dwellings surveyed since 2021 — the only energy figure tied to an actual building. A conventional estimate, not a bill.",
          },
        },
      ],
    },
    {
      key: "eau",
      label: { fr: "Eau et assainissement", en: "Water and sewerage" },
      flow: "contrainte",
      tier: "T1",
      sources: ["sispea_eau"],
      mesures: [
        {
          key: "prix_m3",
          label: { fr: "Prix du m³, eau potable et assainissement", en: "Price per m³, drinking water and sewerage" },
          unit: "€/m³",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Petit poste, mais l'un des rares vrais écarts entre communes voisines : du simple au double, et publié. Le périmètre est le service, pas la commune.",
            en: "A small item, but one of the few genuine gaps between neighbouring communes: up to double, and published. The perimeter is the utility, not the commune.",
          },
        },
        {
          key: "millesime_valide",
          label: { fr: "Dernier exercice validé", en: "Latest validated year" },
          unit: "année",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "La validation prend un à deux ans : ce prix est vrai, mais il a un âge, et l'afficher sans l'âge serait tricher.",
            en: "Validation lags by a year or two: the price is true, but it has an age, and showing it without that age would be cheating.",
          },
        },
      ],
    },
    {
      key: "telecom",
      label: { fr: "Internet et téléphonie", en: "Internet and phone" },
      flow: "contrainte",
      tier: "T2",
      sources: ["arcep_connexion", "saisie_utilisateur"],
      mesures: [
        {
          key: "eligibilite_fibre",
          label: { fr: "Éligibilité à la fibre à l'adresse", en: "Fibre eligibility at the address" },
          unit: "oui / non",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Publié à l'adresse, ce qui est rare et précieux. Éligible ne veut pas dire raccordé, et le dataset ne contient aucun prix.",
            en: "Published per address, which is rare and valuable. Eligible does not mean connected, and the dataset carries no prices.",
          },
        },
        {
          key: "abonnement_telecom",
          label: { fr: "Abonnement internet et mobile du ménage", en: "The household's internet and mobile bill" },
          unit: "€/mois",
          stat: "value",
          availability: "user_input",
          note: {
            fr: "Le prix ne dépend pas du lieu, la technologie disponible oui : sans fibre, l'offre équivalente est plus chère ou plus lente.",
            en: "The price does not depend on place, the available technology does: without fibre the equivalent plan is dearer or slower.",
          },
        },
      ],
    },
  ],
};

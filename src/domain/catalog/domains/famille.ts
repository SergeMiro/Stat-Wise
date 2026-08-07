import type { Domaine } from "../types";

/**
 * Children, schooling and health.
 *
 * Childcare is the sharpest example in the whole catalogue of a distinction this
 * product refuses to blur: the *price* of a nursery place is computable to the
 * cent from a published national scale, and the *existence* of a place is not
 * knowable at all. Open data lists facilities and their capacity; it does not and
 * cannot say whether a given child will get in. So the euro figure is exact and
 * the availability is never asserted — and the two live side by side without one
 * borrowing credibility from the other.
 *
 * The same rule governs schools: addresses are published, catchment areas and
 * admissions are not. A map of nearby schools is access, not a placement.
 *
 * The municipal items — canteen, after-school care — are the quiet gap. They are
 * real money, they vary enormously between towns, they are usually means-tested,
 * and there is no national dataset of any kind. They are curated by hand for the
 * cities we cover, with the date they were read, or they are shown as unknown.
 */
export const famille: Domaine = {
  key: "famille",
  label: { fr: "Enfants, école et santé", en: "Children, school and health" },
  summary: {
    fr: "Le prix d'une place en crèche se calcule au centime ; savoir s'il y a une place ne se sait pas. Les deux se disent, jamais l'un à la place de l'autre.",
    en: "The price of a nursery place computes to the cent; whether there is a place cannot be known. Both are said — never one in place of the other.",
  },
  postes: [
    {
      key: "garde_jeune_enfant",
      label: { fr: "Garde du jeune enfant", en: "Early-years childcare" },
      flow: "contrainte",
      tier: "T1",
      sources: ["bareme_psu_cnaf", "cnaf_eaje", "openfisca", "cnaf_assmat"],
      mesures: [
        {
          key: "tarif_horaire_creche",
          label: { fr: "Tarif horaire de crèche selon les ressources", en: "Hourly nursery rate by household resources" },
          unit: "€/h",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Barème national : un taux d'effort appliqué aux ressources, avec un plancher et un plafond. Exact, à condition de connaître les ressources de référence et les heures du contrat.",
            en: "A national scale: an effort rate applied to resources, with a floor and a ceiling. Exact, provided the reference income and contracted hours are known.",
          },
        },
        {
          key: "capacite_eaje",
          label: { fr: "Places existantes en établissement d'accueil", en: "Existing places in childcare facilities" },
          unit: "places",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "Des places qui existent, jamais une place disponible. La règle du projet est de ne jamais laisser croire le contraire.",
            en: "Places that exist — never an available place. The project rule is to never let anyone believe otherwise.",
          },
        },
        {
          key: "tarif_assmat",
          label: { fr: "Tarif horaire moyen d'assistante maternelle", en: "Average childminder hourly rate" },
          unit: "€/h",
          stat: "mean",
          availability: "open_data",
          note: {
            fr: "Moyenne départementale ; le contrat réel se négocie et s'en écarte souvent.",
            en: "A département average; the actual contract is negotiated and often departs from it.",
          },
        },
        {
          key: "cmg",
          label: { fr: "Complément de libre choix du mode de garde", en: "Childcare choice supplement" },
          unit: "€/mois",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Se soustrait du coût de garde, et le mode de calcul a changé récemment : à revérifier à chaque millésime plutôt qu'à recopier.",
            en: "Subtracted from the childcare cost, and its calculation changed recently: recheck each edition rather than copying it forward.",
          },
        },
        {
          key: "credit_impot_garde",
          label: { fr: "Crédit d'impôt pour frais de garde", en: "Childcare tax credit" },
          unit: "€/an",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Réel mais décalé d'un an : à montrer sur sa propre ligne, pas fondu dans le coût mensuel.",
            en: "Real but a year late: shown on its own line, not melted into the monthly cost.",
          },
        },
      ],
    },
    {
      key: "scolarite",
      label: { fr: "Scolarité", en: "Schooling" },
      flow: "contrainte",
      tier: "T2",
      sources: ["education_annuaire", "tarifs_municipaux"],
      mesures: [
        {
          key: "etablissements_proximite",
          label: { fr: "Établissements scolaires à proximité", en: "Schools nearby" },
          unit: "établissements",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "Des adresses, rien de plus : ni la carte scolaire, ni l'affectation. Promettre l'un des deux serait faux et vérifiable.",
            en: "Addresses, nothing more: neither the catchment map nor the placement. Promising either would be false and checkable.",
          },
        },
        {
          key: "cantine",
          label: { fr: "Repas de cantine", en: "School meals" },
          unit: "€/repas",
          stat: "value",
          availability: "curated",
          note: {
            fr: "Aucune base nationale, presque toujours au quotient familial : relevé ville par ville, avec la date, ou affiché comme inconnu.",
            en: "No national database, nearly always means-tested: read city by city with the date, or shown as unknown.",
          },
        },
        {
          key: "periscolaire",
          label: { fr: "Périscolaire et centre de loisirs", en: "After-school and holiday care" },
          unit: "€/mois",
          stat: "value",
          availability: "curated",
        },
      ],
    },
    {
      key: "sante",
      label: { fr: "Santé", en: "Health" },
      flow: "contrainte",
      tier: "T2",
      sources: ["drees_apl", "ameli_annuaire", "marche_assurances", "saisie_utilisateur"],
      mesures: [
        {
          key: "accessibilite_medecins",
          label: { fr: "Accessibilité potentielle aux médecins généralistes", en: "Potential access to general practitioners" },
          unit: "consultations/an/hab.",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Une accessibilité théorique qui tient compte de l'offre et de la demande alentour. Ce n'est ni « le médecin le plus proche » ni un rendez-vous obtenu.",
            en: "A theoretical access measure accounting for supply and demand nearby. Neither “the nearest doctor” nor an appointment obtained.",
          },
        },
        {
          key: "part_secteur_2",
          label: { fr: "Part de praticiens autorisés à dépasser le tarif", en: "Share of practitioners allowed to charge above the tariff" },
          unit: "%",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "De l'argent réel qui sort de la poche, et très inégal selon les villes. Le secteur donne un droit à dépassement, pas un montant.",
            en: "Real money out of pocket, and very uneven between cities. The sector confers a right to charge more, not an amount.",
          },
        },
        {
          key: "mutuelle",
          label: { fr: "Complémentaire santé", en: "Top-up health cover" },
          unit: "€/mois",
          stat: "value",
          availability: "user_input",
          note: {
            fr: "Poste fixe et lourd, sans aucune donnée ouverte de tarif : la cotisation réelle du ménage, ou rien.",
            en: "A heavy fixed item with no open pricing data at all: the household's actual premium, or nothing.",
          },
        },
      ],
    },
  ],
};

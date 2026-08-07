import type { Domaine } from "../types";

/**
 * What comes in, and what the state takes out before anything is spent.
 *
 * This is the largest single lever in the whole model — the gap between two
 * cities on net pay after tax dwarfs the gap on rent — and it is also the part
 * that is *exactly* computable, because it is a ruleset rather than a
 * measurement. Income tax, benefits, the nursery scale: give the rules a fully
 * described household and they return a number that can be checked against a tax
 * notice, not an estimate with an error bar.
 *
 * That is why the rules engine outranks every dataset here in the build order.
 * Four of the lines the simulator currently shows as "non chiffré" are not
 * missing for want of data — they are missing for want of the rules being wired
 * in, which is a very different kind of hole and a far more embarrassing one.
 */
export const revenus: Domaine = {
  key: "revenus",
  label: { fr: "Revenus et prélèvements", en: "Income and deductions" },
  summary: {
    fr: "Le plus gros écart entre deux villes, et le seul poste calculable à l'euro près : ce sont des règles, pas des statistiques.",
    en: "The biggest gap between two cities, and the only item computable to the euro: these are rules, not statistics.",
  },
  postes: [
    {
      key: "salaire",
      label: { fr: "Salaire", en: "Salary" },
      flow: "revenu",
      tier: "T1",
      sources: ["openfisca", "insee_salaires", "france_travail_offres", "saisie_utilisateur"],
      mesures: [
        {
          key: "brut_vers_net",
          label: { fr: "Passage du brut au net", en: "Gross to net" },
          unit: "€/mois",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Cotisations sociales appliquées à la lettre. Le statut — cadre ou non — change les taux, donc il doit être demandé et non supposé.",
            en: "Social contributions applied to the letter. Status — managerial or not — changes the rates, so it must be asked, not assumed.",
          },
        },
        {
          key: "net_apres_impot",
          label: { fr: "Net après impôt sur le revenu", en: "Net after income tax" },
          unit: "€/mois",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Se calcule sur le foyer fiscal, jamais sur une personne : sans le revenu du conjoint et le nombre de parts, le résultat est faux, pas approximatif.",
            en: "Computed on the tax household, never on a person: without the partner's income and the number of shares the result is wrong, not approximate.",
          },
        },
        {
          key: "salaire_median_zone",
          label: { fr: "Salaire net médian du métier dans la zone d'emploi", en: "Median net pay for the occupation in the employment zone" },
          unit: "€/mois",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "Sert à juger si une offre est réaliste. Mesuré en équivalent temps plein : ce n'est pas le salaire écrit dans une annonce.",
            en: "Used to judge whether an offer is realistic. Measured full-time-equivalent: it is not the pay written in a job ad.",
          },
        },
        {
          key: "salaire_p25_p75_zone",
          label: { fr: "1er et 3e quartiles du salaire dans la zone", en: "First and third quartiles of pay in the zone" },
          unit: "€/mois",
          stat: "p25",
          availability: "open_data",
          note: {
            fr: "La vraie fourchette. Bien plus utile qu'une moyenne, qui pour les salaires est toujours au-dessus de la médiane.",
            en: "The real range. Far more useful than a mean, which on pay always sits above the median.",
          },
        },
        {
          key: "salaire_offres_reelles",
          label: { fr: "Salaires affichés dans les offres en cours", en: "Pay stated in current job ads" },
          unit: "€/mois",
          stat: "median",
          availability: "open_data",
          note: {
            fr: "Temps réel et à la commune, mais renseigné dans une minorité d'offres : à traiter comme un échantillon biaisé, pas comme le marché.",
            en: "Real time and per commune, but stated in a minority of ads: treat as a biased sample, not as the market.",
          },
        },
        {
          key: "salaire_actuel",
          label: { fr: "Salaire actuel du ménage", en: "The household's current pay" },
          unit: "€/mois",
          stat: "value",
          availability: "user_input",
          note: {
            fr: "Le socle de toute la comparaison : la situation actuelle est un fait, la situation visée est une estimation. Les deux ne doivent jamais être calculées de la même façon.",
            en: "The bedrock of the comparison: the current situation is a fact, the target one an estimate. The two must never be computed the same way.",
          },
        },
      ],
    },
    {
      key: "prestations",
      label: { fr: "Prestations et aides", en: "Benefits and allowances" },
      flow: "revenu",
      tier: "T1",
      sources: ["openfisca"],
      mesures: [
        {
          key: "apl",
          label: { fr: "Aide au logement", en: "Housing benefit" },
          unit: "€/mois",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Dépend du loyer, de la zone et des ressources : c'est la prestation qui réagit le plus à un déménagement, donc celle qu'on ne peut pas laisser vide.",
            en: "Depends on rent, zone and resources: the benefit that reacts most to a move, and therefore the one that cannot be left blank.",
          },
        },
        {
          key: "prime_activite",
          label: { fr: "Prime d'activité et RSA", en: "Activity bonus and minimum income" },
          unit: "€/mois",
          stat: "rule",
          availability: "official_rule",
        },
        {
          key: "allocations_familiales",
          label: { fr: "Allocations familiales et compléments", en: "Family allowances and supplements" },
          unit: "€/mois",
          stat: "rule",
          availability: "official_rule",
        },
      ],
    },
    {
      key: "avantages_employeur",
      label: { fr: "Avantages liés à l'emploi", en: "Employment-linked benefits" },
      flow: "revenu",
      tier: "T1",
      sources: ["code_travail_transport", "saisie_utilisateur"],
      mesures: [
        {
          key: "participation_transport",
          label: { fr: "Participation de l'employeur à l'abonnement de transport", en: "Employer's share of the transport pass" },
          unit: "%",
          stat: "rule",
          availability: "official_rule",
          note: {
            fr: "Obligation légale qui coupe l'abonnement de moitié — mais uniquement le trajet domicile-travail. Elle ne s'applique ni au carburant ni aux courses.",
            en: "A legal obligation that halves the pass — but only for the commute. It applies neither to fuel nor to shopping trips.",
          },
        },
        {
          key: "teletravail",
          label: { fr: "Jours de télétravail par semaine", en: "Remote-work days per week" },
          unit: "jours",
          stat: "value",
          availability: "user_input",
          note: {
            fr: "Recalcule le transport, ne le supprime pas : l'abonnement reste souvent utile et la voiture reste assurée.",
            en: "Recomputes transport, does not remove it: the pass often stays worthwhile and the car stays insured.",
          },
        },
        {
          key: "titres_restaurant",
          label: { fr: "Titres-restaurant et mutuelle d'entreprise", en: "Meal vouchers and employer health cover" },
          unit: "€/mois",
          stat: "value",
          availability: "user_input",
        },
      ],
    },
    {
      key: "risque_emploi",
      label: { fr: "Solidité du marché du travail local", en: "Strength of the local job market" },
      flow: "contexte",
      tier: "T2",
      sources: ["france_travail_offres", "insee_salaires"],
      mesures: [
        {
          key: "tension_metier",
          label: { fr: "Tension de recrutement sur le métier dans le bassin", en: "Recruitment tension for the occupation in the area" },
          unit: "indice",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Un risque, pas un euro : ce qui se passe si l'offre tombe. À montrer à côté du résultat, jamais dedans.",
            en: "A risk, not a euro: what happens if the offer falls through. Shown beside the result, never inside it.",
          },
        },
        {
          key: "chomage_zone",
          label: { fr: "Taux de chômage localisé", en: "Localised unemployment rate" },
          unit: "%",
          stat: "value",
          availability: "open_data",
        },
      ],
    },
  ],
};

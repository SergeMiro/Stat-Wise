import type { Domaine } from "../types";

/**
 * Everything that changes a decision without entering the total.
 *
 * These rows exist to be kept *out* of the money. A single number that silently
 * folded in air quality and recorded crime would be impossible to defend and
 * impossible to check — the reader could never tell whether a neighbourhood
 * ranked low because it was expensive or because a monitoring station happened to
 * sit next to a motorway. So context is a second axis, shown beside the euros and
 * never inside them.
 *
 * Each of these datasets also carries a caveat sharp enough that presenting the
 * figure alone would mislead. Recorded crime is as much a measure of policing and
 * of who bothers to report as of crime. Air quality at a given address is
 * modelled from a handful of stations. A natural hazard is a probability, not a
 * damage — though it does turn into money later, through the insurance premium
 * and the resale price.
 */
export const contexte: Domaine = {
  key: "contexte",
  label: { fr: "Contexte non monétaire", en: "Non-monetary context" },
  summary: {
    fr: "Ce qui change une décision sans entrer dans le total. Affiché à côté des euros, jamais dedans — sinon plus personne ne peut vérifier le chiffre.",
    en: "What changes a decision without entering the total. Shown beside the euros, never inside them — otherwise nobody can check the figure.",
  },
  postes: [
    {
      key: "securite",
      label: { fr: "Sécurité", en: "Safety" },
      flow: "contexte",
      tier: "T2",
      sources: ["ssmsi_delinquance"],
      mesures: [
        {
          key: "faits_enregistres",
          label: { fr: "Faits enregistrés pour 1 000 habitants", en: "Recorded offences per 1,000 inhabitants" },
          unit: "faits/1 000 hab.",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Ce sont des faits enregistrés : autant une mesure de l'activité policière et de la propension à porter plainte que de la délinquance. Le dire est obligatoire, sinon le chiffre ment tout seul.",
            en: "These are recorded offences: as much a measure of police activity and of willingness to report as of crime. Saying so is mandatory, or the figure lies by itself.",
          },
        },
        {
          key: "granularite_securite",
          label: { fr: "Niveau géographique réellement disponible", en: "Geographic level actually available" },
          unit: "commune / département",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Rien en dessous de la commune. Un classement « par quartier » de la sécurité n'existe pas et ne doit pas être fabriqué.",
            en: "Nothing below the commune. A “by neighbourhood” safety ranking does not exist and must not be manufactured.",
          },
        },
      ],
    },
    {
      key: "environnement",
      label: { fr: "Air, bruit, risques", en: "Air, noise, hazards" },
      flow: "contexte",
      tier: "T2",
      sources: ["qualite_air", "bruit", "georisques"],
      mesures: [
        {
          key: "qualite_air",
          label: { fr: "Concentration des principaux polluants", en: "Concentration of the main pollutants" },
          unit: "µg/m³",
          stat: "mean",
          availability: "open_data",
          note: {
            fr: "Mesuré en quelques stations puis interpolé : la valeur d'une adresse est modélisée, pas relevée.",
            en: "Measured at a few stations then interpolated: an address value is modelled, not read.",
          },
        },
        {
          key: "bruit",
          label: { fr: "Exposition au bruit des transports", en: "Exposure to transport noise" },
          unit: "dB(A)",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "Cartes réglementaires limitées aux grandes agglomérations et aux axes classés : ailleurs, la donnée n'existe pas.",
            en: "Statutory maps limited to large conurbations and classified routes: elsewhere the data does not exist.",
          },
        },
        {
          key: "risques_adresse",
          label: { fr: "Risques naturels et technologiques à l'adresse", en: "Natural and technological hazards at the address" },
          unit: "risques",
          stat: "count",
          availability: "open_data",
          note: {
            fr: "Disponible à l'adresse, ce qui est rare. Un aléa n'est pas un dommage — mais il pèse sur la prime d'assurance et sur la revente, donc il finit en argent.",
            en: "Available per address, which is rare. A hazard is not damage — but it weighs on the premium and on resale, so it ends up as money.",
          },
        },
      ],
    },
    {
      key: "temps",
      label: { fr: "Temps", en: "Time" },
      flow: "contexte",
      tier: "T1",
      sources: ["ban_itineraire"],
      mesures: [
        {
          key: "heures_trajet_an",
          label: { fr: "Heures de trajet domicile-travail par an", en: "Commuting hours per year" },
          unit: "h/an",
          stat: "value",
          availability: "open_data",
          note: {
            fr: "La deuxième colonne du résultat, et elle reste en heures. Beaucoup de comparateurs la monétisent : cela produit un chiffre unique que personne ne peut contester ni vérifier.",
            en: "The result's second column, and it stays in hours. Many comparison tools monetise it: that yields a single number nobody can contest or check.",
          },
        },
      ],
    },
  ],
};

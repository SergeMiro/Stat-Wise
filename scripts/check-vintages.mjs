/**
 * Freshness gate for the figures the simulators charge money on.
 *
 * The cheapest way to lose a user's trust is a barème from two years ago shown
 * without a word. So every rule and dataset below has an owner and a date by
 * which it must be re-checked; this script fails once one of them is overdue.
 *
 * It is a script rather than a unit test on purpose: a test carrying a deadline
 * would start failing on its own one morning, in a run that changed nothing, and
 * would be silenced rather than fixed.
 *
 *   npm run check:vintages
 *
 * Reviewing an entry means opening the URL, confirming the figure in the code,
 * then moving `nextReview` forward. Nothing else.
 */

const REGISTRY = [
  {
    code: "bareme_psu_cnaf",
    what: "Barème PSU crèche — taux et plancher/plafond de ressources",
    where: "src/domain/reste-a-vivre/snapshot.ts → crecheScale",
    owner: "produit",
    cycle: "annuel, publié en décembre",
    nextReview: "2026-09-01",
    url: "https://www.caf.fr/partenaires/caf-de-paris/partenaires-locaux/petite-enfance",
    note: "Un barème 2026 a été publié le 15/12/2025 et n'est pas encore intégré.",
  },
  {
    code: "bareme_kilometrique",
    what: "Barème kilométrique DGFiP et majoration 20 % véhicule électrique",
    where: "src/domain/reste-a-vivre/snapshot.ts → carVariableCostPerKm, electricVehicleUplift",
    owner: "produit",
    cycle: "annuel, arrêté de février",
    nextReview: "2027-03-01",
    url: "https://www.impots.gouv.fr/particulier/questions/comment-calculer-mes-frais-kilometriques",
    note: "Vérifié contre l'arrêté du 16/02/2026 : barème inchangé depuis 2024.",
  },
  {
    code: "carte_loyers",
    what: "Loyers d'annonce €/m² charges comprises (millésime 2025)",
    where: "src/domain/reste-a-vivre/snapshot.ts → centralRentPerSqm",
    owner: "données",
    cycle: "annuel",
    nextReview: "2026-10-01",
    url: "https://www.data.gouv.fr/datasets/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025",
    note: "Valeurs d'amorçage : à remplacer par l'ETL, pas seulement à rafraîchir.",
  },
  {
    code: "gtfs_tarifs",
    what: "Abonnements et tickets des réseaux de transport",
    where: "src/domain/reste-a-vivre/snapshot.ts → transitPassMonthly, transitTicketUnit",
    owner: "données",
    cycle: "à chaque changement de grille, au moins annuel",
    nextReview: "2026-09-15",
    url: "https://transport.data.gouv.fr/",
    note: "Navigo 2026 à confirmer (sources divergentes : 90,80 € contre 101,50 €). Gratuité TaM pour les résidents à reconfirmer chaque année.",
  },
  {
    code: "tarif_electricite",
    what: "Prix du kWh et abonnement",
    where: "src/domain/reste-a-vivre/snapshot.ts → electricityPricePerKwh",
    owner: "données",
    cycle: "révision semestrielle",
    nextReview: "2027-02-01",
    url: "https://www.cre.fr/",
    note: "",
  },
  {
    code: "publicChargingPrice",
    what: "Prix de la recharge sur borne publique (hypothèse)",
    where: "src/domain/reste-a-vivre/snapshot.ts → publicChargingPricePerKwh",
    owner: "produit",
    cycle: "annuel",
    nextReview: "2027-01-01",
    url: "https://transport.data.gouv.fr/datasets/fichier-consolide-des-bornes-de-recharge-pour-vehicules-electriques",
    note: "Reste une hypothèse tant que le champ tarification de l'IRVE n'est pas exploitable.",
  },
  {
    code: "alur_honoraires",
    what: "Plafonds d'honoraires de location par zone",
    where: "src/domain/reste-a-vivre/snapshot.ts → moveCostRules.agencyFeeCapPerSqm",
    owner: "produit",
    cycle: "à chaque décret",
    nextReview: "2027-01-01",
    url: "https://www.service-public.fr/particuliers/vosdroits/F1168",
    note: "",
  },
  {
    code: "insee_ecsp",
    what: "Écart spatial des prix (Île-de-France +7 %)",
    where: "src/domain/reste-a-vivre/snapshot.ts → parisRegionFoodPremium",
    owner: "données",
    cycle: "tous les 5 à 6 ans",
    nextReview: "2028-01-01",
    url: "https://www.insee.fr/fr/statistiques/7649921",
    note: "Enquête 2022 : la prochaine ne sortira pas avant plusieurs années.",
  },
];

// The date is read from the clock rather than hard-coded, which is precisely why
// this lives in a script and not in the test suite.
const today = new Date();
const iso = today.toISOString().slice(0, 10);

const overdue = [];
const soon = [];

for (const entry of REGISTRY) {
  const due = new Date(`${entry.nextReview}T00:00:00Z`);
  const days = Math.round((due - today) / 86400000);
  if (days < 0) overdue.push({ ...entry, days });
  else if (days <= 45) soon.push({ ...entry, days });
}

const pad = (s, n) => String(s).padEnd(n);

console.log(`\nFraîcheur des données et barèmes — ${iso}\n`);
for (const entry of REGISTRY) {
  const due = new Date(`${entry.nextReview}T00:00:00Z`);
  const days = Math.round((due - today) / 86400000);
  const mark = days < 0 ? "OVERDUE" : days <= 45 ? "bientôt" : "ok";
  console.log(`  ${pad(mark, 8)} ${pad(entry.code, 22)} ${entry.nextReview}  ${entry.what}`);
}

if (soon.length > 0) {
  console.log("\nÀ revoir bientôt :");
  for (const e of soon) console.log(`  ${e.code} — dans ${e.days} j — ${e.url}`);
}

if (overdue.length > 0) {
  console.log("\nEn retard — à revoir avant de publier :");
  for (const e of overdue) {
    console.log(`\n  ${e.code} (${-e.days} j de retard)`);
    console.log(`    quoi      ${e.what}`);
    console.log(`    où        ${e.where}`);
    console.log(`    cycle     ${e.cycle}`);
    console.log(`    source    ${e.url}`);
    if (e.note) console.log(`    note      ${e.note}`);
  }
  console.log(
    `\n${overdue.length} entrée(s) en retard. Vérifiez la valeur, puis avancez nextReview.\n`,
  );
  process.exit(1);
}

console.log(`\n${REGISTRY.length} entrées, aucune en retard.\n`);

/**
 * Replaces the last two seeded household bills with measured ones: electricity
 * consumption and the price of water.
 *
 *   node --experimental-strip-types scripts/etl/build-utilities.ts
 *
 *   électricité → Enedis, consommation annuelle résidentielle par adresse
 *   eau potable → SISPEA via Hub'Eau, indicateur D102.0, périmètre du service
 *   assainissement → SISPEA, indicateur D204.0, médiane nationale
 *
 * No key and no account for either.
 *
 * Two decisions worth reading before changing anything here.
 *
 * **Sewerage is a national median, on purpose.** A household pays for drinking
 * water and for sewerage, and the result line says "eau et assainissement". Only
 * three of our fourteen communes publish D204.0, at years as far apart as 2013 and
 * 2019. Using the local figure where it exists and a national one elsewhere would
 * invent a difference between two cities that is an artefact of who filed a return,
 * not of what anyone pays. A uniform national median cannot manufacture that
 * difference: it cancels out of the comparison and is labelled for what it is.
 *
 * **Electricity is Enedis-only, and that is not the whole energy bill.** The figure
 * is consumption at residential delivery points. A dwelling heated by gas or by a
 * réseau de chaleur consumes fewer kWh and pays elsewhere. The engine declares that
 * gap as an omitted line rather than inflating the kWh to cover it, which is what
 * the seed values silently did while citing Enedis as their source.
 */

import { readFile, writeFile } from "node:fs/promises";

import { cities } from "../../src/domain/reste-a-vivre/snapshot.ts";

const HUBEAU = "https://hubeau.eaufrance.fr/api/v0/indicateurs_services/communes";
const ENEDIS =
  "https://opendata.enedis.fr/api/explore/v2.1/catalog/datasets/consommation-annuelle-residentielle-par-adresse/records";

const OUT = "src/domain/reste-a-vivre/utilities.json";

/** The freshest year SISPEA publishes through Hub'Eau. Checked, not assumed. */
const SEWERAGE_YEAR = 2019;
/** Pages of 1000 communes to read when taking the national median. */
const SEWERAGE_PAGES = 6;

type Json = Record<string, unknown>;

/** One fetch, retried, that names its failure instead of returning null. */
async function getJson(url: string, label: string): Promise<Json | { failed: string }> {
  let last = "aucune tentative";
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return (await response.json()) as Json;
      last = `http ${response.status}`;
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
  return { failed: `${label}: ${last}` };
}

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
};

const round = (value: number, digits: number) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

/* ------------------------------------------------------------------ eau ---- */

type WaterRow = { pricePerM3: number; year: number };

type HubEauRow = {
  annee: number;
  noms_service?: string[] | null;
  indicateurs?: Record<string, number | null> | null;
};

/**
 * Latest published drinking-water price for a commune.
 *
 * A commune can appear several times in one year — one row per service, and
 * Versailles has three. Only the drinking-water service carries D102.0, so reading
 * the indicator is itself the filter; no name matching is needed.
 */
async function waterFor(communeCode: string): Promise<WaterRow | { failed: string }> {
  const url = `${HUBEAU}?code_commune=${communeCode}&size=60&fields=annee,noms_service,indicateurs`;
  const body = await getJson(url, `eau ${communeCode}`);
  if ("failed" in body) return body as { failed: string };

  const rows = (body.data ?? []) as HubEauRow[];
  let best: WaterRow | null = null;
  for (const row of rows) {
    const price = row.indicateurs?.["D102.0"];
    if (typeof price !== "number") continue;
    if (!best || row.annee > best.year) best = { pricePerM3: price, year: row.annee };
  }
  return best ?? { failed: `eau ${communeCode}: aucun D102.0 publié` };
}

/** National median sewerage price — the uniform half of the water bill. */
async function sewerageMedian(): Promise<{ pricePerM3: number; year: number; communes: number }> {
  const prices: number[] = [];
  for (let page = 1; page <= SEWERAGE_PAGES; page += 1) {
    const url = `${HUBEAU}?annee=${SEWERAGE_YEAR}&size=1000&page=${page}&fields=indicateurs`;
    const body = await getJson(url, `assainissement page ${page}`);
    if ("failed" in body) break;
    const rows = (body.data ?? []) as HubEauRow[];
    if (rows.length === 0) break;
    for (const row of rows) {
      const price = row.indicateurs?.["D204.0"];
      if (typeof price === "number") prices.push(price);
    }
  }
  if (prices.length < 200) {
    throw new Error(`assainissement: seulement ${prices.length} communes, médiane non fiable`);
  }
  return { pricePerM3: round(median(prices), 2), year: SEWERAGE_YEAR, communes: prices.length };
}

/* ---------------------------------------------------------- électricité ---- */

type PowerRow = { kwhYear: number; year: number; addresses: number };

/**
 * Latest annual residential consumption per delivery point, in kWh.
 *
 * Enedis repeats the commune average on every address row, so grouping by year and
 * averaging returns that same figure rather than an aggregate of my own making —
 * the publisher's number, not my arithmetic on top of it.
 */
async function powerFor(communeCode: string): Promise<PowerRow | { failed: string }> {
  const select =
    "annee,avg(consommation_annuelle_moyenne_de_la_commune_mwh) as mwh,count(*) as rows";
  const url =
    `${ENEDIS}?where=${encodeURIComponent(`code_commune="${communeCode}"`)}` +
    `&select=${encodeURIComponent(select)}&group_by=annee&order_by=${encodeURIComponent("annee desc")}&limit=3`;

  const body = await getJson(url, `élec ${communeCode}`);
  if ("failed" in body) return body as { failed: string };

  const rows = (body.results ?? []) as Array<{ annee?: string; mwh?: number; rows?: number }>;
  for (const row of rows) {
    if (typeof row.mwh !== "number" || !row.annee) continue;
    return {
      kwhYear: Math.round(row.mwh * 1000),
      year: Number(row.annee),
      addresses: row.rows ?? 0,
    };
  }
  return { failed: `élec ${communeCode}: aucune ligne (réseau non desservi par Enedis ?)` };
}

/**
 * Enedis' own national average, kept for reference only.
 *
 * It is *not* what an unserved commune falls back to: it is address-weighted over
 * the whole country, so rural communes on electric heating pull it well above what
 * any large city consumes. The snapshot falls back to the median of the large
 * communes actually measured, which is the closer comparison.
 */
async function nationalAverage(year: number): Promise<number | null> {
  const select = "avg(consommation_annuelle_moyenne_de_la_commune_mwh) as mwh";
  const url =
    `${ENEDIS}?where=${encodeURIComponent(`annee="${year}"`)}` +
    `&select=${encodeURIComponent(select)}&limit=1`;
  const body = await getJson(url, "moyenne nationale");
  if ("failed" in body) return null;
  const rows = (body.results ?? []) as Array<{ mwh?: number }>;
  const mwh = rows[0]?.mwh;
  return typeof mwh === "number" ? Math.round(mwh * 1000) : null;
}

/* ----------------------------------------------------------------- run ---- */

type City = {
  waterPotablePerM3: number;
  waterYear: number;
  electricityKwhYear: number | null;
  electricityYear: number | null;
};

type Stored = { cities?: Record<string, City> };

const previous: Stored = await readFile(OUT, "utf8")
  .then((raw) => JSON.parse(raw) as Stored)
  .catch((): Stored => ({}));

const sewerage = await sewerageMedian();
console.log(
  `assainissement : médiane nationale ${sewerage.pricePerM3} €/m³ ` +
    `(${sewerage.communes} communes, ${sewerage.year})\n`,
);

const out: Record<string, City> = { ...(previous.cities ?? {}) };
const waterMissing: string[] = [];
const powerMissing: string[] = [];

for (const city of cities) {
  const [water, power] = await Promise.all([waterFor(city.communeCode), powerFor(city.communeCode)]);

  if ("failed" in water) {
    waterMissing.push(`${city.id} (${water.failed})`);
    console.log(`– ${city.name}: ${water.failed}`);
    continue;
  }
  if ("failed" in power) powerMissing.push(`${city.id} (${power.failed})`);

  const carriedKwh = previous.cities?.[city.id]?.electricityKwhYear ?? null;
  const carriedYear = previous.cities?.[city.id]?.electricityYear ?? null;

  out[city.id] = {
    waterPotablePerM3: round(water.pricePerM3, 2),
    waterYear: water.year,
    electricityKwhYear: "kwhYear" in power ? power.kwhYear : carriedKwh,
    electricityYear: "year" in power ? power.year : carriedYear,
  };

  const total = round(water.pricePerM3 + sewerage.pricePerM3, 2);
  console.log(
    `✓ ${city.name}: eau ${round(water.pricePerM3, 2)} + ${sewerage.pricePerM3} = ${total} €/m³ ` +
      `(${water.year}), ` +
      ("kwhYear" in power
        ? `élec ${power.kwhYear} kWh/an (${power.year}, ${power.addresses} adresses)`
        : `élec échouée — ${power.failed}`),
  );
}

const withPower = Object.values(out).filter((c) => c.electricityKwhYear !== null).length;
const latestPowerYear = Math.max(
  ...Object.values(out).map((c) => c.electricityYear ?? 0),
);
const national = await nationalAverage(latestPowerYear);
console.log(`\nmoyenne nationale Enedis ${latestPowerYear} : ${national} kWh/an (référence)`);

await writeFile(
  OUT,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString().slice(0, 10),
      waterSource:
        "SISPEA via Hub'Eau — D102.0 (eau potable, commune) + D204.0 (assainissement, médiane nationale)",
      electricitySource:
        "Enedis — consommation annuelle résidentielle par adresse, moyenne par point de livraison",
      note: "L'électricité ne couvre pas le chauffage au gaz ni les réseaux de chaleur ; le moteur déclare ce poste comme non chiffré.",
      sewerageNational: sewerage,
      electricityNational: { kwhYear: national, year: latestPowerYear },
      coverage: {
        cities: cities.length,
        water: Object.keys(out).length,
        electricity: withPower,
        waterMissing,
        powerMissing,
      },
      cities: out,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

console.log(
  `\neau ${Object.keys(out).length}/${cities.length}, ` +
    `électricité ${withPower}/${cities.length}.`,
);
if (powerMissing.length > 0) console.log(`électricité non résolue : ${powerMissing.join(", ")}`);
console.log(`écrit dans ${OUT}\n`);

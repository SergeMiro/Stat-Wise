/**
 * Replaces two seeded market figures with measured ones: the rent per m² and the
 * price of a litre of fuel.
 *
 *   node --experimental-strip-types scripts/etl/build-market.ts
 *
 *   rent → Carte des loyers 2025 (ANIL/CEREMA), commune, charges comprises
 *   fuel → prix des carburants, flux instantané, per station
 *
 * No key and no account for either. Both write into `market.json`, which the
 * snapshot reads; a city the pass could not resolve keeps its seeded value and is
 * reported, never quietly replaced.
 *
 * Two things the source gives that the model was only approximating:
 *
 * - `lwr.IPm2` and `upr.IPm2` are the published confidence interval around the
 *   predicted rent. The result page already shows a range; until now that range
 *   came from multiplying the median by 0.85 and 1.18. Now it is the interval the
 *   statisticians actually published.
 * - `nbobs_com` is how many observations the commune's figure rests on. A commune
 *   with a handful of listings deserves less confidence than one with hundreds, and
 *   carrying the count means the UI can eventually say so.
 */

import { readFile, writeFile } from "node:fs/promises";

import { cities } from "../../src/domain/reste-a-vivre/snapshot.ts";

const RENT_FLAT =
  "https://static.data.gouv.fr/resources/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025/20251211-145010/pred-app-mef-dhup.csv";
const RENT_HOUSE =
  "https://static.data.gouv.fr/resources/carte-des-loyers-indicateurs-de-loyers-dannonce-par-commune-en-2025/20251211-145039/pred-mai-mef-dhup.csv";
const FUEL =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records";

const OUT = "src/domain/reste-a-vivre/market.json";

/**
 * Paris, Lyon and Marseille are published per arrondissement, not per commune.
 *
 * The snapshot's `centralRentPerSqm` is the *central* reference that district
 * archetypes are derived from, so a median across arrondissements would price the
 * centre as if it were the average of a whole city. The 75th percentile is used
 * instead: high enough to stand for the central arrondissements, not the single
 * dearest one. It is a convention, and it is written down here rather than hidden
 * in a magic number.
 */
const SPLIT_CITIES: Record<string, RegExp> = {
  paris: /^751\d\d$/,
  lyon: /^6938\d$/,
  marseille: /^132\d\d$/,
};

type RentRow = { rent: number; low: number; high: number; observations: number };

const num = (raw: string) => Number(raw.replace(",", "."));

function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  if (sorted.length === 0) return Number.NaN;
  const index = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
  return sorted[index];
}

async function readRents(url: string, label: string): Promise<Map<string, RentRow>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${label}: http ${response.status}`);
  const text = await response.text();
  const lines = text.split(/\r?\n/);
  const header = lines[0].split(";").map((h) => h.replaceAll('"', ""));
  const at = (name: string) => header.indexOf(name);
  const iCode = at("INSEE_C");
  const iRent = at("loypredm2");
  const iLow = at("lwr.IPm2");
  const iHigh = at("upr.IPm2");
  const iObs = at("nbobs_com");
  if ([iCode, iRent, iLow, iHigh].some((i) => i < 0)) {
    throw new Error(`${label}: unexpected columns — ${header.join(",")}`);
  }

  const byCode = new Map<string, RentRow>();
  for (const line of lines.slice(1)) {
    if (!line) continue;
    const cells = line.split(";").map((c) => c.replaceAll('"', ""));
    const code = cells[iCode];
    const rent = num(cells[iRent]);
    if (!code || !Number.isFinite(rent)) continue;
    byCode.set(code, {
      rent,
      low: num(cells[iLow]),
      high: num(cells[iHigh]),
      observations: Number(cells[iObs] ?? 0) || 0,
    });
  }
  console.log(`${label}: ${byCode.size} communes`);
  return byCode;
}

/** One city's rent, resolving the three cities published per arrondissement. */
function rentFor(cityId: string, communeCode: string, table: Map<string, RentRow>): RentRow | null {
  const direct = table.get(communeCode);
  if (direct) return direct;

  const pattern = SPLIT_CITIES[cityId];
  if (!pattern) return null;

  const parts = [...table.entries()].filter(([code]) => pattern.test(code)).map(([, row]) => row);
  if (parts.length === 0) return null;

  return {
    rent: percentile(parts.map((p) => p.rent), 0.75),
    low: percentile(parts.map((p) => p.low), 0.75),
    high: percentile(parts.map((p) => p.high), 0.75),
    observations: parts.reduce((sum, p) => sum + p.observations, 0),
  };
}

/**
 * Median E10 price across the stations of a département.
 *
 * The first version of this returned `null` on any failure, silently. Eleven of
 * fourteen départements came back empty and the pass reported "carburant ?" as if
 * the data did not exist — it did, every one of them answers HTTP 200. A swallowed
 * error is indistinguishable from an absent figure, so failures are retried and
 * then said out loud.
 */
async function fuelFor(departmentCode: string): Promise<{ price: number } | { failed: string }> {
  const url = `${FUEL}?where=code_departement%3D%22${departmentCode}%22&limit=100&select=prix`;

  let last = "aucune tentative";
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        last = `http ${response.status}`;
      } else {
        const body = (await response.json()) as { results?: Array<{ prix?: string | null }> };
        const prices: number[] = [];
        for (const record of body.results ?? []) {
          if (!record.prix) continue;
          type Fuel = { "@nom"?: string; "@valeur"?: string };
          let fuels: Fuel[];
          try {
            // The field is a JSON string holding one entry per fuel sold at the
            // station — except a station selling exactly one fuel serialises a bare
            // object rather than a one-element array. Reading `.find` on that is what
            // silently cost eleven départements their fuel price.
            const parsed = JSON.parse(record.prix) as Fuel | Fuel[];
            fuels = Array.isArray(parsed) ? parsed : [parsed];
          } catch {
            // One unparseable station must not cost us the whole département.
            continue;
          }
          const e10 =
            fuels.find((f) => f["@nom"] === "E10") ?? fuels.find((f) => f["@nom"] === "SP95");
          const value = Number(e10?.["@valeur"]);
          if (Number.isFinite(value) && value > 0.5 && value < 5) prices.push(value);
        }
        if (prices.length >= 3) {
          // Median, not mean: one mis-keyed station should not move a city's budget.
          return { price: Math.round(percentile(prices, 0.5) * 1000) / 1000 };
        }
        last = `seulement ${prices.length} prix exploitables`;
      }
    } catch (error) {
      last = error instanceof Error ? error.message : String(error);
    }
    if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
  }
  return { failed: last };
}

const [flats, houses] = await Promise.all([
  readRents(RENT_FLAT, "appartements"),
  readRents(RENT_HOUSE, "maisons"),
]);

type Market = {
  rentPerSqm: { appartement: number; maison: number };
  rentRange: { low: number; high: number };
  observations: number;
  fuelPricePerLitre: number | null;
};

type Stored = { cities?: Record<string, Market> };

/**
 * Read what is already published before overwriting it.
 *
 * A pass that runs while one of the two sources is down would otherwise replace a
 * real figure with nothing and present the loss as the current state. Only what
 * this run actually measured is written; the rest is carried over untouched.
 */
const previous: Stored = await readFile(OUT, "utf8")
  .then((raw) => JSON.parse(raw) as Stored)
  .catch((): Stored => ({}));

const market: Record<string, Market> = { ...(previous.cities ?? {}) };
const missing: string[] = [];
const fuelMissing: string[] = [];

for (const city of cities) {
  const flat = rentFor(city.id, city.communeCode, flats);
  const house = rentFor(city.id, city.communeCode, houses);
  if (!flat) {
    missing.push(city.id);
    console.log(`– ${city.name}: absent de la Carte des loyers, valeur précédente conservée`);
    continue;
  }

  const department = city.department.match(/\((\w+)\)/)?.[1] ?? "";
  const fuel = department ? await fuelFor(department) : { failed: "département inconnu" };
  const carried = previous.cities?.[city.id]?.fuelPricePerLitre ?? null;
  if ("failed" in fuel) fuelMissing.push(`${city.id} (${fuel.failed})`);

  market[city.id] = {
    rentPerSqm: {
      appartement: Math.round(flat.rent * 100) / 100,
      // Houses have their own published series; fall back to flats if absent.
      maison: Math.round((house?.rent ?? flat.rent) * 100) / 100,
    },
    rentRange: {
      low: Math.round(flat.low * 100) / 100,
      high: Math.round(flat.high * 100) / 100,
    },
    observations: flat.observations,
    fuelPricePerLitre: "price" in fuel ? fuel.price : carried,
  };

  console.log(
    `✓ ${city.name}: ${market[city.id].rentPerSqm.appartement} €/m² ` +
      `(${market[city.id].rentRange.low}–${market[city.id].rentRange.high}, ` +
      `${flat.observations} obs), ` +
      ("price" in fuel
        ? `carburant ${fuel.price} €/L`
        : `carburant échoué (${fuel.failed})${carried === null ? "" : `, ${carried} €/L conservé`}`),
  );
}

await writeFile(
  OUT,
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString().slice(0, 10),
      rentSource: "Carte des loyers 2025 (ANIL / CEREMA), loyer d'annonce charges comprises",
      fuelSource: "Prix des carburants — flux instantané, médiane des stations du département",
      note: "Paris, Lyon et Marseille sont publiés par arrondissement : la référence centrale est le 75e centile des arrondissements.",
      coverage: {
        cities: cities.length,
        resolved: Object.keys(market).length,
        missing,
        fuelResolved: Object.values(market).filter((m) => m.fuelPricePerLitre !== null).length,
      },
      cities: market,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

const withFuel = Object.values(market).filter((m) => m.fuelPricePerLitre !== null).length;
console.log(
  `\n${Object.keys(market).length}/${cities.length} villes résolues, ${missing.length} sans loyer, ` +
    `${withFuel}/${cities.length} avec carburant mesuré.`,
);
if (fuelMissing.length > 0) console.log(`carburant non résolu cette fois : ${fuelMissing.join(", ")}`);
console.log(`écrit dans ${OUT}\n`);

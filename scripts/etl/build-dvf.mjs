/**
 * DVF → per-IRIS real-estate price aggregation (official DGFiP / Etalab data).
 *
 * Input  : scripts/etl/raw/dvf21_{year}.csv.gz  (geo-dvf géolocalisées, dept 21)
 *          scripts/etl/raw/iris_dijon.json      (IRIS contours, opendatasoft)
 * Output : src/lib/data/dvf-dijon.json
 *
 * Method (honest, transaction-based — NOT modelled):
 *   - keep nature_mutation = "Vente"
 *   - keep mutations with EXACTLY ONE bâti lot (Appartement or Maison) so the
 *     whole valeur_fonciere maps cleanly to one surface (drops bulk sales and
 *     apartment+dépendance mixes that pollute €/m²)
 *   - €/m² = valeur_fonciere / surface_reelle_bati, kept in 300..25000
 *   - assign each transaction to an IRIS by point-in-polygon on lon/lat
 *   - per (IRIS, type): count, min, p25, median, p75, max
 * Run: node scripts/etl/build-dvf.mjs
 */
import { gunzipSync } from "node:zlib";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseCsvObjects } from "./lib/csv.mjs";
import { pointInGeometry, bboxOf, centroidOf } from "./lib/geo.mjs";
import { summarize } from "./lib/stats.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RAW = join(__dirname, "raw");
const OUT = join(__dirname, "..", "..", "src", "lib", "data", "dvf-dijon.json");

const COMMUNE = "21231";
const YEARS = [2022, 2023, 2024];
const MIN_PPM2 = 300;
const MAX_PPM2 = 25000;
const MIN_SURFACE = 9;
// A single sale is not a reliable median: suppress published stats below this
// many transactions (the raw count is still reported so the UI can say why).
const MIN_SAMPLE = 5;

// --- load IRIS contours -----------------------------------------------------
const irisRaw = JSON.parse(readFileSync(join(RAW, "iris_dijon.json"), "utf8"));
const irisAreas = irisRaw.records.map((r) => {
  const f = r.fields;
  return {
    code: String(f.iris_code),
    name: f.iris_name,
    geom: f.geo_shape,
    bbox: bboxOf(f.geo_shape),
    centroid: centroidOf(f.geo_shape),
  };
});
console.log(`Loaded ${irisAreas.length} IRIS for commune ${COMMUNE}`);

function findIris(lon, lat) {
  for (const a of irisAreas) {
    const b = a.bbox;
    if (lon < b.minX || lon > b.maxX || lat < b.minY || lat > b.maxY) continue;
    if (pointInGeometry(lon, lat, a.geom)) return a;
  }
  return null;
}

// --- load + clean DVF -------------------------------------------------------
// bucket[irisCode][type] = number[] of €/m²
const buckets = new Map();
const rentBucket = new Map(); // reserved for future (loyers source)
let totalKept = 0;
let unassigned = 0;

for (const year of YEARS) {
  const csv = gunzipSync(readFileSync(join(RAW, `dvf21_${year}.csv.gz`))).toString("utf8");
  const rows = parseCsvObjects(csv).filter(
    (r) => r.code_commune === COMMUNE && r.nature_mutation === "Vente",
  );

  // group by mutation
  const byMut = new Map();
  for (const r of rows) {
    if (!byMut.has(r.id_mutation)) byMut.set(r.id_mutation, []);
    byMut.get(r.id_mutation).push(r);
  }

  let keptYear = 0;
  for (const [, lines] of byMut) {
    const bati = lines.filter(
      (l) => l.type_local === "Appartement" || l.type_local === "Maison",
    );
    if (bati.length !== 1) continue; // single-lot bâti only
    const l = bati[0];
    const surface = Number(l.surface_reelle_bati);
    const value = Number(l.valeur_fonciere);
    const lon = Number(l.longitude);
    const lat = Number(l.latitude);
    if (!surface || surface < MIN_SURFACE || !value || !lon || !lat) continue;
    const ppm2 = value / surface;
    if (ppm2 < MIN_PPM2 || ppm2 > MAX_PPM2) continue;

    const iris = findIris(lon, lat);
    if (!iris) {
      unassigned++;
      continue;
    }
    const type = l.type_local === "Appartement" ? "apartment" : "house";
    if (!buckets.has(iris.code)) buckets.set(iris.code, { apartment: [], house: [] });
    buckets.get(iris.code)[type].push(ppm2);
    keptYear++;
    totalKept++;
  }
  console.log(`  ${year}: kept ${keptYear} clean single-lot sales`);
}
console.log(`Total kept ${totalKept}, unassigned to IRIS ${unassigned}`);

// --- aggregate --------------------------------------------------------------
const areas = irisAreas
  .map((a) => {
    const b = buckets.get(a.code) || { apartment: [], house: [] };
    return {
      irisCode: a.code,
      irisName: a.name,
      centroid: {
        latitude: Number(a.centroid.latitude.toFixed(5)),
        longitude: Number(a.centroid.longitude.toFixed(5)),
      },
      priceM2: {
        apartment: b.apartment.length >= MIN_SAMPLE ? summarize(b.apartment) : null,
        house: b.house.length >= MIN_SAMPLE ? summarize(b.house) : null,
      },
      // sample sizes kept even when the median is suppressed
      sampleSize: { apartment: b.apartment.length, house: b.house.length },
    };
  })
  // keep IRIS that have at least some transactions of either type
  .sort((x, y) => x.irisName.localeCompare(y.irisName));

const output = {
  source: {
    code: "dvf",
    label: "DVF — Demandes de valeurs foncières géolocalisées (DGFiP / Etalab)",
    url: "https://files.data.gouv.fr/geo-dvf/latest/csv/",
    irisContours: "opendatasoft georef-france-iris (IGN)",
    method: "single-lot Vente, €/m² = valeur_fonciere / surface_reelle_bati, PIP→IRIS",
    ppm2Bounds: [MIN_PPM2, MAX_PPM2],
  },
  commune: COMMUNE,
  communeName: "Dijon",
  years: YEARS,
  totalTransactions: totalKept,
  generatedFromYears: YEARS,
  areas,
};

writeFileSync(OUT, JSON.stringify(output, null, 2));
console.log(`Wrote ${OUT} — ${areas.length} IRIS`);

// --- quick sanity print -----------------------------------------------------
const withApt = areas.filter((a) => a.priceM2.apartment).length;
const withHouse = areas.filter((a) => a.priceM2.house).length;
console.log(`IRIS with apartment stats: ${withApt}, with house stats: ${withHouse}`);
const sample = areas
  .filter((a) => a.priceM2.apartment && a.priceM2.apartment.count >= 5)
  .sort((a, b) => b.priceM2.apartment.median - a.priceM2.apartment.median)
  .slice(0, 8);
console.log("\nTop IRIS by apartment median €/m² (count>=5):");
for (const a of sample) {
  const p = a.priceM2.apartment;
  console.log(`  ${a.irisName.padEnd(28)} median ${p.median} €/m²  (p25 ${p.p25} / p75 ${p.p75}, n=${p.count})`);
}

/**
 * BPE → per-IRIS amenity counts (official INSEE data).
 *
 * Input  : scripts/etl/raw/bpe_dept21.csv  (dept-21 subset of national BPE25)
 * Output : src/lib/data/bpe-dijon.json
 *
 * BPE rows already carry the IRIS code (DCIRIS), so no geometry join is needed:
 * filter to the commune, map TYPEQU → category, count per (IRIS, category).
 * Run: node scripts/etl/build-bpe.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { parseCsvObjects } from "./lib/csv.mjs";
import { categoryForTypequ, POI_CATEGORIES } from "./lib/bpe-mapping.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN = join(__dirname, "raw", "bpe_dept21.csv");
const OUT = join(__dirname, "..", "..", "src", "lib", "data", "bpe-dijon.json");
const COMMUNE = "21231";

const rows = parseCsvObjects(readFileSync(IN, "utf8")).filter(
  (r) => r.DEPCOM === COMMUNE,
);
console.log(`BPE rows for commune ${COMMUNE}: ${rows.length}`);

// perIris[dcirisCode] = { transport: n, ... }
const perIris = new Map();
let mapped = 0;
let noIris = 0;
const zero = () => Object.fromEntries(POI_CATEGORIES.map((c) => [c, 0]));

for (const r of rows) {
  const cat = categoryForTypequ(r.TYPEQU);
  if (!cat) continue;
  mapped++;
  const iris = r.DCIRIS && r.DCIRIS !== "0" ? r.DCIRIS : null;
  if (!iris) {
    noIris++;
    continue;
  }
  if (!perIris.has(iris)) perIris.set(iris, zero());
  perIris.get(iris)[cat]++;
}
console.log(`Mapped ${mapped} equipments to a category; ${noIris} lacked an IRIS`);
console.log(`IRIS with amenities: ${perIris.size}`);

const areas = [...perIris.entries()]
  .map(([irisCode, counts]) => ({ irisCode, poi: counts }))
  .sort((a, b) => a.irisCode.localeCompare(b.irisCode));

const output = {
  source: {
    code: "insee_bpe",
    label: "INSEE — Base permanente des équipements (BPE) 2025",
    url: "https://www.insee.fr/fr/statistiques/8217525",
    method: "TYPEQU→category map (scripts/etl/lib/bpe-mapping.mjs), grouped by DCIRIS",
    limits: "no parks layer; transport = rail+taxi floor only",
  },
  commune: COMMUNE,
  communeName: "Dijon",
  year: 2025,
  totalMappedEquipments: mapped,
  areas,
};

writeFileSync(OUT, JSON.stringify(output, null, 2));
console.log(`Wrote ${OUT} — ${areas.length} IRIS`);

// sanity: city-wide totals per category
const totals = zero();
for (const a of areas) for (const c of POI_CATEGORIES) totals[c] += a.poi[c];
console.log("\nDijon city-wide amenity totals:");
for (const c of POI_CATEGORIES) console.log(`  ${c.padEnd(18)} ${totals[c]}`);

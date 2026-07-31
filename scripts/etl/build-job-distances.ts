/**
 * Replaces the derived travel distances with measured ones.
 *
 *   node --experimental-strip-types scripts/etl/build-job-distances.ts
 *
 * Two questions, two sources, no API key and no account anywhere:
 *
 *   where is this district      → OpenStreetMap place nodes via Overpass
 *   how far is it by road       → IGN Géoplateforme itinéraire (BD TOPO)
 *   where is the nearest shop   → OpenStreetMap shop=supermarket|hypermarket
 *
 * BAN was tried first and rejected: it is an *address* geocoder, so a district
 * name resolves to a street that merely shares the name. "Le Marais, Paris" came
 * back as "Rue Le Marois 75016" — a different place in a different arrondissement,
 * with a plausible-looking score of 0.56. That is exactly the failure this project
 * must not ship, so district anchors come from OSM place nodes instead, which are
 * the districts themselves.
 *
 * The output records, per district, whether the distance was measured or left
 * derived. A district whose anchor cannot be found keeps its modelled value and
 * says so — it is never quietly replaced by a wrong measurement.
 */

import { writeFile } from "node:fs/promises";

import { cities } from "../../src/domain/reste-a-vivre/snapshot.ts";

const OVERPASS = "https://overpass-api.de/api/interpreter";
const IGN = "https://data.geopf.fr/navigation/itineraire";
const UA = "StatWise/0.1 (ETL for statwise; github.com/SergeMiro/Stat-Wise)";

/** Overpass asks for no more than a couple of requests at a time. Be a guest. */
const OVERPASS_DELAY_MS = 2500;
const IGN_DELAY_MS = 350;
const MAX_ATTEMPTS = 4;

const OUT = "src/domain/reste-a-vivre/distances.json";

type Point = { lat: number; lon: number };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Accent- and punctuation-insensitive, article-insensitive district matching. */
function normalise(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\b(le|la|les|l|d|de|du|des)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function haversineKm(a: Point, b: Point): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function fetchJson(
  url: string,
  init: RequestInit | undefined,
  label: string,
): Promise<unknown | null> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        headers: { "User-Agent": UA, ...(init?.headers ?? {}) },
      });
      const text = await res.text();
      if (res.ok && text.trimStart().startsWith("{")) return JSON.parse(text);
      // Overpass answers 429/504 in HTML when it is busy; backing off works.
      console.log(`    retry ${attempt}/${MAX_ATTEMPTS} ${label} — http ${res.status}`);
    } catch (error) {
      console.log(`    retry ${attempt}/${MAX_ATTEMPTS} ${label} — ${String(error)}`);
    }
    await sleep(attempt * 4000);
  }
  return null;
}

const overpass = (query: string, label: string) =>
  fetchJson(
    OVERPASS,
    { method: "POST", body: new URLSearchParams({ data: query }) },
    `overpass ${label}`,
  );

/** Road distance in km and minutes, or null when the service cannot answer. */
async function route(from: Point, to: Point): Promise<{ km: number; minutes: number } | null> {
  const url =
    `${IGN}?resource=bdtopo-osrm&profile=car&optimization=fastest` +
    `&start=${from.lon},${from.lat}&end=${to.lon},${to.lat}`;
  const data = (await fetchJson(url, undefined, "ign")) as {
    distance?: number;
    duration?: number;
  } | null;
  if (!data || typeof data.distance !== "number" || typeof data.duration !== "number") {
    return null;
  }
  await sleep(IGN_DELAY_MS);
  return {
    km: Math.round((data.distance / 1000) * 10) / 10,
    minutes: Math.round(data.duration / 60),
  };
}

type Entry = {
  jobKm: number;
  jobMinutes: number;
  groceryKm: number | null;
  anchor: Point;
  anchorName: string;
  groceryName: string | null;
};

const entries: Record<string, Entry> = {};
const unmatched: string[] = [];
let groceryMisses = 0;

for (const city of cities) {
  console.log(`\n${city.name} — ${city.districts.length} quartiers`);

  // A bbox rather than area[...]: resolving an administrative area makes Overpass
  // time out under load, and a box around the town hall covers any city we list.
  const d = 0.11;
  const box = [city.center.lat - d, city.center.lon - d, city.center.lat + d, city.center.lon + d]
    .map((n) => n.toFixed(4))
    .join(",");

  const places = (await overpass(
    `[out:json][timeout:60];node(${box})["place"~"^(neighbourhood|suburb|quarter|city_district)$"];out center;`,
    `places ${city.id}`,
  )) as { elements?: Array<{ lat: number; lon: number; tags?: Record<string, string> }> } | null;
  await sleep(OVERPASS_DELAY_MS);

  const byName = new Map<string, Point & { name: string }>();
  for (const el of places?.elements ?? []) {
    const name = el.tags?.name;
    if (!name || el.lat == null) continue;
    const key = normalise(name);
    if (!byName.has(key)) byName.set(key, { lat: el.lat, lon: el.lon, name });
  }

  const shops = (await overpass(
    `[out:json][timeout:60];(node(${box})["shop"~"^(supermarket|hypermarket)$"];way(${box})["shop"~"^(supermarket|hypermarket)$"];);out center;`,
    `shops ${city.id}`,
  )) as {
    elements?: Array<{ lat?: number; lon?: number; center?: Point; tags?: Record<string, string> }>;
  } | null;
  await sleep(OVERPASS_DELAY_MS);

  const stores: Array<Point & { name: string }> = [];
  for (const el of shops?.elements ?? []) {
    const p = el.center ?? (el.lat != null && el.lon != null ? { lat: el.lat, lon: el.lon } : null);
    if (p) stores.push({ ...p, name: el.tags?.name ?? "sans nom" });
  }
  console.log(`  ${byName.size} lieux, ${stores.length} commerces alimentaires`);

  for (const district of city.districts) {
    const anchor = byName.get(normalise(district.name));
    if (!anchor) {
      unmatched.push(`${city.id}:${district.id}`);
      console.log(`  – ${district.name}: introuvable dans OSM, valeur modélisée conservée`);
      continue;
    }

    const toJob = await route(anchor, city.center);
    if (!toJob) {
      unmatched.push(`${city.id}:${district.id}`);
      console.log(`  – ${district.name}: itinéraire indisponible`);
      continue;
    }

    // Nearest by straight line, then routed: crow-flies picks the candidate,
    // the road decides the number.
    let groceryKm: number | null = null;
    let groceryName: string | null = null;
    const nearest = stores
      .map((s) => ({ s, d: haversineKm(anchor, s) }))
      .sort((a, b) => a.d - b.d)[0];
    if (nearest && nearest.d < 8) {
      const toShop = await route(anchor, nearest.s);
      if (toShop) {
        groceryKm = toShop.km;
        groceryName = nearest.s.name;
      }
    }
    if (groceryKm === null) groceryMisses++;

    entries[`${city.id}:${district.id}`] = {
      jobKm: toJob.km,
      jobMinutes: toJob.minutes,
      groceryKm,
      anchor: { lat: Math.round(anchor.lat * 1e5) / 1e5, lon: Math.round(anchor.lon * 1e5) / 1e5 },
      anchorName: anchor.name,
      groceryName,
    };
    console.log(
      `  ✓ ${district.name}: ${toJob.km} km / ${toJob.minutes} min` +
        (groceryKm !== null ? `, commerce ${groceryKm} km (${groceryName})` : ", commerce ?"),
    );
  }
}

const total = cities.reduce((n, c) => n + c.districts.length, 0);
const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  method:
    "Ancrage des quartiers : nœuds place d'OpenStreetMap (Overpass). Distances : itinéraire routier IGN Géoplateforme, ressource bdtopo-osrm, profil voiture. Commerce alimentaire : shop=supermarket|hypermarket le plus proche dans OSM, choisi à vol d'oiseau puis mesuré par la route.",
  coverage: { districts: total, measured: Object.keys(entries).length, unmatched },
  entries,
};

await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(
  `\n${Object.keys(entries).length}/${total} quartiers mesurés, ` +
    `${unmatched.length} sans ancrage, ${groceryMisses} sans commerce trouvé.`,
);
console.log(`écrit dans ${OUT}\n`);

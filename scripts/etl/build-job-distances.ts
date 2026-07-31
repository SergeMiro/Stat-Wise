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

import { readFile, writeFile } from "node:fs/promises";

import { cities } from "../../src/domain/reste-a-vivre/snapshot.ts";

const OVERPASS = "https://overpass-api.de/api/interpreter";
const IGN = "https://data.geopf.fr/navigation/itineraire";
const UA = "StatWise/0.1 (ETL for statwise; github.com/SergeMiro/Stat-Wise)";

/** Overpass asks for no more than a couple of requests at a time. Be a guest. */
const OVERPASS_DELAY_MS = 2500;
const IGN_DELAY_MS = 350;
const MAX_ATTEMPTS = 4;

const OUT = "src/domain/reste-a-vivre/distances.json";

/**
 * The chains a household actually fills a boot at.
 *
 * A whitelist is a blunt instrument, but the alternative was worse: OpenStreetMap
 * tags a 40 m² organic grocer and a hypermarket with the same `shop=supermarket`,
 * so "nearest supermarket" was landing on shops nobody does a weekly run to. A list
 * is at least inspectable and arguable, which a silent bias is not.
 */
const LARGE_CHAINS = [
  "carrefour",
  "leclerc",
  "intermarch",
  "lidl",
  "aldi",
  "auchan",
  "casino",
  "super u",
  "hyper u",
  "u express",
  "monoprix",
  "match",
  "cora",
  "netto",
  "franprix",
  "geant",
  "grand frais",
  "colruyt",
  "supeco",
  "leader price",
].join("|");

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
  /** Which definition of "food shop" the grocery distance was measured against. */
  shopStandard: "large_chain" | "any_supermarket";
};

/*
  Start from what is already on disk and only overwrite what this run actually
  measured.

  The first version of this script wrote a fresh object, which meant one Overpass
  outage silently deleted good data: a run where Marseille, Bordeaux and Avignon
  timed out dropped coverage from 67 districts to 62 and reported it as the new
  truth. An ETL that can lose measurements on a transient failure is worse than one
  that never ran.
*/
type Stored = { entries: Record<string, Entry> };

const previous: Stored = await readFile(OUT, "utf8")
  .then((raw) => JSON.parse(raw) as Stored)
  .catch((): Stored => ({ entries: {} }));

/*
  Entries carried over from before the shop filter was tightened are marked as such.
  They were measured to the nearest thing OpenStreetMap tags `shop=supermarket`,
  which includes 40 m² organic grocers — a shorter distance than a weekly shop. The
  field keeps that visible instead of letting two standards blend silently.
*/
const entries: Record<string, Entry> = {};
for (const [key, entry] of Object.entries(previous.entries)) {
  entries[key] = { ...entry, shopStandard: entry.shopStandard ?? "any_supermarket" };
}
let refreshed = 0;
let kept = 0;
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

  /*
    `nwr`, not `node`. Half the districts that went unmatched on the first pass were
    not missing from OpenStreetMap at all — they are mapped as ways or relations
    (a boundary around the quartier) rather than a single point. Asking only for
    nodes found 100 places around Avignon; asking for all three found 290.
  */
  const places = (await overpass(
    `[out:json][timeout:60];nwr(${box})["place"~"^(neighbourhood|suburb|quarter|city_district|city_block|borough)$"];out center;`,
    `places ${city.id}`,
  )) as {
    elements?: Array<{
      lat?: number;
      lon?: number;
      center?: Point;
      tags?: Record<string, string>;
    }>;
  } | null;
  await sleep(OVERPASS_DELAY_MS);

  const byName = new Map<string, Point & { name: string }>();
  for (const el of places?.elements ?? []) {
    const name = el.tags?.name;
    const point =
      el.center ?? (el.lat != null && el.lon != null ? { lat: el.lat, lon: el.lon } : null);
    if (!name || !point) continue;
    const key = normalise(name);
    if (!byName.has(key)) byName.set(key, { ...point, name });
  }

  /*
    Only shops somebody does a weekly shop in. The first pass asked for
    `shop=supermarket|hypermarket` and got Biocoop, Naturalia and "Alimentation
    Générale" — 32 of 67 matches were small grocers, which made every central
    district look closer to its shopping than it is. A hypermarket always counts;
    a supermarket counts when its name or brand is one of the chains listed above.

    The first attempt at this filter accepted any supermarket that merely *had* a
    `brand` tag — and Biocoop and Naturalia both have one, so 21 of 77 matches were
    still small grocers. Having a brand is not the same as being a chain someone
    fills a boot at, so the brand is matched against the list rather than counted.
  */
  const shops = (await overpass(
    `[out:json][timeout:60];(nwr(${box})["shop"="hypermarket"];nwr(${box})["shop"="supermarket"]["brand"~"${LARGE_CHAINS}",i];nwr(${box})["shop"="supermarket"]["name"~"${LARGE_CHAINS}",i];);out center;`,
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

  /*
    Exact first, then one guarded fallback: a candidate whose name contains ours as
    a whole phrase, or vice versa. "Centre" matching "Centre-ville" is right;
    matching on a shared word would not be, so partial words are refused. Every
    fallback is logged, because a wrong anchor is a wrong distance and the only
    defence is that someone can read what it chose.
  */
  const anchorFor = (name: string) => {
    const key = normalise(name);
    const exact = byName.get(key);
    if (exact) return { anchor: exact, fuzzy: false };
    for (const [candidate, place] of byName) {
      const contains =
        candidate === key ||
        candidate.startsWith(`${key} `) ||
        candidate.endsWith(` ${key}`) ||
        candidate.includes(` ${key} `) ||
        key.startsWith(`${candidate} `) ||
        key.endsWith(` ${candidate}`);
      if (contains) return { anchor: place, fuzzy: true };
    }
    return null;
  };

  for (const district of city.districts) {
    const match = anchorFor(district.name);
    const anchor = match?.anchor;
    if (match?.fuzzy) {
      console.log(`  ~ ${district.name}: ancré sur « ${anchor!.name} » (correspondance partielle)`);
    }
    const key = `${city.id}:${district.id}`;
    if (!anchor) {
      if (entries[key]) {
        kept++;
        console.log(`  = ${district.name}: non retrouvé cette fois, mesure précédente conservée`);
      } else {
        unmatched.push(key);
        console.log(`  – ${district.name}: introuvable dans OSM, valeur modélisée conservée`);
      }
      continue;
    }

    const toJob = await route(anchor, city.center);
    if (!toJob) {
      if (entries[key]) kept++;
      else unmatched.push(key);
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
    /*
      A shop this run could not find keeps whatever was measured before — but it
      also keeps the standard it was measured under. Carrying the distance forward
      while relabelling it `large_chain` is exactly the silent blending of two
      standards this field exists to prevent, and it is the mistake made here first.
    */
    let shopStandard: Entry["shopStandard"] = "large_chain";
    if (groceryKm === null) {
      groceryMisses++;
      const before = entries[key];
      if (before?.groceryKm != null) {
        groceryKm = before.groceryKm;
        groceryName = before.groceryName;
        shopStandard = before.shopStandard;
      }
    }

    refreshed++;
    entries[key] = {
      jobKm: toJob.km,
      jobMinutes: toJob.minutes,
      groceryKm,
      anchor: { lat: Math.round(anchor.lat * 1e5) / 1e5, lon: Math.round(anchor.lon * 1e5) / 1e5 },
      anchorName: anchor.name,
      groceryName,
      shopStandard,
    };
    console.log(
      `  ✓ ${district.name}: ${toJob.km} km / ${toJob.minutes} min` +
        (groceryKm !== null ? `, commerce ${groceryKm} km (${groceryName})` : ", commerce ?"),
    );
  }
}

const total = cities.reduce((n, c) => n + c.districts.length, 0);
console.log(`\n${refreshed} quartiers recalculés, ${kept} mesures précédentes conservées.`);
const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  method:
    "Ancrage des quartiers : nœuds place d'OpenStreetMap (Overpass). Distances : itinéraire routier IGN Géoplateforme, ressource bdtopo-osrm, profil voiture. Commerce alimentaire : shop=supermarket|hypermarket le plus proche dans OSM, choisi à vol d'oiseau puis mesuré par la route.",
  coverage: {
    districts: total,
    measured: Object.keys(entries).length,
    unmatched: unmatched.filter((key) => !entries[key]),
  },
  entries,
};

await writeFile(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(
  `\n${Object.keys(entries).length}/${total} quartiers mesurés, ` +
    `${unmatched.length} sans ancrage, ${groceryMisses} sans commerce trouvé.`,
);
console.log(`écrit dans ${OUT}\n`);

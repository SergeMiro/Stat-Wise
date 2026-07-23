import type { AreaProfile, PoiCounts } from "@/domain/types";
import dvf from "./dvf-dijon.json";
import bpe from "./bpe-dijon.json";

/**
 * Real Dijon AreaProfiles built from official open data:
 *   - prices  → DVF géolocalisées (DGFiP/Etalab), aggregated per IRIS
 *   - amenities → INSEE BPE 2025, counted per IRIS
 * Metrics without an ETL yet (rent, crime, APL, park layer, nearest-POI
 * distances) are left null/0 and marked `unavailable` in coverage — never faked.
 *
 * Generated inputs: scripts/etl/build-dvf.mjs, scripts/etl/build-bpe.mjs
 */

export const DIJON_DATASET_VERSION = "dijon-official-2025.07";

// Dijon city centre (Hôtel de ville) for real toCityCenter distances.
const DIJON_CENTER = { latitude: 47.3216, longitude: 5.0415 };

const EMPTY_POI: PoiCounts = {
  transport: 0, shops: 0, pharmacies: 0, adminServices: 0, sport: 0,
  culture: 0, libraries: 0, doctors: 0, medicalCenters: 0, creches: 0,
  schoolsMaternelle: 0, schoolsElementaire: 0, college: 0, lycee: 0, parks: 0,
};

function haversineKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const la1 = (a.latitude * Math.PI) / 180;
  const la2 = (b.latitude * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

type DvfStats = { count: number; min: number; p25: number; median: number; p75: number; max: number } | null;
type DvfArea = { irisCode: string; irisName: string; centroid: { latitude: number; longitude: number }; priceM2: { apartment: DvfStats; house: DvfStats } };
type BpeArea = { irisCode: string; poi: Omit<PoiCounts, "parks"> };

const bpeByIris = new Map<string, BpeArea["poi"]>(
  (bpe.areas as BpeArea[]).map((a) => [a.irisCode, a.poi]),
);

function buildDijonAreas(): AreaProfile[] {
  return (dvf.areas as DvfArea[]).map((a, i) => {
    // Headline price: apartments dominate urban IRIS; fall back to houses.
    const price = a.priceM2.apartment ?? a.priceM2.house;
    const types: Array<"apartment" | "house"> = [];
    if (a.priceM2.apartment) types.push("apartment");
    if (a.priceM2.house) types.push("house");
    const txCount =
      (a.priceM2.apartment?.count ?? 0) + (a.priceM2.house?.count ?? 0);

    const bpePoi = bpeByIris.get(a.irisCode);
    const poi: PoiCounts = bpePoi ? { ...EMPTY_POI, ...bpePoi } : { ...EMPTY_POI };

    return {
      areaId: `dijon-${i}`,
      areaName: a.irisName,
      areaType: "iris",
      centroid: a.centroid,
      housing: {
        medianRentPerMonth: null, // Carte des loyers not yet ingested
        medianPriceM2: price ? price.median : null,
        p25PriceM2: price ? price.p25 : null,
        p75PriceM2: price ? price.p75 : null,
        transactionCount: txCount,
        propertyTypesAvailable: types.length ? types : ["apartment", "house"],
      },
      poi,
      distancesKm: {
        toCityCenter: haversineKm(a.centroid, DIJON_CENTER),
        toNearestTransport: null, // to be computed from GTFS / BPE points
        toNearestHospital: null,
      },
      apl: null, // DREES APL not yet ingested
      recordedCrimeRatePer1000: null, // SSMSI not yet ingested
      coverage: {
        housingSale: price ? "available" : "unavailable",
        housingRent: "unavailable",
        poi: bpePoi ? "available" : "unavailable",
        crime: "unavailable",
        apl: "unavailable",
      },
    } satisfies AreaProfile;
  });
}

let cache: AreaProfile[] | null = null;

export function getDijonAreas(): AreaProfile[] {
  if (!cache) cache = buildDijonAreas();
  return cache;
}

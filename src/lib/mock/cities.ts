import type { AreaProfile } from "@/domain/types";
import { getDijonAreas } from "@/lib/data/dijon";

/**
 * Mock pilot-city data for V1. In production these AreaProfiles are produced by
 * the import pipeline (DVF/BPE/APL/...) and read from PostGIS aggregates. Here
 * they are generated deterministically so the wizard and ranking can be
 * exercised end-to-end without a live data backend.
 *
 * Values are illustrative and clearly labelled as such in the UI.
 */

export const DATASET_VERSION = "mock-2026.06";

export type City = {
  id: string;
  name: string;
  postalCodes: string[];
  department: string;
  /** Has rich (IRIS-level) coverage, or only commune-level fallback. */
  coverageLevel: "rich" | "limited";
};

type Archetype = "central" | "residential" | "peripheral" | "limited";

type AreaSpec = { name: string; archetype: Archetype };

type CitySpec = {
  city: City;
  center: { latitude: number; longitude: number };
  areas: AreaSpec[];
};

const CITY_SPECS: CitySpec[] = [
  {
    city: {
      id: "paris",
      name: "Paris",
      postalCodes: ["75001", "75011", "75020"],
      department: "Paris (75)",
      coverageLevel: "rich",
    },
    center: { latitude: 48.8566, longitude: 2.3522 },
    areas: [
      { name: "Le Marais", archetype: "central" },
      { name: "Quartier latin", archetype: "central" },
      { name: "Saint-Germain-des-Prés", archetype: "central" },
      { name: "Montmartre", archetype: "residential" },
      { name: "Batignolles", archetype: "residential" },
      { name: "Bercy", archetype: "residential" },
      { name: "Belleville", archetype: "peripheral" },
      { name: "La Chapelle", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "marseille",
      name: "Marseille",
      postalCodes: ["13001", "13006", "13008"],
      department: "Bouches-du-Rhône (13)",
      coverageLevel: "rich",
    },
    center: { latitude: 43.2965, longitude: 5.3698 },
    areas: [
      { name: "Vieux-Port", archetype: "central" },
      { name: "Le Panier", archetype: "central" },
      { name: "Cours Julien", archetype: "central" },
      { name: "Prado – Castellane", archetype: "residential" },
      { name: "Les Cinq Avenues", archetype: "residential" },
      { name: "La Joliette", archetype: "residential" },
      { name: "Saint-Barnabé", archetype: "peripheral" },
      { name: "L'Estaque", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "toulouse",
      name: "Toulouse",
      postalCodes: ["31000", "31200", "31500"],
      department: "Haute-Garonne (31)",
      coverageLevel: "rich",
    },
    center: { latitude: 43.6047, longitude: 1.4442 },
    areas: [
      { name: "Capitole", archetype: "central" },
      { name: "Les Carmes", archetype: "central" },
      { name: "Saint-Cyprien", archetype: "residential" },
      { name: "Compans-Caffarelli", archetype: "residential" },
      { name: "Rangueil", archetype: "residential" },
      { name: "Borderouge", archetype: "peripheral" },
      { name: "La Reynerie", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "nice",
      name: "Nice",
      postalCodes: ["06000", "06100", "06300"],
      department: "Alpes-Maritimes (06)",
      coverageLevel: "rich",
    },
    center: { latitude: 43.7102, longitude: 7.262 },
    areas: [
      { name: "Vieux-Nice", archetype: "central" },
      { name: "Carré d'Or", archetype: "central" },
      { name: "Libération", archetype: "residential" },
      { name: "Cimiez", archetype: "residential" },
      { name: "Riquier", archetype: "residential" },
      { name: "Fabron", archetype: "peripheral" },
      { name: "L'Ariane", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "nantes",
      name: "Nantes",
      postalCodes: ["44000", "44100", "44300"],
      department: "Loire-Atlantique (44)",
      coverageLevel: "rich",
    },
    center: { latitude: 47.2184, longitude: -1.5536 },
    areas: [
      { name: "Centre-ville", archetype: "central" },
      { name: "Île de Nantes", archetype: "central" },
      { name: "Hauts-Pavés – Saint-Félix", archetype: "residential" },
      { name: "Malakoff – Saint-Donatien", archetype: "residential" },
      { name: "Dervallières – Zola", archetype: "residential" },
      { name: "Doulon – Bottière", archetype: "peripheral" },
      { name: "Nantes Nord", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "montpellier",
      name: "Montpellier",
      postalCodes: ["34000", "34070", "34080"],
      department: "Hérault (34)",
      coverageLevel: "rich",
    },
    center: { latitude: 43.6108, longitude: 3.8767 },
    areas: [
      { name: "Écusson", archetype: "central" },
      { name: "Antigone", archetype: "central" },
      { name: "Beaux-Arts", archetype: "residential" },
      { name: "Port Marianne", archetype: "residential" },
      { name: "Boutonnet", archetype: "residential" },
      { name: "Croix-d'Argent", archetype: "peripheral" },
      { name: "La Mosson", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "strasbourg",
      name: "Strasbourg",
      postalCodes: ["67000", "67100", "67200"],
      department: "Bas-Rhin (67)",
      coverageLevel: "rich",
    },
    center: { latitude: 48.5734, longitude: 7.7521 },
    areas: [
      { name: "Grande Île", archetype: "central" },
      { name: "Krutenau", archetype: "central" },
      { name: "Neustadt", archetype: "residential" },
      { name: "Orangerie", archetype: "residential" },
      { name: "Neudorf", archetype: "residential" },
      { name: "Robertsau", archetype: "peripheral" },
      { name: "Hautepierre", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "bordeaux",
      name: "Bordeaux",
      postalCodes: ["33000", "33200", "33300"],
      department: "Gironde (33)",
      coverageLevel: "rich",
    },
    center: { latitude: 44.8378, longitude: -0.5792 },
    areas: [
      { name: "Saint-Pierre", archetype: "central" },
      { name: "Chartrons", archetype: "central" },
      { name: "Saint-Michel", archetype: "residential" },
      { name: "Nansouty", archetype: "residential" },
      { name: "La Bastide", archetype: "residential" },
      { name: "Caudéran", archetype: "peripheral" },
      { name: "Bacalan", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "lille",
      name: "Lille",
      postalCodes: ["59000", "59800"],
      department: "Nord (59)",
      coverageLevel: "rich",
    },
    center: { latitude: 50.6292, longitude: 3.0573 },
    areas: [
      { name: "Vieux-Lille", archetype: "central" },
      { name: "Centre", archetype: "central" },
      { name: "Wazemmes", archetype: "residential" },
      { name: "Vauban-Esquermes", archetype: "residential" },
      { name: "Moulins", archetype: "residential" },
      { name: "Fives", archetype: "peripheral" },
      { name: "Bois-Blancs", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "dijon",
      name: "Dijon",
      postalCodes: ["21000"],
      department: "Côte-d'Or (21)",
      coverageLevel: "rich",
    },
    center: { latitude: 47.322, longitude: 5.0415 },
    areas: [
      { name: "Centre-ville", archetype: "central" },
      { name: "Montchapet", archetype: "residential" },
      { name: "Université", archetype: "residential" },
      { name: "Chevreul – Parc", archetype: "residential" },
      { name: "Fontaine d'Ouche", archetype: "peripheral" },
      { name: "Toison d'Or", archetype: "peripheral" },
      { name: "Grésilles", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "lyon",
      name: "Lyon",
      postalCodes: ["69001", "69002", "69003"],
      department: "Rhône (69)",
      coverageLevel: "rich",
    },
    center: { latitude: 45.764, longitude: 4.8357 },
    areas: [
      { name: "Presqu'île", archetype: "central" },
      { name: "Croix-Rousse", archetype: "residential" },
      { name: "Part-Dieu", archetype: "central" },
      { name: "Confluence", archetype: "residential" },
      { name: "Monplaisir", archetype: "residential" },
      { name: "Vaise", archetype: "peripheral" },
      { name: "La Guillotière", archetype: "central" },
      { name: "Gerland", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "versailles",
      name: "Versailles",
      postalCodes: ["78000"],
      department: "Yvelines (78)",
      coverageLevel: "rich",
    },
    center: { latitude: 48.8049, longitude: 2.1204 },
    areas: [
      { name: "Notre-Dame", archetype: "central" },
      { name: "Saint-Louis", archetype: "central" },
      { name: "Clagny – Glatigny", archetype: "residential" },
      { name: "Montreuil", archetype: "residential" },
      { name: "Porchefontaine", archetype: "residential" },
      { name: "Chantiers", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "avignon",
      name: "Avignon",
      postalCodes: ["84000"],
      department: "Vaucluse (84)",
      coverageLevel: "rich",
    },
    center: { latitude: 43.9493, longitude: 4.8055 },
    areas: [
      { name: "Intra-muros", archetype: "central" },
      { name: "Montfavet", archetype: "residential" },
      { name: "Pont des Deux Eaux", archetype: "residential" },
      { name: "Monclar", archetype: "peripheral" },
      { name: "Saint-Chamand", archetype: "peripheral" },
    ],
  },
  {
    city: {
      id: "petite-commune",
      name: "Saint-Apollinaire",
      postalCodes: ["21850"],
      department: "Côte-d'Or (21)",
      coverageLevel: "limited",
    },
    center: { latitude: 47.327, longitude: 5.0855 },
    areas: [
      { name: "Bourg", archetype: "limited" },
      { name: "Les Carrières", archetype: "limited" },
    ],
  },
];

// --- deterministic pseudo-random (stable per area, no Math.random) ----------

function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // map to 0..1
  return ((h >>> 0) % 1000) / 1000;
}

/** value between min and max, jittered deterministically by the seed. */
function v(seed: number, min: number, max: number): number {
  return Math.round(min + (max - min) * seed);
}

type Archetypal = {
  rent: [number, number];
  priceM2: [number, number];
  transport: [number, number];
  shops: [number, number];
  pharmacies: [number, number];
  admin: [number, number];
  sport: [number, number];
  culture: [number, number];
  libraries: [number, number];
  doctors: [number, number];
  medical: [number, number];
  creches: [number, number];
  parks: [number, number];
  crime: [number, number];
  apl: [number, number];
  distCenter: [number, number];
  distTransport: [number, number];
  distHospital: [number, number];
};

const PROFILES: Record<Archetype, Archetypal> = {
  central: {
    rent: [880, 1120],
    priceM2: [3600, 5200],
    transport: [12, 22],
    shops: [55, 95],
    pharmacies: [4, 8],
    admin: [3, 7],
    sport: [4, 9],
    culture: [6, 14],
    libraries: [1, 3],
    doctors: [16, 30],
    medical: [2, 5],
    creches: [3, 6],
    parks: [1, 3],
    crime: [55, 90],
    apl: [4.5, 6],
    distCenter: [0.2, 0.9],
    distTransport: [0.1, 0.3],
    distHospital: [1, 3],
  },
  residential: {
    rent: [740, 920],
    priceM2: [2800, 3700],
    transport: [5, 10],
    shops: [22, 42],
    pharmacies: [2, 5],
    admin: [1, 4],
    sport: [4, 9],
    culture: [2, 6],
    libraries: [1, 2],
    doctors: [7, 14],
    medical: [1, 3],
    creches: [3, 6],
    parks: [4, 9],
    crime: [22, 45],
    apl: [4, 5.2],
    distCenter: [1.4, 3.4],
    distTransport: [0.3, 0.7],
    distHospital: [2, 5],
  },
  peripheral: {
    rent: [600, 760],
    priceM2: [1900, 2800],
    transport: [2, 6],
    shops: [8, 20],
    pharmacies: [1, 3],
    admin: [0, 2],
    sport: [1, 5],
    culture: [0, 3],
    libraries: [0, 1],
    doctors: [2, 7],
    medical: [0, 2],
    creches: [1, 3],
    parks: [2, 6],
    crime: [25, 55],
    apl: [3, 4.2],
    distCenter: [3, 6.5],
    distTransport: [0.6, 1.6],
    distHospital: [4, 8],
  },
  limited: {
    rent: [620, 780],
    priceM2: [2100, 2700],
    transport: [0, 2],
    shops: [3, 9],
    pharmacies: [0, 2],
    admin: [0, 1],
    sport: [0, 3],
    culture: [0, 1],
    libraries: [0, 1],
    doctors: [0, 3],
    medical: [0, 1],
    creches: [0, 2],
    parks: [1, 4],
    crime: [15, 35],
    apl: [2.6, 3.6],
    distCenter: [4, 9],
    distTransport: [1, 3],
    distHospital: [6, 12],
  },
};

function buildArea(
  cityId: string,
  spec: AreaSpec,
  center: CitySpec["center"],
  index: number,
): AreaProfile {
  const p = PROFILES[spec.archetype];
  const s = seedFrom(`${cityId}:${spec.name}`);
  const s2 = seedFrom(`${spec.name}:${cityId}`);
  const limited = spec.archetype === "limited";
  const transactionCount = limited ? v(s, 5, 18) : v(s, 35, 180);
  const priceM2 = limited && transactionCount < 12 ? null : v(s, p.priceM2[0], p.priceM2[1]);

  return {
    areaId: `${cityId}-${index}`,
    areaName: spec.name,
    areaType: limited ? "commune" : "iris",
    centroid: {
      latitude: center.latitude + (s - 0.5) * 0.04,
      longitude: center.longitude + (s2 - 0.5) * 0.05,
    },
    housing: {
      medianRentPerMonth: v(s2, p.rent[0], p.rent[1]),
      medianPriceM2: priceM2,
      p25PriceM2: priceM2 === null ? null : Math.round(priceM2 * 0.84),
      p75PriceM2: priceM2 === null ? null : Math.round(priceM2 * 1.18),
      transactionCount,
      propertyTypesAvailable: spec.archetype === "central" ? ["apartment"] : ["apartment", "house"],
    },
    poi: {
      transport: v(s, p.transport[0], p.transport[1]),
      shops: v(s2, p.shops[0], p.shops[1]),
      pharmacies: v(s, p.pharmacies[0], p.pharmacies[1]),
      adminServices: v(s2, p.admin[0], p.admin[1]),
      sport: v(s, p.sport[0], p.sport[1]),
      culture: v(s2, p.culture[0], p.culture[1]),
      libraries: v(s, p.libraries[0], p.libraries[1]),
      doctors: v(s2, p.doctors[0], p.doctors[1]),
      medicalCenters: v(s, p.medical[0], p.medical[1]),
      creches: v(s2, p.creches[0], p.creches[1]),
      schoolsMaternelle: v(s, limited ? 0 : 1, limited ? 1 : 3),
      schoolsElementaire: v(s2, limited ? 0 : 1, limited ? 1 : 3),
      college: v(s, 0, limited ? 1 : 2),
      lycee: v(s2, 0, spec.archetype === "central" ? 2 : 1),
      parks: v(s, p.parks[0], p.parks[1]),
    },
    distancesKm: {
      toCityCenter: round1(p.distCenter[0] + (p.distCenter[1] - p.distCenter[0]) * s),
      toNearestTransport: round1(
        p.distTransport[0] + (p.distTransport[1] - p.distTransport[0]) * s2,
      ),
      toNearestHospital: round1(p.distHospital[0] + (p.distHospital[1] - p.distHospital[0]) * s),
    },
    apl: round1(p.apl[0] + (p.apl[1] - p.apl[0]) * s2),
    recordedCrimeRatePer1000: v(s, p.crime[0], p.crime[1]),
    coverage: {
      housingSale: priceM2 === null ? "unavailable" : "available",
      housingRent: "commune_only",
      poi: limited ? "commune_only" : "available",
      crime: "commune_only",
      apl: "commune_only",
    },
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

const AREA_CACHE = new Map<string, AreaProfile[]>();

export function listCities(): City[] {
  // Alphabetical: with fourteen cities a picker needs a predictable order, and
  // "largest first" stops being obvious to the reader past the first few.
  return CITY_SPECS.map((c) => c.city).sort((a, b) => a.name.localeCompare(b.name, "fr"));
}

export function findCity(cityId: string): City | undefined {
  return CITY_SPECS.find((c) => c.city.id === cityId)?.city;
}

export function getCityAreas(cityId: string): AreaProfile[] {
  // Dijon runs on real official open data (DVF + BPE); other pilot cities are
  // still deterministic mock until their ETL lands.
  if (cityId === "dijon") return getDijonAreas();
  if (AREA_CACHE.has(cityId)) return AREA_CACHE.get(cityId)!;
  const spec = CITY_SPECS.find((c) => c.city.id === cityId);
  if (!spec) return [];
  const areas = spec.areas.map((a, i) => buildArea(cityId, a, spec.center, i));
  AREA_CACHE.set(cityId, areas);
  return areas;
}

export function findArea(cityId: string, areaId: string): AreaProfile | undefined {
  return getCityAreas(cityId).find((a) => a.areaId === areaId);
}

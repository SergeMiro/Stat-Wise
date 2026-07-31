/**
 * Partly measured, partly seeded snapshot for the reste-à-vivre engine.
 *
 * ⚠️ Read the mapping below before trusting a figure. Rents, fuel and travel
 * distances are read from imported data. Electricity, water and transit fares are
 * still SEED VALUES, sized to the real datasets so the simulator reads correctly
 * end to end. The UI keeps labelling runs as seeded — see `SNAPSHOT_IS_SEEDED` —
 * because a withdrawn banner would imply every line is a measurement.
 *
 * District figures are **derived**, not typed in one by one. Each city carries a
 * central reference rent and each district an archetype; the rest follows from a
 * documented model plus a deterministic per-district jitter. That is deliberate:
 * sixty hand-written numbers would look like measurements, while a stated model
 * can be read, argued with and replaced wholesale by ETL output.
 *
 * Replacing this module with real data must not require touching the engine: the
 * shapes below are the shapes the importers have to produce.
 *
 * Field → source mapping:
 *   rentPerSqm          → MEASURED: Carte des loyers 2025 (ANIL/CEREMA), commune
 *   rentPerSqmRange     → MEASURED: the source's own confidence interval
 *   electricityKwhYear  → seeded; Enedis, consommation résidentielle par IRIS
 *   waterPricePerM3     → seeded; SISPEA via Hub'Eau, périmètre du service
 *   fuelPricePerLitre   → MEASURED: prix des carburants, médiane du département
 *   transitPassMonthly  → seeded; grille tarifaire du réseau, à relever
 *   transitTicketUnit   → GTFS fare_attributes, quand le réseau les publie
 *   distanceToJobKm     → MEASURED where `distances.json` has the district
 *   distanceToGroceryKm → MEASURED where `distances.json` has the district
 *   alurZone            → décret plafonnant les honoraires de location
 *
 * `id`, `name` and `department` are the same as in `src/lib/mock/cities.ts`, so
 * both simulators speak of the same places; a test enforces it.
 */

import measured from "./distances.json" with { type: "json" };
import market from "./market.json" with { type: "json" };

/** Position of a district inside its city. Drives rent, energy and distances. */
export type DistrictArchetype = "central" | "residential" | "peripheral";

export type DistrictSnapshot = {
  id: string;
  name: string;
  archetype: DistrictArchetype;
  /** Rent €/m² per month, charges comprises, by housing type. */
  rentPerSqm: { appartement: number; maison: number };
  /** P25/P75 spread of the flat rent, for the result range. */
  rentPerSqmRange: { low: number; high: number };
  /** Annual kWh per residential delivery point in this area. */
  electricityKwhYear: number;
  /**
   * One-way distance to the reference workplace (city centre) in km. Stands in
   * for real address-to-address routing, which V1 does not do yet.
   */
  distanceToJobKm: number;
  /**
   * One-way distance to the nearest large food store, in km. This is what turns
   * "there is a supermarket nearby" into euros: a cheap district far from one
   * gives part of the saving back in fuel.
   */
  distanceToGroceryKm: number;
  /**
   * Road minutes to the reference workplace, when they were measured. Used only
   * for the car, since a routed car time says nothing about a bus or a bicycle.
   */
  distanceToJobMinutes: number | null;
  /**
   * Whether the two distances above were measured on the road network or are
   * still the archetype model. Shown to the reader, because the difference
   * between a measurement and a model is the whole point of the provenance rule.
   */
  distanceSource: DistanceSource;
  /** The OSM place the route started from, when measured. */
  anchorName: string | null;
  /** The shop the grocery distance was measured to, when found. */
  groceryName: string | null;
};

export type DistanceSource = "measured" | "derived";

export type CitySnapshot = {
  /** Must match a city id in `src/lib/mock/cities.ts`. */
  id: string;
  name: string;
  department: string;
  /**
   * Reference point for the workplace — the town hall. Real routing measures the
   * commute from a district to here, which is why it belongs in the data and not
   * in a component.
   */
  center: GeoPoint;
  /**
   * INSEE commune code. Needed by the socio-fiscal rules engine: housing benefit
   * depends on which zone the commune sits in, so a wrong code silently produces
   * a benefit for the wrong part of France. Every code here came from the BAN
   * municipality lookup, not from memory.
   */
  communeCode: string;
  /** True for Île-de-France, the only spatial price gap Insee actually measures. */
  parisRegion: boolean;
  /** €/m³, water supply + collective sanitation. */
  waterPricePerM3: number;
  /** €/litre, SP95-E10. */
  fuelPricePerLitre: number;
  /** Monthly adult transit pass, full price before the employer share. */
  transitPassMonthly: number;
  /** True where the network is free for residents, so the pass costs nothing. */
  transitFreeForResidents: boolean;
  /** Single-journey ticket, for trips no monthly pass covers. */
  transitTicketUnit: number;
  transitNetwork: string;
  /** Zone used by the decree capping letting fees. */
  alurZone: AlurZone;
  districts: DistrictSnapshot[];
};

export type AlurZone = "tres_tendue" | "tendue" | "autre";

export type GeoPoint = { lat: number; lon: number };

/**
 * Still true, and deliberately so.
 *
 * Rents and travel distances are now measured — the two heaviest items. Energy,
 * water and transit fares are not: they remain seeded. The banner stays until the
 * last of them is real, because a reader who sees it withdrawn will reasonably
 * assume every figure is a measurement. `MARKET_COVERAGE` and the per-line status
 * are what say which is which.
 */
export const SNAPSHOT_IS_SEEDED = true;

export const JOB_DATASET_VERSION = "loyers2025-carburants2026.07";

// --- the derivation model ---------------------------------------------------

/**
 * How an archetype sits relative to its city's central reference.
 *
 * `rent` multiplies the central €/m². Energy rises towards the edge (bigger,
 * older, less dense housing) while distances grow — which is the whole tension
 * the simulator exists to price: cheaper rent, dearer travel.
 */
const ARCHETYPES: Record<
  DistrictArchetype,
  { rent: number; kwh: number; jobKm: number; groceryKm: number }
> = {
  central: { rent: 1, kwh: 3150, jobKm: 1.2, groceryKm: 0.4 },
  residential: { rent: 0.88, kwh: 3700, jobKm: 2.6, groceryKm: 0.6 },
  peripheral: { rent: 0.76, kwh: 4250, jobKm: 4.6, groceryKm: 0.95 },
};

/** A house costs less per m² than a flat in the same area. */
export const HOUSE_RENT_RATIO = 0.9;
/** P25 and P75 of the advertised rent around its median. */
const RENT_SPREAD = { low: 0.85, high: 1.18 };

/** FNV-1a → 0..1. Deterministic: the engine must never call Math.random. */
function seed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Floors a measured distance at 100 m.
 *
 * A shop across the street routes to 40 m, which rounds to 0.0 km — and in this
 * codebase a zero means "costs nothing", while a missing value means "unknown".
 * Neither is true here: the journey is real, just short. Rounding it away would
 * quietly turn a measurement into one of the two things it is not.
 */
const atLeastAStep = (km: number) => Math.max(0.1, round1(km));
const round2 = (n: number) => Math.round(n * 100) / 100;

type CitySpec = Omit<CitySnapshot, "districts"> & {
  /** Central reference rent, €/m²/month for a flat, charges comprises. */
  centralRentPerSqm: number;
  districts: Array<{ id: string; name: string; archetype: DistrictArchetype }>;
};

type MarketRow = {
  rentPerSqm: { appartement: number; maison: number };
  rentRange: { low: number; high: number };
  observations: number;
  fuelPricePerLitre: number | null;
};

const marketOf = (cityId: string): MarketRow | undefined =>
  (market.cities as Record<string, MarketRow | undefined>)[cityId];

function buildDistrict(
  cityId: string,
  centralRent: number,
  spec: { id: string; name: string; archetype: DistrictArchetype },
): DistrictSnapshot {
  const a = ARCHETYPES[spec.archetype];
  // Two independent draws so rent and distance do not move in lockstep.
  const s1 = seed(`${cityId}:${spec.id}`);
  const s2 = seed(`${spec.id}:${cityId}`);

  /*
    The commune's real rent when the market pass resolved it, the seeded reference
    otherwise. Both are then shaped by the archetype, because the published figure
    is one number for the whole commune and districts inside it are not alike.
  */
  const row = marketOf(cityId);
  const reference = row?.rentPerSqm.appartement ?? centralRent;

  // ±6 % around the archetype so districts of one archetype are not clones.
  const flat = round2(reference * a.rent * (0.94 + 0.12 * s1));

  /*
    The range comes from the source's own confidence interval when we have it, kept
    proportional to this district's position. Multiplying the median by 0.85 and 1.18
    was a stand-in for exactly this, and a published interval beats a guessed one.
  */
  const spread = row
    ? { low: row.rentRange.low / row.rentPerSqm.appartement, high: row.rentRange.high / row.rentPerSqm.appartement }
    : RENT_SPREAD;
  const houseRatio = row ? row.rentPerSqm.maison / row.rentPerSqm.appartement : HOUSE_RENT_RATIO;

  /*
    Measured distances win over the model when the ETL found this district. A
    district it could not anchor keeps its modelled value and is labelled
    `derived`, rather than being handed a distance measured from the wrong place.
  */
  const hit = (measured.entries as Record<string, MeasuredEntry | undefined>)[
    `${cityId}:${spec.id}`
  ];

  return {
    id: spec.id,
    name: spec.name,
    archetype: spec.archetype,
    rentPerSqm: { appartement: flat, maison: round2(flat * houseRatio) },
    rentPerSqmRange: { low: round2(flat * spread.low), high: round2(flat * spread.high) },
    electricityKwhYear: Math.round(a.kwh * (0.92 + 0.16 * s2)),
    distanceToJobKm: hit ? atLeastAStep(hit.jobKm) : round1(a.jobKm * (0.8 + 0.4 * s2)),
    distanceToGroceryKm:
      hit && hit.groceryKm !== null
        ? atLeastAStep(hit.groceryKm)
        : round1(a.groceryKm * (0.8 + 0.4 * s1)),
    distanceToJobMinutes: hit ? hit.jobMinutes : null,
    distanceSource: hit ? "measured" : "derived",
    anchorName: hit ? hit.anchorName : null,
    groceryName: hit ? (hit.groceryName ?? null) : null,
  };
}

type MeasuredEntry = {
  jobKm: number;
  jobMinutes: number;
  groceryKm: number | null;
  anchorName: string;
  groceryName: string | null;
};

/** Date the measured distances were collected, shown next to them. */
export const DISTANCES_GENERATED_AT: string = measured.generatedAt;
export const DISTANCES_COVERAGE = measured.coverage;

// --- the cities -------------------------------------------------------------

/*
  The ten largest cities in France plus the four pilot communes already covered.
  Transit fares and water prices are seeded per network; two of them are worth
  reading twice:

  - Montpellier's network has been free for residents of the métropole since
    21/12/2023, so the pass is 0 € and the employer's 50 % has nothing to cover.
  - Paris and Versailles are both Île-de-France, so they must carry the *same*
    Navigo price. Sources disagreed on the 2026 figure (90,80 € against
    101,50 €); 90,80 € is used and recorded in NOTES/03 as needing a check
    against Île-de-France Mobilités directly.
*/
const CITY_SPECS: CitySpec[] = [
  {
    id: "paris",
    communeCode: "75056",
    center: { lat: 48.8566, lon: 2.3522 },
    name: "Paris",
    department: "Paris (75)",
    parisRegion: true,
    waterPricePerM3: 4.3,
    fuelPricePerLitre: 1.86,
    transitPassMonthly: 90.8,
    transitFreeForResidents: false,
    transitTicketUnit: 2.5,
    transitNetwork: "Navigo (Île-de-France Mobilités)",
    alurZone: "tres_tendue",
    centralRentPerSqm: 31,
    districts: [
      { id: "marais", name: "Le Marais", archetype: "central" },
      { id: "quartier-latin", name: "Quartier latin", archetype: "central" },
      { id: "saint-germain", name: "Saint-Germain-des-Prés", archetype: "central" },
      { id: "montmartre", name: "Montmartre", archetype: "residential" },
      { id: "batignolles", name: "Batignolles", archetype: "residential" },
      { id: "bercy", name: "Bercy", archetype: "residential" },
      { id: "belleville", name: "Belleville", archetype: "peripheral" },
      { id: "la-chapelle", name: "La Chapelle", archetype: "peripheral" },
    ],
  },
  {
    id: "marseille",
    communeCode: "13055",
    center: { lat: 43.2965, lon: 5.3698 },
    name: "Marseille",
    department: "Bouches-du-Rhône (13)",
    parisRegion: false,
    waterPricePerM3: 3.9,
    fuelPricePerLitre: 1.79,
    transitPassMonthly: 44,
    transitFreeForResidents: false,
    transitTicketUnit: 1.8,
    transitNetwork: "RTM",
    alurZone: "tendue",
    centralRentPerSqm: 16,
    districts: [
      { id: "vieux-port", name: "Vieux-Port", archetype: "central" },
      { id: "le-panier", name: "Le Panier", archetype: "central" },
      { id: "cours-julien", name: "Cours Julien", archetype: "central" },
      { id: "prado-castellane", name: "Prado – Castellane", archetype: "residential" },
      { id: "cinq-avenues", name: "Les Cinq Avenues", archetype: "residential" },
      { id: "joliette", name: "La Joliette", archetype: "residential" },
      { id: "saint-barnabe", name: "Saint-Barnabé", archetype: "peripheral" },
      { id: "l-estaque", name: "L'Estaque", archetype: "peripheral" },
    ],
  },
  {
    id: "lyon",
    communeCode: "69123",
    center: { lat: 45.764, lon: 4.8357 },
    name: "Lyon",
    department: "Rhône (69)",
    parisRegion: false,
    waterPricePerM3: 3.25,
    fuelPricePerLitre: 1.78,
    transitPassMonthly: 74.2,
    transitFreeForResidents: false,
    transitTicketUnit: 2.1,
    transitNetwork: "TCL",
    alurZone: "tendue",
    centralRentPerSqm: 19,
    districts: [
      { id: "presqu-ile", name: "Presqu'île", archetype: "central" },
      { id: "part-dieu", name: "Part-Dieu", archetype: "central" },
      { id: "confluence", name: "Confluence", archetype: "central" },
      { id: "croix-rousse", name: "Croix-Rousse", archetype: "residential" },
      { id: "la-guillotiere", name: "La Guillotière", archetype: "residential" },
      { id: "monplaisir", name: "Monplaisir", archetype: "residential" },
      { id: "vaise", name: "Vaise", archetype: "peripheral" },
      { id: "gerland", name: "Gerland", archetype: "peripheral" },
    ],
  },
  {
    id: "toulouse",
    communeCode: "31555",
    center: { lat: 43.6047, lon: 1.4442 },
    name: "Toulouse",
    department: "Haute-Garonne (31)",
    parisRegion: false,
    waterPricePerM3: 3.6,
    fuelPricePerLitre: 1.76,
    transitPassMonthly: 48,
    transitFreeForResidents: false,
    transitTicketUnit: 1.8,
    transitNetwork: "Tisséo",
    alurZone: "tendue",
    centralRentPerSqm: 15,
    districts: [
      { id: "capitole", name: "Capitole", archetype: "central" },
      { id: "les-carmes", name: "Les Carmes", archetype: "central" },
      { id: "saint-cyprien", name: "Saint-Cyprien", archetype: "residential" },
      { id: "compans", name: "Compans-Caffarelli", archetype: "residential" },
      { id: "rangueil", name: "Rangueil", archetype: "residential" },
      { id: "borderouge", name: "Borderouge", archetype: "peripheral" },
      { id: "la-reynerie", name: "La Reynerie", archetype: "peripheral" },
    ],
  },
  {
    id: "nice",
    communeCode: "06088",
    center: { lat: 43.7102, lon: 7.262 },
    name: "Nice",
    department: "Alpes-Maritimes (06)",
    parisRegion: false,
    waterPricePerM3: 4.1,
    fuelPricePerLitre: 1.82,
    transitPassMonthly: 40,
    transitFreeForResidents: false,
    transitTicketUnit: 1.7,
    transitNetwork: "Lignes d'Azur",
    alurZone: "tendue",
    centralRentPerSqm: 19.5,
    districts: [
      { id: "vieux-nice", name: "Vieux-Nice", archetype: "central" },
      { id: "carre-d-or", name: "Carré d'Or", archetype: "central" },
      { id: "liberation", name: "Libération", archetype: "residential" },
      { id: "cimiez", name: "Cimiez", archetype: "residential" },
      { id: "riquier", name: "Riquier", archetype: "residential" },
      { id: "fabron", name: "Fabron", archetype: "peripheral" },
      { id: "l-ariane", name: "L'Ariane", archetype: "peripheral" },
    ],
  },
  {
    id: "nantes",
    communeCode: "44109",
    center: { lat: 47.2184, lon: -1.5536 },
    name: "Nantes",
    department: "Loire-Atlantique (44)",
    parisRegion: false,
    waterPricePerM3: 3.7,
    fuelPricePerLitre: 1.75,
    transitPassMonthly: 66,
    transitFreeForResidents: false,
    transitTicketUnit: 1.8,
    transitNetwork: "TAN",
    alurZone: "tendue",
    centralRentPerSqm: 15.5,
    districts: [
      { id: "centre-ville", name: "Centre-ville", archetype: "central" },
      { id: "ile-de-nantes", name: "Île de Nantes", archetype: "central" },
      { id: "hauts-paves", name: "Hauts-Pavés – Saint-Félix", archetype: "residential" },
      { id: "malakoff", name: "Malakoff – Saint-Donatien", archetype: "residential" },
      { id: "dervallieres", name: "Dervallières – Zola", archetype: "residential" },
      { id: "doulon", name: "Doulon – Bottière", archetype: "peripheral" },
      { id: "nantes-nord", name: "Nantes Nord", archetype: "peripheral" },
    ],
  },
  {
    id: "montpellier",
    communeCode: "34172",
    center: { lat: 43.6108, lon: 3.8767 },
    name: "Montpellier",
    department: "Hérault (34)",
    parisRegion: false,
    waterPricePerM3: 3.85,
    fuelPricePerLitre: 1.78,
    // Free for residents of the métropole since 21/12/2023 (Pass gratuité).
    transitPassMonthly: 0,
    transitFreeForResidents: true,
    transitTicketUnit: 1.6,
    transitNetwork: "TaM",
    alurZone: "tendue",
    centralRentPerSqm: 16.5,
    districts: [
      { id: "ecusson", name: "Écusson", archetype: "central" },
      { id: "antigone", name: "Antigone", archetype: "central" },
      { id: "beaux-arts", name: "Beaux-Arts", archetype: "residential" },
      { id: "port-marianne", name: "Port Marianne", archetype: "residential" },
      { id: "boutonnet", name: "Boutonnet", archetype: "residential" },
      { id: "croix-d-argent", name: "Croix-d'Argent", archetype: "peripheral" },
      { id: "la-mosson", name: "La Mosson", archetype: "peripheral" },
    ],
  },
  {
    id: "strasbourg",
    communeCode: "67482",
    center: { lat: 48.5734, lon: 7.7521 },
    name: "Strasbourg",
    department: "Bas-Rhin (67)",
    parisRegion: false,
    waterPricePerM3: 3.95,
    fuelPricePerLitre: 1.77,
    transitPassMonthly: 52.5,
    transitFreeForResidents: false,
    transitTicketUnit: 1.9,
    transitNetwork: "CTS",
    alurZone: "tendue",
    centralRentPerSqm: 15,
    districts: [
      { id: "grande-ile", name: "Grande Île", archetype: "central" },
      { id: "krutenau", name: "Krutenau", archetype: "central" },
      { id: "neustadt", name: "Neustadt", archetype: "residential" },
      { id: "orangerie", name: "Orangerie", archetype: "residential" },
      { id: "neudorf", name: "Neudorf", archetype: "residential" },
      { id: "robertsau", name: "Robertsau", archetype: "peripheral" },
      { id: "hautepierre", name: "Hautepierre", archetype: "peripheral" },
    ],
  },
  {
    id: "bordeaux",
    communeCode: "33063",
    center: { lat: 44.8378, lon: -0.5792 },
    name: "Bordeaux",
    department: "Gironde (33)",
    parisRegion: false,
    waterPricePerM3: 3.65,
    fuelPricePerLitre: 1.77,
    transitPassMonthly: 45.5,
    transitFreeForResidents: false,
    transitTicketUnit: 1.8,
    transitNetwork: "TBM",
    alurZone: "tendue",
    centralRentPerSqm: 17,
    districts: [
      { id: "saint-pierre", name: "Saint-Pierre", archetype: "central" },
      { id: "chartrons", name: "Chartrons", archetype: "central" },
      { id: "saint-michel", name: "Saint-Michel", archetype: "residential" },
      { id: "nansouty", name: "Nansouty", archetype: "residential" },
      { id: "la-bastide", name: "La Bastide", archetype: "residential" },
      { id: "cauderan", name: "Caudéran", archetype: "peripheral" },
      { id: "bacalan", name: "Bacalan", archetype: "peripheral" },
    ],
  },
  {
    id: "lille",
    communeCode: "59350",
    center: { lat: 50.6292, lon: 3.0573 },
    name: "Lille",
    department: "Nord (59)",
    parisRegion: false,
    waterPricePerM3: 3.8,
    fuelPricePerLitre: 1.76,
    transitPassMonthly: 40,
    transitFreeForResidents: false,
    transitTicketUnit: 1.8,
    transitNetwork: "Ilévia",
    alurZone: "tendue",
    centralRentPerSqm: 15.5,
    districts: [
      { id: "vieux-lille", name: "Vieux-Lille", archetype: "central" },
      { id: "centre", name: "Centre", archetype: "central" },
      { id: "wazemmes", name: "Wazemmes", archetype: "residential" },
      { id: "vauban-esquermes", name: "Vauban-Esquermes", archetype: "residential" },
      { id: "moulins", name: "Moulins", archetype: "residential" },
      { id: "fives", name: "Fives", archetype: "peripheral" },
      { id: "bois-blancs", name: "Bois-Blancs", archetype: "peripheral" },
    ],
  },
  {
    id: "versailles",
    communeCode: "78646",
    center: { lat: 48.8049, lon: 2.1204 },
    name: "Versailles",
    department: "Yvelines (78)",
    parisRegion: true,
    waterPricePerM3: 4.35,
    fuelPricePerLitre: 1.83,
    // Same Navigo as Paris: one network, one price.
    transitPassMonthly: 90.8,
    transitFreeForResidents: false,
    transitTicketUnit: 2.5,
    transitNetwork: "Navigo (Île-de-France Mobilités)",
    alurZone: "tendue",
    centralRentPerSqm: 20.5,
    districts: [
      { id: "notre-dame", name: "Notre-Dame", archetype: "central" },
      { id: "saint-louis", name: "Saint-Louis", archetype: "central" },
      { id: "clagny-glatigny", name: "Clagny – Glatigny", archetype: "residential" },
      { id: "montreuil", name: "Montreuil", archetype: "residential" },
      { id: "chantiers", name: "Chantiers", archetype: "residential" },
      { id: "porchefontaine", name: "Porchefontaine", archetype: "peripheral" },
    ],
  },
  {
    id: "dijon",
    communeCode: "21231",
    center: { lat: 47.3216, lon: 5.0415 },
    name: "Dijon",
    department: "Côte-d'Or (21)",
    parisRegion: false,
    waterPricePerM3: 3.55,
    fuelPricePerLitre: 1.72,
    transitPassMonthly: 40.5,
    transitFreeForResidents: false,
    transitTicketUnit: 1.5,
    transitNetwork: "Divia",
    alurZone: "autre",
    centralRentPerSqm: 14.2,
    districts: [
      { id: "centre-ville", name: "Centre-ville", archetype: "central" },
      { id: "universite", name: "Université", archetype: "central" },
      { id: "montchapet", name: "Montchapet", archetype: "residential" },
      { id: "chevreul-parc", name: "Chevreul – Parc", archetype: "residential" },
      { id: "toison-d-or", name: "Toison d'Or", archetype: "residential" },
      { id: "fontaine-d-ouche", name: "Fontaine d'Ouche", archetype: "peripheral" },
      { id: "gresilles", name: "Grésilles", archetype: "peripheral" },
    ],
  },
  {
    id: "avignon",
    communeCode: "84007",
    center: { lat: 43.9493, lon: 4.8055 },
    name: "Avignon",
    department: "Vaucluse (84)",
    parisRegion: false,
    waterPricePerM3: 3.95,
    fuelPricePerLitre: 1.75,
    transitPassMonthly: 38,
    transitFreeForResidents: false,
    transitTicketUnit: 1.4,
    transitNetwork: "Orizo",
    alurZone: "autre",
    centralRentPerSqm: 12.4,
    districts: [
      { id: "intra-muros", name: "Intra-muros", archetype: "central" },
      { id: "pont-des-deux-eaux", name: "Pont des Deux Eaux", archetype: "residential" },
      { id: "monclar", name: "Monclar", archetype: "residential" },
      { id: "montfavet", name: "Montfavet", archetype: "peripheral" },
      { id: "saint-chamand", name: "Saint-Chamand", archetype: "peripheral" },
    ],
  },
  {
    id: "petite-commune",
    communeCode: "21540",
    center: { lat: 47.327, lon: 5.0855 },
    name: "Saint-Apollinaire",
    department: "Côte-d'Or (21)",
    parisRegion: false,
    waterPricePerM3: 3.72,
    fuelPricePerLitre: 1.71,
    transitPassMonthly: 40.5,
    transitFreeForResidents: false,
    transitTicketUnit: 1.5,
    transitNetwork: "Divia",
    alurZone: "autre",
    centralRentPerSqm: 11.6,
    districts: [
      { id: "bourg", name: "Bourg", archetype: "residential" },
      { id: "les-carrieres", name: "Les Carrières", archetype: "peripheral" },
    ],
  },
];

export const cities: CitySnapshot[] = CITY_SPECS.map((spec) => {
  const { centralRentPerSqm, districts, ...city } = spec;
  const row = marketOf(spec.id);
  return {
    ...city,
    // A city the fuel pass could not price keeps its seeded litre.
    /*
      The literal in CITY_SPECS is a last-resort amorce, ~12 % below the July 2026
      readings. A test asserts every city resolves from `market.json`, so a future
      ETL run that loses a city fails the build instead of quietly serving the old
      price as if it were current.
    */
    fuelPricePerLitre: row?.fuelPricePerLitre ?? city.fuelPricePerLitre,
    districts: districts.map((d) => buildDistrict(spec.id, centralRentPerSqm, d)),
  };
});

/** How much of the market data is measured, for the banner and the fine print. */
export const MARKET_COVERAGE = market.coverage;
export const MARKET_GENERATED_AT: string = market.generatedAt;
/** Cities whose rent is a real published figure rather than a seed. */
export const RENT_IS_MEASURED = (cityId: string): boolean => marketOf(cityId) !== undefined;

/**
 * National parameters. None of these create a difference between two cities —
 * they only scale a quantity that does. Kept here so the engine never hides a
 * magic number.
 */
export const nationalParams = {
  /** €/kWh, variable part of the electricity tariff. */
  electricityPricePerKwh: 0.2016,
  /** €/month, 6 kVA subscription. */
  electricitySubscriptionMonthly: 14.2,
  /**
   * Non-fuel running cost of a car per km — maintenance, tyres, insurance,
   * depreciation. Derived from the DGFiP mileage allowance, which is national
   * and therefore blind to insurance differences between départements.
   */
  carVariableCostPerKm: 0.15,
  /**
   * Uplift applied to the running cost of a 100 % electric car.
   *
   * The DGFiP increases the mileage allowance by 20 % for electric vehicles
   * (arrêté du 16/02/2026, scale unchanged since 2024). Careful: that fiscal
   * majoration also covers charging, which this engine bills as its own line.
   * So the number is published, but the way we use it — as an assumption about
   * wear and depreciation only — is ours, and the line says so.
   */
  electricVehicleUplift: 0.2,
  /**
   * €/kWh at a public charging point. An assumption, not a measurement: the
   * national IRVE file lists stations and sometimes their tariff, but the tariff
   * field is heterogeneous and often empty, and prices swing with the operator
   * and the charging power.
   */
  publicChargingPricePerKwh: 0.45,
  /** kWh/100 km, a mid-range figure offered as a starting point. */
  defaultKwhPer100Km: 17,
  /** m³ per person per year. Order of magnitude, not a measurement. */
  waterM3PerPersonYear: 54,
  /** €/person/month for food at home, national reference basket. */
  foodPerAdultMonthly: 210,
  /** A child eats less than an adult; consumption-unit style weighting. */
  foodChildCoefficient: 0.6,
  /**
   * Île-de-France food price premium measured by the Insee ECSP 2022. It is the
   * only spatial food price gap that exists in official French statistics.
   */
  parisRegionFoodPremium: 0.07,
  /**
   * The employer must reimburse half of a public transport pass — for the
   * commute only. It never covers a shopping trip, so the engine applies it to
   * the work pass and nothing else.
   */
  employerTransitShare: 0.5,
  /** Grocery runs per month, when the user has not said otherwise. */
  defaultGroceryTripsPerMonth: 5,
  /** Weeks actually worked per year, after leave and public holidays. */
  workingWeeksPerYear: 45,
  /** Average door-to-door speed in km/h, by mode. Stands in for real routing. */
  averageSpeedKmh: { voiture: 22, transports: 16, actif: 13 },
} as const;

/**
 * One-off costs of moving — the `ponctuel` class from
 * `docs/reste-a-vivre-variables.md` §1. Never spread across months: 3 200 €
 * divided by twelve would silently eat 267 €/month and make the verdict
 * meaningless.
 */
export const moveCostRules = {
  /** Letting fees are capped in €/m² of living space by decree, per zone. */
  agencyFeeCapPerSqm: { tres_tendue: 12, tendue: 10, autre: 8 } as Record<AlurZone, number>,
  /** Deposit for an unfurnished let: one month's rent excluding charges. */
  depositMonths: 1,
  /**
   * Share of the rent assumed to be charges, used to get back to "hors charges"
   * for the deposit. The rent indicator we use is charges comprises, so this
   * step is unavoidable — and it is an assumption, not a measurement.
   */
  chargesShareOfRent: 0.15,
  /** €, a removal between two cities for a family. The user can override it. */
  defaultRemovalCost: 1200,
} as const;

/**
 * Suggested yearly cost of keeping a bicycle on the road — purchase spread over
 * its life, plus wear parts, tyres and repairs.
 *
 * No public dataset publishes this, so these are openly assumptions offered as
 * starting points, not measurements. The user picks one or types their own
 * figure, and the result labels the line as a hypothesis either way.
 */
export const bikeAmortizationPresets = [
  { key: "walk", perYear: 0 },
  { key: "usedBike", perYear: 60 },
  { key: "newBike", perYear: 150 },
  { key: "electricBike", perYear: 420 },
] as const;

/**
 * Barème national des participations familiales (PSU), applicable depuis
 * septembre 2025. `rate` is applied to the household's monthly resources,
 * clamped between `resourceFloor` and `resourceCeiling`, and yields the hourly
 * family contribution. The published per-hour floors and caps are the exact
 * product of those bounds, which is what makes the set verifiable.
 *
 * TODO: the Cnaf published a 2026 barème on 15/12/2025 — revalidate the rates
 * before the next release. `npm run check:vintages` fails once this is overdue.
 */
export const crecheScale = {
  vintage: "2025",
  resourceFloor: 801,
  resourceCeiling: 8500,
  /** Indexed by number of dependent children, 1 through 4+. */
  rates: [0.000619, 0.000516, 0.000413, 0.00031],
} as const;

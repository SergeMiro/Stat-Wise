/**
 * Seeded snapshot for the reste-à-vivre engine.
 *
 * ⚠️ These are SEED VALUES, sized to the real datasets so the simulator reads
 * correctly end to end. They are NOT yet read from the imported data. Each field
 * names the source it will be filled from, and the UI labels the whole run as
 * seeded — see `SNAPSHOT_IS_SEEDED` below, which the result page renders as a
 * visible banner rather than fine print.
 *
 * Replacing this module with ETL output must not require touching the engine:
 * the shapes here are the shapes the importers have to produce.
 *
 * Field → source mapping:
 *   rentPerSqm          → Carte des loyers (ANIL/CEREMA), commune, charges comprises
 *   electricityKwhYear  → Enedis, consommation résidentielle par IRIS
 *   waterPricePerM3     → SISPEA via Hub'Eau, périmètre du service
 *   fuelPricePerLitre   → prix-carburants.gouv.fr, médiane des stations à 5 km
 *   transitPassMonthly  → grille tarifaire du réseau, relevée à la main
 *   transitTicketUnit   → GTFS fare_attributes, quand le réseau les publie
 *   distanceToJobKm     → à remplacer par un vrai calcul BAN + itinéraire
 *   distanceToGroceryKm → BPE (commerces alimentaires) + BAN + itinéraire
 *
 * `cityId` and the district names are deliberately the same as in
 * `src/lib/mock/cities.ts`, so both simulators speak of the same places; a test
 * enforces it. The granularity still differs and is not faked: "Trouver mon
 * quartier" works on IRIS zones for Dijon (real DVF/BPE), while this simulator
 * works on named districts, which is the level rent indicators reach.
 */

export type DistrictSnapshot = {
  id: string;
  name: string;
  /** Rent €/m² per month, charges comprises, by housing type. */
  rentPerSqm: { appartement: number; maison: number };
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
};

export type CitySnapshot = {
  /** Must match a city id in `src/lib/mock/cities.ts`. */
  id: string;
  name: string;
  department: string;
  /** True for Île-de-France, the only spatial price gap Insee actually measures. */
  parisRegion: boolean;
  /** €/m³, water supply + collective sanitation. */
  waterPricePerM3: number;
  /** €/litre, SP95-E10. */
  fuelPricePerLitre: number;
  /** Monthly adult transit pass, full price before the employer share. */
  transitPassMonthly: number;
  /** Single-journey ticket, for trips no monthly pass covers. */
  transitTicketUnit: number;
  transitNetwork: string;
  districts: DistrictSnapshot[];
};

/** Flipped to false the day the engine reads imported data instead of this file. */
export const SNAPSHOT_IS_SEEDED = true;

export const JOB_DATASET_VERSION = "seed-2026.07";

export const cities: CitySnapshot[] = [
  {
    id: "dijon",
    name: "Dijon",
    department: "Côte-d'Or (21)",
    parisRegion: false,
    waterPricePerM3: 3.55,
    fuelPricePerLitre: 1.72,
    transitPassMonthly: 40.5,
    transitTicketUnit: 1.5,
    transitNetwork: "Divia",
    districts: [
      {
        id: "centre-ville",
        name: "Centre-ville",
        rentPerSqm: { appartement: 14.2, maison: 12.5 },
        electricityKwhYear: 3250,
        distanceToJobKm: 1.2,
        distanceToGroceryKm: 0.4,
      },
      {
        id: "montchapet",
        name: "Montchapet",
        rentPerSqm: { appartement: 12.8, maison: 11.6 },
        electricityKwhYear: 3900,
        distanceToJobKm: 2.4,
        distanceToGroceryKm: 0.6,
      },
      {
        id: "universite",
        name: "Université",
        rentPerSqm: { appartement: 13.5, maison: 11.9 },
        electricityKwhYear: 3400,
        distanceToJobKm: 3.1,
        distanceToGroceryKm: 0.7,
      },
      {
        id: "chevreul-parc",
        name: "Chevreul – Parc",
        rentPerSqm: { appartement: 12.9, maison: 11.8 },
        electricityKwhYear: 3700,
        distanceToJobKm: 2.0,
        distanceToGroceryKm: 0.5,
      },
      {
        id: "fontaine-d-ouche",
        name: "Fontaine d'Ouche",
        rentPerSqm: { appartement: 10.9, maison: 10.1 },
        electricityKwhYear: 3600,
        distanceToJobKm: 3.8,
        distanceToGroceryKm: 0.8,
      },
      {
        id: "toison-d-or",
        name: "Toison d'Or",
        rentPerSqm: { appartement: 12.2, maison: 11.2 },
        electricityKwhYear: 4400,
        distanceToJobKm: 4.3,
        distanceToGroceryKm: 0.4,
      },
      {
        id: "gresilles",
        name: "Grésilles",
        rentPerSqm: { appartement: 10.8, maison: 10.0 },
        electricityKwhYear: 3500,
        distanceToJobKm: 3.2,
        distanceToGroceryKm: 0.6,
      },
    ],
  },
  {
    id: "lyon",
    name: "Lyon",
    department: "Rhône (69)",
    parisRegion: false,
    waterPricePerM3: 3.25,
    fuelPricePerLitre: 1.78,
    transitPassMonthly: 74.2,
    transitTicketUnit: 2.1,
    transitNetwork: "TCL",
    districts: [
      {
        id: "presqu-ile",
        name: "Presqu'île",
        rentPerSqm: { appartement: 19.0, maison: 16.7 },
        electricityKwhYear: 2900,
        distanceToJobKm: 1.0,
        distanceToGroceryKm: 0.3,
      },
      {
        id: "croix-rousse",
        name: "Croix-Rousse",
        rentPerSqm: { appartement: 17.6, maison: 15.6 },
        electricityKwhYear: 3050,
        distanceToJobKm: 2.4,
        distanceToGroceryKm: 0.5,
      },
      {
        id: "part-dieu",
        name: "Part-Dieu",
        rentPerSqm: { appartement: 17.1, maison: 15.1 },
        electricityKwhYear: 3000,
        distanceToJobKm: 2.2,
        distanceToGroceryKm: 0.4,
      },
      {
        id: "confluence",
        name: "Confluence",
        rentPerSqm: { appartement: 18.3, maison: 16.1 },
        electricityKwhYear: 2950,
        distanceToJobKm: 2.0,
        distanceToGroceryKm: 0.6,
      },
      {
        id: "monplaisir",
        name: "Monplaisir",
        rentPerSqm: { appartement: 15.2, maison: 13.7 },
        electricityKwhYear: 3400,
        distanceToJobKm: 4.2,
        distanceToGroceryKm: 0.6,
      },
      {
        id: "vaise",
        name: "Vaise",
        rentPerSqm: { appartement: 14.9, maison: 13.5 },
        electricityKwhYear: 3600,
        distanceToJobKm: 4.8,
        distanceToGroceryKm: 0.7,
      },
      {
        id: "la-guillotiere",
        name: "La Guillotière",
        rentPerSqm: { appartement: 16.8, maison: 14.9 },
        electricityKwhYear: 3150,
        distanceToJobKm: 2.5,
        distanceToGroceryKm: 0.5,
      },
    ],
  },
  {
    id: "versailles",
    name: "Versailles",
    department: "Yvelines (78)",
    parisRegion: true,
    waterPricePerM3: 4.35,
    fuelPricePerLitre: 1.83,
    transitPassMonthly: 88.8,
    transitTicketUnit: 2.5,
    transitNetwork: "Navigo (Île-de-France Mobilités)",
    districts: [
      {
        id: "notre-dame",
        name: "Notre-Dame",
        rentPerSqm: { appartement: 20.5, maison: 18.1 },
        electricityKwhYear: 3500,
        distanceToJobKm: 1.3,
        distanceToGroceryKm: 0.4,
      },
      {
        id: "saint-louis",
        name: "Saint-Louis",
        rentPerSqm: { appartement: 19.8, maison: 17.5 },
        electricityKwhYear: 3600,
        distanceToJobKm: 1.6,
        distanceToGroceryKm: 0.6,
      },
      {
        id: "clagny-glatigny",
        name: "Clagny – Glatigny",
        rentPerSqm: { appartement: 19.2, maison: 17.9 },
        electricityKwhYear: 4200,
        distanceToJobKm: 2.4,
        distanceToGroceryKm: 0.8,
      },
      {
        id: "montreuil",
        name: "Montreuil",
        rentPerSqm: { appartement: 17.9, maison: 16.1 },
        electricityKwhYear: 3900,
        distanceToJobKm: 2.6,
        distanceToGroceryKm: 0.9,
      },
      {
        id: "porchefontaine",
        name: "Porchefontaine",
        rentPerSqm: { appartement: 17.6, maison: 16.0 },
        electricityKwhYear: 4000,
        distanceToJobKm: 2.9,
        distanceToGroceryKm: 1.0,
      },
      {
        id: "chantiers",
        name: "Chantiers",
        rentPerSqm: { appartement: 18.2, maison: 16.4 },
        electricityKwhYear: 3800,
        distanceToJobKm: 2.2,
        distanceToGroceryKm: 0.7,
      },
    ],
  },
  {
    id: "avignon",
    name: "Avignon",
    department: "Vaucluse (84)",
    parisRegion: false,
    waterPricePerM3: 3.95,
    fuelPricePerLitre: 1.75,
    transitPassMonthly: 38,
    transitTicketUnit: 1.4,
    transitNetwork: "Orizo",
    districts: [
      {
        id: "intra-muros",
        name: "Intra-muros",
        rentPerSqm: { appartement: 12.4, maison: 11.2 },
        electricityKwhYear: 3400,
        distanceToJobKm: 1.0,
        distanceToGroceryKm: 0.6,
      },
      {
        id: "montfavet",
        name: "Montfavet",
        rentPerSqm: { appartement: 10.6, maison: 10.0 },
        electricityKwhYear: 4600,
        distanceToJobKm: 6.9,
        distanceToGroceryKm: 1.6,
      },
      {
        id: "pont-des-deux-eaux",
        name: "Pont des Deux Eaux",
        rentPerSqm: { appartement: 10.9, maison: 10.2 },
        electricityKwhYear: 4100,
        distanceToJobKm: 3.4,
        distanceToGroceryKm: 1.1,
      },
      {
        id: "monclar",
        name: "Monclar",
        rentPerSqm: { appartement: 10.2, maison: 9.7 },
        electricityKwhYear: 3900,
        distanceToJobKm: 2.6,
        distanceToGroceryKm: 0.9,
      },
      {
        id: "saint-chamand",
        name: "Saint-Chamand",
        rentPerSqm: { appartement: 10.0, maison: 9.5 },
        electricityKwhYear: 4000,
        distanceToJobKm: 3.9,
        distanceToGroceryKm: 1.3,
      },
    ],
  },
  {
    id: "petite-commune",
    name: "Saint-Apollinaire",
    department: "Côte-d'Or (21)",
    parisRegion: false,
    waterPricePerM3: 3.72,
    fuelPricePerLitre: 1.71,
    transitPassMonthly: 40.5,
    transitTicketUnit: 1.5,
    transitNetwork: "Divia",
    districts: [
      {
        id: "bourg",
        name: "Bourg",
        rentPerSqm: { appartement: 11.6, maison: 10.8 },
        electricityKwhYear: 6100,
        distanceToJobKm: 5.6,
        distanceToGroceryKm: 1.0,
      },
      {
        id: "les-carrieres",
        name: "Les Carrières",
        rentPerSqm: { appartement: 11.2, maison: 10.5 },
        electricityKwhYear: 6400,
        distanceToJobKm: 6.4,
        distanceToGroceryKm: 1.8,
      },
    ],
  },
];

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
 * Suggested yearly cost of keeping a bicycle on the road — purchase spread over
 * its life, plus wear parts, tyres and repairs.
 *
 * No public dataset publishes this, so these are openly assumptions offered as
 * starting points, not measurements. The user picks one or types their own
 * figure, and the result labels the line as a hypothesis either way. Presenting
 * any of these as data would break the rule the rest of the engine follows.
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
 * before the next release.
 */
export const crecheScale = {
  vintage: "2025",
  resourceFloor: 801,
  resourceCeiling: 8500,
  /** Indexed by number of dependent children, 1 through 4+. */
  rates: [0.000619, 0.000516, 0.000413, 0.00031],
} as const;

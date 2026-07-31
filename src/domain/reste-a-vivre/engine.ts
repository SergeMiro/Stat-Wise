import type {
  CommuteInput,
  Comparison,
  CurrentSide,
  ErrandsInput,
  Explanation,
  FamilyTravelInput,
  FiscalResult,
  Household,
  HousingType,
  Line,
  MoveCost,
  OtherIncomeInput,
  SideResult,
  TargetSide,
  VehicleInput,
  WaterfallStep,
} from "./types";
import {
  cities,
  crecheScale,
  HOUSE_RENT_RATIO,
  moveCostRules,
  nationalParams as p,
  type CitySnapshot,
  type DistrictSnapshot,
} from "./snapshot";

/**
 * The reste-à-vivre engine ("Trouver mon job"). Pure: no React, no fetch, no
 * Date.now(), no locale — same inputs always yield the same result.
 *
 * Three rules govern every function here.
 *
 * 1. A figure we cannot compute becomes a line with `amount: null`, never a line
 *    worth 0 €. Totals sum only the lines that have a value, and the omitted ones
 *    travel with the result so the caller cannot lose them.
 * 2. Nothing that is merely assumed is labelled `computed`. Assumptions get
 *    `convention` and say so in `basis`, because a reader must be able to
 *    disagree with an assumption but not with an arithmetic result.
 * 3. No human-readable text. Lines carry translation keys and raw numbers; the
 *    UI formats them for the active locale.
 */

const MONTHS_PER_YEAR = 12;

export const findCity = (cityId: string): CitySnapshot | undefined =>
  cities.find((city) => city.id === cityId);

export const findDistrict = (
  city: CitySnapshot,
  districtId: string,
): DistrictSnapshot | undefined => city.districts.find((district) => district.id === districtId);

export const listJobCities = (): CitySnapshot[] =>
  [...cities].sort((a, b) => a.name.localeCompare(b.name, "fr"));

const round = (value: number) => Math.round(value * 100) / 100;

/** Sums the lines that carry a value; ignores the ones we could not compute. */
const total = (lines: Line[]) =>
  round(lines.reduce((sum, line) => (line.amount === null ? sum : sum + line.amount), 0));

/** Monthly days actually spent at the workplace, holidays already removed. */
const commuteDaysPerMonth = (daysOnSitePerWeek: number) =>
  (daysOnSitePerWeek * p.workingWeeksPerYear) / MONTHS_PER_YEAR;

/**
 * Family contribution for a crèche place, from the national PSU scale.
 *
 * The scale is national, so this never differs between two cities — but the
 * probability of getting a place does, which is why the caller pairs this line
 * with an availability caveat rather than presenting it as settled.
 */
export const crecheMonthlyCost = (
  monthlyResources: number,
  dependentChildren: number,
  childrenInCreche: number,
  hoursPerMonth: number,
): number => {
  if (childrenInCreche <= 0 || hoursPerMonth <= 0) return 0;

  const clamped = Math.min(
    Math.max(monthlyResources, crecheScale.resourceFloor),
    crecheScale.resourceCeiling,
  );
  const index = Math.min(Math.max(dependentChildren, 1), crecheScale.rates.length) - 1;
  const hourlyRate = clamped * crecheScale.rates[index];

  return round(hourlyRate * hoursPerMonth * childrenInCreche);
};

/** Food basket for the household, with the only spatial premium Insee measures. */
export const foodMonthlyCost = (household: Household, parisRegion: boolean): number => {
  const units = household.adults + household.children * p.foodChildCoefficient;
  const base = units * p.foodPerAdultMonthly;
  return round(base * (parisRegion ? 1 + p.parisRegionFoodPremium : 1));
};

/**
 * Total cost of a kilometre for this household's car: energy plus wear. Used for
 * journeys that are not the commute or the shopping run — visiting family — where
 * the two components do not need to be shown as separate lines.
 */
const vehicleCostPerKm = (vehicle: VehicleInput, city: CitySnapshot): number => {
  const energy =
    vehicle.energy === "thermique"
      ? (vehicle.litresPer100Km * city.fuelPricePerLitre) / 100
      : (vehicle.kwhPer100Km *
          (Math.min(Math.max(vehicle.homeChargingShare, 0), 1) * p.electricityPricePerKwh +
            (1 - Math.min(Math.max(vehicle.homeChargingShare, 0), 1)) *
              p.publicChargingPricePerKwh)) /
        100;
  const wear =
    vehicle.energy === "electrique"
      ? p.carVariableCostPerKm * (1 + p.electricVehicleUplift)
      : p.carVariableCostPerKm;
  return round(energy + wear);
};

type SideContext = {
  city: CitySnapshot;
  district: DistrictSnapshot;
  household: Household;
  commute: CommuteInput;
  errands: ErrandsInput;
  vehicle: VehicleInput;
  /** One-way km to close family from this side. */
  familyKm: number;
  familyTripsPerYear: number;
  /** Declared monthly spending that does not change with the city. */
  otherMonthly: number;
  /** Tax, when the rules engine answered. */
  fiscal?: FiscalResult;
  otherIncome: OtherIncomeInput;
  /** True on the side the household lives on today. */
  isCurrentSide: boolean;
  netSalary: number;
  partnerNetSalary: number;
  housingType: HousingType;
  surfaceM2: number;
  /** Set on the current side: the rent actually paid, which overrides the data. */
  actualRent?: number;
  /** Set on the current side: the distance actually travelled. */
  actualKm?: number;
};

const revenueLines = (context: SideContext): Line[] => {
  const lines: Line[] = [
    {
      key: "salaire",
      label: { key: "salaire" },
      kind: "revenu",
      amount: context.netSalary,
      status: "user",
      basis: { key: "user_input" },
      sources: ["saisie_utilisateur"],
    },
  ];

  if (context.partnerNetSalary > 0) {
    lines.push({
      key: "salaire_conjoint",
      label: { key: "salaire_conjoint" },
      kind: "revenu",
      amount: context.partnerNetSalary,
      status: "user",
      basis: { key: "user_input" },
      sources: ["saisie_utilisateur"],
    });
  }

  /*
    The employer reimburses half of a pass. Where the network is free for
    residents there is nothing to reimburse, and a 0 € "employer share" line
    would be noise pretending to be information.
  */
  if (context.commute.mode === "transports" && !context.city.transitFreeForResidents) {
    const pass = context.city.transitPassMonthly;
    lines.push({
      key: "prise_en_charge_transport",
      label: { key: "prise_en_charge_transport" },
      kind: "revenu",
      amount: round(pass * p.employerTransitShare),
      status: "computed",
      basis: {
        key: "employer_share",
        params: {
          share: { n: p.employerTransitShare * 100, d: 0 },
          network: context.city.transitNetwork,
          pass: { n: pass, d: 2 },
        },
      },
      sources: ["code_travail_transport", "gtfs_tarifs"],
    });
  }

  for (const [key, amount] of [
    ["dividendes", context.otherIncome.dividendsMonthly],
    ["revenus_fonciers", context.otherIncome.rentalMonthly],
  ] as const) {
    if (amount > 0) {
      lines.push({
        key,
        label: { key },
        kind: "revenu",
        amount: round(amount),
        status: "user",
        basis: { key: "place_invariant_income" },
        sources: ["saisie_utilisateur"],
      });
    }
  }

  /*
    Benefits the household already receives, on today's side only. Housing benefit
    is driven by the rent and the commune's zone, so repeating today's amount in
    another city would be inventing money in favour of the move.
  */
  if (context.isCurrentSide && context.otherIncome.declaredBenefitsMonthly > 0) {
    lines.push({
      key: "prestations_declarees",
      label: { key: "prestations_declarees" },
      kind: "revenu",
      amount: round(context.otherIncome.declaredBenefitsMonthly),
      status: "user",
      basis: { key: "declared_benefits" },
      sources: ["saisie_utilisateur"],
    });
  }

  return lines;
};

const expenseLines = (context: SideContext): Line[] => {
  const { city, district, household, commute, errands, vehicle } = context;
  const persons = household.adults + household.children;
  const lines: Line[] = [];

  // Housing. The current side is anchored on the rent actually paid; the target
  // side can only be estimated from a commune-level indicator.
  if (context.actualRent !== undefined) {
    lines.push({
      key: "loyer",
      label: { key: "loyer_reel" },
      kind: "contrainte",
      amount: context.actualRent,
      status: "user",
      basis: { key: "rent_actual" },
      sources: ["saisie_utilisateur"],
    });
  } else {
    const perSqm = district.rentPerSqm[context.housingType];
    lines.push({
      key: "loyer",
      label: { key: "loyer_estime" },
      kind: "contrainte",
      amount: round(perSqm * context.surfaceM2),
      status: "computed",
      basis: {
        key: "rent_estimated",
        params: {
          perSqm: { n: perSqm, d: 2 },
          surface: { n: context.surfaceM2, d: 0 },
        },
      },
      sources: ["carte_loyers"],
    });
  }

  // Electricity. The consumption is local, the price is not.
  const kwhMonthly = district.electricityKwhYear / MONTHS_PER_YEAR;
  lines.push({
    key: "electricite",
    label: { key: "electricite" },
    kind: "contrainte",
    amount: round(kwhMonthly * p.electricityPricePerKwh + p.electricitySubscriptionMonthly),
    status: "computed",
    basis: {
      key: "electricity",
      params: {
        kwhYear: { n: district.electricityKwhYear, d: 0 },
        price: { n: p.electricityPricePerKwh, d: 4 },
      },
    },
    sources: ["enedis_conso", "tarif_electricite"],
  });

  lines.push({
    key: "eau",
    label: { key: "eau" },
    kind: "contrainte",
    amount: round((p.waterM3PerPersonYear * persons * city.waterPricePerM3) / MONTHS_PER_YEAR),
    status: "convention",
    basis: {
      key: "water",
      params: {
        pricePerM3: { n: city.waterPricePerM3, d: 2 },
        m3PerPerson: { n: p.waterM3PerPersonYear, d: 0 },
      },
    },
    sources: ["sispea_eau", "convention_statwise"],
  });

  /*
    Travel. Two purposes, possibly two modes, but only one vehicle: the commute
    and the grocery runs are described separately and then pooled before any
    per-kilometre cost is applied, so nothing is charged twice.
  */
  const km = context.actualKm ?? district.distanceToJobKm;
  const commuteMonthlyKm = km * 2 * commuteDaysPerMonth(commute.daysOnSitePerWeek);
  const groceryMonthlyKm = district.distanceToGroceryKm * 2 * errands.tripsPerMonth;

  const commuteByCar = commute.mode === "voiture";
  const errandsByCar = errands.mode === "voiture";
  const carKm = (commuteByCar ? commuteMonthlyKm : 0) + (errandsByCar ? groceryMonthlyKm : 0);

  if (carKm > 0) {
    /*
      Which journeys the car is doing. Written once and interpolated into whichever
      energy line applies, so petrol and electricity cannot drift apart in how they
      describe the same kilometres.
    */
    const purpose: Explanation = {
      key:
        commuteByCar && errandsByCar
          ? "purpose_both"
          : commuteByCar
            ? "purpose_commute"
            : "purpose_groceries",
      params: {
        commuteKm: { n: commuteMonthlyKm, d: 0 },
        groceryKm: { n: groceryMonthlyKm, d: 0 },
        groceryOneWay: { n: district.distanceToGroceryKm, d: 1 },
      },
    };

    if (vehicle.energy === "thermique") {
      lines.push({
        key: "carburant",
        label: { key: "carburant" },
        kind: "contrainte",
        amount: round((carKm * vehicle.litresPer100Km * city.fuelPricePerLitre) / 100),
        status: "computed",
        basis: {
          key: "fuel",
          params: {
            purpose,
            totalKm: { n: carKm, d: 0 },
            litres: { n: vehicle.litresPer100Km, d: 1 },
            price: { n: city.fuelPricePerLitre, d: 2 },
          },
        },
        sources: ["prix_carburants", "insee_bpe", "ban_itineraire"],
      });
    } else {
      /*
        An electric car does the same kilometres for a price that depends on where
        it is plugged in. Home and public charging are two different tariffs, so
        they are two different lines: one computed from the regulated electricity
        price, one an openly-labelled assumption.
      */
      const kwh = (carKm * vehicle.kwhPer100Km) / 100;
      const homeShare = Math.min(Math.max(vehicle.homeChargingShare, 0), 1);
      const homeKwh = kwh * homeShare;
      const publicKwh = kwh - homeKwh;

      if (homeKwh > 0) {
        lines.push({
          key: "recharge_domicile",
          label: { key: "recharge_domicile" },
          kind: "contrainte",
          amount: round(homeKwh * p.electricityPricePerKwh),
          status: "computed",
          basis: {
            key: "charge_home",
            params: {
              purpose,
              totalKm: { n: carKm, d: 0 },
              kwhPer100: { n: vehicle.kwhPer100Km, d: 1 },
              sharePct: { n: homeShare * 100, d: 0 },
              kwh: { n: homeKwh, d: 0 },
              price: { n: p.electricityPricePerKwh, d: 4 },
            },
          },
          sources: ["tarif_electricite", "insee_bpe", "ban_itineraire"],
        });
      }

      if (publicKwh > 0) {
        lines.push({
          key: "recharge_publique",
          label: { key: "recharge_publique" },
          kind: "contrainte",
          amount: round(publicKwh * p.publicChargingPricePerKwh),
          status: "convention",
          basis: {
            key: "charge_public",
            params: {
              purpose,
              sharePct: { n: (1 - homeShare) * 100, d: 0 },
              kwh: { n: publicKwh, d: 0 },
              price: { n: p.publicChargingPricePerKwh, d: 2 },
            },
          },
          sources: ["irve_bornes", "convention_statwise"],
        });
      }
    }

    // Wear, servicing, insurance and depreciation. Electric cars carry the DGFiP
    // uplift — applied here to wear alone, since charging is billed above.
    const electric = vehicle.energy === "electrique";
    const perKm = electric
      ? round(p.carVariableCostPerKm * (1 + p.electricVehicleUplift))
      : p.carVariableCostPerKm;

    lines.push({
      key: "usage_vehicule",
      label: { key: "usage_vehicule" },
      kind: "contrainte",
      amount: round(carKm * perKm),
      status: "convention",
      basis: {
        key: electric ? "vehicle_use_ev" : "vehicle_use",
        params: {
          km: { n: carKm, d: 0 },
          perKm: { n: perKm, d: 2 },
          base: { n: p.carVariableCostPerKm, d: 2 },
          upliftPct: { n: p.electricVehicleUplift * 100, d: 0 },
        },
      },
      sources: ["bareme_kilometrique", "convention_statwise"],
    });
  }

  // The work pass is the only thing the employer co-finances.
  const holdsWorkPass = commute.mode === "transports";

  if (holdsWorkPass) {
    lines.push({
      key: "abonnement_transport",
      label: { key: "abonnement_transport", params: { network: city.transitNetwork } },
      kind: "contrainte",
      amount: city.transitPassMonthly,
      status: "computed",
      basis: city.transitFreeForResidents
        ? { key: "transit_free", params: { network: city.transitNetwork } }
        : { key: "transit_pass" },
      sources: ["gtfs_tarifs"],
    });
  }

  if (errands.mode === "transports") {
    const journeys = errands.tripsPerMonth * 2;
    lines.push(
      holdsWorkPass
        ? {
            key: "courses_transport",
            label: { key: "courses_transport" },
            kind: "contrainte",
            amount: 0,
            status: "computed",
            basis: {
              key: "errands_covered_by_pass",
              params: {
                network: city.transitNetwork,
                journeys: { n: journeys, d: 0 },
              },
            },
            sources: ["gtfs_tarifs"],
          }
        : {
            key: "courses_transport",
            label: { key: "courses_transport" },
            kind: "contrainte",
            amount: round(journeys * city.transitTicketUnit),
            status: "computed",
            basis: {
              key: "errands_tickets",
              params: {
                journeys: { n: journeys, d: 0 },
                ticket: { n: city.transitTicketUnit, d: 2 },
              },
            },
            sources: ["gtfs_tarifs", "code_travail_transport"],
          },
    );
  }

  if (commute.mode === "actif" || errands.mode === "actif") {
    const activeKm =
      (commute.mode === "actif" ? commuteMonthlyKm : 0) +
      (errands.mode === "actif" ? groceryMonthlyKm : 0);
    lines.push({
      key: "velo_amortissement",
      label: { key: "velo_amortissement" },
      kind: "contrainte",
      amount: round(errands.bikeAmortizationPerYear / MONTHS_PER_YEAR),
      status: "convention",
      basis:
        errands.bikeAmortizationPerYear > 0
          ? {
              key: "bike_amortization",
              params: {
                perYear: { n: errands.bikeAmortizationPerYear, d: 0 },
                km: { n: activeKm, d: 0 },
              },
            }
          : { key: "bike_none", params: { km: { n: activeKm, d: 0 } } },
      sources: ["convention_statwise"],
    });
  }

  // Childcare.
  if (household.childrenInCreche > 0) {
    lines.push({
      key: "creche",
      label: { key: "creche" },
      kind: "contrainte",
      amount: crecheMonthlyCost(
        context.netSalary + context.partnerNetSalary,
        household.children,
        household.childrenInCreche,
        household.crecheHoursPerMonth,
      ),
      status: "computed",
      basis: {
        key: "creche",
        params: {
          vintage: crecheScale.vintage,
          hours: { n: household.crecheHoursPerMonth, d: 0 },
        },
      },
      sources: ["bareme_psu_cnaf"],
    });
  }

  // Trips to close family. Place-driven because the distance changes with the
  // city, and costed with the household's own car rather than a generic rate.
  const familyMonthlyKm = (context.familyKm * 2 * context.familyTripsPerYear) / MONTHS_PER_YEAR;

  if (familyMonthlyKm > 0) {
    lines.push({
      key: "deplacements_famille",
      label: { key: "deplacements_famille" },
      kind: "contrainte",
      amount: round(familyMonthlyKm * vehicleCostPerKm(vehicle, city)),
      status: "convention",
      basis: {
        key: "family_travel",
        params: {
          oneWayKm: { n: context.familyKm, d: 0 },
          trips: { n: context.familyTripsPerYear, d: 0 },
          monthlyKm: { n: familyMonthlyKm, d: 0 },
          perKm: { n: vehicleCostPerKm(vehicle, city), d: 2 },
        },
      },
      sources: ["convention_statwise", "prix_carburants"],
    });
  }

  if (context.fiscal) {
    lines.push({
      key: "impot_revenu",
      label: { key: "impot_revenu" },
      kind: "contrainte",
      amount: round(context.fiscal.incomeTaxMonthly),
      status: "computed",
      basis: {
        key: "income_tax",
        params: { year: String(context.fiscal.year) },
      },
      sources: ["openfisca"],
    });
  }

  lines.push({
    key: "alimentation",
    label: { key: "alimentation" },
    kind: "pilotable",
    amount: foodMonthlyCost(household, city.parisRegion),
    status: "convention",
    basis: city.parisRegion
      ? {
          key: "food_paris",
          params: { premium: { n: p.parisRegionFoodPremium * 100, d: 0 } },
        }
      : { key: "food_province" },
    sources: ["insee_ecsp", "convention_statwise"],
  });

  return lines;
};

/** Lines we deliberately refuse to invent. They stay visible in the result. */
const omittedLines = (context: SideContext): Line[] => {
  const lines: Line[] = [];

  // Income tax is only unquantified while the rules engine has not answered.
  if (!context.fiscal) {
    lines.push({
      key: "impot_revenu",
      label: { key: "impot_revenu" },
      kind: "contrainte",
      amount: null,
      status: "unavailable",
      reason: { key: "impot_revenu" },
      sources: ["openfisca"],
    });
  }

  /*
    Benefits stay unquantified whether or not the rules engine answered. It will
    answer — and the answer is wrong for the reason set out in
    `src/lib/openfisca-payload.ts`. An admitted gap beats a credible mistake.
  */
  lines.push({
    key: "prestations",
    label: { key: "prestations" },
    kind: "revenu",
    amount: null,
    status: "unavailable",
    reason: {
      key:
        !context.isCurrentSide && context.otherIncome.declaredBenefitsMonthly > 0
          ? "prestations_target"
          : "prestations",
    },
    sources: ["openfisca"],
  });

  lines.push(
    {
      key: "assurances",
      label: { key: "assurances" },
      kind: "contrainte",
      amount: null,
      status: "unavailable",
      reason: { key: "assurances" },
      sources: [],
    },
    {
      key: "charges_copro",
      label: { key: "charges_copro" },
      kind: "contrainte",
      amount: null,
      status: "unavailable",
      reason: { key: "charges_copro" },
      sources: ["carte_loyers"],
    },
    {
      key: "taxe_fonciere",
      label: { key: "taxe_fonciere" },
      kind: "contrainte",
      amount: null,
      status: "non_applicable",
      reason: { key: "taxe_fonciere" },
      sources: [],
    },
    {
      key: "taxe_habitation",
      label: { key: "taxe_habitation" },
      kind: "contrainte",
      amount: null,
      status: "non_applicable",
      reason: { key: "taxe_habitation" },
      sources: [],
    },
  );

  if (context.household.childrenInCreche > 0) {
    lines.push({
      key: "cmg",
      label: { key: "cmg" },
      kind: "revenu",
      amount: null,
      status: "unavailable",
      reason: { key: "cmg" },
      sources: ["openfisca"],
    });
  }

  if (context.commute.mode === "voiture") {
    lines.push({
      key: "stationnement",
      label: { key: "stationnement" },
      kind: "contrainte",
      amount: null,
      status: "unavailable",
      reason: { key: "stationnement" },
      sources: [],
    });
  }

  // Fitting a home charging point is a one-off, and this engine measures a monthly
  // flow. Saying so is better than burying a four-figure cost in a rent-sized line.
  if (context.vehicle.energy === "electrique" && context.vehicle.homeChargingShare > 0) {
    lines.push({
      key: "borne_domicile",
      label: { key: "borne_domicile" },
      kind: "contrainte",
      amount: null,
      status: "non_applicable",
      reason: { key: "borne_domicile" },
      sources: [],
    });
  }

  return lines;
};

const buildSide = (context: SideContext): SideResult => {
  const revenus = revenueLines(context);
  const depenses = expenseLines(context);
  const km = context.actualKm ?? context.district.distanceToJobKm;
  /*
    A routed car time beats a flat average speed — but only for a car, and only
    when the distance is the measured one. If the user gave their own kilometres,
    the measured minutes belong to a different journey.
  */
  const measuredMinutes =
    context.actualKm === undefined &&
    context.commute.mode === "voiture" &&
    context.district.distanceToJobMinutes !== null
      ? context.district.distanceToJobMinutes
      : null;
  const speed = p.averageSpeedKmh[context.commute.mode];
  const oneWayMinutes = measuredMinutes ?? Math.round((km / speed) * 60);
  const totalRevenus = total(revenus);
  const totalDepenses = total(depenses);
  const resteAVivre = round(totalRevenus - totalDepenses);

  /*
    Declared place-invariant spending. Kept outside `depenses` on purpose: it must
    not enter the comparable total, because that total is what the verdict rests
    on and this figure is identical on both sides. It exists so the absolute
    number stops being overstated — every category it stands for is an expense.
  */
  const autres: Line = {
    key: "autres_depenses",
    label: { key: "autres_depenses" },
    kind: "pilotable",
    amount: context.otherMonthly,
    status: "user",
    basis: { key: "declared_other" },
    sources: ["saisie_utilisateur"],
  };

  return {
    cityId: context.city.id,
    cityName: context.city.name,
    districtId: context.district.id,
    districtName: context.district.name,
    revenus,
    depenses,
    omitted: omittedLines(context),
    autres,
    totalRevenus,
    totalDepenses,
    resteAVivre,
    resteAVivreReel: round(resteAVivre - context.otherMonthly),
    commuteHoursPerYear:
      Math.round(
        ((oneWayMinutes * 2 * context.commute.daysOnSitePerWeek * p.workingWeeksPerYear) / 60) * 10,
      ) / 10,
    oneWayKm: km,
    oneWayMinutes,
    groceryKm: context.district.distanceToGroceryKm,
    distanceSource: context.district.distanceSource,
    groceryName: context.district.groceryName,
  };
};

export type CompareInput = {
  current: CurrentSide;
  target: TargetSide;
  household: Household;
  /** The household's car. Shared by both sides: moving city does not change it. */
  vehicle: VehicleInput;
  /** Commute as it is today. */
  currentCommute: CommuteInput;
  /** Commute planned in the target city. */
  targetCommute: CommuteInput;
  /** Grocery runs as they are today. */
  currentErrands: ErrandsInput;
  /** Grocery runs planned in the target city. */
  targetErrands: ErrandsInput;
  /** Trips to close family, from each side. */
  familyTravel: FamilyTravelInput;
  /**
   * Declared monthly spending that does not change with the city — insurance,
   * telecom, clothing, leisure, subscriptions. One field instead of thirty models
   * for categories no open dataset covers geographically.
   */
  otherMonthly: number;
  /** €, what the removal itself will cost. Part of the up-front block. */
  removalCost: number;
  otherIncome: OtherIncomeInput;
  /**
   * Tax and benefits per side, when the rules engine answered. Absent means those
   * lines stay `non chiffré` — the behaviour before OpenFisca was wired in.
   */
  fiscal?: { current: FiscalResult; target: FiscalResult };
};

/** Which bucket of the waterfall a line belongs to. */
const WATERFALL_BUCKET: Record<string, string> = {
  salaire: "salaire",
  salaire_conjoint: "salaire",
  prise_en_charge_transport: "transport",
  loyer: "logement",
  electricite: "energie",
  eau: "energie",
  carburant: "transport",
  recharge_domicile: "transport",
  recharge_publique: "transport",
  usage_vehicule: "transport",
  abonnement_transport: "transport",
  courses_transport: "transport",
  velo_amortissement: "transport",
  deplacements_famille: "famille",
  creche: "garde",
  alimentation: "alimentation",
};

/**
 * The difference grouped by cause. Income counts positively, expenses negatively,
 * so the bars add up to `deltaResteAVivre` — which is the only property that
 * makes a waterfall readable.
 */
const buildWaterfall = (current: SideResult, target: SideResult): WaterfallStep[] => {
  const totals = new Map<string, number>();
  const add = (key: string, amount: number) =>
    totals.set(key, round((totals.get(key) ?? 0) + amount));

  for (const [side, sign] of [
    [target, 1],
    [current, -1],
  ] as const) {
    for (const line of side.revenus) {
      add(WATERFALL_BUCKET[line.key] ?? "autre", sign * (line.amount ?? 0));
    }
    for (const line of side.depenses) {
      add(WATERFALL_BUCKET[line.key] ?? "autre", -sign * (line.amount ?? 0));
    }
  }

  return [...totals.entries()]
    .map(([key, amount]) => ({ key, amount }))
    .filter((step) => Math.abs(step.amount) >= 0.5)
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
};

/** Cash needed before moving in. Rules only — no geographic data required. */
const buildMoveCost = (
  targetCity: CitySnapshot,
  targetRent: number,
  surfaceM2: number,
  removalCost: number,
): MoveCost => {
  const rentExcludingCharges = round(targetRent * (1 - moveCostRules.chargesShareOfRent));
  const deposit = round(rentExcludingCharges * moveCostRules.depositMonths);
  const feeCap = moveCostRules.agencyFeeCapPerSqm[targetCity.alurZone];
  const agencyFee = round(feeCap * surfaceM2);

  const lines: Line[] = [
    {
      key: "depot_garantie",
      label: { key: "depot_garantie" },
      kind: "contrainte",
      amount: deposit,
      status: "computed",
      basis: {
        key: "deposit",
        params: {
          rent: { n: targetRent, d: 0 },
          chargesShare: { n: moveCostRules.chargesShareOfRent * 100, d: 0 },
        },
      },
      sources: ["convention_statwise"],
    },
    {
      key: "honoraires_agence",
      label: { key: "honoraires_agence" },
      kind: "contrainte",
      amount: agencyFee,
      status: "computed",
      basis: {
        key: "agency_fee",
        params: { cap: { n: feeCap, d: 0 }, surface: { n: surfaceM2, d: 0 } },
      },
      sources: ["carte_loyers"],
    },
    {
      key: "demenagement",
      label: { key: "demenagement" },
      kind: "contrainte",
      amount: removalCost,
      status: "user",
      basis: { key: "user_input" },
      sources: ["saisie_utilisateur"],
    },
    {
      key: "double_loyer",
      label: { key: "double_loyer" },
      kind: "contrainte",
      amount: null,
      status: "unavailable",
      reason: { key: "double_loyer" },
      sources: [],
    },
  ];

  return { lines, total: total(lines) };
};

/**
 * Compares the two situations and ranks every district of the target city.
 *
 * The ranking is what makes the answer actionable: the headline says whether the
 * move leaves more money in the best case, and the list says which districts
 * actually deliver it.
 */
export const compare = (input: CompareInput): Comparison | null => {
  const currentCity = findCity(input.current.cityId);
  const targetCity = findCity(input.target.cityId);
  if (!currentCity || !targetCity) return null;

  const currentDistrict = findDistrict(currentCity, input.current.districtId);
  if (!currentDistrict) return null;

  const current = buildSide({
    city: currentCity,
    district: currentDistrict,
    household: input.household,
    commute: input.currentCommute,
    errands: input.currentErrands,
    vehicle: input.vehicle,
    familyKm: input.familyTravel.currentKm,
    familyTripsPerYear: input.familyTravel.tripsPerYear,
    otherMonthly: input.otherMonthly,
    fiscal: input.fiscal?.current,
    otherIncome: input.otherIncome,
    isCurrentSide: true,
    netSalary: input.current.netSalary,
    partnerNetSalary: input.current.partnerNetSalary,
    housingType: input.current.housingType,
    surfaceM2: input.current.surfaceM2,
    actualRent: input.current.actualRent,
    actualKm: input.current.oneWayKm,
  });

  /** A target-side district at an arbitrary salary — reused by the reverse solve. */
  const targetSideAt = (district: DistrictSnapshot, netSalary: number) =>
    buildSide({
      city: targetCity,
      district,
      household: input.household,
      commute: input.targetCommute,
      errands: input.targetErrands,
      vehicle: input.vehicle,
      familyKm: input.familyTravel.targetKm,
      familyTripsPerYear: input.familyTravel.tripsPerYear,
      otherMonthly: input.otherMonthly,
      fiscal: input.fiscal?.target,
      otherIncome: input.otherIncome,
      isCurrentSide: false,
      netSalary,
      partnerNetSalary: input.target.partnerNetSalary,
      housingType: input.target.housingType,
      surfaceM2: input.target.surfaceM2,
    });

  const ranked = targetCity.districts
    .map((district) => targetSideAt(district, input.target.netSalary))
    .sort((a, b) => b.resteAVivre - a.resteAVivre);

  const [best, ...alternatives] = ranked;

  const rentOf = (side: SideResult) =>
    side.depenses.find((line) => line.key === "loyer")?.amount ?? 0;

  // Omitted lines are identical in structure on both sides; one list is enough,
  // and duplicating it would only suggest the gaps are twice as large.
  const omitted = best.omitted;

  const bestDistrict = targetCity.districts.find((d) => d.id === best.districtId)!;
  const medianRent = bestDistrict.rentPerSqm[input.target.housingType];
  const surface = input.target.surfaceM2;
  const ratio = input.target.housingType === "maison" ? HOUSE_RENT_RATIO : 1;
  /*
    Only the rent moves: the current side is a fact and everything else on the
    target side is independent of it. A dearer rent leaves less over, so the P75
    of the local spread gives the low bound.
  */
  const rentLow = bestDistrict.rentPerSqmRange.low * ratio * surface;
  const rentHigh = bestDistrict.rentPerSqmRange.high * ratio * surface;
  const deltaMedian = round(best.resteAVivre - current.resteAVivre);

  /*
    What salary in the target city leaves exactly today's amount.

    Bisection, not a division: an extra euro of salary raises the crèche
    contribution through the PSU scale, so the relationship is not one-to-one.
    Solved on the best district, so the answer matches the headline the reader
    just saw rather than a district they were never shown.
  */
  const requiredTargetSalary = (() => {
    const goal = current.resteAVivre;
    const partner = input.target.partnerNetSalary;
    let low = 0;
    let high = 30000;
    if (targetSideAt(bestDistrict, high).resteAVivre < goal) return null;
    for (let i = 0; i < 60; i++) {
      const mid = (low + high) / 2;
      if (targetSideAt(bestDistrict, mid).resteAVivre < goal) low = mid;
      else high = mid;
    }
    // Round up to the nearest 10 €: a negotiation figure, not a decimal.
    const solved = Math.ceil(high / 10) * 10;
    return solved > 0 || partner > 0 ? solved : null;
  })();

  return {
    current,
    target: best,
    deltaResteAVivre: deltaMedian,
    deltaRange: {
      low: round(deltaMedian - (rentHigh - medianRent * surface)),
      high: round(deltaMedian + (medianRent * surface - rentLow)),
    },
    deltaSalary: round(
      input.target.netSalary +
        input.target.partnerNetSalary -
        (input.current.netSalary + input.current.partnerNetSalary),
    ),
    deltaHousing: round(rentOf(best) - rentOf(current)),
    deltaCommuteHours: round(best.commuteHoursPerYear - current.commuteHoursPerYear),
    waterfall: buildWaterfall(current, best),
    requiredTargetSalary,
    moveCost: buildMoveCost(targetCity, rentOf(best), surface, input.removalCost),
    alternatives,
    omitted,
  };
};

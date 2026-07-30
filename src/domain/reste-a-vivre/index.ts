/**
 * "Trouver mon job" — reste-à-vivre comparison between two places to work.
 *
 * Quality of life is measured here as one number: the money left once every bill
 * is paid. A higher salary elsewhere is only good news if it survives the rent,
 * the commute, the crèche and the shopping trips it comes with.
 */

/** Bump whenever the arithmetic changes so results stay reproducible. */
export const JOB_ENGINE_VERSION = "0.1.0";

export {
  compare,
  crecheMonthlyCost,
  findCity,
  findDistrict,
  foodMonthlyCost,
  listJobCities,
  type CompareInput,
} from "./engine";

export {
  bikeAmortizationPresets,
  cities as jobCities,
  crecheScale,
  nationalParams,
  JOB_DATASET_VERSION,
  SNAPSHOT_IS_SEEDED,
  type CitySnapshot,
  type DistrictSnapshot,
} from "./snapshot";

export {
  collectSources,
  DATA_SOURCES,
  SNAPSHOT_DATE,
  SOURCE_CODES,
  sourceOf,
  type DataSource,
  type GeoLevel,
  type SourceCode,
  type Translatable,
} from "./sources";

export type {
  CommuteInput,
  Comparison,
  CurrentSide,
  ErrandsInput,
  Explanation,
  Household,
  HousingType,
  Interpolation,
  Line,
  LineKind,
  LineStatus,
  Num,
  SideResult,
  TargetSide,
  TravelMode,
  VehicleEnergy,
  VehicleInput,
} from "./types";

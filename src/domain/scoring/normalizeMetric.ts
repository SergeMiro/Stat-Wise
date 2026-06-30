/**
 * Metric normalization within a comparable set of areas.
 *
 * Normalization is always performed inside the set of areas being compared
 * (e.g. the IRIS of one city), never against the whole of France — see
 * scoring-methodology.md §normalization.
 */

export type MetricDirection = "higher_is_better" | "lower_is_better";

export type Range = { min: number; max: number };

/** Build a [min,max] range from the non-null values of a set. Returns null if empty. */
export function rangeOf(values: Array<number | null | undefined>): Range | null {
  const nums = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (nums.length === 0) return null;
  let min = nums[0];
  let max = nums[0];
  for (const n of nums) {
    if (n < min) min = n;
    if (n > max) max = n;
  }
  return { min, max };
}

/**
 * Normalize a single value to 0..1 within the given range and direction.
 *
 * Edge cases (per spec):
 * - value null/undefined -> null (do NOT substitute 0)
 * - no range (all values missing) -> null
 * - max === min -> 1 (every area is equal on this metric; neutral-positive)
 */
export function normalize(
  value: number | null | undefined,
  range: Range | null,
  direction: MetricDirection,
): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  if (!range) return null;

  const { min, max } = range;
  if (max === min) return 1;

  const clamped = Math.min(Math.max(value, min), max);
  const ratio = (clamped - min) / (max - min);
  return direction === "higher_is_better" ? ratio : 1 - ratio;
}

/** Average of the defined components (0..1). Returns null if no component is defined. */
export function combine(components: Array<number | null>): number | null {
  const defined = components.filter((c): c is number => c !== null);
  if (defined.length === 0) return null;
  const sum = defined.reduce((acc, c) => acc + c, 0);
  return sum / defined.length;
}

/** Weighted average of [value, weight] pairs, ignoring null values. */
export function weightedCombine(pairs: Array<[number | null, number]>): number | null {
  let weightedSum = 0;
  let weightTotal = 0;
  for (const [value, weight] of pairs) {
    if (value === null || weight <= 0) continue;
    weightedSum += value * weight;
    weightTotal += weight;
  }
  if (weightTotal === 0) return null;
  return weightedSum / weightTotal;
}

/** Round a 0..1 score to a 0..100 integer for display. Keeps null as null. */
export function toScore100(value: number | null): number | null {
  if (value === null) return null;
  return Math.round(value * 100);
}

/** Percentile (linear interpolation) of a numeric array. p in [0,1]. */
export function percentile(sorted, p) {
  if (sorted.length === 0) return null;
  if (sorted.length === 1) return sorted[0];
  const idx = p * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const w = idx - lo;
  return sorted[lo] * (1 - w) + sorted[hi] * w;
}

export function summarize(values) {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  return {
    count: s.length,
    min: Math.round(s[0]),
    p25: Math.round(percentile(s, 0.25)),
    median: Math.round(percentile(s, 0.5)),
    p75: Math.round(percentile(s, 0.75)),
    max: Math.round(s[s.length - 1]),
  };
}

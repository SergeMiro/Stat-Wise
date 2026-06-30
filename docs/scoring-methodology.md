# Scoring methodology

The scoring engine lives in `src/domain/scoring` and is pure (no React, Next,
Supabase or IO) and unit-tested. Current engine version: see `ENGINE_VERSION`
in `src/domain/scoring/constants.ts`.

## Pipeline (Trouver mon quartier)

1. Load all areas (IRIS, or commune fallback) of the chosen city.
2. **Hard constraints** remove non-conforming areas *before* ranking.
3. Build a **normalization context** across the kept set (one city only).
4. Compute 7 **category scores** per area (0..1).
5. Apply **weights** derived from the user's priorities.
6. Compute **data confidence**.
7. `finalScore = rawScore × confidence`, rank, and explain.

## Normalization

Within the compared set only (never across all of France):

```
higher_is_better: normalized = (x - min) / (max - min)
lower_is_better : normalized = 1 - (x - min) / (max - min)
```

- `max === min` → 1 (every area equal; neutral-positive).
- A missing value → `null` (never substituted with 0).
- A missing metric lowers **confidence** and is surfaced as a caveat, but does
  not score the area as 0.

## Categories and weights

Seven ranking categories: `housing, mobility, services, health, tranquillity,
family, nature`. The user sets 8 priorities (0 = not important … 3 = critical).
Mapping (`weights.ts`):

- 1:1 for housing, mobility, health, tranquillity, family, nature.
- `dailyServices` → `services` weight.
- `sportAndLeisure` is not a ranking axis on its own; it is folded at half
  weight into both `services` and `nature` (the categories whose scores already
  include sport POIs), clamped to the 0..3 scale.

```
rawScore = Σ(categoryScoreᵢ × weightᵢ) / Σ(weightᵢ)   // weighted categories with data
finalScore = rawScore × dataConfidence
```

## Data confidence

Computed only over the categories the user weighted (>0) — a missing metric the
user doesn't care about must not penalise the area. Per-category data quality:
`available = 1`, `commune_only = 0.6`, `unavailable = 0` (with a transaction-count
check for housing sale). The weighted ratio maps to:

| Ratio | Label | Multiplier |
|---|---|---|
| ≥ 0.85 | high (Données solides) | 1.0 |
| ≥ 0.60 | medium (Données partielles) | 0.93 |
| > 0 | low (Données limitées) | 0.82 |
| 0 | unavailable (Données indisponibles) | 0 → overall score is `null` |

## Explanations

`strengths`, `caveats`, `missingData` are emitted as machine **codes**,
localized by the UI. Caveats are honest by construction: rent and crime are
flagged as commune-level, low transaction counts are flagged, and the presence
of a crèche/school never implies a place or catchment.

## Housing price policy

Use the **median** `price_per_m2` (never `(min+max)/2`), keep `P25/P50/P75`,
segment by property type, show `transaction_count` and confidence, and don't
produce an estimate from too few transactions.

> V1 note: pilot-city values are generated deterministically in
> `src/lib/mock/cities.ts` and are clearly labelled as illustrative. The real
> import pipeline (DVF/BPE/APL/…) replaces them without changing the engine.

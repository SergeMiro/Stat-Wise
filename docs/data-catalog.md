# Data catalog

All sources are registered in `reference.data_sources` with URL, license,
refresh frequency, geographic level, legal notes and import version. The pure
engine mirrors the citations in `src/domain/scoring/constants.ts` so results can
attach sources without a DB round-trip.

## Sources (V1)

| Code | Source | Geographic level | Key limit |
|---|---|---|---|
| `insee_bpe` | INSEE BPE (équipements) | point / commune | presence ≠ quality or availability |
| `dvf` | DVF (valeurs foncières), aggregated | IRIS / commune | never publish raw transactions |
| `carte_loyers` | Carte des loyers | commune | not a precise per-area rent |
| `education_nationale` | Annuaire Éducation nationale | point | no catchment / enrolment guarantee |
| `apl` | APL (accès aux médecins) | commune | not the nearest doctor / appointment |
| `delinquance` | Délinquance enregistrée (SSMSI) | commune / département | not "real crime" or area safety |

## Geographic model

| Level | Object | Use |
|---|---|---|
| City | `commune` | search, rent, APL, crime, general |
| Intra-city | `IRIS` | main ranking unit ("analysed area") |
| Special | `arrondissement`/`secteur` | Paris/Lyon/Marseille UI layer |
| Point | POI | school, crèche, doctor, park, transport |

Rule: use IRIS where coverage allows, else fall back to commune, and always show
the real precision level in the UI.

## Missing-data policy

Distinct states must never be collapsed:

```
value = 0              → genuinely zero
value = null           → unknown
coverage = unavailable → source does not cover the area
confidence = low       → data exists but is too thin for a strong claim
```

## Do not mix indicators

Salaries, `revenu médian par unité de consommation`, household spending, purchase
price, rent, infrastructure and recorded crime are distinct measures with
different methodologies and geographic precision. Never blend them into one
unexplained number.

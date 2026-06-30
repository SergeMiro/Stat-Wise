# Product spec (V1)

**StatWise** turns official French spatial and social data into clear decisions
about where to live.

- **Slogan (fr):** Prenez de meilleures décisions pour votre vie grâce aux données.
- **Slogan (en):** Make better life decisions with data.
- One slogan per localized page (fr → French, en → English), never both.

## The two V1 simulators

1. **Trouver mon quartier / Find my neighbourhood** — rank a city's areas by
   budget, mobility, services, health, tranquillity, family and nature, using
   the user's priorities and hard constraints.
2. **Grandir ici / Raising a child here** — compare up to three areas through a
   child's needs and daily life, tuned by age group (planned, phase 7).

## Out of scope for V1

International comparisons; tax/CAF/benefits/mortgage/salary calculations;
property listings; payments/subscriptions; chatbots; reviews as a primary data
source; precise home addresses, income, medical or child data; a single
unexplained "quality of life" score.

## Promises and non-promises

We may say: "this area better matches your criteria", "this indicator is
commune-level", "indicative range from available data", "presence of a facility
≠ available places", "verify the exact address before deciding".

We never say: "objectively the best", "safe for children", "guaranteed crèche
place", "your child will get into this school", "you'll live X% better", "exact
rent of a specific flat".

## Transparency requirement

Every meaningful score in the UI carries: a clear name, what it measures, its
sources, the data date/version, the geographic precision level, a confidence
level (high/medium/low/unavailable), and the factors behind it.

## Acceptance (V1)

Mobile-first; FR + EN; both journeys completable; data never fabricated by AI;
limits never hidden; sources + methodology pages live; correct auth + RLS; user
data isolated; engine testable and versioned; import pipeline reproducible; no
personal/raw DVF data published.

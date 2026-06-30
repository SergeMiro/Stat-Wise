# Architecture

StatWise is a Next.js (App Router) + TypeScript app on Supabase (PostgreSQL + PostGIS), built mobile-first and bilingual (FR/EN).

## Data flow

```
Official public sources
  → Importer / job (server)
  → Raw storage + import log (Supabase Storage, analytics.import_runs)
  → Validation & normalization
  → PostgreSQL + PostGIS aggregates (reference.*, analytics.*)
  → Scoring engine (pure TypeScript domain layer)
  → Next.js Server Components / Server Actions / Route Handlers
  → Mobile-first UI
```

The app **never** calls external government APIs during a user simulation. It
reads pre-computed, versioned aggregates only (§13).

## Layers and dependency rules

| Layer | Path | May import |
|---|---|---|
| Domain | `src/domain` | nothing app-specific (no React / Next / Supabase, no IO) |
| Server | `src/server` | `domain`, Supabase, Next server APIs |
| Lib | `src/lib` | `domain`, framework-agnostic helpers |
| Components | `src/components` | `lib`, `domain` types — **no business logic** |
| App | `src/app` | everything; wires UI to data |

The scoring engine (`src/domain/scoring`) is pure and unit-tested. UI receives
prepared view models, not raw database rows.

## Next.js roles

- **Server Components** — public/SEO pages, localized content, reading aggregates.
- **Client Components** — the simulation wizard, sliders, comparison, draft autosave.
- **Server Actions** (Phase 2) — create/save/delete simulations; re-check auth + ownership.
- **Route Handlers** (Phase 4) — admin import endpoints, health checks.
- **`src/proxy.ts`** — locale routing (Next 16 renamed `middleware` → `proxy`).

## i18n

Dictionary-based (`src/lib/i18n`), French is the source of truth and English
must match its shape (`Dictionary = typeof fr`). Routes are localized via the
`[locale]` segment; `/` redirects to the negotiated locale in `proxy.ts`.

## Current status (V1 foundation)

Implemented: foundation, design system, FR/EN, public pages, scoring engine +
tests, and the **Trouver mon quartier** wizard running on mock pilot-city data
(`src/lib/mock/cities.ts`) end-to-end. Auth, real data imports and the family
simulator are scaffolded/planned (see the project plan, phases 2-7).

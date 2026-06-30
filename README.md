# StatWise

> Make better life decisions with data. · Prenez de meilleures décisions pour votre vie grâce aux données.

StatWise turns official French public data into clear decisions about **where to
live**. V1 ships two simulators — *Trouver mon quartier* (find my neighbourhood)
and *Grandir ici* (raising a child here) — built mobile-first and bilingual
(FR/EN).

## Stack

- **Next.js 16** (App Router) + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (Base UI primitives)
- **Supabase** (PostgreSQL + PostGIS, Auth, RLS) — scaffolded
- **Vitest** for the pure scoring engine
- Pure-TypeScript domain layer, dictionary-based i18n, `[locale]` routing

## Quickstart

```bash
npm install
cp .env.example .env.local   # fill in Supabase values when connecting a DB
npm run dev                  # http://localhost:3000  → redirects to /fr
```

The app runs without a live database: the *Trouver mon quartier* wizard works
end-to-end on deterministic mock pilot-city data (`src/lib/mock/cities.ts`).

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (scoring engine) |
| `npm run format` | Prettier |

## Structure

```
src/
├── app/[locale]/        # localized routes (home, public pages, /app wizard)
├── components/          # ui (shadcn), layout, score, quartier, states
├── domain/              # pure types + scoring engine (+ tests)
├── lib/                 # i18n, formatting, mock data, storage helpers
├── server/supabase/     # browser/server/admin clients
└── proxy.ts             # locale redirect (Next 16 middleware → proxy)
supabase/migrations/     # PostGIS, reference/analytics/public schemas, RLS
docs/                    # product-spec, data-catalog, scoring-methodology, …
```

## Database

Apply migrations with the Supabase CLI:

```bash
supabase db push          # or run supabase/migrations/*.sql against your DB
```

RLS is enabled on every user-facing table; server use cases must also re-check
ownership.

## Docs

- [Product spec](docs/product-spec.md)
- [Architecture](docs/architecture.md)
- [Scoring methodology](docs/scoring-methodology.md)
- [Data catalog](docs/data-catalog.md)
- [Privacy scope](docs/privacy-scope.md)
- [Full project plan](STATWISE_PROJECT_PLAN.md)

## Status

Phase 0–1 complete (foundation, design system, FR/EN, public pages) plus the
*Trouver mon quartier* wizard on mock data. Auth + RLS, real data imports, and
*Grandir ici* are scaffolded/planned — see the project plan.

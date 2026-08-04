# Migrations that were never applied to this project

These five described an earlier design. They are **not** part of the schema the
application runs against, and they were moved out of `supabase/migrations/` because
leaving them there made the directory unrunnable.

## How that was established

Checked against the live project (`eiwbtcrwvkylppmykfqq`), not inferred from the files:

| Object these files create | Exists in the database |
| --- | --- |
| `postgis` extension | no |
| `reference.geo_communes` | no |
| `analytics.metric_values` | no |
| `public.simulation_inputs` | no |

The migration tracker lists ten applied migrations and none of them is one of these.

## Why they could not stay

Migrations run in filename order, so `0004_public_user_tables.sql` would run *before*
`20260802165414_accounts_and_saved_simulations.sql`. Both create `public.profiles`, and
they disagree about what a profile is:

| | `0004` (here) | applied schema |
| --- | --- | --- |
| name | `display_name` | `first_name`, `last_name` |
| home city | — | `home_city_id` |
| role | — | `role`, with a trigger making it non-self-assignable |

`0004` uses `create table if not exists`; the applied migration does not. So a push
against an empty database would create the old table, and then the real migration would
fail on it. In the worse case — if the failure were ignored — the application would be
pointed at a `profiles` with no `role` column, which is the column the assistant reads
to decide what a visitor is allowed to make it do.

## What to do with them

Kept rather than deleted, because they are the only written record of the reference-geo
and analytics schemas, and that ETL work may come back. If it does, they need renumbering
to timestamps after the applied ones, and the `profiles` and `simulations` parts dropped —
those tables now exist and are owned by `20260802165414`.

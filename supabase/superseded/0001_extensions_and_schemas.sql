-- StatWise — extensions and logical schemas
-- See docs/architecture.md and STATWISE_PROJECT_PLAN.md §10.

create extension if not exists postgis;
create extension if not exists pgcrypto;
-- Optional, used later for fast commune name search:
create extension if not exists pg_trgm;

-- Logical organisation (§10.2). `public` is the only schema exposed via the
-- Supabase client API; the rest are server-side / RPC only.
create schema if not exists reference; -- referentials and geography
create schema if not exists analytics; -- aggregates, metrics, import results
create schema if not exists staging;   -- raw/staging import tables
create schema if not exists audit;     -- technical logs

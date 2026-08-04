-- StatWise — user-facing tables exposed through the Supabase API (§10.7)

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  locale text not null default 'fr',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  simulation_type text not null check (simulation_type in ('quartier', 'family')),
  status text not null check (status in ('draft', 'processing', 'completed', 'failed', 'archived')),
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists simulations_user_idx on public.simulations (user_id, created_at desc);

create table if not exists public.simulation_inputs (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  schema_version text not null,
  inputs_json jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists simulation_inputs_sim_idx on public.simulation_inputs (simulation_id);

create table if not exists public.simulation_results (
  id uuid primary key default gen_random_uuid(),
  simulation_id uuid not null references public.simulations(id) on delete cascade,
  engine_version text not null,
  dataset_version text not null,
  result_json jsonb not null,
  confidence_score numeric,
  generated_at timestamptz not null default now()
);

create index if not exists simulation_results_sim_idx on public.simulation_results (simulation_id);

create table if not exists public.saved_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_type text not null,
  area_id uuid not null,
  label text,
  created_at timestamptz not null default now()
);

create index if not exists saved_areas_user_idx on public.saved_areas (user_id);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  consent_version text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists user_consents_user_idx on public.user_consents (user_id);

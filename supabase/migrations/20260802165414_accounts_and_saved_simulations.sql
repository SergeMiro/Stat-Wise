-- Profiles: the stable facts about a household, the ones a simulation already
-- knows or that a provider hands us. Never the financial inputs — those live on
-- the simulation the user chose to save.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text check (first_name is null or length(first_name) <= 80),
  last_name  text check (last_name  is null or length(last_name)  <= 80),
  -- An id from our own city list, not free text: it has to join to the snapshot.
  home_city_id text check (home_city_id is null or length(home_city_id) <= 64),
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'One row per account. Holds only what does not change: name, home city, locale.';

alter table public.profiles enable row level security;

create policy "profiles are readable by their owner"
  on public.profiles for select using ((select auth.uid()) = id);
create policy "profiles are created by their owner"
  on public.profiles for insert with check ((select auth.uid()) = id);
create policy "profiles are updated by their owner"
  on public.profiles for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Saved simulations. Stored only when the household asks for it: the input holds
-- a salary, a rent and a child count, which is exactly what we should not be
-- keeping by default.
create table public.simulations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('job', 'quartier', 'family')),
  -- The engine input, verbatim, so a saved run can be replayed and re-explained.
  input jsonb not null,
  -- What the result page needs to list it without recomputing everything.
  summary jsonb not null,
  -- Which engine and dataset produced it: a figure means nothing without them.
  engine_version text not null,
  dataset_version text not null,
  created_at timestamptz not null default now()
);

comment on table public.simulations is
  'A run the user asked to keep. Deleted with the account, by the cascade above.';

create index simulations_by_owner on public.simulations (user_id, created_at desc);

alter table public.simulations enable row level security;

create policy "simulations are readable by their owner"
  on public.simulations for select using ((select auth.uid()) = user_id);
create policy "simulations are created by their owner"
  on public.simulations for insert with check ((select auth.uid()) = user_id);
create policy "simulations are deleted by their owner"
  on public.simulations for delete using ((select auth.uid()) = user_id);

-- A profile the moment an account exists, so no screen has to cope with its
-- absence. Google hands us the given and family names; email signup carries
-- whatever the form collected.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, home_city_id, locale)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'first_name',
                         new.raw_user_meta_data ->> 'given_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'last_name',
                         new.raw_user_meta_data ->> 'family_name', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'home_city_id', '')), ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'locale', ''), 'fr')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

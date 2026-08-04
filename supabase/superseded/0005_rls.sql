-- StatWise — Row Level Security (§10.8)
-- Every user-facing table is owner-scoped to auth.uid(). Server use cases must
-- ALSO check ownership — RLS is defence in depth, not the only gate.

alter table public.profiles enable row level security;
alter table public.simulations enable row level security;
alter table public.simulation_inputs enable row level security;
alter table public.simulation_results enable row level security;
alter table public.saved_areas enable row level security;
alter table public.user_consents enable row level security;

-- profiles: a user reads/updates only their own row
create policy "profiles_select_own" on public.profiles
  for select using (id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "profiles_insert_own" on public.profiles
  for insert with check (id = (select auth.uid()));

-- simulations: full CRUD limited to the owner
create policy "simulations_all_own" on public.simulations
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- simulation_inputs / results: access only through an owned simulation
create policy "simulation_inputs_own" on public.simulation_inputs
  for all using (
    exists (select 1 from public.simulations s where s.id = simulation_id and s.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.simulations s where s.id = simulation_id and s.user_id = (select auth.uid()))
  );

create policy "simulation_results_own" on public.simulation_results
  for all using (
    exists (select 1 from public.simulations s where s.id = simulation_id and s.user_id = (select auth.uid()))
  ) with check (
    exists (select 1 from public.simulations s where s.id = simulation_id and s.user_id = (select auth.uid()))
  );

create policy "saved_areas_all_own" on public.saved_areas
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "user_consents_all_own" on public.user_consents
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Create a profile row automatically on sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, locale)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'locale', 'fr'))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

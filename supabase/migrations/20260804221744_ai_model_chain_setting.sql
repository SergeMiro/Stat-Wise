/*
  The model chain an admin puts in front of visitors.

  One row, enforced by a check on a fixed primary key rather than by convention: a
  second row would make "the setting" ambiguous, and whichever code read it first
  would win silently.

  Readable by everyone because it holds model *names*, which are not secrets — the
  keys live in the environment and never here. That also lets the panel say which
  model answered without a privileged read.
*/
create table public.ai_settings (
  id boolean primary key default true check (id),
  /*
    Ordered array of {gateway, model}. Order *is* the fallback order, so it is stored
    as an array and not as three columns: three columns would need renumbering every
    time one is removed from the middle.
  */
  model_chain jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.ai_settings (id, model_chain) values (true, '[]'::jsonb)
on conflict (id) do nothing;

alter table public.ai_settings enable row level security;

create policy "settings are readable by everyone"
  on public.ai_settings for select using (true);

create policy "only admins may change the model chain"
  on public.ai_settings for update
  using (
    exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role = 'admin')
  )
  with check (
    exists (select 1 from public.profiles p
            where p.id = (select auth.uid()) and p.role = 'admin')
  );

create trigger ai_settings_touch_updated_at
  before update on public.ai_settings
  for each row execute function public.touch_updated_at();

comment on table public.ai_settings is
  'Single row. model_chain is the ordered fallback list; an empty array means use the code default.';

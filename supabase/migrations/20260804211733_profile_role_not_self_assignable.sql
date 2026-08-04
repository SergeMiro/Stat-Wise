-- The assistant decides what it may do from this column, so it is the one field on
-- the profile that its owner must not be able to set.
alter table public.profiles
  add column role text not null default 'member'
  check (role in ('member', 'admin'));

comment on column public.profiles.role is
  'Drives the assistant''s capabilities. Not writable by the account itself — see the trigger below.';

/*
  The existing update policy lets the owner write their own row, which is right for a
  name and a city and wrong for this. Without the trigger, anyone signed in could
  grant themselves admin — and admin is what unlocks MCP servers, meaning arbitrary
  outbound tool calls.

  A trigger rather than a narrower policy because row-level security grants or denies
  a whole statement; it cannot say "every column but this one". The trigger simply
  puts the old value back, so an attempt succeeds and changes nothing rather than
  erroring and telling the caller what to try next.
*/
create function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.role is distinct from old.role then
    -- `service_role` is the trusted server key; anything else keeps the old value.
    if current_setting('request.jwt.claims', true)::json ->> 'role' is distinct from 'service_role' then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

revoke execute on function public.protect_profile_role() from public, anon, authenticated;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

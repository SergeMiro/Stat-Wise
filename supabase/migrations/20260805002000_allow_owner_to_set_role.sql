-- Let a trusted database connection set `profiles.role`, so the first admin can exist.
--
-- `protect_profile_role` puts the old value back unless the caller's JWT claims
-- `service_role`. That is right for anyone arriving through the API, and it is written to
-- succeed-and-do-nothing on purpose: an attacker who probes it learns nothing.
--
-- It also caught the operator. Outside PostgREST there is no `request.jwt.claims`, so
-- `current_setting` returns null, the check fails, and the update is reverted. So
-- `update public.profiles set role = 'admin'` typed into the Supabase SQL editor reports
-- success and changes nothing — verified against a local stack: the row still read
-- `member` afterwards. There was no way to appoint the first admin without circulating
-- the service-role key, which is the exact secret the admin console exists to avoid.
--
-- A direct database connection is therefore trusted too. That concedes nothing it does
-- not already have: it can drop the trigger, disable it, or write the column anyway.
--
-- ## How the caller is identified, and the trap in the obvious way
--
-- The first attempt at this used `current_user`. Inside a SECURITY DEFINER function
-- `current_user` is the function's *owner*, not the caller — so the check was true for
-- everyone, and a signed-in member promoted themselves to admin on the first try. That
-- was caught by attempting the attack rather than by reading the code, and it is why the
-- attempt is now a test.
--
-- Measured in both paths on a local stack:
--
--   psql as postgres    current_user=postgres  session_user=postgres       owner_member=t
--   PostgREST member    current_user=postgres  session_user=authenticator  owner_member=f
--
-- `session_user` survives the definer switch, so it is the one that can tell them apart.
-- `is_superuser` is not used: it reads `off` even for `postgres` on Supabase, so a check
-- on it would look like a safeguard while never being true.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_role text;
  from_database boolean;
begin
  if new.role is not distinct from old.role then
    return new;
  end if;

  claimed_role := current_setting('request.jwt.claims', true)::json ->> 'role';

  /*
    Membership, not a literal name match, so the owner role a migration runs as also
    qualifies. Through PostgREST `session_user` is `authenticator`, which holds no such
    membership — that is what keeps an account from promoting itself.
  */
  from_database := pg_catalog.pg_has_role(
    session_user,
    (select c.relowner from pg_catalog.pg_class c where c.oid = 'public.profiles'::regclass),
    'USAGE'
  );

  if claimed_role = 'service_role' or from_database then
    return new;
  end if;

  new.role := old.role;
  return new;
end;
$$;

revoke execute on function public.protect_profile_role() from public, anon, authenticated;

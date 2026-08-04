-- These two only ever run as triggers, but living in `public` made them callable
-- as REST endpoints by anyone, signed in or not — and they are SECURITY DEFINER,
-- so a caller would run them as the owner. The trigger keeps working: PostgreSQL
-- does not check EXECUTE for a trigger it fires itself.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;

-- Fix: my_family_id() returned NULL for unauthenticated (anon) requests
-- because auth.uid() is null without Supabase Auth.
--
-- Since Familjeveckan is a single-family app (BYOK, private URL),
-- we fall back to the hardcoded Walter family UUID for anon access.
-- This will be replaced with proper per-user JWT claims when Supabase Auth
-- is added in a future phase.

create or replace function my_family_id()
returns uuid language sql stable security definer as $$
  select coalesce(
    -- Authenticated users: look up their family via user_id
    (select family_id from family_members where user_id = auth.uid() limit 1),
    -- Unauthenticated (anon key): single-family fallback
    -- TODO: replace with auth.jwt()->>'family_id' claim when auth is implemented
    '00000000-0000-0000-0000-000000000001'::uuid
  );
$$;

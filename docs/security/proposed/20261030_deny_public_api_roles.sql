-- PROPOSAL ONLY. Do not execute until the approval gate in
-- docs/security/SUPABASE_SECURITY_ASSESSMENT.md is signed.
--
-- Verified target on 2026-10-30 from the local .env connection:
--   Supabase project ref kqptdgbttfuqkzxzbazw
--   database postgres, pooler port 6543, login role postgres
--   current_user rolsuper = false, rolbypassrls = true
--
-- Effect:
--   * Enables RLS on existing public tables without FORCE.
--   * Revokes API-role privileges on public tables, sequences, and functions.
--   * Stops future public tables created by postgres from inheriting those grants.
--   * Does not add policies. With RLS enabled and no policy, anon and
--     authenticated are denied. A USING (true) policy is intentionally absent.
--   * Does not change auth, storage, vault, or realtime.
--   * Does not add ownership columns and does not change application code.
--
-- Prisma keeps working only while DATABASE_URL uses a role that bypasses RLS
-- or owns the tables. On the verified database that role is postgres.
-- Do not point Prisma at anon, authenticated, or authenticator.

BEGIN;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public
  FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
  FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public
  FROM PUBLIC, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;

DO $$
DECLARE
  table_name text;
BEGIN
  FOR table_name IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',
      table_name
    );
  END LOOP;
END $$;

COMMIT;

-- Optional second step. Run only if the role executing this file is allowed
-- to change supabase_admin default privileges. If this statement fails, the
-- transaction above has already committed. New tables created later by
-- supabase_admin would otherwise be granted to anon again.
--
-- ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
--   REVOKE ALL ON TABLES FROM PUBLIC, anon, authenticated, service_role;
-- ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
--   REVOKE ALL ON SEQUENCES FROM PUBLIC, anon, authenticated, service_role;
-- ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public
--   REVOKE ALL ON FUNCTIONS FROM PUBLIC, anon, authenticated, service_role;

-- Post-check, still read-only. Do not treat a failed check as permission to
-- improvise grants.
--
-- SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
-- FROM pg_class c
-- JOIN pg_namespace n ON n.oid = c.relnamespace
-- WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity;
--
-- SELECT grantee, privilege_type, count(DISTINCT table_name)
-- FROM information_schema.role_table_grants
-- WHERE table_schema = 'public'
--   AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
-- GROUP BY 1, 2;

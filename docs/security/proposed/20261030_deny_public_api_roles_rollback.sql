-- ROLLBACK ONLY. Do not run unless the forward proposal was applied to the
-- same database and a human has decided to restore the 2026-10-30 grants.
--
-- Restores the verified pre-change posture of schema public:
--   * RLS disabled on public tables
--   * anon, authenticated, and service_role granted all table privileges
--   * postgres default privileges in public grant those roles again
--
-- This rollback re-opens anonymous Data API access. It does not touch
-- storage, auth, vault, or realtime.

BEGIN;

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
      'ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY',
      table_name
    );
  END LOOP;
END $$;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public
  TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

COMMIT;

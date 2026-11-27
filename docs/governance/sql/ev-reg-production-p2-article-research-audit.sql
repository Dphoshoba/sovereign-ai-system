-- EV-REG Production P2 — additive ArticleResearchAudit columns
-- Caller: docs/governance/EV-REG-PRODUCTION-P2-MIGRATION-PREPARATION.md §5/§12
--   (human-executed only after P2 approval; no automated runner in-repo).
-- No existing Production SQL package; Preview SQL lives only inside
--   docs/governance/EV-REG-3Y-MIGRATION-EXECUTION.md (not reusable as a .sql file).
-- Reads/writes: information_schema metadata + ALTER TABLE catalog only;
--   does not SELECT/UPDATE audit row bodies.
-- User: "Prepare an explicit transaction-controlled Production SQL script."
-- User: ADD COLUMN "specificationVersion" TEXT, ADD COLUMN "disputes" JSONB
--   (nullable, without defaults, indexes or backfill).
-- NOT a Prisma migration. Do NOT copy into prisma/migrations.
-- Do NOT run without explicit human P2 execution approval.
-- Target project ref only: kqptdgbttfuqkzxzbazw

-- =============================================================================
-- A. Preflight (run in a READ ONLY transaction first, then ROLLBACK)
-- =============================================================================

-- BEGIN READ ONLY;
-- SET LOCAL default_transaction_read_only = on;
--
-- SELECT current_database() AS db,
--        current_user AS usr,
--        current_setting('transaction_read_only') AS tro;
--
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'ArticleResearchAudit'
--   AND column_name IN ('specificationVersion', 'disputes')
-- ORDER BY column_name;
-- -- Expect: zero rows (both columns absent).
--
-- SELECT column_name
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'ArticleReviewNote'
-- ORDER BY ordinal_position;
-- -- Record only; do not ALTER this table.
--
-- ROLLBACK;

-- =============================================================================
-- B. Migration transaction (authorised execution only)
-- =============================================================================

BEGIN;

SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- Fail closed if either column already exists.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ArticleResearchAudit'
      AND column_name = 'specificationVersion'
  ) OR EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ArticleResearchAudit'
      AND column_name = 'disputes'
  ) THEN
    RAISE EXCEPTION 'EV-REG P2 abort: specificationVersion and/or disputes already present';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'ArticleResearchAudit'
      AND table_type = 'BASE TABLE'
  ) THEN
    RAISE EXCEPTION 'EV-REG P2 abort: ArticleResearchAudit missing';
  END IF;
END $$;

ALTER TABLE public."ArticleResearchAudit"
  ADD COLUMN "specificationVersion" TEXT,
  ADD COLUMN "disputes" JSONB;

-- In-transaction verification (metadata only — no audit row bodies).
DO $$
DECLARE
  spec_ok boolean;
  disp_ok boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ArticleResearchAudit'
      AND column_name = 'specificationVersion'
      AND data_type = 'text'
      AND is_nullable = 'YES'
      AND column_default IS NULL
  ) INTO spec_ok;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ArticleResearchAudit'
      AND column_name = 'disputes'
      AND data_type = 'jsonb'
      AND is_nullable = 'YES'
      AND column_default IS NULL
  ) INTO disp_ok;

  IF NOT spec_ok OR NOT disp_ok THEN
    RAISE EXCEPTION 'EV-REG P2 abort: post-ALTER column shape unexpected';
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- C. Post-migration read-only confirmation (new session)
-- =============================================================================

-- BEGIN READ ONLY;
-- SET LOCAL default_transaction_read_only = on;
--
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND table_name = 'ArticleResearchAudit'
--   AND column_name IN ('specificationVersion', 'disputes')
-- ORDER BY column_name;
--
-- ROLLBACK;

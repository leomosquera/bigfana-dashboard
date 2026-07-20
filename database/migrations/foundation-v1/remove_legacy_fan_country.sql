BEGIN;

-- =====================================================
-- Legacy Fan Country Physical Removal
-- Foundation DB v1 — Working identity (NO MIGRATION NUMBER)
-- docs/sessions/2026-07-19-legacy-fan-country-physical-removal-design.md
-- docs/sessions/2026-07-19-legacy-fan-country-post-cutover-gate-assessment.md
-- docs/sessions/2026-07-19-fan-geographic-data-application-cutover.md
-- Migration 006 fan profile foundation (country_code expand)
-- =====================================================
--
-- Business reason:
--   Complete physical removal of the unused legacy free-text
--   fans.country column after:
--     Migration 006 = ADD country_code + CHECK + backfill
--     Block C      = Architecture Review
--     Block D      = Application cutover (country_code SoT)
--     Block E      = Post-cutover gate assessment PASS (verdict A)
--
--   Canonical fan geography is already:
--     fans.country_code
--       TEXT NULLABLE
--       CHECK fans_country_code_check:
--         NULL OR ^[A-Z]{2}$
--
--   The application and Drizzle no longer read, write, or
--   map fans.country (Block D COMPLETE).
--
--   Residual Neon surface still present before this migration:
--     fans.country
--       type            = text
--       is_nullable     = YES
--       column_default  = none
--       comment         = none
--
--   This migration removes that residual physical surface.
--
-- Scope (physical removal only):
--   1. DROP COLUMN fans.country
--
-- Explicit OUT OF SCOPE:
--   No ALTER / DROP of fans.country_code
--   No modify fans_country_code_check
--   No CASCADE on DROP (unexpected dependents must fail loudly)
--   No DML / backfill / DELETE / UPDATE / INSERT
--   No new country tables / indexes
--   No fan_status cleanup
--   No application / Drizzle changes (already cut over)
--   No EEP feature work
--   No Migration 020 assignment or freeze
--
-- Migration identity:
--   Working identity = Legacy Fan Country Physical Removal
--   Migration number = NOT ASSIGNED
--   Migration 020    = NOT STARTED / NO FROZEN SCOPE
--
-- Data impact:
--   Discards residual non-authoritative legacy free-text.
--   Known assessment snapshot (informational only; NOT a hard
--   fan-count gate — normal fan growth must not fail execution):
--     6 rows: country NULL / country_code NULL
--     1 row:  Argentina / AR (consistent)
--     0 legacy-only
--     0 divergent
--   Canonical geography remains in fans.country_code.
--   Not considered canonical business-data loss when
--   pre-check legacy-only / divergent gates still hold.
--
-- Tables affected: fans (column removal only)
-- EEP impact: none at DDL level
--
-- Dependency strategy:
--   Gate Assessment found no indexes / FKs / views / triggers /
--   RLS / functions depending on fans.country.
--   Therefore no companion DROP INDEX / DROP CONSTRAINT.
--   Unexpected dependents must fail DROP COLUMN loudly (no CASCADE).
--
-- Hard contract warning:
--   This migration is irreversible under normal contract
--   operations. Successful Neon adoption requires a dedicated
--   reverse migration if rollback is ever needed later.
--   Restored fans.country must NEVER become canonical geography.
--   fans.country_code remains SoT.
--
-- Idempotency:
--   DROP COLUMN IF EXISTS fans.country
--   Safe to re-execute after a successful run (NOTICE + no-op).
--   Pre-check DO block:
--     - column absent → NOTICE + continue (idempotent re-run)
--       still verify country_code + CHECK integrity
--     - column present → verify expected legacy state +
--       data safety gates, then proceed
--   Post-check DO block hard-fails if column still exists.
--
-- =====================================================
-- OPERATIONAL GATES (HUMAN — NOT PROVEN BY THIS SQL)
-- =====================================================
-- SQL generation / this file does NOT convert these to PASS.
-- This file is NOT authorized for Neon execution by itself.
--
-- Before FIRST Neon execution, operator MUST confirm ALL of:
--   [ ] Design Brief approved
--   [ ] This SQL human-reviewed and approved
--   [ ] Explicit irreversible DROP approval recorded
--   [ ] Block D deployment fully propagated
--   [ ] No active pre-Block-D application instances
--   [ ] Rollback-to-old-app incompatibility after DROP acknowledged
--   [ ] EEP compatibility reviewed (no known fans.country consumer)
--   [ ] Out-of-repo writers reviewed (no known fans.country writer)
--   [ ] Repository zero-surface still true (no app/Drizzle mapping)
-- =====================================================

-- =====================================================
-- Pre-execution safety (manual checklist — BEFORE first Neon apply)
-- =====================================================
-- A. Legacy column (first execution)
--   SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'fans'
--     AND column_name = 'country';
--   -- expect first run: text, YES, NULL default
--
-- B. Canonical column + CHECK
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'fans'
--     AND column_name = 'country_code';
--
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'public.fans'::regclass
--     AND conname = 'fans_country_code_check';
--
-- C. Informational distributions (compare pre/post; do NOT require = 7)
--   SELECT COUNT(*) AS fan_count FROM fans;
--   SELECT country, country_code, COUNT(*)::int AS n
--   FROM fans
--   GROUP BY country, country_code
--   ORDER BY n DESC;
-- =====================================================

-- =====================================================
-- Pre-execution FAIL-FAST / already-applied detection
-- =====================================================

DO $$
DECLARE
  fans_reg regclass;

  col_exists boolean;
  code_exists boolean;
  check_exists boolean;

  col_data_type text;
  col_nullable text;
  col_default text;

  invalid_codes integer;
  legacy_only integer;
  divergent integer;

  fan_total integer;
  code_null integer;
  code_present integer;
  legacy_null integer;
  legacy_present integer;

  unexpected_index_count integer;
BEGIN
  fans_reg := to_regclass('public.fans');

  IF fans_reg IS NULL THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: public.fans is missing. Aborting — wrong database or catastrophic schema drift.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fans'
      AND column_name = 'country_code'
  ) INTO code_exists;

  IF NOT code_exists THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: fans.country_code is missing. Aborting — canonical geography column absent.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.fans'::regclass
      AND conname = 'fans_country_code_check'
  ) INTO check_exists;

  IF NOT check_exists THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: fans_country_code_check is missing. Aborting — canonical CHECK absent.';
  END IF;

  -- -------------------------------------------------
  -- Canonical country_code integrity (always required)
  -- Does NOT hard-code total fan count.
  -- -------------------------------------------------
  SELECT COUNT(*) INTO fan_total FROM fans;

  SELECT COUNT(*) INTO invalid_codes
  FROM fans
  WHERE country_code IS NOT NULL
    AND country_code !~ '^[A-Z]{2}$';

  IF invalid_codes <> 0 THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: % fans have invalid country_code (expected NULL or ^[A-Z]{2}$). Aborting.',
      invalid_codes;
  END IF;

  SELECT COUNT(*) INTO code_null
  FROM fans
  WHERE country_code IS NULL;

  SELECT COUNT(*) INTO code_present
  FROM fans
  WHERE country_code IS NOT NULL;

  RAISE NOTICE
    'Legacy Fan Country Physical Removal: fan_total=% country_code_null=% country_code_present=% (informational; growth OK).',
    fan_total, code_null, code_present;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fans'
      AND column_name = 'country'
  ) INTO col_exists;

  -- -------------------------------------------------
  -- Already applied path
  -- -------------------------------------------------
  IF NOT col_exists THEN
    RAISE NOTICE
      'Legacy Fan Country Physical Removal: fans.country already absent. Continuing with DROP COLUMN IF EXISTS no-op (idempotent re-run). Canonical country_code + CHECK integrity checks passed.';
    RETURN;
  END IF;

  -- -------------------------------------------------
  -- Expected legacy column physical state
  -- -------------------------------------------------
  SELECT
    c.data_type,
    c.is_nullable,
    c.column_default
  INTO
    col_data_type,
    col_nullable,
    col_default
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = 'fans'
    AND c.column_name = 'country';

  IF col_data_type IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: fans.country data_type is % (expected text). Unexpected drift — aborting.',
      col_data_type;
  END IF;

  IF col_nullable IS DISTINCT FROM 'YES' THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: fans.country is_nullable is % (expected YES). Unexpected drift — aborting.',
      col_nullable;
  END IF;

  IF col_default IS NOT NULL THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: fans.country has unexpected default % . Unexpected drift — aborting.',
      col_default;
  END IF;

  -- -------------------------------------------------
  -- Unexpected indexes referencing fans.country
  -- (exclude country_code matches)
  -- -------------------------------------------------
  SELECT COUNT(*) INTO unexpected_index_count
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'fans'
    AND indexdef ~* '([^_a-z]|^)country([^_a-z]|$)'
    AND indexdef !~* 'country_code';

  IF unexpected_index_count <> 0 THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: % unexpected index(es) reference fans.country. Aborting — no CASCADE / no companion drops.',
      unexpected_index_count;
  END IF;

  -- -------------------------------------------------
  -- Data safety: zero legacy-only / zero divergent
  -- Approved consistency:
  --   lower(trim(country)) IN ('argentina','ar') AND country_code = 'AR'
  --   OR upper(trim(country)) = country_code
  -- -------------------------------------------------
  SELECT COUNT(*) INTO legacy_only
  FROM fans
  WHERE country IS NOT NULL
    AND country_code IS NULL;

  IF legacy_only <> 0 THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: % fan(s) have country set with country_code NULL (legacy-only geography). Aborting DROP — would discard sole geographic information.',
      legacy_only;
  END IF;

  SELECT COUNT(*) INTO divergent
  FROM fans
  WHERE country IS NOT NULL
    AND country_code IS NOT NULL
    AND NOT (
      (lower(trim(country)) IN ('argentina', 'ar') AND country_code = 'AR')
      OR upper(trim(country)) = country_code
    );

  IF divergent <> 0 THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal FAIL-FAST: % fan(s) have divergent country / country_code pairs. Aborting DROP.',
      divergent;
  END IF;

  SELECT COUNT(*) INTO legacy_null
  FROM fans
  WHERE country IS NULL;

  SELECT COUNT(*) INTO legacy_present
  FROM fans
  WHERE country IS NOT NULL;

  RAISE NOTICE
    'Legacy Fan Country Physical Removal: fans.country present in expected state; country_null=% country_present=% legacy_only=0 divergent=0. Proceeding to DROP COLUMN.',
    legacy_null, legacy_present;
END $$;

-- =====================================================
-- Physical removal (no CASCADE; no companion drops)
-- =====================================================
-- Unexpected dependents must fail this statement loudly.
-- =====================================================

ALTER TABLE fans
  DROP COLUMN IF EXISTS country;

-- =====================================================
-- Hard post-condition (inside transaction)
-- =====================================================

DO $$
DECLARE
  col_exists boolean;
  code_exists boolean;
  check_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fans'
      AND column_name = 'country'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal POST-CHECK FAILED: fans.country still exists after DROP COLUMN. Aborting transaction.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fans'
      AND column_name = 'country_code'
  ) INTO code_exists;

  IF NOT code_exists THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal POST-CHECK FAILED: fans.country_code missing after DROP. Aborting transaction.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.fans'::regclass
      AND conname = 'fans_country_code_check'
  ) INTO check_exists;

  IF NOT check_exists THEN
    RAISE EXCEPTION
      'Legacy Fan Country Physical Removal POST-CHECK FAILED: fans_country_code_check missing after DROP. Aborting transaction.';
  END IF;

  RAISE NOTICE
    'Legacy Fan Country Physical Removal POST-CHECK: fans.country absent; fans.country_code present; fans_country_code_check present.';
END $$;

-- =====================================================
-- Post-migration validation (manual — run AFTER Neon apply)
-- =====================================================
-- Record / compare against the immediate pre-execution snapshot.
-- Do NOT require fan_count = 7 forever — only that the migration
-- itself did not mutate fan rows / country_code values.
--
-- 1. fans.country ABSENT
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'fans'
--     AND column_name = 'country';
--   -- expect: 0 rows
--
-- 2. fans.country_code PRESENT
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'fans'
--     AND column_name = 'country_code';
--   -- expect: 1 row
--
-- 3. fans_country_code_check PRESENT
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conrelid = 'public.fans'::regclass
--     AND conname = 'fans_country_code_check';
--   -- expect: CHECK (... NULL OR ^[A-Z]{2}$)
--
-- 4. Fan count unchanged vs immediate pre-execution snapshot
--   SELECT COUNT(*) AS fan_count FROM fans;
--
-- 5. country_code distribution unchanged vs pre-execution snapshot
--   SELECT country_code, COUNT(*)::int AS n
--   FROM fans
--   GROUP BY country_code
--   ORDER BY n DESC, country_code NULLS LAST;
--
-- 6. No invalid canonical values
--   SELECT COUNT(*) AS invalid_country_codes
--   FROM fans
--   WHERE country_code IS NOT NULL
--     AND country_code !~ '^[A-Z]{2}$';
--   -- expect: 0
--
-- 7. Architectural invariants intact
--   SELECT COUNT(*) AS fans_organization_id
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'fans'
--     AND column_name = 'organization_id';
--   -- expect: 0 (ABSENT)
--
--   SELECT COUNT(*) AS org_sport_cols
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'organizations'
--     AND column_name IN ('sport', 'sport_id');
--   -- expect: 0 (ABSENT)
--
-- 8. Application validation (not executed here)
--   npx tsc --noEmit
--   npm run build
--   scoped eslint on fan geography consumers
--   npx tsx --test src/server/queries/fan-organizations.test.ts
--
-- 9. Repository search (expect zero legacy runtime usage)
--   - fans.country / fan.country
--   - zero runtime reads
--   - zero runtime writes
--   - zero Drizzle mapping of fans.country
--   - zero DTO exposure of fan country free-text
--
-- 10. Idempotent re-run
--   Re-executing this file after successful apply must:
--     - pass country_code + CHECK integrity checks
--     - RAISE NOTICE that fans.country is already absent
--     - no-op DROP COLUMN IF EXISTS
--     - pass hard post-check (column still absent)
-- =====================================================

-- =====================================================
-- Rollback (HARD CONTRACT — dedicated reverse migration only)
-- =====================================================
-- This is a hard contract migration.
--
-- There is NO reverse SQL in this file.
-- Transaction failure mid-apply: stop; inspect catalog;
-- re-run with IF EXISTS + validation. Do not invent ad-hoc fixes.
-- Unexpected dependents must fail loudly (no CASCADE).
--
-- If reverse is ever required, authorize and write a SEPARATE
-- reverse migration that recreates:
--   fans.country TEXT NULL
-- as non-canonical residual only.
--
-- Do NOT restore fans.country as canonical geography.
-- fans.country_code remains the sole geographic SoT.
--
-- That reverse migration is NOT generated and NOT executed here.
-- =====================================================

COMMIT;

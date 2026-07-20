BEGIN;

-- =====================================================
-- Remove Legacy Fan Ownership
-- Foundation DB v1 — Migration 018b (Contract Phase)
-- migration-plan-v1.md → Migration 018b (staged)
-- docs/sessions/2026-07-18-migration-018b-remove-legacy-fan-ownership-design.md
-- ADR-009 (Accepted — Frozen)
-- ADR-001 / ADR-002
-- =====================================================
--
-- Business reason:
--   Complete physical removal of the deprecated legacy
--   fan ownership projection after Application Phase F2
--   and post-F2 ADR-009 hard gates PASS.
--
--   fan_organizations is already the sole source of truth
--   for fan↔organization relationships (ADR-001 / ADR-002 /
--   ADR-009). The application and Drizzle no longer read,
--   write, or map fans.organization_id.
--
--   Residual Neon surface still present before this migration:
--     fans.organization_id          (UUID NULLABLE, DEPRECATED)
--     fans_organization_id_fkey
--     idx_fans_org
--
--   This migration removes that residual physical surface.
--
-- Scope (physical removal only — explicit order):
--   1. DROP INDEX     idx_fans_org
--   2. DROP CONSTRAINT fans_organization_id_fkey
--   3. DROP COLUMN    fans.organization_id
--
-- Explicit OUT OF SCOPE:
--   No changes to fan_organizations (structure or data).
--   No application / Drizzle changes (already cut over in F2).
--   No data backfill or repair.
--   No shadow / backup ownership tables.
--   No changes to other fans columns / constraints / indexes.
--   No Migration 019 / organizations.sport work.
--   No CASCADE on DROP (unexpected dependents must fail loudly).
--
-- Contract (ADR-009):
--   fans.organization_id is DEPRECATED and non-authoritative.
--   Sole authoritative relationship is fan_organizations.
--   Compatibility projection writers are retired (F2).
--   Physical removal is the exclusive final contract step.
--
-- Data impact:
--   Discards residual non-authoritative projection values
--   that may remain on fans.organization_id.
--   Does NOT delete fans.
--   Does NOT delete or rewrite fan_organizations rows.
--   Not considered business ownership data loss:
--     SoT = fan_organizations (PRIMARY / FOLLOWING).
--
-- Frozen sequence:
--   017  = deprecation — COMPLETE
--   018a = omit-safe — COMPLETE
--   F2   = stop projection write + remove Drizzle mapping — COMPLETE
--   Gate = post-F2 ADR-009 technical gates — PASS
--   018b = physical DROP (this migration)
--   019  = organizations.sport — unchanged / out of scope
--
-- Tables affected: fans (index + FK + column removal only)
-- EEP impact: none
--
-- Hard contract warning:
--   This migration is irreversible under normal contract
--   operations. Successful Neon adoption requires a dedicated
--   reverse migration if rollback is ever needed later.
--   Do NOT treat COMMIT success as a trivial undo target.
--   Do NOT include a simplistic automatic rollback that
--   pretends to restore the pre-018b business/schema state.
--
-- Idempotency:
--   DROP ... IF EXISTS on all three objects.
--   Safe to re-execute after a successful run (no-ops).
--   Pre-check DO block allows full re-run when all three
--   objects are already absent; FAIL-FAST on unexpected
--   partial catalog drift (column gone but FK/index remain).
--
-- Execution gate (HUMAN — not granted by this file alone):
--   Before FIRST Neon execution, operator MUST confirm:
--     - Design Brief approved
--     - This SQL human-reviewed and approved
--     - Explicit approval for irreversible DROP
--     - fans.organization_id exists
--     - fans_organization_id_fkey exists
--     - idx_fans_org exists
--     - fan_organizations exists
--     - ADR-009 post-F2 gates still considered valid
-- =====================================================

-- =====================================================
-- Pre-execution safety (manual checklist — run BEFORE first Neon apply)
-- =====================================================
-- A. Confirm expected legacy objects exist (first execution)
--   SELECT column_name, data_type, udt_name, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'fans'
--     AND column_name = 'organization_id';
--   -- expect: one row, uuid, is_nullable = 'YES', column_default IS NULL
--
--   SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
--   FROM pg_constraint con
--   JOIN pg_class rel ON rel.oid = con.conrelid
--   JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
--   WHERE nsp.nspname = 'public'
--     AND rel.relname = 'fans'
--     AND con.contype = 'f'
--     AND con.conname = 'fans_organization_id_fkey';
--   -- expect: FK to organizations(id) ON DELETE CASCADE
--
--   SELECT indexname, indexdef
--   FROM pg_indexes
--   WHERE schemaname = 'public'
--     AND tablename = 'fans'
--     AND indexname = 'idx_fans_org';
--   -- expect: btree (organization_id)
--
-- B. Confirm SoT table exists
--   SELECT to_regclass('public.fan_organizations');
--   -- expect: fan_organizations
--
-- C. Optional consistency snapshot (expect 0 divergent; record counts)
--   SELECT COUNT(*) AS total_fans FROM fans;
--
--   SELECT COUNT(DISTINCT f.id) AS fans_with_primary
--   FROM fans f
--   JOIN fan_organizations fo
--     ON fo.fan_id = f.id
--    AND fo.is_primary = TRUE;
--
--   SELECT COUNT(*) AS fans_without_primary
--   FROM fans f
--   WHERE NOT EXISTS (
--     SELECT 1 FROM fan_organizations fo
--     WHERE fo.fan_id = f.id AND fo.is_primary = TRUE
--   );
--   -- expect: 0 (post-F2 gate baseline)
--
--   SELECT COUNT(*) AS divergent_legacy_vs_primary
--   FROM fans f
--   LEFT JOIN fan_organizations fo
--     ON fo.fan_id = f.id
--    AND fo.is_primary = TRUE
--   WHERE f.organization_id IS NOT NULL
--     AND (fo.organization_id IS NULL
--          OR fo.organization_id <> f.organization_id);
--   -- expect: 0
--
-- D. Confirm Migration 019 object untouched baseline (informational)
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'organizations'
--     AND column_name = 'sport';
--   -- expect: still present (019 not started)
-- =====================================================

-- =====================================================
-- Pre-execution FAIL-FAST / already-applied detection
-- =====================================================
-- Behavior:
--   - fan_organizations missing → EXCEPTION (wrong DB / catastrophic)
--   - all three legacy objects absent → NOTICE + continue
--     (idempotent re-run after successful apply)
--   - column absent but FK and/or index still present → EXCEPTION
--     (unexpected partial / catalog drift)
--   - column present → proceed with explicit DROPs
-- =====================================================

DO $$
DECLARE
  fan_orgs_reg regclass;
  col_exists boolean;
  fk_exists boolean;
  idx_exists boolean;
BEGIN
  fan_orgs_reg := to_regclass('public.fan_organizations');
  IF fan_orgs_reg IS NULL THEN
    RAISE EXCEPTION
      'Migration 018b FAIL-FAST: public.fan_organizations is missing. Aborting — wrong database or catastrophic schema drift.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'fans'
      AND column_name = 'organization_id'
  ) INTO col_exists;

  SELECT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'fans'
      AND con.contype = 'f'
      AND con.conname = 'fans_organization_id_fkey'
  ) INTO fk_exists;

  SELECT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'fans'
      AND indexname = 'idx_fans_org'
  ) INTO idx_exists;

  IF NOT col_exists AND NOT fk_exists AND NOT idx_exists THEN
    RAISE NOTICE
      'Migration 018b: legacy ownership objects already absent (column, FK, index). Continuing with IF EXISTS no-ops (idempotent re-run).';
    RETURN;
  END IF;

  IF NOT col_exists THEN
    RAISE EXCEPTION
      'Migration 018b FAIL-FAST: fans.organization_id is absent but dependents remain (fk_exists=%, idx_exists=%). Unexpected partial state — do not invent ad-hoc fixes; inspect catalog before retry.',
      fk_exists, idx_exists;
  END IF;
END $$;

-- =====================================================
-- Physical removal (explicit order — no CASCADE)
-- =====================================================
-- Prefer explicit DROP of dependents before DROP COLUMN
-- for auditability. Do NOT rely solely on implicit
-- DROP COLUMN dependency cleanup.
-- No CASCADE: unexpected dependents must fail the statement.
-- =====================================================

DROP INDEX IF EXISTS idx_fans_org;

ALTER TABLE fans
  DROP CONSTRAINT IF EXISTS fans_organization_id_fkey;

ALTER TABLE fans
  DROP COLUMN IF EXISTS organization_id;

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Record / compare counts against the pre-execution snapshot.
-- Migration DDL must not delete fan rows or fan_organizations rows.
--
-- 1. fans.organization_id NO LONGER exists
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'fans'
--     AND column_name = 'organization_id';
--   -- expect: 0 rows
--
-- 2. fans_organization_id_fkey NO LONGER exists
--   SELECT con.conname
--   FROM pg_constraint con
--   JOIN pg_class rel ON rel.oid = con.conrelid
--   JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
--   WHERE nsp.nspname = 'public'
--     AND rel.relname = 'fans'
--     AND con.contype = 'f'
--     AND con.conname = 'fans_organization_id_fkey';
--   -- expect: 0 rows
--
-- 3. idx_fans_org NO LONGER exists
--   SELECT to_regclass('public.idx_fans_org');
--   -- expect: NULL
--
--   SELECT indexname
--   FROM pg_indexes
--   WHERE schemaname = 'public'
--     AND tablename = 'fans'
--     AND indexname = 'idx_fans_org';
--   -- expect: 0 rows
--
-- 4. fan_organizations still exists
--   SELECT to_regclass('public.fan_organizations');
--   -- expect: fan_organizations
--
-- 5. fan_organizations structurally intact
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'fan_organizations'
--   ORDER BY ordinal_position;
--   -- expect stable columns including:
--   --   id, fan_id, organization_id, relationship_type,
--   --   is_primary, joined_at, metadata, created_at, updated_at
--
-- 6. PRIMARY relationships remain intact
--   SELECT COUNT(*) AS total_fans FROM fans;
--
--   SELECT COUNT(DISTINCT f.id) AS fans_with_primary
--   FROM fans f
--   JOIN fan_organizations fo
--     ON fo.fan_id = f.id
--    AND fo.is_primary = TRUE;
--   -- expect: fans_with_primary == pre-check fans_with_primary
--
--   SELECT COUNT(*) AS fans_without_primary
--   FROM fans f
--   WHERE NOT EXISTS (
--     SELECT 1 FROM fan_organizations fo
--     WHERE fo.fan_id = f.id AND fo.is_primary = TRUE
--   );
--   -- expect: 0 (same as pre-check baseline)
--
--   SELECT COUNT(*) AS fans_with_multiple_primary
--   FROM (
--     SELECT fo.fan_id
--     FROM fan_organizations fo
--     WHERE fo.is_primary = TRUE
--     GROUP BY fo.fan_id
--     HAVING COUNT(*) > 1
--   ) multi;
--   -- expect: 0
--
-- 7. No fans deleted (fan count unchanged)
--   SELECT COUNT(*) AS total_fans FROM fans;
--   -- expect: total_fans == pre-check total_fans
--
-- 8. fans retains non-legacy columns
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'fans'
--   ORDER BY ordinal_position;
--   -- expect present (among others):
--   --   id, first_name, last_name, display_name, email,
--   --   phone, birth_date, gender, city, country_code,
--   --   avatar_url, status, country, external_id, segment,
--   --   tier, engagement_score, eep_contact_id, eep_sync_status,
--   --   eep_last_sync_at, eep_last_error, created_at, updated_at
--   -- expect ABSENT:
--   --   organization_id
--
-- 9. Migration 019 untouched (organizations.sport still present)
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'organizations'
--     AND column_name = 'sport';
--   -- expect: one row (019 not started)
--
-- 10. Idempotency (optional re-run of this migration file)
--   Re-executing the three DROP ... IF EXISTS statements
--   (and this file as a whole) must succeed once objects are gone.
--   Expect NOTICE from the pre-check DO block on full re-run.
--
-- =====================================================
-- Application validation AFTER Neon apply (not executed here)
-- =====================================================
-- Do not modify application / Drizzle as part of 018b.
-- After Neon DROP, confirm app still matches post-F2 mapping:
--
--   npx tsc --noEmit
--   npm run build
--
-- Phase B semantic tests:
--   npx tsx --test src/server/queries/fan-organizations.test.ts
--
-- Final repository search (expect zero runtime ownership usage):
--   - fans.organizationId / fans.organization_id in src/ + scripts/
--   - zero runtime reads
--   - zero runtime writes
--   - zero Drizzle mapping of fans.organizationId
--
-- =====================================================
-- Rollback (HARD CONTRACT — dedicated reverse migration only)
-- =====================================================
-- Migration 018b is a hard contract migration.
--
-- There is NO simplistic automatic rollback in this file.
-- Transaction failure mid-apply: stop; inspect catalog;
-- re-run with IF EXISTS + validation. Do not invent ad-hoc fixes.
--
-- If reverse is ever required AFTER successful Neon adoption,
-- authorize and write a SEPARATE reverse migration that explicitly:
--   1. Recreates fans.organization_id as UUID NULLABLE (no default)
--   2. Recreates fans_organization_id_fkey → organizations(id)
--      with the correct ON DELETE / ON UPDATE policy
--   3. Recreates idx_fans_org on fans(organization_id)
--   4. Decides whether to rebuild projection values from
--      fan_organizations PRIMARY (compatibility projection only;
--      never a second business persistence model)
--
-- That reverse migration is NOT generated and NOT executed here.
-- =====================================================

COMMIT;

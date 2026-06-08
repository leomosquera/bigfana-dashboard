BEGIN;

-- =====================================================
-- fans — Fan Profile Foundation
-- Foundation DB v1 — Migration 006
-- ADR-001 Global Fan Model
-- ADR-002 Primary and Followed Organizations
-- migration-plan-v1.md
-- physical-model-v1.md
-- docs/sessions/2026-06-08-migration-006-fan-profile-foundation-design.md
-- =====================================================
--
-- Business reason:
--   Evolve the existing fans table toward the Foundation v1
--   fan profile model. fans remains the canonical identity
--   and declarative profile entity (no fan_profiles table).
--
-- Scope (expand-only):
--   ADD avatar_url
--   ADD country_code with ISO 3166-1 alpha-2 CHECK
--   BACKFILL country_code = 'AR' from approved Argentina variants
--
-- Deprecated (unchanged in DDL — documentation only):
--   fans.organization_id → use fan_organizations
--   fans.country         → use country_code
--
-- Tables affected: fans (ALTER only)
-- EEP impact: none at DDL level
-- Existing data impact: country_code backfill for Argentina variants only
--
-- Excluded (pre-existing Neon baseline):
--   fans_email_normalized_unique_idx — not created by this migration
--
-- Out of scope:
--   DROP / RENAME columns
--   organization_id modifications
--   fan_profiles table
--   EEP field changes
--   email indexes
--
-- Rollback (only before Migration 007, pre-adoption):
--   ALTER TABLE fans DROP CONSTRAINT IF EXISTS fans_country_code_check;
--   ALTER TABLE fans DROP COLUMN IF EXISTS country_code;
--   ALTER TABLE fans DROP COLUMN IF EXISTS avatar_url;
--
-- Do NOT drop fans_email_normalized_unique_idx (not owned by Migration 006).
-- =====================================================

-- =====================================================
-- avatar_url
-- =====================================================

ALTER TABLE fans
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- =====================================================
-- country_code
-- =====================================================

ALTER TABLE fans
ADD COLUMN IF NOT EXISTS country_code TEXT;

-- =====================================================
-- country_code CHECK (ISO 3166-1 alpha-2)
-- Consistent with competitions.country_code (Migration 003)
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fans_country_code_check'
          AND conrelid = 'fans'::regclass
    ) THEN
        ALTER TABLE fans
        ADD CONSTRAINT fans_country_code_check
        CHECK (
            country_code IS NULL
            OR country_code ~ '^[A-Z]{2}$'
        );
    END IF;
END $$;

-- =====================================================
-- Backfill country_code from legacy country
-- Approved variants only: argentina, ar (case-insensitive trim)
-- Legacy country column is NOT modified
-- Idempotent: only updates rows where country_code IS NULL
-- =====================================================

UPDATE fans
SET country_code = 'AR'
WHERE country_code IS NULL
  AND country IS NOT NULL
  AND lower(trim(country)) IN ('argentina', 'ar');

-- =====================================================
-- Post-migration validation (manual — do not execute in migration)
-- =====================================================
--
-- Pre-execution baseline:
--   SELECT indexname, indexdef
--   FROM pg_indexes
--   WHERE tablename = 'fans'
--     AND indexname = 'fans_email_normalized_unique_idx';
--
-- Schema:
--   \d fans
--   SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--   WHERE table_name = 'fans'
--     AND column_name IN ('avatar_url', 'country_code', 'country', 'organization_id')
--   ORDER BY column_name;
--
-- Constraint rejects invalid codes:
--   UPDATE fans SET country_code = 'mx' WHERE id = (SELECT id FROM fans LIMIT 1);
--   UPDATE fans SET country_code = 'ARG' WHERE id = (SELECT id FROM fans LIMIT 1);
--
-- Constraint accepts valid codes and NULL:
--   UPDATE fans SET country_code = 'AR' WHERE id = (SELECT id FROM fans LIMIT 1);
--   UPDATE fans SET country_code = NULL WHERE id = (SELECT id FROM fans LIMIT 1);
--
-- Backfill verification:
--   SELECT id, country, country_code
--   FROM fans
--   WHERE country IS NOT NULL
--     AND lower(trim(country)) IN ('argentina', 'ar');
--   -- expect country_code = 'AR'
--
--   SELECT id, country, country_code
--   FROM fans
--   WHERE country IS NOT NULL
--     AND lower(trim(country)) NOT IN ('argentina', 'ar')
--     AND country_code IS NULL;
--   -- expect unmapped rows remain NULL
--
-- Legacy country unchanged:
--   SELECT id, country FROM fans WHERE country IS NOT NULL;
--
-- Deprecated columns still present:
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'fans' AND column_name IN ('country', 'organization_id');
--
-- Email baseline unchanged:
--   SELECT indexname FROM pg_indexes
--   WHERE tablename = 'fans' AND indexname = 'fans_email_normalized_unique_idx';
--
-- Idempotency:
--   Re-run this migration file — expect no errors
--
-- Confirm re-run is idempotent

COMMIT;

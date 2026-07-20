BEGIN;

-- =====================================================
-- EEP Audiences Foundation
-- Foundation DB v1 — Migration 013
-- migration-plan-v1.md → Migration 013
-- physical-model-v1.md → EEP Domain
-- docs/sessions/2026-07-17-migration-013-eep-audiences-design.md
-- ADR-003 / ADR-007
-- =====================================================
--
-- Business reason:
--   Introduce BigFana's local cache of EEP-owned audiences
--   and fan memberships. EEP is the source of truth;
--   BigFana stores platform-scoped cache tables for local
--   read and future activation (campaigns / sponsors).
--
-- Scope:
--   audiences, fan_audiences only.
--   No segments / fan_segments (Migration 014).
--   No organization_id (ADR-007 — platform-scoped).
--   No campaign / sponsor targeting FKs.
--   No catalog status / retirement state columns.
--   No integration_jobs changes.
--
-- ADR-007 identity contract:
--   eep_id is the globally unique EEP Audience ID.
--   It is stable for the lifetime of the audience.
--   It is never reused for a different audience.
--   It is the idempotent upsert key for audiences.
--
-- Lifecycle / timestamps:
--   Audience lifecycle is sync-driven (not a BigFana
--   draft/active catalog workflow).
--   Migration 013 intentionally stores no audience
--   retirement state (no status / is_active / retired).
--   updated_at is maintained by the application during
--   successful synchronization (no DB trigger).
--
-- Tables affected: audiences, fan_audiences (CREATE)
-- EEP impact: cache surface only (no live sync in DDL)
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   fan_id → RESTRICT
--   audience_id → RESTRICT
--
-- Rollback (only before dependent migrations / application adoption):
--   DROP TABLE IF EXISTS fan_audiences;
--   DROP TABLE IF EXISTS audiences;
-- =====================================================

-- =====================================================
-- audiences
-- =====================================================

CREATE TABLE IF NOT EXISTS audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    eep_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- fan_audiences
-- =====================================================

CREATE TABLE IF NOT EXISTS fan_audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fan_id UUID NOT NULL,
    audience_id UUID NOT NULL,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fan_audiences_fan_fk
        FOREIGN KEY (fan_id)
        REFERENCES fans(id)
        ON DELETE RESTRICT,

    CONSTRAINT fan_audiences_audience_fk
        FOREIGN KEY (audience_id)
        REFERENCES audiences(id)
        ON DELETE RESTRICT,

    CONSTRAINT fan_audiences_unique_membership
        UNIQUE (fan_id, audience_id)
);

-- =====================================================
-- Indexes — audiences
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS audiences_eep_id_unique
ON audiences(eep_id);

CREATE INDEX IF NOT EXISTS audiences_name_idx
ON audiences(name);

-- =====================================================
-- Indexes — fan_audiences
-- =====================================================

CREATE INDEX IF NOT EXISTS fan_audiences_fan_idx
ON fan_audiences(fan_id);

CREATE INDEX IF NOT EXISTS fan_audiences_audience_idx
ON fan_audiences(audience_id);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Prerequisites:
--   :fan_id from fans
--   :fan_id_2 from fans (optional, distinct)
--
-- 1. Verify tables
--   \d audiences
--   \d fan_audiences
--   SELECT to_regclass('public.audiences');
--   SELECT to_regclass('public.fan_audiences');
--
-- 2. Confirm no organization_id / retirement columns
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name IN ('audiences', 'fan_audiences')
--     AND column_name IN (
--       'organization_id', 'status', 'is_active', 'retired_at'
--     );
--   -- expect 0 rows
--
-- 3. Counts (no seed)
--   SELECT COUNT(*) FROM audiences;       -- expect 0
--   SELECT COUNT(*) FROM fan_audiences;  -- expect 0
--
-- 4. Valid path: audience → membership
--   INSERT INTO audiences (eep_id, name, description)
--   VALUES ('eep-aud-validation-013', 'Validation Audience', 'test')
--   RETURNING id;  -- :audience_id
--
--   INSERT INTO fan_audiences (fan_id, audience_id)
--   VALUES (:fan_id, :audience_id);
--
-- 5. Reject: duplicate eep_id
--   INSERT INTO audiences (eep_id, name)
--   VALUES ('eep-aud-validation-013', 'Duplicate');
--
-- 6. Reject: duplicate membership
--   INSERT INTO fan_audiences (fan_id, audience_id)
--   VALUES (:fan_id, :audience_id);
--
-- 7. Reject: invalid fan_id / audience_id
--   INSERT INTO fan_audiences (fan_id, audience_id)
--   VALUES ('00000000-0000-0000-0000-000000000000', :audience_id);
--
-- 8. RESTRICT checks (expect failure when children exist)
--   DELETE FROM audiences WHERE id = :audience_id;
--   DELETE FROM fans WHERE id = :fan_id;
--
-- 9. Cleanup validation rows
--   DELETE FROM fan_audiences WHERE audience_id = :audience_id;
--   DELETE FROM audiences WHERE eep_id = 'eep-aud-validation-013';
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged

-- =====================================================
-- Rollback (pre-adoption only)
-- =====================================================
-- DROP TABLE IF EXISTS fan_audiences;
-- DROP TABLE IF EXISTS audiences;

COMMIT;

BEGIN;

-- =====================================================
-- EEP Segments Foundation
-- Foundation DB v1 — Migration 014
-- migration-plan-v1.md → Migration 014
-- physical-model-v1.md → EEP Domain
-- docs/sessions/2026-07-17-migration-014-eep-segments-design.md
-- ADR-003 / ADR-008
-- =====================================================
--
-- Business reason:
--   Introduce BigFana's local cache of EEP-owned segments
--   and fan memberships. EEP is the source of truth;
--   BigFana stores platform-scoped cache tables for local
--   classification reads. Segments classify; audiences
--   (Migration 013) activate — domains remain separate.
--
-- Scope:
--   segments, fan_segments only.
--   No changes to audiences / fan_audiences.
--   No organization_id (ADR-008 — platform-scoped).
--   No campaign / sponsor targeting FKs.
--   No catalog status / retirement state columns.
--   No scores / recommendations.
--   No fan_segment_rules changes.
--   No integration_jobs changes.
--
-- ADR-008 identity contract:
--   eep_id is the globally unique EEP Segment ID.
--   It is stable for the lifetime of the segment.
--   It is never reused for a different segment.
--   It is the idempotent synchronization / upsert key.
--   segments.id (UUID) is a BigFana surrogate key only.
--   eep_id is the canonical external sync identifier.
--
-- Lifecycle / timestamps:
--   Segment lifecycle is sync-driven (not a BigFana
--   draft/active catalog workflow).
--   Migration 014 intentionally stores no segment
--   retirement state (no status / is_active / retired).
--   updated_at is maintained by the application during
--   successful synchronization (no DB trigger).
--
-- Tables affected: segments, fan_segments (CREATE)
-- EEP impact: cache surface only (no live sync in DDL)
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   fan_id → RESTRICT
--   segment_id → RESTRICT
--
-- Rollback (only before dependent migrations / application adoption):
--   DROP TABLE IF EXISTS fan_segments;
--   DROP TABLE IF EXISTS segments;
-- =====================================================

-- =====================================================
-- segments
-- =====================================================

CREATE TABLE IF NOT EXISTS segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    eep_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()
);

-- =====================================================
-- fan_segments
-- =====================================================

CREATE TABLE IF NOT EXISTS fan_segments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fan_id UUID NOT NULL,
    segment_id UUID NOT NULL,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fan_segments_fan_fk
        FOREIGN KEY (fan_id)
        REFERENCES fans(id)
        ON DELETE RESTRICT,

    CONSTRAINT fan_segments_segment_fk
        FOREIGN KEY (segment_id)
        REFERENCES segments(id)
        ON DELETE RESTRICT,

    CONSTRAINT fan_segments_unique_membership
        UNIQUE (fan_id, segment_id)
);

-- =====================================================
-- Indexes — segments
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS segments_eep_id_unique
ON segments(eep_id);

CREATE INDEX IF NOT EXISTS segments_name_idx
ON segments(name);

-- =====================================================
-- Indexes — fan_segments
-- =====================================================

CREATE INDEX IF NOT EXISTS fan_segments_fan_idx
ON fan_segments(fan_id);

CREATE INDEX IF NOT EXISTS fan_segments_segment_idx
ON fan_segments(segment_id);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Prerequisites:
--   :fan_id from fans
--
-- 1. Verify tables
--   \d segments
--   \d fan_segments
--   SELECT to_regclass('public.segments');
--   SELECT to_regclass('public.fan_segments');
--
-- 2. Confirm no organization_id / retirement columns
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name IN ('segments', 'fan_segments')
--     AND column_name IN (
--       'organization_id', 'status', 'is_active', 'retired_at'
--     );
--   -- expect 0 rows
--
-- 3. Counts (no seed)
--   SELECT COUNT(*) FROM segments;       -- expect 0
--   SELECT COUNT(*) FROM fan_segments;   -- expect 0
--
-- 4. Valid path: segment → membership
--   INSERT INTO segments (eep_id, name, description)
--   VALUES ('eep-seg-validation-014', 'Validation Segment', 'test')
--   RETURNING id;  -- :segment_id
--
--   INSERT INTO fan_segments (fan_id, segment_id)
--   VALUES (:fan_id, :segment_id);
--
-- 5. Reject: duplicate eep_id
--   INSERT INTO segments (eep_id, name)
--   VALUES ('eep-seg-validation-014', 'Duplicate');
--
-- 6. Reject: duplicate membership
--   INSERT INTO fan_segments (fan_id, segment_id)
--   VALUES (:fan_id, :segment_id);
--
-- 7. Reject: invalid fan_id / segment_id
--   INSERT INTO fan_segments (fan_id, segment_id)
--   VALUES ('00000000-0000-0000-0000-000000000000', :segment_id);
--
-- 8. RESTRICT checks (expect failure when children exist)
--   DELETE FROM segments WHERE id = :segment_id;
--   DELETE FROM fans WHERE id = :fan_id;
--
-- 9. Confirm audiences unchanged
--   SELECT to_regclass('public.audiences');
--   SELECT to_regclass('public.fan_audiences');
--
-- 10. Cleanup validation rows
--   DELETE FROM fan_segments WHERE segment_id = :segment_id;
--   DELETE FROM segments WHERE eep_id = 'eep-seg-validation-014';
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged

-- =====================================================
-- Rollback (pre-adoption only)
-- =====================================================
-- DROP TABLE IF EXISTS fan_segments;
-- DROP TABLE IF EXISTS segments;

COMMIT;

BEGIN;

-- =====================================================
-- fan_sports, fan_competitions
-- Foundation DB v1 — Migration 005
-- ADR-001 Global Fan Model
-- ADR-002 Primary and Followed Organizations
-- ADR-004 Sports, Competitions and Organizations
-- ADR-006 Global Sports Community Vision
-- Decision 005 — Fan Interests
-- physical-model-v1.md
-- =====================================================
--
-- Business reason:
--   Allow platform-level fans to explicitly follow sports
--   and competitions, completing the fan interest model
--   alongside fan_organizations (Migration 001).
--
-- Scope:
--   fan_sports and fan_competitions tables only.
--   No metadata, source, score, affinity, priority,
--   or recommendation fields.
--
-- Tables affected: fan_sports (CREATE), fan_competitions (CREATE)
-- EEP impact: none (future fan_events on follow/unfollow are application-layer)
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   fan_id → CASCADE (interests are fan-owned adjunct data)
--   sport_id → RESTRICT (catalog integrity)
--   competition_id → RESTRICT (catalog integrity)
--
-- Rollback (only before Migration 006):
--   DROP TABLE IF EXISTS fan_competitions;
--   DROP TABLE IF EXISTS fan_sports;
-- =====================================================

-- =====================================================
-- fan_sports
-- =====================================================

CREATE TABLE IF NOT EXISTS fan_sports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fan_id UUID NOT NULL,
    sport_id UUID NOT NULL,

    joined_at TIMESTAMP WITHOUT TIME ZONE,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fan_sports_fan_fk
        FOREIGN KEY (fan_id)
        REFERENCES fans(id)
        ON DELETE CASCADE,

    CONSTRAINT fan_sports_sport_fk
        FOREIGN KEY (sport_id)
        REFERENCES sports(id)
        ON DELETE RESTRICT,

    CONSTRAINT fan_sports_unique_follow
        UNIQUE (fan_id, sport_id)
);

CREATE INDEX IF NOT EXISTS fan_sports_fan_idx
ON fan_sports(fan_id);

CREATE INDEX IF NOT EXISTS fan_sports_sport_idx
ON fan_sports(sport_id);

-- =====================================================
-- fan_competitions
-- =====================================================

CREATE TABLE IF NOT EXISTS fan_competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fan_id UUID NOT NULL,
    competition_id UUID NOT NULL,

    joined_at TIMESTAMP WITHOUT TIME ZONE,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fan_competitions_fan_fk
        FOREIGN KEY (fan_id)
        REFERENCES fans(id)
        ON DELETE CASCADE,

    CONSTRAINT fan_competitions_competition_fk
        FOREIGN KEY (competition_id)
        REFERENCES competitions(id)
        ON DELETE RESTRICT,

    CONSTRAINT fan_competitions_unique_follow
        UNIQUE (fan_id, competition_id)
);

CREATE INDEX IF NOT EXISTS fan_competitions_fan_idx
ON fan_competitions(fan_id);

CREATE INDEX IF NOT EXISTS fan_competitions_competition_idx
ON fan_competitions(competition_id);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- SELECT COUNT(*) FROM fan_sports;                     -- expect 0 (no seed)
-- SELECT COUNT(*) FROM fan_competitions;               -- expect 0 (no seed)
-- \d fan_sports
-- \d fan_competitions
--
-- Valid insert (fan_sports):
--   fan_id from fans
--   sport_id from sports
--
-- Valid insert (fan_competitions):
--   fan_id from fans
--   competition_id from competitions
--
-- Reject: duplicate (fan_id, sport_id)
-- Reject: duplicate (fan_id, competition_id)
-- Reject: invalid fan_id, sport_id, or competition_id
-- Reject: DELETE sport with existing fan_sports rows (RESTRICT)
-- Reject: DELETE competition with existing fan_competitions rows (RESTRICT)
-- Confirm: DELETE fan cascades fan_sports and fan_competitions rows
-- Confirm re-run is idempotent

COMMIT;

BEGIN;

-- =====================================================
-- competitions
-- Foundation DB v1 — Migration 003
-- ADR-004 Sports, Competitions and Organizations
-- ADR-005 Managed vs Integrated Competitions
-- Decision 004 — Competition Hierarchy
-- Global Catalog Rules — physical-model-v1.md
-- =====================================================
--
-- Business reason:
--   Introduce global competition catalog as foundation
--   for competition_organizations, fan interests, and
--   future integrated/managed competition operations.
--
-- Canonical identifier:
--   slug is the canonical competition identifier.
--   Display name (name) uses official international name.
--
-- Scope:
--   competitions table only.
--   Does not introduce competition_organizations,
--   fan_competitions, seasons, or matches.
--
-- Tables affected: competitions (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only, no seed)
--
-- Rollback (only before Migration 004):
--   DROP TABLE IF EXISTS competitions;
-- =====================================================

CREATE TABLE IF NOT EXISTS competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sport_id UUID NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    competition_type TEXT NOT NULL,
    country_code TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT competitions_sport_fk
        FOREIGN KEY (sport_id)
        REFERENCES sports(id)
        ON DELETE RESTRICT,

    CONSTRAINT competitions_slug_unique UNIQUE (slug),

    CONSTRAINT competitions_competition_type_check
        CHECK (
            competition_type IN (
                'INTEGRATED',
                'MANAGED'
            )
        ),

    CONSTRAINT competitions_country_code_check
        CHECK (
            country_code IS NULL
            OR country_code ~ '^[A-Z]{2}$'
        )
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS competitions_sport_idx
ON competitions(sport_id);

CREATE INDEX IF NOT EXISTS competitions_type_idx
ON competitions(competition_type);

CREATE INDEX IF NOT EXISTS competitions_active_idx
ON competitions(is_active);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- SELECT COUNT(*) FROM competitions;                   -- expect 0 (no seed)
-- \d competitions
--
-- Valid insert (INTEGRATED, domestic):
--   sport_id from sports WHERE slug = 'soccer'
--   name = 'Liga MX', slug = 'liga-mx'
--   competition_type = 'INTEGRATED', country_code = 'MX'
--
-- Valid insert (INTEGRATED, international):
--   competition_type = 'INTEGRATED', country_code = NULL
--
-- Reject: competition_type = 'EXTERNAL'
-- Reject: country_code = 'mx' (lowercase)
-- Reject: invalid sport_id
--
-- SELECT slug, COUNT(*) FROM competitions GROUP BY slug HAVING COUNT(*) > 1;
-- Confirm re-run is idempotent

COMMIT;

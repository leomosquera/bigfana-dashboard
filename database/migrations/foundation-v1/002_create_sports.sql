BEGIN;

-- =====================================================
-- sports
-- Foundation DB v1 — Migration 002
-- ADR-004 Sports, Competitions and Organizations
-- Decision 003 — Multi-Sport Architecture
-- Global Catalog Rules — physical-model-v1.md
-- =====================================================
--
-- Business reason:
--   Introduce normalized global sports catalog as foundation
--   for competitions, fan interests, and organizations.sport refactor.
--
-- Canonical identifier:
--   slug is the canonical global sport identifier.
--   Display name (name) is unique but secondary to slug for
--   i18n resolution and cross-system references.
--
-- Tables affected: sports (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only)
--
-- Rollback (only before Migration 003):
--   DROP TABLE IF EXISTS sports;
-- =====================================================

CREATE TABLE IF NOT EXISTS sports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT sports_name_unique UNIQUE (name),
    CONSTRAINT sports_slug_unique UNIQUE (slug)
);

-- =====================================================
-- Canonical seed
-- Source: migration-plan-v1.md Migration 002
-- Slugs: physical-model-v1.md → Global Catalog Rules
-- slug is the canonical global sport identifier.
-- =====================================================

INSERT INTO sports (name, slug, is_active)
VALUES
    ('Soccer',            'soccer',            TRUE),
    ('American Football', 'american-football', TRUE),
    ('Basketball',        'basketball',        TRUE),
    ('Rugby',             'rugby',             TRUE),
    ('Volleyball',        'volleyball',        TRUE),
    ('Tennis',            'tennis',            TRUE),
    ('Padel',             'padel',             TRUE),
    ('Golf',              'golf',              TRUE),
    ('Motorsports',       'motorsports',       TRUE),
    ('Esports',           'esports',           TRUE),
    ('Other',             'other',             TRUE)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- SELECT COUNT(*) FROM sports;                         -- expect 11
-- SELECT name, slug, is_active FROM sports ORDER BY slug;
-- SELECT slug, COUNT(*) FROM sports GROUP BY slug HAVING COUNT(*) > 1;
-- SELECT name, COUNT(*) FROM sports GROUP BY name HAVING COUNT(*) > 1;

COMMIT;

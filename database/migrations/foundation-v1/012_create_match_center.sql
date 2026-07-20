BEGIN;

-- =====================================================
-- Match Center Foundation
-- Foundation DB v1 — Migration 012
-- migration-plan-v1.md → Migration 012
-- physical-model-v1.md → Competition Operations
-- docs/sessions/2026-07-17-migration-012-match-center-design.md
-- ADR-004 / ADR-005
-- =====================================================
--
-- Business reason:
--   Introduce competition-scoped Match Center Foundation:
--   seasons, matches (fixtures + results), and persisted
--   standings snapshots. Managed and Integrated competitions
--   share the same schema.
--
-- Scope:
--   seasons, matches, standings only.
--   No divisions, stages, venues, provider metadata,
--   lineups, match events, statistics, content.match_id,
--   or sponsor_competitions.
--
-- Ownership:
--   Competitions own seasons.
--   Seasons own matches and standings.
--   season_id is the single source of truth for competition
--   ownership on matches and standings (no competition_id
--   on those tables).
--   Organizations participate only as home/away competitors
--   and standings entries (not tenant roots).
--
-- Standings:
--   Persisted snapshots only. Never calculated in SQL.
--
-- Tables affected: seasons, matches, standings (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   All business FKs → RESTRICT
--
-- Rollback (only before dependent migrations / application adoption):
--   DROP TABLE IF EXISTS standings;
--   DROP TABLE IF EXISTS matches;
--   DROP TABLE IF EXISTS seasons;
-- =====================================================

-- =====================================================
-- seasons
-- =====================================================

CREATE TABLE IF NOT EXISTS seasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    competition_id UUID NOT NULL,
    name TEXT NOT NULL,
    starts_at DATE,
    ends_at DATE,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT seasons_competition_fk
        FOREIGN KEY (competition_id)
        REFERENCES competitions(id)
        ON DELETE RESTRICT,

    CONSTRAINT seasons_dates_check
        CHECK (
            ends_at IS NULL
            OR starts_at IS NULL
            OR ends_at >= starts_at
        )
);

-- =====================================================
-- matches
-- =====================================================

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    season_id UUID NOT NULL,
    home_organization_id UUID NOT NULL,
    away_organization_id UUID NOT NULL,
    starts_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled',
    home_score INTEGER,
    away_score INTEGER,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT matches_season_fk
        FOREIGN KEY (season_id)
        REFERENCES seasons(id)
        ON DELETE RESTRICT,

    CONSTRAINT matches_home_organization_fk
        FOREIGN KEY (home_organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT matches_away_organization_fk
        FOREIGN KEY (away_organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT matches_status_check
        CHECK (
            status IN (
                'scheduled',
                'live',
                'finished',
                'postponed',
                'cancelled'
            )
        ),

    CONSTRAINT matches_teams_distinct_check
        CHECK (home_organization_id <> away_organization_id),

    CONSTRAINT matches_home_score_check
        CHECK (home_score IS NULL OR home_score >= 0),

    CONSTRAINT matches_away_score_check
        CHECK (away_score IS NULL OR away_score >= 0)
);

-- =====================================================
-- standings
-- =====================================================

CREATE TABLE IF NOT EXISTS standings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    season_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    played INTEGER NOT NULL DEFAULT 0,
    won INTEGER NOT NULL DEFAULT 0,
    drawn INTEGER NOT NULL DEFAULT 0,
    lost INTEGER NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT standings_season_fk
        FOREIGN KEY (season_id)
        REFERENCES seasons(id)
        ON DELETE RESTRICT,

    CONSTRAINT standings_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT standings_season_organization_unique
        UNIQUE (season_id, organization_id),

    CONSTRAINT standings_played_check
        CHECK (played >= 0),

    CONSTRAINT standings_won_check
        CHECK (won >= 0),

    CONSTRAINT standings_drawn_check
        CHECK (drawn >= 0),

    CONSTRAINT standings_lost_check
        CHECK (lost >= 0),

    CONSTRAINT standings_points_check
        CHECK (points >= 0)
);

-- =====================================================
-- Indexes — seasons
-- =====================================================

CREATE INDEX IF NOT EXISTS seasons_competition_idx
ON seasons(competition_id);

CREATE UNIQUE INDEX IF NOT EXISTS seasons_competition_name_unique
ON seasons(competition_id, lower(name));

-- =====================================================
-- Indexes — matches
-- =====================================================

CREATE INDEX IF NOT EXISTS matches_season_idx
ON matches(season_id);

CREATE INDEX IF NOT EXISTS matches_season_starts_at_idx
ON matches(season_id, starts_at);

CREATE INDEX IF NOT EXISTS matches_status_idx
ON matches(status);

CREATE INDEX IF NOT EXISTS matches_home_organization_idx
ON matches(home_organization_id);

CREATE INDEX IF NOT EXISTS matches_away_organization_idx
ON matches(away_organization_id);

-- =====================================================
-- Indexes — standings
-- =====================================================

CREATE INDEX IF NOT EXISTS standings_season_idx
ON standings(season_id);

CREATE INDEX IF NOT EXISTS standings_organization_idx
ON standings(organization_id);

CREATE INDEX IF NOT EXISTS standings_season_points_idx
ON standings(season_id, points DESC);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Prerequisites:
--   :competition_id from competitions
--   :org_home, :org_away from organizations (distinct)
--
-- 1. Verify tables
--   \d seasons
--   \d matches
--   \d standings
--   SELECT to_regclass('public.seasons');
--   SELECT to_regclass('public.matches');
--   SELECT to_regclass('public.standings');
--
-- 2. Confirm no competition_id on matches / standings
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name IN ('matches', 'standings')
--     AND column_name = 'competition_id';
--   -- expect 0 rows
--
-- 3. Counts (no seed)
--   SELECT COUNT(*) FROM seasons;     -- expect 0
--   SELECT COUNT(*) FROM matches;     -- expect 0
--   SELECT COUNT(*) FROM standings;   -- expect 0
--
-- 4. Valid path: season → match → standing
--   INSERT INTO seasons (competition_id, name)
--   VALUES (:competition_id, '2025/26')
--   RETURNING id;  -- :season_id
--
--   INSERT INTO matches (
--     season_id, home_organization_id, away_organization_id, starts_at
--   ) VALUES (
--     :season_id, :org_home, :org_away, NOW() + INTERVAL '1 day'
--   );
--   -- expect status = 'scheduled', scores NULL
--
--   INSERT INTO standings (season_id, organization_id)
--   VALUES (:season_id, :org_home);
--   -- expect counters = 0
--
-- 5. Competition via join only
--   SELECT m.id, s.competition_id
--   FROM matches m
--   JOIN seasons s ON s.id = m.season_id;
--
-- 6. Reject: ends_at < starts_at
--   INSERT INTO seasons (competition_id, name, starts_at, ends_at)
--   VALUES (:competition_id, 'Bad Dates', '2026-12-01', '2026-01-01');
--
-- 7. Reject: duplicate season name (case-insensitive)
--   INSERT INTO seasons (competition_id, name)
--   VALUES (:competition_id, '2025/26');
--   INSERT INTO seasons (competition_id, name)
--   VALUES (:competition_id, '2025/26');
--
-- 8. Reject: home = away
--   INSERT INTO matches (
--     season_id, home_organization_id, away_organization_id, starts_at
--   ) VALUES (
--     :season_id, :org_home, :org_home, NOW()
--   );
--
-- 9. Reject: invalid status
--   INSERT INTO matches (
--     season_id, home_organization_id, away_organization_id, starts_at, status
--   ) VALUES (
--     :season_id, :org_home, :org_away, NOW(), 'completed'
--   );
--
-- 10. Reject: negative score
--   INSERT INTO matches (
--     season_id, home_organization_id, away_organization_id, starts_at, home_score
--   ) VALUES (
--     :season_id, :org_home, :org_away, NOW(), -1
--   );
--
-- 11. Reject: duplicate standing (season_id, organization_id)
--   INSERT INTO standings (season_id, organization_id)
--   VALUES (:season_id, :org_home);
--
-- 12. Reject: negative points
--   INSERT INTO standings (season_id, organization_id, points)
--   VALUES (:season_id, :org_away, -1);
--
-- 13. RESTRICT checks (expect failure when children exist)
--   DELETE FROM seasons WHERE id = :season_id;
--   DELETE FROM competitions WHERE id = :competition_id;
--   DELETE FROM organizations WHERE id = :org_home;
--
-- 14. Cleanup validation rows
--   DELETE FROM standings WHERE season_id = :season_id;
--   DELETE FROM matches WHERE season_id = :season_id;
--   DELETE FROM seasons WHERE id = :season_id;
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged

-- =====================================================
-- Rollback (pre-adoption only)
-- =====================================================
-- DROP TABLE IF EXISTS standings;
-- DROP TABLE IF EXISTS matches;
-- DROP TABLE IF EXISTS seasons;

COMMIT;

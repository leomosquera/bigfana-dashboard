# Migration 012 — Match Center Foundation
## Design Brief

**Date:** 2026-07-17  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/012_create_match_center.sql`

---

## 1. Objective

Define the approved DDL scope for Foundation Database v1 Migration 012.

Introduce **Match Center Foundation**: competition-scoped operational tables that support seasons, fixtures/results (`matches`), and persisted standings — without competition structure abstractions, venues, provider metadata, or cross-domain FKs.

**Business outcome:**

```txt
Competitions can have seasons
Seasons can have matches (fixtures + results)
Seasons can have persisted standings snapshots
Managed and Integrated competitions share the same schema
```

**Non-outcomes (explicit):**

```txt
No competition structure model (divisions / stages / groups / brackets / conferences)
No venue modeling
No ticketing, lineups, events, or statistics
No content or sponsor linkage
No application-layer / Drizzle changes in this migration
```

---

## 2. Architectural Invariants

Frozen for Migration 012. Must not change during SQL generation or later review.

```txt
- Match Center is competition-scoped.
- No organization_id on Match Center tables.
- Competitions own seasons.
- Seasons own matches.
- Standings belong to a season and competition.
- Organizations participate only as home/away competitors and standings entries.
- Fixtures are represented by the matches table.
- Managed and Integrated competitions share the same schema.
- Standings are persisted snapshots and are never calculated in SQL.
- No venues.
- No venue columns on matches.
- No divisions.
- No stages, conferences, groups or brackets.
- No provider metadata.
- No integration-specific columns.
- No content.match_id.
- No sponsor_competitions.
- No lineups, match events or statistics.
- No triggers.
- No business logic inside DDL.
- Expand-only migration.
```

### Normalization invariant (approved)

```txt
season_id is the single source of truth for competition ownership on matches and standings.
matches and standings do NOT store competition_id.
Competition is always derived: match|standing → season → competition.
```

---

## 3. Scope

### In scope (DDL)

```txt
CREATE TABLE seasons
CREATE TABLE matches
CREATE TABLE standings
```

### Tables affected

```txt
seasons   (CREATE)
matches   (CREATE)
standings (CREATE)
```

### Tables not affected

```txt
competitions
competition_organizations
organizations
content
sponsors, sponsor_organizations
benefits, rewards, redemptions
fans, fan_events
All other Foundation DB v1 tables
```

### Data impact

```txt
Expand-only
No seed data
No backfill
No ALTER on existing tables
EEP impact: none
```

### General conventions

```txt
BEGIN / COMMIT transaction wrapper
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
UUID PK DEFAULT gen_random_uuid()
TIMESTAMP WITHOUT TIME ZONE for created_at / updated_at / match starts_at
DATE for season starts_at / ends_at
ON DELETE RESTRICT for all business FKs
No DB triggers
No seed data
No application logic in migration
```

---

## 4. Ownership

| Entity | Entity class | Root scope |
|--------|--------------|------------|
| `seasons` | Competition operations | `competition_id` → `competitions` |
| `matches` | Competition operations | `season_id` → `seasons` (competition via season) |
| `standings` | Competition operations | `season_id` → `seasons` (competition via season) |

**Rules:**

```txt
Match Center tables do NOT have a tenant organization_id column
matches and standings do NOT have competition_id
Organizations appear only as:
  matches.home_organization_id
  matches.away_organization_id
  standings.organization_id
Membership in a competition (competition_organizations) is NOT enforced in DDL
Competition for a match or standing is derived exclusively through seasons.competition_id
```

---

## 5. Lifecycle

```txt
Competition
    ↓
Season
    ↓
Match (fixture + result)     ← owned by season only
    ↓
Standings (persisted snapshot) ← owned by season only
```

| Stage | Table | Responsibility |
|-------|--------|----------------|
| Competition | `competitions` (existing) | Global catalog; INTEGRATED or MANAGED |
| Season | `seasons` | Time-bounded competition edition; sole carrier of `competition_id` |
| Match | `matches` | Fixture schedule + result fields; scoped by `season_id` |
| Standings | `standings` | Per-organization snapshot for a season; scoped by `season_id` |

**Fixture semantics:** “Fixture” is a product term only. Persistence is always `matches`.

**Competition lookup:**

```txt
matches.season_id     → seasons.id → seasons.competition_id
standings.season_id   → seasons.id → seasons.competition_id
```

---

## 6. Table responsibilities

### 6.1 `seasons`

**Purpose:** A named edition of a competition (e.g. `2025/26`, `Season 1`).

**Responsibilities:**

```txt
Anchor matches and standings
Carry optional calendar bounds (starts_at / ends_at)
Belong to exactly one competition
Act as the single source of truth linking Match Center rows to a competition
```

**Not responsible for:**

```txt
Divisions / stages / groups / brackets
Season membership rosters
Provider sync metadata
```

#### Columns

```txt
seasons
├── id              UUID        PK, DEFAULT gen_random_uuid()
├── competition_id  UUID        NOT NULL, FK → competitions.id
├── name            TEXT        NOT NULL
├── starts_at       DATE        NULL
├── ends_at         DATE        NULL
├── created_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
```

#### Column semantics

| Column | Rules |
|--------|-------|
| `competition_id` | Owning competition — only Match Center table that stores this FK |
| `name` | Display name within competition; required |
| `starts_at` / `ends_at` | Optional calendar bounds; `DATE` (not timestamp) |
| `created_at` / `updated_at` | Foundation timestamps; no trigger |

#### Constraints

**Foreign keys**

```txt
seasons_competition_fk
    competition_id → competitions.id
    ON DELETE RESTRICT
```

**CHECK**

```txt
seasons_dates_check
    ends_at IS NULL
    OR starts_at IS NULL
    OR ends_at >= starts_at
```

**Uniqueness**

```txt
seasons_competition_name_unique
    UNIQUE INDEX ON (competition_id, lower(name))
```

Case-insensitive season name uniqueness per competition.

#### Indexes

```txt
seasons_competition_idx
    ON (competition_id)

seasons_competition_name_unique
    UNIQUE ON (competition_id, lower(name))
```

---

### 6.2 `matches`

**Purpose:** Single match record used for both fixture (pre-result) and result (post-score) states.

**Responsibilities:**

```txt
Schedule a home vs away organization within a season
Store match status
Store optional scores
Support Managed writes and Integrated sync into the same shape
```

**Not responsible for:**

```txt
Venues
Lineups, events, statistics
Storing competition_id (derived via season)
Enforcing competition_organizations membership
Computing standings
```

#### Columns

```txt
matches
├── id                     UUID        PK, DEFAULT gen_random_uuid()
├── season_id              UUID        NOT NULL, FK → seasons.id
├── home_organization_id   UUID        NOT NULL, FK → organizations.id
├── away_organization_id   UUID        NOT NULL, FK → organizations.id
├── starts_at              TIMESTAMP   NOT NULL
├── status                 TEXT        NOT NULL, DEFAULT 'scheduled'
├── home_score             INTEGER     NULL
├── away_score             INTEGER     NULL
├── created_at             TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at             TIMESTAMP   NOT NULL, DEFAULT NOW()
```

`starts_at` and timestamps use `TIMESTAMP WITHOUT TIME ZONE`.

#### Column semantics

| Column | Rules |
|--------|-------|
| `season_id` | Owning season; competition ownership derived through `seasons.competition_id` |
| `home_organization_id` / `away_organization_id` | Competing organizations; both required in Foundation |
| `starts_at` | Kickoff / scheduled start |
| `status` | Match lifecycle — closed set below |
| `home_score` / `away_score` | Nullable until known; not DB-tied to `status` |
| `created_at` / `updated_at` | Foundation timestamps; no trigger |

#### `status` values

| Value | Meaning |
|-------|---------|
| `scheduled` | Fixture planned; default |
| `live` | In progress |
| `finished` | Completed |
| `postponed` | Delayed; may be rescheduled |
| `cancelled` | Will not be played |

Default: `scheduled`

Lowercase status convention — aligned with Migrations 007–011.

#### Constraints

**Foreign keys**

```txt
matches_season_fk
    season_id → seasons.id
    ON DELETE RESTRICT

matches_home_organization_fk
    home_organization_id → organizations.id
    ON DELETE RESTRICT

matches_away_organization_fk
    away_organization_id → organizations.id
    ON DELETE RESTRICT
```

**CHECK**

```txt
matches_status_check
    status IN (
        'scheduled',
        'live',
        'finished',
        'postponed',
        'cancelled'
    )

matches_teams_distinct_check
    home_organization_id <> away_organization_id

matches_home_score_check
    home_score IS NULL OR home_score >= 0

matches_away_score_check
    away_score IS NULL OR away_score >= 0
```

**Explicitly not in DDL**

```txt
No competition_id column or FK
No CHECK that finished requires non-null scores
No CHECK that scheduled requires null scores
No CHECK that organizations belong to competition_organizations
```

Those are application-layer rules (where applicable).

#### Indexes

```txt
matches_season_idx
    ON (season_id)

matches_season_starts_at_idx
    ON (season_id, starts_at)

matches_status_idx
    ON (status)

matches_home_organization_idx
    ON (home_organization_id)

matches_away_organization_idx
    ON (away_organization_id)
```

Competition-scoped listing uses a join:

```txt
matches
  JOIN seasons ON seasons.id = matches.season_id
WHERE seasons.competition_id = ?
```

No uniqueness on `(season_id, home, away, starts_at)` — reschedules and edge cases are application concerns.

---

### 6.3 `standings`

**Purpose:** Persisted per-organization standing snapshot for a season.

**Responsibilities:**

```txt
Store played / won / drawn / lost / points
One row per organization per season
Support Managed maintenance and Integrated sync snapshots
```

**Not responsible for:**

```txt
Deriving rows from matches in SQL
Storing competition_id (derived via season)
Goal difference, form, ranking position columns (deferred)
Division-scoped tables
```

#### Columns

```txt
standings
├── id                UUID        PK, DEFAULT gen_random_uuid()
├── season_id         UUID        NOT NULL, FK → seasons.id
├── organization_id   UUID        NOT NULL, FK → organizations.id
├── played            INTEGER     NOT NULL, DEFAULT 0
├── won               INTEGER     NOT NULL, DEFAULT 0
├── drawn             INTEGER     NOT NULL, DEFAULT 0
├── lost              INTEGER     NOT NULL, DEFAULT 0
├── points            INTEGER     NOT NULL, DEFAULT 0
├── created_at        TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at        TIMESTAMP   NOT NULL, DEFAULT NOW()
```

#### Column semantics

| Column | Rules |
|--------|-------|
| `season_id` | Owning season; competition ownership derived through `seasons.competition_id` |
| `organization_id` | Organization in this standing row (participant — not tenant root) |
| `played`, `won`, `drawn`, `lost`, `points` | Snapshot counters; defaults `0` |
| Consistency of `played` vs W/D/L | Application only — not DDL |

#### Constraints

**Foreign keys**

```txt
standings_season_fk
    season_id → seasons.id
    ON DELETE RESTRICT

standings_organization_fk
    organization_id → organizations.id
    ON DELETE RESTRICT
```

**CHECK**

```txt
standings_played_check   played >= 0
standings_won_check      won >= 0
standings_drawn_check    drawn >= 0
standings_lost_check     lost >= 0
standings_points_check   points >= 0
```

**Uniqueness**

```txt
standings_season_organization_unique
    UNIQUE (season_id, organization_id)
```

One standing row per organization per season.

#### Indexes

```txt
standings_season_idx
    ON (season_id)

standings_season_organization_unique
    UNIQUE (season_id, organization_id)

standings_organization_idx
    ON (organization_id)

standings_season_points_idx
    ON (season_id, points DESC)
```

`standings_season_points_idx` supports common table ordering; ranking ties broken in application.

Competition-scoped standings listing uses a join:

```txt
standings
  JOIN seasons ON seasons.id = standings.season_id
WHERE seasons.competition_id = ?
```

---

## 7. Relationships

```txt
competitions 1:N seasons
seasons      1:N matches
seasons      1:N standings

organizations 1:N matches (as home)
organizations 1:N matches (as away)
organizations 1:N standings
```

```txt
seasons.competition_id          ──► competitions.id
matches.season_id               ──► seasons.id
standings.season_id             ──► seasons.id
matches.home_organization_id    ──► organizations.id
matches.away_organization_id    ──► organizations.id
standings.organization_id       ──► organizations.id
```

**Competition ownership path (normalized):**

```txt
matches.season_id   → seasons → competitions
standings.season_id → seasons → competitions
```

**Not modeled:**

```txt
competition_id on matches
competition_id on standings
season → organization membership
match → venue
match → division / stage / group
standing → division
```

---

## 8. Deferred items

Explicitly **out of Migration 012**:

```txt
divisions
venues
venue columns on matches
competition structure ADR outcomes
stages
conferences
groups
brackets

content.match_id
sponsor_competitions

lineups
match events
statistics
provider metadata
integration-specific columns
integration registry

season membership
division membership

goal_difference / rank / form columns on standings
fixtures table
denormalized competition_id on matches or standings
DB calculation of standings from matches
DB enforcement of competition_organizations membership

DB trigger for updated_at
seed data
application-layer Drizzle schema changes (parallel track)
```

**Future ADR (required, not part of 012):** Competition Structure — whether competitions use divisions, stages, conferences, groups, brackets, or a generalized model.

---

## 9. Validation checklist

### Pre-execution

- [ ] Human approval of this Design Brief recorded
- [ ] Branch is not `main`
- [ ] Migrations 001–011 confirmed executed and validated in Neon
- [ ] `competitions` and `organizations` exist for FK test inserts

### Post-execution — Schema

**`seasons`**

- [ ] Table exists
- [ ] PK `id` UUID with default
- [ ] `competition_id` NOT NULL, FK RESTRICT → `competitions`
- [ ] `name` NOT NULL
- [ ] `starts_at` / `ends_at` DATE nullable
- [ ] `created_at` / `updated_at` NOT NULL with defaults
- [ ] `seasons_dates_check` accepts equal dates; rejects `ends_at < starts_at` when both set
- [ ] Unique index on `(competition_id, lower(name))`
- [ ] Index on `competition_id`
- [ ] No `organization_id` column
- [ ] No `division_id` / venue columns

**`matches`**

- [ ] Table exists
- [ ] Columns include `season_id`, home/away org, `starts_at`, `status`, scores, timestamps
- [ ] **No `competition_id` column**
- [ ] FKs RESTRICT: season, home org, away org only
- [ ] `starts_at` NOT NULL (`TIMESTAMP WITHOUT TIME ZONE`)
- [ ] `status` default `scheduled`
- [ ] `matches_status_check` accepts five approved values; rejects others
- [ ] `matches_teams_distinct_check` rejects home = away
- [ ] Scores nullable; negative scores rejected
- [ ] Indexes: season, season+starts_at, status, home org, away org
- [ ] **No `matches_competition_idx` or competition FK**
- [ ] No venue columns; no tenant `organization_id`; no provider columns

**`standings`**

- [ ] Table exists
- [ ] Columns include `season_id`, `organization_id`, counters, timestamps
- [ ] **No `competition_id` column**
- [ ] FKs RESTRICT: season, organization only
- [ ] Counters NOT NULL default 0; negative rejected
- [ ] UNIQUE `(season_id, organization_id)`
- [ ] Indexes: season, season+organization unique, organization, season+points
- [ ] **No `standings_competition_idx` or competition FK**
- [ ] No standings calculation functions/triggers
- [ ] `organization_id` is participant only (not tenant root)

### Post-execution — Data / behavior

- [ ] `SELECT COUNT(*)` on all three tables = 0 (no seed)
- [ ] Valid insert path: competition → season → match → standing
- [ ] Competition for a match is readable only via `JOIN seasons`
- [ ] Competition for a standing is readable only via `JOIN seasons`
- [ ] Reject invalid FKs
- [ ] Reject duplicate season name (case-insensitive) in same competition
- [ ] Reject duplicate standing for same `(season_id, organization_id)`
- [ ] DELETE competition / season / organization blocked by RESTRICT when children exist
- [ ] Re-run migration idempotent (`IF NOT EXISTS`)

### EEP / cross-domain

- [ ] No EEP tables changed
- [ ] `content` unchanged (no `match_id`)
- [ ] Sponsor tables unchanged

---

## 10. Rollback strategy

**Before application adoption and before any later migration depends on these tables:**

```txt
DROP TABLE IF EXISTS standings;
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS seasons;
```

Order matters: drop children before parents.

**After application adoption:** rollback requires a dedicated reverse migration and data preservation review — not a casual drop.

**EEP impact of rollback:** none.

---

## 11. SQL generation notes (non-DDL; for implementer after approval)

When generating SQL after human approval:

```txt
File: database/migrations/foundation-v1/012_create_match_center.sql
Wrap in BEGIN / COMMIT
Follow 011 header comment style (business reason, scope, FK behavior, rollback)
Create tables in order: seasons → matches → standings
Do NOT add competition_id to matches or standings
Reflect every Architectural Invariant in comments where helpful
Do not add columns or tables beyond this brief
```

---

## 12. References

```txt
docs/04-database/migration-plan-v1.md          → Migration 012
docs/04-database/physical-model-v1.md          → Competition Operations (seasons/matches/standings)
docs/04-database/foundation-db-v1.md           → Phase Match Center
docs/04-database/gap-analysis.md               → Seasons / Matches / Standings
docs/decisions/ADR-004-sports-competitions-organizations.md
docs/decisions/ADR-005-managed-vs-integrated-competitions.md
003_create_competitions.sql
004_create_competition_organizations.sql
011_create_content.sql                         → status / timestamp / RESTRICT precedent
```

**Approved architecture inputs (this brief):**

```txt
Architecture Review — Migration 012 Match Center Foundation (approved)
Venues evaluation — Option C defer (approved)
Competition Structure — future ADR; not frozen in 012 (approved)
Normalization — Option B: no competition_id on matches/standings (approved)
```

---

## 13. Approval gate

| Item | Status |
|------|--------|
| Scope: `seasons` + `matches` + `standings` only | Locked |
| Architectural Invariants | Locked — copied above |
| Normalization: `season_id` sole competition path | Locked |
| Column/constraint/index definitions | Approved |
| SQL generation / Neon execution / validation | Complete |
| Documentation alignment | Complete |

**Next Foundation step:** Migration 013 — EEP Audiences Architecture Review.

---

## Revision note

Relative to the prior draft brief:

```txt
Removed competition_id from matches and standings
Removed matches_competition_fk / standings_competition_fk
Removed matches_competition_idx / standings_competition_idx
Removed application-enforced competition_id ↔ season.competition_id consistency rules
Updated ownership, relationships, lifecycle, validation, and deferred items accordingly
All other architectural decisions unchanged
```

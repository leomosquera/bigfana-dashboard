# BigFana Current Schema

## Purpose

This document describes the **live physical Neon schema** for BigFana after Foundation Database v1 Migrations 001–019.

It is the source of truth for **current** columns, types, constraints, and indexes.

Future / target architecture (where it differs from Neon today) is documented in:

- foundation-db-v1.md
- physical-model-v1.md (sections explicitly labeled target / deferred)

Type representation note (post-019 Drizzle cleanup + Block A / NEW-F17 COMPLETE):

```txt
Many lifecycle / status domains are TEXT + CHECK in Neon.
A PG enum type `fan_status` exists but is unused by fans.status (optional DB hygiene debt).
Drizzle Foundation-critical mappings for fans / fan_events / integration_jobs /
memberships roles are aligned to Neon TEXT (+ CHECK where present).
F08 catalog tables mapped in Drizzle (COMPLETE — Block B):
  sports / competitions / competition_organizations

Live Neon timestamp conventions (verified):
  TIMESTAMP WITHOUT TIME ZONE — fans, fan_events, integration_jobs,
    organizations, memberships, fan_organizations,
    sports, competitions, competition_organizations (+ Foundation expand DDL)
  TIMESTAMP WITH TIME ZONE (timestamptz) — Better Auth (user/session/account/
    verification), campaigns engine, fan_points_ledger, fan_levels,
    fan_segment_rules, fan_experiences
Drizzle withTimezone matches each convention (NEW-F15 + NEW-F17 COMPLETE).
```

---

# Database

Current database:

```txt
PostgreSQL

Neon
```

---

# Schema Overview

Current implementation includes:

```txt
Authentication

Organizations

Users

Memberships

Fans

Fan Organizations

Fan Interests

Sports

Competitions

Competition Organizations

Campaigns

Loyalty

Sponsors

Sponsor Organizations

Content

Events

Integrations

Audit Logs
```

---

# Authentication

## Tables

```txt
user

account

session

verification
```

---

## Purpose

Authentication and user session management (Better Auth).

---

## Relationships

```txt
account.user_id
    → user.id

session.user_id
    → user.id
```

---

## Timestamp types (live Neon — verified Block A / NEW-F17)

All Better Auth timestamp columns are:

```txt
TIMESTAMP WITH TIME ZONE (timestamptz)
```

Verified columns:

```txt
user.created_at / user.updated_at
session.expires_at / session.created_at / session.updated_at
account.access_token_expires_at / account.refresh_token_expires_at
account.created_at / account.updated_at
verification.expires_at / verification.created_at / verification.updated_at
```

Drizzle declares `withTimezone: true` for these columns — **ALIGNED** (intentional timestamptz).

---

# Organizations

## Tables

```txt
organizations
```

---

## Purpose

Stores club and organization information.

Examples:

```txt
River Plate

Toluca

Real Madrid
```

---

## Columns (live Neon)

```txt
id UUID PK DEFAULT gen_random_uuid()

name TEXT NOT NULL

slug TEXT NOT NULL UNIQUE   -- constraint/index: organizations_slug_key

brand_color TEXT

logo_url TEXT

favicon_url TEXT

country TEXT

timezone TEXT

is_active BOOLEAN NOT NULL DEFAULT true

created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()

updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
```

Notes vs target physical-model drafts:

```txt
No `description` column in Neon today.
No `country_code` column — live field is `country`.
No `organizations.sport` / `organizations.sport_id` (removed / never introduced).
```

---

## Observations

Current implementation assumes organizations are the primary tenant boundary.

`organizations.sport` has been **physically removed** (Migration 019b COMPLETE).

There is no `organizations.sport_id`.

Canonical organization competition/sport context is derived via:

```txt
organization
  → competition_organizations
  → competitions
  → sports
```

Historical normalization: legacy `organizations.sport = 'football'` → `sports.slug = 'soccer'`.

Migration 019 staged retirement is COMPLETE:

```txt
019a → canonical competitions + memberships + COMMENT deprecation
App  → Drizzle / type cutover (zero runtime dependency)
019b → physical DROP
```

This remains aligned with Foundation Database v1 / ADR-004 / ADR-005.

---

# Users

## Tables

```txt
users

memberships
```

---

## Purpose

Stores administrative users and organization memberships.

---

## Relationships

```txt
memberships.user_id
    → users.id

memberships.organization_id
    → organizations.id
```

---

## memberships (live Neon highlights)

```txt
id UUID PK

user_id UUID FK NOT NULL          → users.id ON DELETE CASCADE

organization_id UUID FK NOT NULL  → organizations.id ON DELETE CASCADE

role TEXT NOT NULL
  CHECK (role IN ('owner', 'admin', 'tenant', 'analyst'))
  -- Canonical MembershipRole TypeScript contract aligned (F06 COMPLETE)

status TEXT NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'invited', 'suspended'))

better_auth_user_id TEXT

created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
```

Indexes (non-PK):

```txt
idx_memberships_org
idx_memberships_user
memberships_user_id_organization_id_key
  UNIQUE (user_id, organization_id)
memberships_better_auth_user_id_org_idx
  UNIQUE (better_auth_user_id, organization_id)
  WHERE better_auth_user_id IS NOT NULL
```

---

# Fans

## Tables

```txt
fans

fan_organizations

fan_sports

fan_competitions
```

---

## Purpose

Stores global fan identity, declarative profile, organization relationships, and sport/competition interests.

There is no `fan_profiles` table. Profile fields live on `fans`.

---

## fans

Global platform fan identity and declarative profile.

---

### Core Identity

```txt
id UUID PK DEFAULT gen_random_uuid()

first_name TEXT

last_name TEXT

display_name TEXT
  -- nullable in Neon; Drizzle nullability aligned (NEW-F16 COMPLETE)
  -- application writes currently populate it; no global fallback product rule added

email TEXT
```

---

### Profile

```txt
phone TEXT

birth_date DATE

gender TEXT

city TEXT

country_code TEXT

avatar_url TEXT
```

`avatar_url` and `country_code` exist in Neon (Migration 006) and are mapped in Drizzle (F07 COMPLETE).

Fan geography (Block D + physical removal COMPLETE):

```txt
country_code  = canonical SoT (ISO-3166-1 alpha-2 OR NULL)
                CHECK fans_country_code_check: NULL OR ^[A-Z]{2}$
                create/update/read use countryCode → country_code
avatar_url    = mapped; no upload/profile feature wiring yet
country       = PHYSICALLY REMOVED from Neon (unnumbered removal COMPLETE)
```

Verified snapshot after physical removal:

```txt
total fans: 7
country_code NULL: 6
country_code AR: 1
invalid country_code: 0
```

---

### Lifecycle

```txt
status TEXT NOT NULL DEFAULT 'active'
```

Allowed values enforced by CHECK (`fans_status_check`), **not** by a column typed as PG enum:

```txt
active

inactive

suspended

archived
```

Note: a PostgreSQL enum type named `fan_status` exists in the database but is **unused** by `fans.status` (F05 / F14 debt).

---

### Historical — Legacy Fan Geography (REMOVED)

```txt
fans.country  — PHYSICALLY REMOVED (unnumbered Legacy Fan Country Physical Removal COMPLETE)
```

Historical path only (not a current column):

```txt
Migration 006 — ADD country_code + CHECK + Argentina backfill; legacy country retained
Block D       — application cutover to country_code SoT; Drizzle unmapped country
Physical DROP — ALTER TABLE fans DROP COLUMN country (EXECUTED AND VALIDATED)
```

Canonical fan geography: `fans.country_code` only. Migration number for the DROP was NOT ASSIGNED (not Migration 020).

### Historical — Legacy Ownership (REMOVED)

```txt
fans.organization_id          — PHYSICALLY REMOVED (Migration 018b COMPLETE)
fans_organization_id_fkey     — PHYSICALLY REMOVED (Migration 018b COMPLETE)
idx_fans_org                  — PHYSICALLY REMOVED (Migration 018b COMPLETE)
```

These objects are **not** current columns/indexes. Historical path only:

```txt
Migration 001  — introduced fan_organizations; backfilled from fans.organization_id
Migration 017  — COMMENT deprecation (ADR-009)
Migration 018a — omit-safe NULLABLE
Application F2 — stopped projection write; removed Drizzle mapping
Migration 018b — physical DROP of column + FK + index
```

Sole authoritative fan↔organization relationship: `fan_organizations`.

---

### Operational Columns

```txt
external_id TEXT

segment TEXT

tier TEXT

engagement_score INTEGER NOT NULL DEFAULT 0

eep_contact_id TEXT

eep_sync_status TEXT NOT NULL DEFAULT 'pending'
  -- CHECK fans_eep_sync_status_check:
  -- pending | synced | failed | retrying
  -- (TEXT + CHECK in Neon; not a PG enum column type)

eep_last_sync_at TIMESTAMP WITHOUT TIME ZONE

eep_last_error TEXT

created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()

updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
```

---

### Constraints

```txt
fans_country_code_check
    country_code IS NULL OR ISO 3166-1 alpha-2 (^[A-Z]{2}$)

fans_status_check
    status IN ('active', 'inactive', 'suspended', 'archived')

fans_eep_sync_status_check
    eep_sync_status IN ('pending', 'synced', 'failed', 'retrying')
```

---

### Indexes

```txt
fans_email_normalized_unique_idx
    UNIQUE ON lower(trim(email))
    WHERE email IS NOT NULL

idx_fans_email
    ON (email)
```

---

### Relationships

```txt
fans = global fan identity only (ADR-001)

Fan↔organization relationships live exclusively in fan_organizations
(PRIMARY / FOLLOWING — ADR-002 / ADR-009).

Referenced by fan_organizations, fan_sports, fan_competitions,
campaign_responses, fan_events, fan_points_ledger
```

---

### Observations

Migration 006 backfilled `country_code = 'AR'` from legacy `country` values matching Argentina variants. Legacy free-text `country` was later physically removed (unnumbered removal COMPLETE). Canonical geography is `country_code` only.

Migration 017 formalized database-level deprecation of `fans.organization_id` via `COMMENT ON COLUMN` only (ADR-009). Historical — no longer current state.

Migration 018a made `fans.organization_id` omit-safe (`NOT NULL` → `NULLABLE`). Historical — column later removed by 018b.

Application Phase F2 COMPLETE: zero runtime reads/writes of legacy ownership; Drizzle `fans.organizationId` unmapped.

Migration 018b COMPLETE: physically removed `fans.organization_id`, `fans_organization_id_fkey`, and `idx_fans_org`. Validated in Neon: fan count 7→7; PRIMARY intact (7/7); app tsc/build/Phase B tests PASS; idempotent re-run PASS.

`fan_organizations` is the sole authoritative fan↔organization relationship. ADR-009 contract phase COMPLETE.

Migration 019 COMPLETE: minimum canonical competitions + memberships established; Application/Drizzle cutover COMPLETE; `organizations.sport` physically REMOVED (019b). Canonical sport context is competition-derived only.

Defined by:

```txt
ADR-001

ADR-002

ADR-009

Migration 006

Migration 017

Migration 018a

Migration 018b
```

---

## fan_organizations

Relationship between fans and organizations.

---

### Columns

```txt
id UUID PK DEFAULT gen_random_uuid()

fan_id UUID FK NOT NULL

organization_id UUID FK NOT NULL

relationship_type VARCHAR(20) NOT NULL

is_primary BOOLEAN NOT NULL DEFAULT false

joined_at TIMESTAMP WITHOUT TIME ZONE

metadata JSONB NOT NULL DEFAULT '{}'::jsonb

created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()

updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
```

---

### relationship_type

```txt
PRIMARY

FOLLOWING
```

Enforced by `fan_organizations_relationship_type_check`.

---

### Relationships

```txt
fan_id
    → fans.id          ON DELETE CASCADE

organization_id
    → organizations.id ON DELETE CASCADE
```

---

### Indexes / invariants

```txt
fan_organizations_fan_idx
fan_organizations_org_idx
fan_organizations_relationship_idx

fan_organizations_unique_relation_idx
  UNIQUE (fan_id, organization_id)

fan_organizations_primary_idx
  UNIQUE (fan_id) WHERE is_primary = TRUE
```

---

### Observations

Sole authoritative source of truth for primary and followed organizations (ADR-009). Backfilled from legacy `fans.organization_id` in Migration 001. Legacy column physically removed by Migration 018b (COMPLETE). PRIMARY / FOLLOWING represented exclusively here.

Note: DB does not currently enforce `is_primary = TRUE` ⇔ `relationship_type = 'PRIMARY'` as a CHECK (F11 debt). Application keeps them aligned.

Defined by:

```txt
ADR-001

ADR-002

ADR-009

Migration 001

Migration 017

Migration 018a

Migration 018b
```

---

# Fan Interests

## Tables

```txt
fan_sports

fan_competitions
```

---

## Purpose

Sports and competitions explicitly followed by platform-level fans.

---

## fan_sports

### Columns

```txt
id UUID PK

fan_id UUID FK

sport_id UUID FK

joined_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP
```

### Constraints

```txt
UNIQUE (fan_id, sport_id)

fan_id   → fans.id ON DELETE CASCADE

sport_id → sports.id ON DELETE RESTRICT
```

---

## fan_competitions

### Columns

```txt
id UUID PK

fan_id UUID FK

competition_id UUID FK

joined_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP
```

### Constraints

```txt
UNIQUE (fan_id, competition_id)

fan_id         → fans.id ON DELETE CASCADE

competition_id → competitions.id ON DELETE RESTRICT
```

---

## Observations

No seed data. Organization interests remain in `fan_organizations`.

Defined by:

```txt
ADR-006

Migration 005
```

---

# Sports

## Tables

```txt
sports
```

---

## Purpose

Global sports catalog.

---

## Columns (live Neon)

```txt
id UUID PK DEFAULT gen_random_uuid()

name TEXT NOT NULL
  -- UNIQUE sports_name_unique

slug TEXT NOT NULL
  -- UNIQUE sports_slug_unique

is_active BOOLEAN NOT NULL DEFAULT true

created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()

updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
```

Drizzle representation: mapped (Block B / F08 COMPLETE).

---

## Seed Catalog

Eleven canonical sports seeded per Global Catalog Rules:

```txt
soccer

american-football

basketball

rugby

volleyball

tennis

padel

golf

motorsports

esports

other
```

---

## Observations

`sports` is a global entity with no `organization_id`.

`slug` is the canonical global sport identifier.

`name` is the unique English display label.

Drizzle: `src/db/schema/sports.ts` (F08 COMPLETE). Competition product features remain unimplemented.

Defined by:

```txt
ADR-004

Migration 002
```

---

# Competitions

## Tables

```txt
competitions
```

---

## Purpose

Global competition catalog.

---

## Columns (live Neon)

```txt
id UUID PK DEFAULT gen_random_uuid()

sport_id UUID NOT NULL
  -- FK competitions_sport_fk → sports.id ON DELETE RESTRICT

name TEXT NOT NULL

slug TEXT NOT NULL
  -- UNIQUE competitions_slug_unique

competition_type TEXT NOT NULL
  -- CHECK INTEGRATED | MANAGED (TEXT + CHECK, not PG enum)

country_code TEXT
  -- CHECK NULL or ^[A-Z]{2}$

is_active BOOLEAN NOT NULL DEFAULT true

created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()

updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
```

Drizzle representation: mapped (Block B / F08 COMPLETE) — `text().$type<CompetitionType>()` for competition_type.

---

## Constraints

```txt
competitions_sport_fk
    sport_id → sports.id (ON DELETE RESTRICT)

competitions_slug_unique
    UNIQUE (slug)

competitions_competition_type_check
    competition_type IN ('INTEGRATED', 'MANAGED')

competitions_country_code_check
    country_code IS NULL OR ISO 3166-1 alpha-2 (^[A-Z]{2}$)
```

---

## Indexes

```txt
competitions_sport_idx

competitions_type_idx

competitions_active_idx
```

---

## Relationships

```txt
competitions.sport_id
    → sports.id
```

Referenced by:

```txt
competition_organizations
```

---

## Observations

`competitions` is a global entity with no `organization_id`.

`slug` is the canonical competition identifier.

`name` uses the official international display name and is not globally unique.

`country_code` is nullable; use `NULL` for international competitions.

Foundation minimum canonical package established by Migration 019a (validated in Neon: 2 rows):

```txt
liga-profesional-argentina  — Liga Profesional Argentina — INTEGRATED — AR — soccer
liga-mx                     — Liga MX — INTEGRATED — MX — soccer
```

Supported competition types:

```txt
INTEGRATED

MANAGED
```

Drizzle: `src/db/schema/competitions.ts` (F08 COMPLETE). Competition application features remain unimplemented.

Defined by:

```txt
ADR-004

ADR-005

Migration 003

Migration 019a
```

---

# Competition Organizations

## Tables

```txt
competition_organizations
```

---

## Purpose

Links organizations to competitions they participate in.

---

## Columns (live Neon)

```txt
id UUID PK DEFAULT gen_random_uuid()

competition_id UUID NOT NULL
  -- FK → competitions.id ON DELETE RESTRICT

organization_id UUID NOT NULL
  -- FK → organizations.id ON DELETE RESTRICT

joined_at TIMESTAMP WITHOUT TIME ZONE
  -- NULL for Foundation seed memberships (019a)

created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()

updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
```

Drizzle representation: mapped (Block B / F08 COMPLETE).

---

## Constraints

```txt
competition_organizations_competition_fk
    competition_id → competitions.id (ON DELETE RESTRICT)

competition_organizations_organization_fk
    organization_id → organizations.id (ON DELETE RESTRICT)

competition_organizations_unique_membership
    UNIQUE (competition_id, organization_id)
    -- multi-competition orgs allowed; NO UNIQUE (organization_id) alone
```

---

## Indexes

```txt
competition_organizations_competition_idx

competition_organizations_organization_idx
```

---

## Relationships

```txt
competition_organizations.competition_id
    → competitions.id

competition_organizations.organization_id
    → organizations.id
```

---

## Observations

Junction table completing Sport → Competition → Organization hierarchy.

One membership per organization per competition.

Both foreign keys use ON DELETE RESTRICT — organizations are long-lived; soft deletion preferred.

Foundation minimum memberships established by Migration 019a (validated in Neon: 3 rows):

```txt
river-plate  → liga-profesional-argentina
boca-juniors → liga-profesional-argentina
toluca       → liga-mx
```

Drizzle: `src/db/schema/competition-organizations.ts` (F08 COMPLETE). No competition UI/API/services in this phase.

`joined_at` is NULL for these Foundation memberships.

Defined by:

```txt
ADR-004

Migration 004

Migration 019a
```

---

# Campaigns

## Tables

```txt
campaigns

campaign_questions

campaign_options

campaign_responses

sponsor_ads

campaign_ads
```

---

## Purpose

Campaign engine for fan engagement.

Supports:

```txt
Trivia

Polls

Surveys

Predictions
```

---

## Relationships

```txt
campaigns.organization_id
    → organizations.id

campaign_questions.campaign_id
    → campaigns.id

campaign_options.question_id
    → campaign_questions.id

campaign_responses.campaign_id
    → campaigns.id

campaign_responses.question_id
    → campaign_questions.id

campaign_responses.option_id
    → campaign_options.id

campaign_responses.fan_id
    → fans.id

campaign_responses.organization_id
    → organizations.id
```

---

## Timestamp types (live Neon — verified Block A / NEW-F17)

All mapped campaign-engine timestamp columns are:

```txt
TIMESTAMP WITH TIME ZONE (timestamptz)
```

Verified columns:

```txt
campaigns.starts_at / ends_at / created_at / updated_at
campaign_questions.created_at / updated_at
campaign_options.created_at / updated_at
campaign_responses.created_at
sponsor_ads.created_at / updated_at
campaign_ads.created_at
```

Drizzle declares `withTimezone: true` for these columns — **ALIGNED** (intentional timestamptz).

---

## Observations

Current campaign structure is considered reusable.

No major redesign currently planned.

---

# Loyalty

## Tables

```txt
fan_levels

fan_points_ledger

benefits

rewards

redemptions
```

---

## Purpose

Stores loyalty progression, point transactions, organization-owned benefits and rewards catalogs, and fan reward redemption transactions.

---

## Relationships

```txt
fan_levels.organization_id
    → organizations.id

fan_points_ledger.organization_id
    → organizations.id

fan_points_ledger.fan_id
    → fans.id

fan_points_ledger.fan_event_id
    → fan_events.id

benefits.organization_id
    → organizations.id

rewards.organization_id
    → organizations.id

redemptions.organization_id
    → organizations.id

redemptions.fan_id
    → fans.id

redemptions.reward_id
    → rewards.id
```

---

## Timestamp types — runtime loyalty tables (live Neon — verified Block A / NEW-F17)

```txt
fan_points_ledger.created_at
fan_levels.created_at / fan_levels.updated_at
```

Physical type:

```txt
TIMESTAMP WITH TIME ZONE (timestamptz)
```

Drizzle declares `withTimezone: true` — **ALIGNED** (intentional timestamptz).

Note: Foundation catalog loyalty tables (`benefits` / `rewards` / `redemptions`) use
`TIMESTAMP WITHOUT TIME ZONE` per Migrations 007–009 and are outside Block A Drizzle scope.

---

## Observations

Current implementation provides a strong foundation for:

```txt
Points

Levels

Benefits (catalog — Migration 007)

Rewards (catalog — Migration 008)

Redemptions (transactions — Migration 009)
```

Loyalty Foundation (Migrations 007–009) is complete at the DDL level.

Benefit eligibility and usage tracking are deferred.

Points debit, stock decrement, and redemption workflow implementation are deferred to the application layer.

---

# Benefits

## Tables

```txt
benefits
```

---

## Purpose

Organization-owned loyalty benefit catalog. Benefits are entitlements (discounts, priority access, exclusive content) — not point-priced redeemables.

---

## Columns

```txt
id UUID PK

organization_id UUID FK NOT NULL

name TEXT NOT NULL

description TEXT

status TEXT NOT NULL DEFAULT draft

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Constraints

```txt
benefits_organization_fk
    organization_id → organizations.id (ON DELETE RESTRICT)

benefits_status_check
    status IN ('draft', 'active', 'paused', 'archived')
```

---

## Indexes

```txt
benefits_organization_id_idx

benefits_organization_status_idx
```

---

## Relationships

```txt
benefits.organization_id
    → organizations.id
```

---

## Observations

Catalog-only scope — no eligibility rules, usage tracking, sponsor linkage, or campaign FK.

`active` status means catalog visibility only; fan eligibility is future work.

`organization_id` uses ON DELETE RESTRICT — organizations are long-lived; soft deletion preferred.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 007
```

---

# Rewards

## Tables

```txt
rewards
```

---

## Purpose

Organization-owned loyalty rewards catalog. Rewards are point-priced redeemables (merchandise, tickets, experiences) — not entitlements (benefits belong to Migration 007).

---

## Columns

```txt
id UUID PK

organization_id UUID FK NOT NULL

name TEXT NOT NULL

description TEXT

points_required INTEGER NOT NULL

stock INTEGER

status TEXT NOT NULL DEFAULT draft

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Constraints

```txt
rewards_organization_fk
    organization_id → organizations.id (ON DELETE RESTRICT)

rewards_status_check
    status IN ('draft', 'active', 'paused', 'archived')

rewards_points_required_check
    points_required >= 1

rewards_stock_check
    stock IS NULL OR stock >= 0
```

---

## Indexes

```txt
rewards_organization_id_idx

rewards_organization_status_idx
```

---

## Stock Semantics

```txt
NULL  → unlimited availability
0     → out of stock (listed but not redeemable)
> 0   → available units remaining
```

Stock decrement on redemption is not implemented in Migration 008. Decrement logic belongs to Migration 009 application layer.

---

## Relationships

```txt
rewards.organization_id
    → organizations.id
```

---

## Observations

Catalog-only scope — no ledger debits, eligibility rules, sponsor linkage, or campaign FK.

`active` status means catalog visibility only; fan balance and stock checks occur at redemption time (application layer).

Free rewards (`0` points) are not supported. Promotional free items belong in `benefits`, not `rewards`.

`organization_id` uses ON DELETE RESTRICT — organizations are long-lived; soft deletion preferred.

No unique constraint on `name` per organization — duplicate names permitted at DB level.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 008
```

---

# Redemptions

## Tables

```txt
redemptions
```

---

## Purpose

Organization-scoped transactional record of a fan claiming a reward. Redemptions are fan claim instances against the rewards catalog — not entitlements (benefits) and not catalog configuration (rewards).

---

## Columns

```txt
id UUID PK

organization_id UUID FK NOT NULL

fan_id UUID FK NOT NULL

reward_id UUID FK NOT NULL

status TEXT NOT NULL DEFAULT pending

points_cost INTEGER NOT NULL

redeemed_at TIMESTAMP NOT NULL DEFAULT NOW()

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Constraints

```txt
redemptions_organization_fk
    organization_id → organizations.id (ON DELETE RESTRICT)

redemptions_fan_fk
    fan_id → fans.id (ON DELETE RESTRICT)

redemptions_reward_fk
    reward_id → rewards.id (ON DELETE RESTRICT)

redemptions_status_check
    status IN ('pending', 'approved', 'fulfilled', 'rejected', 'cancelled')

redemptions_points_cost_check
    points_cost >= 1
```

---

## Indexes

```txt
redemptions_organization_redeemed_at_idx

redemptions_organization_status_idx

redemptions_fan_id_idx

redemptions_reward_id_idx

redemptions_organization_fan_idx
```

---

## Relationships

```txt
redemptions.organization_id
    → organizations.id

redemptions.fan_id
    → fans.id

redemptions.reward_id
    → rewards.id
```

---

## Points Cost Snapshot

`points_cost` stores the point cost at claim time — a snapshot of `rewards.points_required` when the redemption is created.

| Rule | Value |
|------|-------|
| Nullability | NOT NULL |
| Constraint | `points_cost >= 1` |
| Source | Application copies `rewards.points_required` on insert |
| Rationale | Catalog `points_required` may change after redemption is recorded |

Migration 009 does not validate that `points_cost` matches `rewards.points_required` at insert time. That belongs to the redemption service.

---

## Status Workflow

| Status | Meaning | Terminal? |
|--------|---------|-----------|
| `pending` | Fan submitted claim; default on insert | No |
| `approved` | Organization accepted claim; fulfillment in progress | No |
| `fulfilled` | Reward delivered or digitally issued | Yes |
| `rejected` | Organization denied claim | Yes |
| `cancelled` | Fan or system withdrew before fulfillment | Yes |

Status transitions are enforced at the application layer. The database only constrains valid status values via CHECK.

Fast-path (`pending` → `fulfilled`) is permitted in application logic.

---

## Observations

DDL transaction storage only — no `ledger_entry_id`, `fan_event_id`, triggers, or procedures.

Points debit timing, stock decrement timing, and full redemption workflow are deferred to the application layer.

`organization_id` must equal `rewards.organization_id` for the linked reward — enforced at application layer, not DB CHECK.

All FKs use ON DELETE RESTRICT — preserve redemption history.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 009
```

---

# Segmentation

## Tables

```txt
fan_segment_rules

fan_experiences
```

---

## Purpose

Stores segmentation rules and fan experiences.

---

## Relationships

```txt
fan_segment_rules.organization_id
    → organizations.id

fan_experiences.organization_id
    → organizations.id

fan_experiences.segment_rule_id
    → fan_segment_rules.id
```

---

## Timestamp types (live Neon — verified Block A / NEW-F17)

All mapped EIL timestamp columns are:

```txt
TIMESTAMP WITH TIME ZONE (timestamptz)
```

Verified columns:

```txt
fan_segment_rules.created_at / updated_at
fan_experiences.starts_at / ends_at / created_at / updated_at
```

Drizzle declares `withTimezone: true` for these columns — **ALIGNED** (intentional timestamptz).

Note: EEP cache tables `segments` / `fan_segments` (Migration 014) use
`TIMESTAMP WITHOUT TIME ZONE` and are not mapped in Drizzle yet (NEW-F18).

---

## Observations

Future EEP-generated segments may coexist with current rule-based segmentation.

Defined by:

```txt
ADR-003
```

---

# Events

## Tables

```txt
fan_events
```

---

## Purpose

Stores fan behavioral events.

---

## Columns (live Neon)

```txt
id UUID PK DEFAULT gen_random_uuid()

organization_id UUID FK NOT NULL  → organizations.id ON DELETE CASCADE

fan_id UUID FK NOT NULL           → fans.id ON DELETE CASCADE

event_type TEXT NOT NULL

source TEXT NOT NULL

source_id TEXT

payload JSONB

metadata JSONB

points INTEGER NOT NULL DEFAULT 0

occurred_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()

created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
```

---

## Indexes (live Neon)

```txt
idx_fan_events_fan     ON (fan_id)
idx_fan_events_org     ON (organization_id)
idx_fan_events_type    ON (event_type)
```

Drizzle index declarations for `fan_events` are aligned to these physical Neon indexes (F09 COMPLETE).
Composite performance indexes remain optional P3 debt (not created).

---

## Relationships

```txt
fan_events.fan_id
    → fans.id

fan_events.organization_id
    → organizations.id
```

---

## Observations

fan_events is a strategic table.

It is the primary source for:

```txt
EEP Synchronization

Audience Generation

Behavior Tracking

Analytics
```

---

# Integrations

## Tables

```txt
integrations

integration_jobs
```

---

## Purpose

Organization-owned provider enablement registry (`integrations`) and asynchronous integration task queue (`integration_jobs`).

---

## integrations

### Columns

```txt
id UUID PK

organization_id UUID FK NOT NULL

provider TEXT NOT NULL

status TEXT NOT NULL DEFAULT draft

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Constraints

```txt
integrations_organization_fk
    organization_id → organizations.id (ON DELETE RESTRICT)

integrations_provider_check
    provider IN ('eep')

integrations_status_check
    status IN ('draft', 'active', 'paused', 'archived')

integrations_organization_provider_unique
    UNIQUE (organization_id, provider)
```

### Indexes

```txt
integrations_organization_idx
    ON (organization_id)

integrations_organization_status_idx
    ON (organization_id, status)

integrations_provider_idx
    ON (provider)
```

### Observations

Exactly one row per `(organization_id, provider)`, regardless of lifecycle status.

Lifecycle transitions UPDATE the existing row and never create additional rows for the same pair.

Historical lifecycle records belong to `audit_logs` (Migration 016).

Provider codes are stable platform vocabulary (`eep` in Foundation v1).

Conceptual 1:N with `integration_jobs`; physical `integration_id` FK deferred.

Logical job association: `(organization_id, provider)`.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 015
```

---

## integration_jobs

### Purpose

Stores asynchronous integration tasks (pre-existing; unchanged by Migration 015).

### Columns (live Neon highlights)

```txt
id UUID PK DEFAULT gen_random_uuid()

organization_id UUID FK NOT NULL  → organizations.id ON DELETE CASCADE

entity_type TEXT NOT NULL

entity_id UUID NOT NULL

provider TEXT NOT NULL

operation TEXT NOT NULL

payload JSONB

status TEXT NOT NULL DEFAULT 'pending'
  -- CHECK: pending | processing | synced | failed | retrying

attempts INTEGER NOT NULL DEFAULT 0

max_attempts INTEGER NOT NULL DEFAULT 5

next_retry_at TIMESTAMP WITHOUT TIME ZONE

last_error TEXT

processed_at TIMESTAMP WITHOUT TIME ZONE

idempotency_key TEXT UNIQUE

created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()

updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
```

Status / provider / operation domains are TEXT (+ CHECK where present), not PG enum column types.
Drizzle representation aligned to Neon TEXT model (F05 COMPLETE).

### Indexes (live Neon)

```txt
idx_integration_jobs_org       ON (organization_id)
idx_integration_jobs_status    ON (status)
integration_jobs_idempotency_key_key  UNIQUE (idempotency_key)
```

Drizzle index declarations for `integration_jobs` are aligned to these physical Neon indexes (F09 COMPLETE).
Composite performance indexes remain optional P3 debt (not created).

### Relationships

```txt
integration_jobs.organization_id
    → organizations.id
```

### Observations

No `integration_id` column — associate logically with `integrations` via `(organization_id, provider)`.

Supports ADR-003 sync principles: asynchronous, retryable, idempotent (`idempotency_key`).

Current flow:

```txt
BigFana
    ↓
Events
    ↓
Integration Jobs
    ↓
EEP (and future providers)
```

Defined by:

```txt
eep-architecture.md

Pre-Foundation integration queue
```

---

# Audit Logs

## Tables

```txt
audit_logs
```

---

## Purpose

Append-only dual-scope business audit trail for security-significant governance decisions.

Independent from `fan_events` (behavioral) and `integration_jobs` (operational execution).

---

## audit_logs

### Columns

```txt
id UUID PK

organization_id UUID FK NULL

actor_type TEXT NOT NULL

actor_id UUID NULL

origin_type TEXT NOT NULL

origin_id UUID NULL

action TEXT NOT NULL

entity_type TEXT NOT NULL

entity_id UUID NOT NULL

metadata JSONB NOT NULL DEFAULT '{}'

created_at TIMESTAMP NOT NULL
```

### Constraints

```txt
audit_logs_organization_fk
    organization_id → organizations.id ON DELETE RESTRICT

audit_logs_actor_type_check
    actor_type IN ('user', 'system', 'integration', 'anonymous')

audit_logs_origin_type_check
    origin_type IN ('dashboard', 'api', 'system', 'integration')

audit_logs_action_check
    action IN (
        'created', 'updated', 'status_changed',
        'linked', 'unlinked',
        'published', 'unpublished',
        'approved', 'rejected', 'cancelled', 'fulfilled',
        'archived', 'restored'
    )
```

### Indexes

```txt
audit_logs_organization_idx
    ON (organization_id)

audit_logs_organization_created_idx
    ON (organization_id, created_at DESC)

audit_logs_entity_idx
    ON (entity_type, entity_id)

audit_logs_entity_created_idx
    ON (entity_type, entity_id, created_at DESC)

audit_logs_actor_idx
    ON (actor_type, actor_id)

audit_logs_created_idx
    ON (created_at DESC)
```

### Observations

Dual-scope: `organization_id` present for org events; NULL for platform events (never invent artificial org context).

Actor (who) and Origin (where) are distinct soft-reference dimensions — no FK on `actor_id` / `origin_id`.

`entity_id` is the canonical BigFana primary key UUID of the audited entity.

`entity_type` is open TEXT; every emitted value must be documented in the platform canonical entity vocabulary.

`metadata` supplements business context only and must never become the authoritative source of current business state.

Append-only: no `updated_at`; application paths INSERT only.

Owns integration registry lifecycle history deferred from Migration 015.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 016
```

---

# Sponsors

## Tables

```txt
sponsors

sponsor_organizations

sponsor_ads

campaign_ads
```

---

## Purpose

Global sponsor catalog, organization sponsorship relationships, and org-scoped sponsor advertisements.

Sponsor Foundation (Migrations 010) introduces the global catalog and org partnership junction. Ad creatives (`sponsor_ads`) remain on the pre-Foundation model until `sponsor_id` reconciliation.

---

## Relationships

```txt
sponsor_organizations.sponsor_id
    → sponsors.id

sponsor_organizations.organization_id
    → organizations.id

sponsor_ads.organization_id
    → organizations.id

campaign_ads.campaign_id
    → campaigns.id

campaign_ads.sponsor_ad_id
    → sponsor_ads.id
```

---

# sponsors

## Purpose

Global platform catalog of commercial partners (brands). A sponsor exists independently from organizations.

---

## Columns

```txt
id UUID PK

name TEXT NOT NULL

slug TEXT NOT NULL

website_url TEXT

logo_url TEXT

status TEXT NOT NULL DEFAULT draft

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

---

## Constraints

```txt
sponsors_status_check
    status IN ('draft', 'active', 'paused', 'archived')
```

---

## Indexes

```txt
sponsors_slug_unique
    UNIQUE ON lower(slug)
```

Case-insensitive canonical slug enforcement. No table-level `UNIQUE (slug)` constraint.

---

## Relationships

```txt
Referenced by sponsor_organizations
```

---

## Observations

`sponsors` is a global entity with no `organization_id`.

`slug` is the canonical global sponsor identifier (case-insensitive uniqueness via `lower(slug)`).

`name` is not globally unique — duplicate display names permitted.

`active` status means catalog visibility only — not org partnership validity.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 010
```

---

# sponsor_organizations

## Purpose

Junction table linking global sponsors to tenant organizations.

---

## Columns

```txt
id UUID PK

sponsor_id UUID FK NOT NULL

organization_id UUID FK NOT NULL

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

---

## Constraints

```txt
sponsor_organizations_sponsor_fk
    sponsor_id → sponsors.id (ON DELETE RESTRICT)

sponsor_organizations_organization_fk
    organization_id → organizations.id (ON DELETE RESTRICT)

sponsor_organizations_unique_membership
    UNIQUE (sponsor_id, organization_id)
```

---

## Indexes

```txt
sponsor_organizations_sponsor_idx

sponsor_organizations_organization_idx
```

---

## Relationships

```txt
sponsor_organizations.sponsor_id
    → sponsors.id

sponsor_organizations.organization_id
    → organizations.id
```

---

## Observations

One membership row per sponsor–organization pair.

No `starts_at` / `ends_at` in Migration 010 — partnership windows deferred.

Both foreign keys use ON DELETE RESTRICT — preserve partnership history.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 010
```

---

# Sponsor Ads

## Tables

```txt
sponsor_ads

campaign_ads
```

---

## Purpose

Org-scoped sponsor advertisements and campaign associations. Pre-Foundation table — uses denormalized `sponsor_name` until `sponsor_id` FK is added in a future migration.

---

## Relationships

```txt
sponsor_ads.organization_id
    → organizations.id

campaign_ads.campaign_id
    → campaigns.id

campaign_ads.sponsor_ad_id
    → sponsor_ads.id
```

---

## Observations

`sponsor_ads` does not yet reference `sponsors.id`. Brand identity is stored in `sponsor_name` text per organization.

`sponsor_competitions` deferred to future 010b.

Defined by:

```txt
Pre-Foundation campaign engine
```

---

# Content

## Tables

```txt
content
```

---

## Purpose

Organization-owned publishable content for fan engagement — news, articles, announcements, video metadata, and match updates.

Content Foundation (Migration 011) introduces the core `content` table only. Taxonomy (`content_categories`, `content_tags`, assignment pivots) is intentionally deferred to Migration 011b.

---

## Columns

```txt
id UUID PK

organization_id UUID FK NOT NULL

title TEXT NOT NULL

slug TEXT NOT NULL

content_type TEXT NOT NULL

body TEXT

status TEXT NOT NULL DEFAULT draft

published_at TIMESTAMP

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

---

## Constraints

```txt
content_organization_fk
    organization_id → organizations.id (ON DELETE RESTRICT)

content_content_type_check
    content_type IN ('news', 'article', 'announcement', 'video', 'match_update')

content_status_check
    status IN ('draft', 'published', 'paused', 'archived')
```

---

## Indexes

```txt
content_organization_idx
    ON (organization_id)

content_organization_status_idx
    ON (organization_id, status)

content_slug_unique
    UNIQUE ON (organization_id, lower(slug))

content_organization_content_type_idx
    ON (organization_id, content_type)
```

Case-insensitive slug uniqueness per organization. No table-level `UNIQUE (slug)` constraint.

---

## Relationships

```txt
content.organization_id
    → organizations.id
```

---

## Publication Lifecycle

| Status | Meaning |
|--------|---------|
| `draft` | Created in admin; not fan-visible |
| `published` | Live; fan-visible when application rules allow |
| `paused` | Temporarily hidden from fans |
| `archived` | Soft-retired; retained for history |

Default: `draft`

Status transitions are enforced at the application layer.

---

## `published_at`

| Rule | Value |
|------|-------|
| Nullability | Nullable |
| While `draft` | Typically NULL |
| On publish | Application sets timestamp (usually `NOW()`) |
| DB enforcement | No CHECK linking `status = published` to `published_at NOT NULL` |

---

## `content_type`

| Value | Meaning |
|-------|---------|
| `news` | News item |
| `article` | Long-form article |
| `announcement` | Official club/org announcement |
| `video` | Video content (metadata in 011; media library deferred) |
| `match_update` | Match-related update — semantic type only; no `match_id` FK (deferred) |

---

## Observations

`content` is organization-owned — all queries must scope by `organization_id`.

Publication lifecycle uses `published` (not catalog `active` from loyalty/sponsors).

`match_update` has no `match_id` FK — intentionally deferred past Migration 012.

No campaign, sponsor, taxonomy, scheduling, or media FKs in Migration 011.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 011
```

---

# Match Center

## Tables

```txt
seasons

matches

standings
```

---

## Purpose

Competition-scoped Match Center Foundation — seasons, fixtures/results (`matches`), and persisted standings snapshots.

Managed and Integrated competitions share the same schema (ADR-005).

`season_id` is the single source of truth for competition ownership on `matches` and `standings` (no denormalized `competition_id` on those tables).

---

## seasons

### Columns

```txt
id UUID PK

competition_id UUID FK NOT NULL

name TEXT NOT NULL

starts_at DATE

ends_at DATE

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Constraints

```txt
seasons_competition_fk
    competition_id → competitions.id (ON DELETE RESTRICT)

seasons_dates_check
    ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at
```

### Indexes

```txt
seasons_competition_idx
    ON (competition_id)

seasons_competition_name_unique
    UNIQUE ON (competition_id, lower(name))
```

---

## matches

### Columns

```txt
id UUID PK

season_id UUID FK NOT NULL

home_organization_id UUID FK NOT NULL

away_organization_id UUID FK NOT NULL

starts_at TIMESTAMP NOT NULL

status TEXT NOT NULL DEFAULT scheduled

home_score INTEGER

away_score INTEGER

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Constraints

```txt
matches_season_fk
    season_id → seasons.id (ON DELETE RESTRICT)

matches_home_organization_fk
    home_organization_id → organizations.id (ON DELETE RESTRICT)

matches_away_organization_fk
    away_organization_id → organizations.id (ON DELETE RESTRICT)

matches_status_check
    status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')

matches_teams_distinct_check
    home_organization_id <> away_organization_id

matches_home_score_check
    home_score IS NULL OR home_score >= 0

matches_away_score_check
    away_score IS NULL OR away_score >= 0
```

### Indexes

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

### Match status

| Status | Meaning |
|--------|---------|
| `scheduled` | Fixture planned; default |
| `live` | In progress |
| `finished` | Completed |
| `postponed` | Delayed; may be rescheduled |
| `cancelled` | Will not be played |

---

## standings

### Columns

```txt
id UUID PK

season_id UUID FK NOT NULL

organization_id UUID FK NOT NULL

played INTEGER NOT NULL DEFAULT 0

won INTEGER NOT NULL DEFAULT 0

drawn INTEGER NOT NULL DEFAULT 0

lost INTEGER NOT NULL DEFAULT 0

points INTEGER NOT NULL DEFAULT 0

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Constraints

```txt
standings_season_fk
    season_id → seasons.id (ON DELETE RESTRICT)

standings_organization_fk
    organization_id → organizations.id (ON DELETE RESTRICT)

standings_season_organization_unique
    UNIQUE (season_id, organization_id)

standings_played_check / standings_won_check / standings_drawn_check /
standings_lost_check / standings_points_check
    each counter >= 0
```

### Indexes

```txt
standings_season_idx
    ON (season_id)

standings_organization_idx
    ON (organization_id)

standings_season_points_idx
    ON (season_id, points DESC)
```

(`standings_season_organization_unique` also provides a unique index on `(season_id, organization_id)`.)

---

## Relationships

```txt
seasons.competition_id
    → competitions.id

matches.season_id
    → seasons.id

standings.season_id
    → seasons.id

matches.home_organization_id
    → organizations.id

matches.away_organization_id
    → organizations.id

standings.organization_id
    → organizations.id
```

Competition for a match or standing is derived exclusively through:

```txt
match|standing → seasons → competitions
```

---

## Observations

Match Center tables are competition-scoped — not organization-owned tenant roots.

`matches` and `standings` do **not** store `competition_id`.

Organizations participate only as home/away competitors and standings entries.

Fixtures are represented by `matches` (no separate `fixtures` table).

Standings are persisted snapshots — never calculated in SQL.

Deferred from Migration 012:

```txt
divisions / stages / conferences / groups / brackets
venues / venue columns
content.match_id
sponsor_competitions
lineups / match events / statistics
provider / integration metadata
```

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 012
```

---

# EEP Audiences

## Tables

```txt
audiences

fan_audiences
```

---

## Purpose

Platform-scoped local cache of EEP-owned audiences and fan memberships.

EEP is the source of truth. BigFana stores cache tables for local read and future activation (campaigns / sponsors).

Defined by ADR-003 and ADR-007.

---

## audiences

### Columns

```txt
id UUID PK

eep_id TEXT NOT NULL

name TEXT NOT NULL

description TEXT

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Indexes

```txt
audiences_eep_id_unique
    UNIQUE ON (eep_id)

audiences_name_idx
    ON (name)
```

`eep_id` is the globally unique, stable, never-reused EEP Audience ID (ADR-007) and the idempotent upsert key.

---

## fan_audiences

### Columns

```txt
id UUID PK

fan_id UUID FK NOT NULL

audience_id UUID FK NOT NULL

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Constraints

```txt
fan_audiences_fan_fk
    fan_id → fans.id (ON DELETE RESTRICT)

fan_audiences_audience_fk
    audience_id → audiences.id (ON DELETE RESTRICT)

fan_audiences_unique_membership
    UNIQUE (fan_id, audience_id)
```

### Indexes

```txt
fan_audiences_fan_idx
    ON (fan_id)

fan_audiences_audience_idx
    ON (audience_id)
```

---

## Relationships

```txt
fan_audiences.fan_id
    → fans.id

fan_audiences.audience_id
    → audiences.id
```

---

## Observations

Platform-scoped — **no `organization_id`** on either table.

Organization scope applies only at activation time (later).

No audience retirement state (`status` / `is_active` / `retired_at`) in Migration 013.

`updated_at` is maintained by the application during successful synchronization (no DB trigger).

Lifecycle is sync-driven — not a BigFana catalog draft/active workflow.

`fan_segment_rules` remains BigFana-owned and unchanged.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 013
```

---

# EEP Segments

## Tables

```txt
segments

fan_segments
```

---

## Purpose

Platform-scoped local cache of EEP-owned segments and fan memberships.

EEP is the source of truth. Segments classify fans; audiences (Migration 013) activate — domains remain separate.

Defined by ADR-003 and ADR-008.

---

## segments

### Columns

```txt
id UUID PK

eep_id TEXT NOT NULL

name TEXT NOT NULL

description TEXT

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Indexes

```txt
segments_eep_id_unique
    UNIQUE ON (eep_id)

segments_name_idx
    ON (name)
```

`id` is a BigFana surrogate key only.  
`eep_id` is the globally unique, stable, never-reused EEP Segment ID (ADR-008) and the canonical external synchronization / upsert key.

---

## fan_segments

### Columns

```txt
id UUID PK

fan_id UUID FK NOT NULL

segment_id UUID FK NOT NULL

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Constraints

```txt
fan_segments_fan_fk
    fan_id → fans.id (ON DELETE RESTRICT)

fan_segments_segment_fk
    segment_id → segments.id (ON DELETE RESTRICT)

fan_segments_unique_membership
    UNIQUE (fan_id, segment_id)
```

### Indexes

```txt
fan_segments_fan_idx
    ON (fan_id)

fan_segments_segment_idx
    ON (segment_id)
```

---

## Relationships

```txt
fan_segments.fan_id
    → fans.id

fan_segments.segment_id
    → segments.id
```

---

## Observations

Platform-scoped — **no `organization_id`** on either table.

No segment retirement state (`status` / `is_active` / `retired_at`) in Migration 014.

`updated_at` is maintained by the application during successful synchronization (no DB trigger).

Lifecycle is sync-driven — not a BigFana catalog draft/active workflow.

No FK between `segments` and `audiences`.

`fan_segment_rules` remains BigFana-owned and unchanged.

No seed data — validated: 0 rows.

Defined by:

```txt
Migration 014
```

---

# Current Strengths

The current schema already provides:

```txt
Organizations

Fans

Fan Profile Foundation

Fan Organization Relationships

Fan Interests

Sports Catalog

Competitions Catalog

Competition Organization Memberships

Campaigns

Events

Points

Levels

Benefits Catalog

Rewards Catalog

Redemptions

Sponsor Foundation

Content Foundation

Match Center Foundation

EEP Audiences Foundation

EEP Segments Foundation

Integration Registry Foundation

Audit Layer Foundation

EEP Integration Foundation
```

which aligns strongly with BigFana's Phase 1 roadmap.

---

# Known Limitations

Current schema does not yet support:

```txt
Competition structure (divisions / stages — future ADR)

Venues

Benefit eligibility and usage tracking

Content Taxonomy (deferred — Migration 011b)

Audience / segment retirement state

Activation FKs (campaign / sponsor ↔ audience or segment)

integration_id FK on integration_jobs

Credentials / connections / webhook ingress

Retention / SIEM / legal hold for audit_logs

```

---

# Related Documents

- logical-model.md
- foundation-db-v1.md
- foundation-db-backlog.md
- physical-model-v1.md
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- ADR-006
- ADR-007
- ADR-008
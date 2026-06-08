# BigFana Current Schema

## Purpose

This document describes the current state of the BigFana database.

This document represents the current Neon implementation as Foundation Database v1 migrations progress.

Future target architecture is documented in:

- foundation-db-v1.md
- physical-model-v1.md

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

Events

Integrations
```

---

# Authentication

## Tables

```txt
user

account

session
```

---

## Purpose

Authentication and user session management.

---

## Relationships

```txt
account.user_id
    → user.id

session.user_id
    → user.id
```

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

## Observations

Current implementation assumes organizations are the primary tenant boundary.

`organizations.sport` remains a legacy free-text field pending migration to the `sports` catalog.

This remains aligned with Foundation Database v1.

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
id UUID PK

first_name TEXT

last_name TEXT

display_name TEXT NOT NULL

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

---

### Lifecycle

```txt
status fan_status NOT NULL DEFAULT active
```

Allowed values:

```txt
active

inactive

suspended

archived
```

---

### Deprecated Columns

```txt
organization_id UUID FK NOT NULL

country TEXT
```

```txt
organization_id → use fan_organizations (contract phase removal)

country         → use country_code (contract phase removal)
```

---

### Operational Columns

```txt
external_id TEXT

segment TEXT

tier TEXT

engagement_score INTEGER NOT NULL DEFAULT 0

eep_contact_id TEXT

eep_sync_status eep_sync_status NOT NULL DEFAULT pending

eep_last_sync_at TIMESTAMPTZ

eep_last_error TEXT

created_at TIMESTAMPTZ NOT NULL

updated_at TIMESTAMPTZ NOT NULL
```

---

### Constraints

```txt
fans_country_code_check
    country_code IS NULL OR ISO 3166-1 alpha-2 (^[A-Z]{2}$)
```

---

### Indexes

```txt
fans_email_normalized_unique_idx
    UNIQUE ON lower(trim(email))
    WHERE email IS NOT NULL

idx_fans_email

idx_fans_org
```

---

### Relationships

```txt
fans.organization_id
    → organizations.id (DEPRECATED)

Referenced by fan_organizations, fan_sports, fan_competitions,
campaign_responses, fan_events, fan_points_ledger
```

---

### Observations

Migration 006 backfilled `country_code = 'AR'` from legacy `country` values matching Argentina variants. Legacy `country` values were not modified.

Application layer (Drizzle) may lag Neon until schema and services are updated.

Defined by:

```txt
ADR-001

ADR-002

Migration 006
```

---

## fan_organizations

Relationship between fans and organizations.

---

### Columns

```txt
id UUID PK

fan_id UUID FK

organization_id UUID FK

relationship_type VARCHAR(20)

is_primary BOOLEAN

joined_at TIMESTAMP

metadata JSONB

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

### relationship_type

```txt
PRIMARY

FOLLOWING
```

---

### Relationships

```txt
fan_id
    → fans.id

organization_id
    → organizations.id
```

---

### Observations

Source of truth for primary and followed organizations. Migrated from legacy `fans.organization_id` in Migration 001.

Defined by:

```txt
ADR-001

ADR-002

Migration 001
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

## Columns

```txt
id UUID PK

name TEXT UNIQUE

slug TEXT UNIQUE

is_active BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP
```

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

## Columns

```txt
id UUID PK

sport_id UUID FK

name TEXT

slug TEXT UNIQUE

competition_type TEXT

country_code TEXT

is_active BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP
```

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

No seed data — catalog starts empty (validated: 0 rows).

Supported competition types:

```txt
INTEGRATED

MANAGED
```

Defined by:

```txt
ADR-004

ADR-005

Migration 003
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

## Columns

```txt
id UUID PK

competition_id UUID FK

organization_id UUID FK

joined_at TIMESTAMP

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## Constraints

```txt
competition_organizations_competition_fk
    competition_id → competitions.id (ON DELETE RESTRICT)

competition_organizations_organization_fk
    organization_id → organizations.id (ON DELETE RESTRICT)

competition_organizations_unique_membership
    UNIQUE (competition_id, organization_id)
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

No seed data — validated: 0 rows.

Defined by:

```txt
ADR-004

Migration 004
```

---

# Campaigns

## Tables

```txt
campaigns

campaign_questions

campaign_options

campaign_responses
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
integration_jobs
```

---

## Purpose

Stores asynchronous integration tasks.

---

## Relationships

```txt
integration_jobs.organization_id
    → organizations.id
```

---

## Observations

Current implementation aligns with:

```txt
BigFana
    ↓
Events
    ↓
Integration Jobs
    ↓
EEP
```

Defined by:

```txt
eep-architecture.md
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

`sponsor_competitions` deferred to future 010b or Migration 012.

Defined by:

```txt
Pre-Foundation campaign engine
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

EEP Integration Foundation
```

which aligns strongly with BigFana's Phase 1 roadmap.

---

# Known Limitations

Current schema does not yet support:

```txt
Matches

Standings

Benefit eligibility and usage tracking

EEP Audiences

EEP Segments
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
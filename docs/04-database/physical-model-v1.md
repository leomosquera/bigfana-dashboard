# BigFana Physical Model v1

## Purpose

This document defines the physical database model for Foundation Database v1.

The objective is to establish:

- tables
- relationships
- ownership
- foreign keys
- indexes
- multi-tenant boundaries

### How to read this document

Sections may describe one of:

```txt
Current Foundation physical state  — what is live in Neon after Migrations 001–019
Target / future model              — intended evolution not yet fully realized in Neon
Deferred fields                    — planned columns not present in Neon today
Historical notes                   — retired structures (must not be treated as current)
```

For **authoritative live column/type inventory**, prefer:

```txt
docs/04-database/current-schema.md
```

Canonical relationships (current and target — COMPLETE):

```txt
fan
  → fan_organizations
    → organization

organization
  → competition_organizations
    → competitions
      → sports
```

Legacy ownership (`fans.organization_id`) and free-text org sport (`organizations.sport`) are **not** canonical. Both are physically removed.

This document remains a design reference for future migrations; it is not automatically rewritten whenever Neon differs on deferred branding fields.

---

# Design Principles

The database must support:

```txt
Multi-Tenant

Multi-Sport

Multi-Competition

Global Fan Model

EEP Integration

Future Global Community
```

---

# Core Architecture

The platform is organized into the following domains:

```txt
Organizations

Users

Fans

Competitions

Campaigns

Loyalty

Sponsors

Content

EEP

Integrations

Audit
```

---

# Organizations Domain

## organizations

Purpose:

Stores clubs, leagues, federations, national teams and sports organizations.

---

### Current Foundation physical state (Neon)

Live columns after Migration 019:

```txt
id UUID PK

name TEXT NOT NULL

slug TEXT NOT NULL UNIQUE
  -- Neon unique constraint/index name: organizations_slug_key

brand_color TEXT

logo_url TEXT

favicon_url TEXT

country TEXT

timezone TEXT

is_active BOOLEAN NOT NULL DEFAULT true

created_at TIMESTAMP WITHOUT TIME ZONE

updated_at TIMESTAMP WITHOUT TIME ZONE
```

Canonical sport / competition context (no org-level sport column):

```txt
organization
  → competition_organizations
  → competitions
  → sports
```

```txt
organizations.sport      — REMOVED (Migration 019b COMPLETE)
organizations.sport_id   — ABSENT (never introduced)
```

---

### Target / deferred fields (not live in Neon)

These appear in earlier target drafts and may be introduced by a future approved migration if product requires them. They are **not** current:

```txt
description TEXT          — deferred

country_code TEXT         — deferred / prefer evolution of `country` if needed

organizations_slug_idx    — naming target; live unique is organizations_slug_key
```

Do not document these deferred fields as if they already exist in Neon.

---

# Users Domain

## users

Purpose:

Administrative users.

---

### Columns

```txt
id UUID PK

name TEXT

email TEXT UNIQUE

is_active BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

## memberships

Purpose:

Connect users to organizations.

---

### Columns

```txt
id UUID PK

user_id UUID FK

organization_id UUID FK

role TEXT

created_at TIMESTAMP
```

---

### Relationships

```txt
user_id
    → users.id

organization_id
    → organizations.id
```

---

# Fan Domain

Defined by:

```txt
ADR-001

ADR-002
```

---

## fans

Purpose:

Global platform fan identity and declarative profile.

A fan exists independently from organizations.

There is no separate `fan_profiles` table. Organization relationships are stored in `fan_organizations`.

---

### Core Identity

```txt
id UUID PK

first_name TEXT

last_name TEXT

display_name TEXT

email TEXT
```

`display_name` is derived from `first_name` and `last_name` and persisted at write time for search and display compatibility.

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

`country_code` uses ISO 3166-1 alpha-2 (nullable; CHECK `fans_country_code_check`: NULL OR `^[A-Z]{2}$`).

It is the sole current fan geographic field. Legacy free-text `fans.country` was **PHYSICALLY REMOVED** (unnumbered Legacy Fan Country Physical Removal — COMPLETE). Do not reintroduce it.

---

### Lifecycle

```txt
status TEXT
```

Allowed values align with the current Neon implementation:

```txt
active

inactive

suspended

archived
```

---

### Legacy ownership — PHYSICALLY REMOVED

```txt
fans.organization_id          — REMOVED (Migration 018b COMPLETE)
fans_organization_id_fkey     — REMOVED (Migration 018b COMPLETE)
idx_fans_org                  — REMOVED (Migration 018b COMPLETE)
```

Current physical model:

```txt
fans                 = global fan identity only (ADR-001)
fan_organizations    = sole authoritative fan↔organization relationship
                       (PRIMARY / FOLLOWING — ADR-002 / ADR-009)
```

Historical path (not current state):

```txt
Migration 017  — COMMENT deprecation
Migration 018a — omit-safe NULLABLE
Application F2 — stop projection write + remove Drizzle mapping
Migration 018b — physical DROP (executed and validated in Neon)
```

ADR-009 contract phase COMPLETE.

Migration 019 COMPLETE: Foundation minimum competitions + memberships established; Application/Drizzle cutover COMPLETE; `organizations.sport` physically REMOVED (019b). Canonical sport context is derived via `competition_organizations → competitions → sports`. No `organizations.sport_id`.

---

### Timestamps

```txt
created_at TIMESTAMP

updated_at TIMESTAMP
```

---

### Indexes

```txt
fans_email_normalized_unique_idx
    UNIQUE
    ON lower(trim(email))
    WHERE email IS NOT NULL
```

Canonical global email uniqueness index. Active in Neon (pre-Migration 006 baseline).

Legacy indexes:

```txt
idx_fans_email
```

`idx_fans_org` was removed by Migration 018b (COMPLETE).

---

### Notes

The current Neon/Drizzle implementation also includes operational columns used by the dashboard and EEP integration:

```txt
external_id

segment

tier

engagement_score

eep_contact_id

eep_sync_status

eep_last_sync_at

eep_last_error
```

These columns are not part of the declarative fan profile. Relocation of organization-scoped or EEP-owned fields belongs to future migrations.

---

## fan_organizations

Purpose:

Relationship between fans and organizations.

---

### Columns

```txt
id UUID PK

fan_id UUID FK

organization_id UUID FK

relationship_type TEXT

is_primary BOOLEAN

joined_at TIMESTAMP

created_at TIMESTAMP
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

### Indexes

```txt
fan_organizations_fan_idx

fan_organizations_org_idx

fan_organizations_primary_idx
```

---

# Sports Domain

Defined by:

```txt
ADR-004
```

---

## sports

Purpose:

Sports catalog.

---

### Columns

```txt
id UUID PK

name TEXT

slug TEXT UNIQUE

is_active BOOLEAN

created_at TIMESTAMP
```

---

## competitions

Purpose:

Competition catalog.

---

### Columns

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

### competition_type

Allowed values:

```txt
INTEGRATED

MANAGED
```

Defined by:

```txt
ADR-005
```

---

### country_code

ISO 3166-1 alpha-2.

Nullable.

Examples:

```txt
AR

MX

US

BR

ES
```

Use `NULL` for international competitions.

Examples:

```txt
UEFA Champions League

Copa Libertadores
```

---

### Relationships

```txt
sport_id
    → sports.id
```

---

### Migration 003 Scope

Migration 003 introduces:

```txt
competitions
```

only.

Migration 003 does not introduce:

```txt
competition_organizations

fan_competitions

seasons

matches
```

Those belong to later migrations.

---

## competition_organizations

Purpose:

Organizations participating in competitions.

---

### Columns

```txt
id UUID PK

competition_id UUID FK

organization_id UUID FK

joined_at TIMESTAMP
```

---

### Relationships

```txt
competition_id
    → competitions.id

organization_id
    → organizations.id
```

---

# Fan Interests Domain

## fan_sports

Purpose:

Sports followed by fans.

---

### Columns

```txt
id UUID PK

fan_id UUID FK

sport_id UUID FK
```

---

## fan_competitions

Purpose:

Competitions followed by fans.

---

### Columns

```txt
id UUID PK

fan_id UUID FK

competition_id UUID FK
```

---

# Campaign Domain

Existing domain preserved.

---

## campaigns

---

### Columns

```txt
id UUID PK

organization_id UUID FK

name TEXT

description TEXT

campaign_type TEXT

status TEXT

starts_at TIMESTAMP

ends_at TIMESTAMP

created_at TIMESTAMP
```

---

## campaign_questions

---

### Columns

```txt
id UUID PK

campaign_id UUID FK

question TEXT

sort_order INTEGER
```

---

## campaign_options

---

### Columns

```txt
id UUID PK

question_id UUID FK

label TEXT

value TEXT

is_correct BOOLEAN
```

---

## campaign_responses

---

### Columns

```txt
id UUID PK

campaign_id UUID FK

question_id UUID FK

option_id UUID FK

fan_id UUID FK

organization_id UUID FK

created_at TIMESTAMP
```

---

# Loyalty Domain

---

## fan_levels

Purpose:

Organization loyalty levels.

---

### Columns

```txt
id UUID PK

organization_id UUID FK

name TEXT

required_points INTEGER

sort_order INTEGER

created_at TIMESTAMP
```

---

## benefits

Purpose:

Permanent fan benefits.

---

### Columns

```txt
id UUID PK

organization_id UUID FK

name TEXT

description TEXT

status TEXT

created_at TIMESTAMP
```

---

## rewards

Purpose:

Organization-owned point-priced redeemable rewards catalog.

---

### Columns

```txt
id UUID PK

organization_id UUID FK NOT NULL

name TEXT NOT NULL

description TEXT

points_required INTEGER NOT NULL

stock INTEGER

status TEXT NOT NULL DEFAULT draft

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

---

### status

```txt
draft

active

paused

archived
```

Default: `draft`

`active` means catalog visibility only — not fan eligibility or balance check.

---

### points_required

```txt
points_required >= 1
```

Free rewards (`0` points) are not supported. Promotional free items belong in `benefits`.

---

### stock

```txt
NULL  → unlimited availability
0     → out of stock (listed but not redeemable)
> 0   → available units remaining
```

```txt
stock IS NULL OR stock >= 0
```

Stock decrement on redemption is application-layer — not enforced by DDL.

---

### Relationships

```txt
organization_id
    → organizations.id ON DELETE RESTRICT
```

---

### Indexes

```txt
rewards_organization_id_idx

rewards_organization_status_idx
```

---

## redemptions

Purpose:

Organization-scoped transactional record of a fan claiming a reward.

---

### Columns

```txt
id UUID PK

organization_id UUID FK NOT NULL

fan_id UUID FK NOT NULL

reward_id UUID FK NOT NULL

status TEXT NOT NULL DEFAULT pending

points_cost INTEGER NOT NULL

redeemed_at TIMESTAMP NOT NULL

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

---

### status

```txt
pending

approved

fulfilled

rejected

cancelled
```

Default: `pending`

Status transitions are enforced at the application layer. Terminal statuses: `fulfilled`, `rejected`, `cancelled`.

---

### points_cost

Snapshot of `rewards.points_required` at claim time.

```txt
points_cost >= 1
```

Application copies `rewards.points_required` on insert. Catalog values may change after redemption is recorded.

---

### redeemed_at

Fan submission timestamp. Default `NOW()` on insert.

---

### Relationships

```txt
organization_id
    → organizations.id ON DELETE RESTRICT

fan_id
    → fans.id ON DELETE RESTRICT

reward_id
    → rewards.id ON DELETE RESTRICT
```

Tenant invariant (application-layer): `redemptions.organization_id` must equal `rewards.organization_id`.

---

### Indexes

```txt
redemptions_organization_redeemed_at_idx
    ON (organization_id, redeemed_at)

redemptions_organization_status_idx
    ON (organization_id, status)

redemptions_fan_id_idx
    ON (fan_id)

redemptions_reward_id_idx
    ON (reward_id)

redemptions_organization_fan_idx
    ON (organization_id, fan_id)
```

---

## fan_points_ledger

Purpose:

Point transaction history.

---

### Columns

```txt
id UUID PK

fan_id UUID FK

organization_id UUID FK

fan_event_id UUID FK

points INTEGER

reason TEXT

created_at TIMESTAMP
```

---

# Sponsor Domain

---

## sponsors

Purpose:

Global sponsor catalog.

---

### Columns

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

### status

```txt
draft

active

paused

archived
```

Default: `draft`

`active` means catalog visibility only — not org partnership validity.

---

### slug

```txt
sponsors_slug_unique
    UNIQUE INDEX ON lower(slug)
```

Case-insensitive canonical slug enforcement. No table-level `UNIQUE (slug)` constraint.

---

### Relationships

```txt
Referenced by sponsor_organizations
```

---

### Notes

Global entity — no `organization_id`.

No seed data in Migration 010.

---

## sponsor_organizations

Purpose:

Sponsor relationships with organizations.

---

### Columns

```txt
id UUID PK

sponsor_id UUID FK NOT NULL

organization_id UUID FK NOT NULL

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

---

### Relationships

```txt
sponsor_id
    → sponsors.id ON DELETE RESTRICT

organization_id
    → organizations.id ON DELETE RESTRICT
```

---

### Constraints

```txt
sponsor_organizations_unique_membership
    UNIQUE (sponsor_id, organization_id)
```

---

### Indexes

```txt
sponsor_organizations_sponsor_idx

sponsor_organizations_organization_idx
```

---

### Notes

No `starts_at` / `ends_at` in Migration 010 — deferred.

One row per sponsor–organization pair.

---

## sponsor_competitions

Purpose:

Sponsor relationships with competitions.

Status:

```txt
Deferred — not executed in Migration 010
```

Target anchor: future 010b.

---

### Columns

```txt
id UUID PK

sponsor_id UUID FK

competition_id UUID FK

starts_at TIMESTAMP

ends_at TIMESTAMP
```

---

## sponsor_ads

Purpose:

Advertising assets.

Status:

```txt
Pre-Foundation — sponsor_id FK not yet applied in Neon
```

---

### Columns (executed — Neon)

```txt
id UUID PK

organization_id UUID FK

sponsor_name TEXT NOT NULL

title TEXT

description TEXT

image_url TEXT

destination_url TEXT

priority INTEGER

segment_rules JSONB

status TEXT

metadata JSONB

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

### Columns (target — post reconciliation)

```txt
sponsor_id UUID FK

organization_id UUID FK

title TEXT

image_url TEXT

destination_url TEXT

status TEXT
```

---

# Content Domain

---

## content

Purpose:

Organization-owned publishable content for fan engagement.

Status:

```txt
Executed — Migration 011
```

---

### Columns

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

### content_type

```txt
news

article

announcement

video

match_update
```

Enforced by `content_content_type_check`.

`match_update` is semantic only — no `match_id` FK (deferred past Migration 012).

---

### status (publication lifecycle)

```txt
draft

published

paused

archived
```

Default: `draft`

Publication-oriented lifecycle — not catalog `active` (007–010).

`published` means fan-visible when application rules allow.

---

### published_at

```txt
NULL while draft
Set by application on first publish
No DB CHECK enforcing published_at when status = published
```

---

### slug

```txt
content_slug_unique
    UNIQUE INDEX ON (organization_id, lower(slug))
```

Organization-scoped, case-insensitive canonical slug. No table-level `UNIQUE (slug)`.

---

### Relationships

```txt
organization_id
    → organizations.id ON DELETE RESTRICT
```

---

### Indexes

```txt
content_organization_idx

content_organization_status_idx

content_slug_unique

content_organization_content_type_idx
```

---

### Notes

Organization-owned — all queries must filter by `organization_id`.

No taxonomy, campaign, sponsor, match, scheduling, or media FKs in Migration 011.

No seed data in Migration 011.

---

## Content Taxonomy (Deferred)

Status:

```txt
Not executed — target for Migration 011b
```

---

### Target: content_categories

```txt
id UUID PK

organization_id UUID FK

name TEXT

slug TEXT
```

Org-scoped taxonomy — to be confirmed in 011b design brief.

---

### Target: content_tags

```txt
id UUID PK

organization_id UUID FK

name TEXT

slug TEXT
```

---

### Target: assignment pivots

```txt
content_category_assignments

content_tag_assignments
```

Taxonomy ships with assignment model — not before (Foundation principle).

---

# Competition Operations

Defined by:

```txt
ADR-005

Migration 012 — Match Center Foundation
```

Status:

```txt
Executed and validated in Neon
```

Ownership:

```txt
Competitions own seasons.
Seasons own matches and standings.
season_id is the single source of truth for competition ownership
on matches and standings (no denormalized competition_id).
```

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

### Notes

Case-insensitive unique name per competition: `(competition_id, lower(name))`.

---

## divisions

Status:

```txt
Deferred — not executed in Migration 012
```

Reason:

```txt
Competition Structure requires a future ADR
(divisions vs stages vs conferences vs groups vs brackets).
Migration 012 intentionally avoids freezing this abstraction.
```

### Columns (sketch — not executed)

```txt
id UUID PK

competition_id UUID FK

name TEXT

sort_order INTEGER
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

### Notes

No `competition_id` column — competition derived via `season_id → seasons`.

Fixtures are represented by this table (no separate `fixtures` table).

No venue columns.

Status values: `scheduled`, `live`, `finished`, `postponed`, `cancelled`.

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

### Notes

No `competition_id` column — competition derived via `season_id → seasons`.

Persisted snapshots only — never calculated in SQL.

Unique `(season_id, organization_id)`.

`organization_id` is a participant reference, not a tenant root.

---

# EEP Domain

Defined by:

```txt
ADR-003

ADR-007
```

---

## audiences

Purpose:

EEP audience cache (platform-scoped).

Status:

```txt
Executed and validated in Neon — Migration 013
```

---

### Columns

```txt
id UUID PK

eep_id TEXT NOT NULL

name TEXT NOT NULL

description TEXT

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Notes

No `organization_id` (ADR-007).

`eep_id` is globally unique, stable, and never reused.

No retirement state columns in Migration 013.

`updated_at` is maintained by the application during successful synchronization (no DB trigger).

Unique index: `audiences_eep_id_unique` ON `(eep_id)`.

---

## segments

Purpose:

EEP segment cache (platform-scoped).

Status:

```txt
Executed and validated in Neon — Migration 014
```

Defined by:

```txt
ADR-003

ADR-008
```

---

### Columns

```txt
id UUID PK

eep_id TEXT NOT NULL

name TEXT NOT NULL

description TEXT

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Notes

No `organization_id` (ADR-008).

`id` is a BigFana surrogate key only.  
`eep_id` is the canonical external synchronization identifier — globally unique, stable, never reused.

No retirement state columns in Migration 014.

`updated_at` is maintained by the application during successful synchronization (no DB trigger).

Unique index: `segments_eep_id_unique` ON `(eep_id)`.

---

## fan_audiences

Purpose:

EEP audience membership cache (platform-scoped).

Status:

```txt
Executed and validated in Neon — Migration 013
```

---

### Columns

```txt
id UUID PK

fan_id UUID FK NOT NULL

audience_id UUID FK NOT NULL

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Notes

No `organization_id`.

UNIQUE `(fan_id, audience_id)`.

FKs ON DELETE RESTRICT → `fans`, `audiences`.

---

## fan_segments

Purpose:

EEP segment membership cache (platform-scoped).

Status:

```txt
Executed and validated in Neon — Migration 014
```

---

### Columns

```txt
id UUID PK

fan_id UUID FK NOT NULL

segment_id UUID FK NOT NULL

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Notes

No `organization_id`.

UNIQUE `(fan_id, segment_id)`.

FKs ON DELETE RESTRICT → `fans`, `segments`.

---

## Existing Segmentation Rules

Purpose:

Business-defined segmentation criteria.

---

### Existing Table

```txt
fan_segment_rules
```

---

### Ownership

```txt
BigFana
```

---

### Notes

These rules define segmentation criteria.

They do not represent EEP segments.

EEP remains the owner of:

```txt
segments

audiences
```

---

# Events Domain

---

## fan_events

Purpose:

Behavioral event store.

---

### Columns

```txt
id UUID PK

fan_id UUID FK

organization_id UUID FK

event_type TEXT

payload JSONB

created_at TIMESTAMP
```

---

# Integration Domain

---

## integrations

Purpose:

Organization-owned provider enablement registry.

Status:

```txt
Executed and validated in Neon — Migration 015
```

---

### Columns

```txt
id UUID PK

organization_id UUID FK NOT NULL

provider TEXT NOT NULL

status TEXT NOT NULL DEFAULT draft

created_at TIMESTAMP NOT NULL

updated_at TIMESTAMP NOT NULL
```

### Notes

Exactly one row per `(organization_id, provider)`, regardless of lifecycle state.

Lifecycle transitions UPDATE that row; never INSERT a second row for the same pair.

Provider CHECK in Foundation v1: `'eep'` only (platform vocabulary; widen via future expand-only migration).

Status values: `draft`, `active`, `paused`, `archived`.

FK `organization_id` → `organizations.id` ON DELETE RESTRICT.

Conceptual 1:N with `integration_jobs`; physical `integration_id` FK deferred.

Logical job association: `(organization_id, provider)`.

---

## integration_jobs

Purpose:

Asynchronous integration processing.

Status:

```txt
Pre-existing — unchanged by Migration 015
```

---

### Columns (live shape — reference)

```txt
id UUID PK

organization_id UUID FK

entity_type TEXT

entity_id UUID

provider TEXT

operation TEXT

payload JSONB

status TEXT

attempts INTEGER

max_attempts INTEGER

next_retry_at TIMESTAMP

last_error TEXT

processed_at TIMESTAMP

idempotency_key TEXT UNIQUE

created_at TIMESTAMP

updated_at TIMESTAMP
```

### Notes

No `integration_id` FK in Foundation v1 (deferred).

Supports async / retryable / idempotent sync (ADR-003).

Lifecycle history for registry enablement decisions is recorded in `audit_logs` (Migration 016), not on `integrations` or `integration_jobs`.

---

# Audit Domain

---

## audit_logs

Purpose:

Append-only dual-scope business audit trail for security-significant governance decisions.

Status:

```txt
Executed and validated in Neon — Migration 016
```

---

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

### Notes

Dual-scope: org events set `organization_id`; platform events leave it NULL (never invent artificial organization context).

Actor (who) and Origin (where) are distinct dimensions. `actor_id` / `origin_id` are UUID soft references with no foreign keys.

`entity_id` is the canonical BigFana primary key UUID of the audited entity (stable for entity lifetime).

`entity_type` is open TEXT; every emitted value must be documented in the platform canonical entity vocabulary.

`metadata` supplements business context only and must never become the authoritative source of current business state.

Business decisions only — not `fan_events`, not `integration_jobs` execution details, not observability logs.

Append-only: no `updated_at`.

FK `organization_id` → `organizations.id` ON DELETE RESTRICT (nullable).

Owns integration registry lifecycle history deferred from Migration 015.

CHECK vocabularies: `actor_type`, `origin_type`, `action` (see Migration 016 Design Brief / SQL).

---

# Multi-Tenant Rules

Organization-owned entities:

```txt
Campaigns

Benefits

Rewards

Content

Integrations

Loyalty

Fan Experiences
```

must always include:

```txt
organization_id
```

Dual-scope governance (nullable `organization_id`):

```txt
audit_logs
```

---

# Global Entities

Global entities do not belong to organizations.

Examples:

```txt
fans

sports

competitions

sponsors

audiences

segments
```

---

# Global Catalog Rules

## Sports

Sport names are globally normalized and stored in English.

UI translations are handled separately.

Examples:

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
```

The database must use a single canonical sport definition regardless of the user's language.

Examples:

```txt
Fútbol
Football
Calcio
Fussball
Soccer
```

must resolve to:

```txt
soccer
```

Likewise:

```txt
Football
NFL Football
American Football
```

must resolve to:

```txt
american-football
```

---

## Competitions

Competition names are stored using their official international name.

Competition slugs are globally unique.

`slug` is the canonical competition identifier.

Examples:

```txt
premier-league

liga-mx

mls

copa-libertadores

uefa-champions-league
```

---

# Related Documents

- current-schema.md
- gap-analysis.md
- foundation-db-v1.md
- foundation-db-backlog.md
- application-architecture.md
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- ADR-006
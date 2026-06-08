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

This document is the source of truth for future database migrations.

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
```

---

# Organizations Domain

## organizations

Purpose:

Stores clubs, leagues, federations, national teams and sports organizations.

---

### Columns

```txt
id UUID PK

name TEXT

slug TEXT UNIQUE

description TEXT

logo_url TEXT

country_code TEXT

is_active BOOLEAN

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

### Indexes

```txt
organizations_slug_idx
```

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

`country_code` uses ISO 3166-1 alpha-2.

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

### Deprecated

```txt
organization_id UUID FK
```

Status:

```txt
DEPRECATED
```

Legacy organization ownership column. Retained during the transition phase.

To be removed during future contract migrations after `fan_organizations` adoption is complete in the application layer.

Do not use for new features. Read organization relationships from `fan_organizations`.

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

Legacy indexes (unchanged):

```txt
idx_fans_email

idx_fans_org
```

`idx_fans_org` supports deprecated `organization_id` queries during the transition phase.

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

name TEXT

slug TEXT UNIQUE

website_url TEXT

logo_url TEXT

status TEXT

created_at TIMESTAMP
```

---

## sponsor_organizations

Purpose:

Sponsor relationships with organizations.

---

### Columns

```txt
id UUID PK

sponsor_id UUID FK

organization_id UUID FK

starts_at TIMESTAMP

ends_at TIMESTAMP
```

---

## sponsor_competitions

Purpose:

Sponsor relationships with competitions.

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

---

### Columns

```txt
id UUID PK

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

Organization content.

---

### Columns

```txt
id UUID PK

organization_id UUID FK

title TEXT

slug TEXT

content_type TEXT

body TEXT

status TEXT

published_at TIMESTAMP
```

---

## content_categories

---

### Columns

```txt
id UUID PK

name TEXT

slug TEXT
```

---

## content_tags

---

### Columns

```txt
id UUID PK

name TEXT

slug TEXT
```

---

# Competition Operations

Defined by:

```txt
ADR-005
```

---

## seasons

### Columns

```txt
id UUID PK

competition_id UUID FK

name TEXT

starts_at DATE

ends_at DATE
```

---

## divisions

### Columns

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

competition_id UUID FK

season_id UUID FK

home_organization_id UUID FK

away_organization_id UUID FK

starts_at TIMESTAMP

status TEXT

home_score INTEGER

away_score INTEGER
```

---

## standings

### Columns

```txt
id UUID PK

competition_id UUID FK

season_id UUID FK

organization_id UUID FK

played INTEGER

won INTEGER

drawn INTEGER

lost INTEGER

points INTEGER
```

---

# EEP Domain

Defined by:

```txt
ADR-003
```

---

## audiences

Purpose:

EEP audience cache.

---

### Columns

```txt
id UUID PK

eep_id TEXT

name TEXT

description TEXT

updated_at TIMESTAMP
```

---

## segments

Purpose:

EEP segment cache.

---

### Columns

```txt
id UUID PK

eep_id TEXT

name TEXT

description TEXT

updated_at TIMESTAMP
```

---

## fan_audiences

### Columns

```txt
id UUID PK

fan_id UUID FK

audience_id UUID FK
```

---

## fan_segments

### Columns

```txt
id UUID PK

fan_id UUID FK

segment_id UUID FK
```

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

Integration registry.

---

### Columns

```txt
id UUID PK

organization_id UUID FK

provider TEXT

status TEXT

created_at TIMESTAMP
```

---

## integration_jobs

Purpose:

Asynchronous integration processing.

---

### Columns

```txt
id UUID PK

organization_id UUID FK

integration_id UUID FK

job_type TEXT

payload JSONB

status TEXT

attempts INTEGER

created_at TIMESTAMP
```

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
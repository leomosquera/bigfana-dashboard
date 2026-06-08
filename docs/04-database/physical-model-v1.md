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

Global platform fan profile.

A fan exists independently from organizations.

---

### Columns

```txt
id UUID PK

first_name TEXT

last_name TEXT

email TEXT

phone TEXT

country_code TEXT

birth_date DATE

avatar_url TEXT

created_at TIMESTAMP

updated_at TIMESTAMP
```

---

### Indexes

```txt
fans_email_idx
```

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

type TEXT

country_code TEXT

is_active BOOLEAN

created_at TIMESTAMP
```

---

### type

```txt
INTEGRATED

MANAGED
```

---

### Relationships

```txt
sport_id
    → sports.id
```

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

Redeemable rewards.

---

### Columns

```txt
id UUID PK

organization_id UUID FK

name TEXT

description TEXT

points_required INTEGER

stock INTEGER

status TEXT

created_at TIMESTAMP
```

---

## redemptions

Purpose:

Reward redemption history.

---

### Columns

```txt
id UUID PK

reward_id UUID FK

fan_id UUID FK

organization_id UUID FK

status TEXT

redeemed_at TIMESTAMP
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
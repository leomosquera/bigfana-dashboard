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

Sports

Campaigns

Loyalty

Sponsors

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
```

---

## Purpose

Stores fan profiles.

---

## Relationships

```txt
fans.organization_id
    → organizations.id
```

Referenced by:

```txt
campaign_responses

fan_events

fan_points_ledger
```

---

## Observations

Current implementation is transitioning from:

```txt
fans.organization_id
```

to:

```txt
fan_organizations
```

Both models currently coexist.

Legacy model:

```txt
One Fan
    ↓
One Organization
```

Foundation Database v1 model:

```txt
One Fan
    ↓
Many Organizations
```

supported through:

```txt
fan_organizations
```

Future development must use:

```txt
fan_organizations
```

as the source of truth.

Defined by:

```txt
ADR-001

ADR-002
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
```

---

## Purpose

Stores loyalty progression and point transactions.

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
```

---

## Observations

Current implementation provides a strong foundation for:

```txt
Points

Levels

Rewards

Benefits
```

Future loyalty modules will expand this area.

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
sponsor_ads

campaign_ads
```

---

## Purpose

Stores sponsor advertisements and campaign associations.

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

The sponsor domain exists but remains incomplete.

Future architecture introduces:

```txt
sponsors

sponsor_organizations
```

---

# Current Strengths

The current schema already provides:

```txt
Organizations

Fans

Fan Organization Relationships

Sports Catalog

Campaigns

Events

Points

Levels

EEP Integration Foundation
```

which aligns strongly with BigFana's Phase 1 roadmap.

---

# Known Limitations

Current schema does not yet support:

```txt
Competitions

Competition Organizations

Matches

Standings

Rewards

Benefits

Sponsors Domain

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
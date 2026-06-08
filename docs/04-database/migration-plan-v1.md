# BigFana Migration Plan v1

## Purpose

This document defines the migration strategy from the current Neon schema to Foundation Database v1.

The objective is to:

- minimize risk
- avoid breaking existing functionality
- preserve production data
- enable incremental evolution

This document is the execution plan for database evolution.

---

# Migration Principles

All migrations must follow these rules:

```txt
Backward Compatible

Incremental

Reversible When Possible

Documented

Approved Before Execution
```

No migration should remove existing structures until replacement structures are fully adopted.

---

# Migration Strategy

The migration strategy follows three phases:

```txt
Expand

Migrate

Contract
```

---

## Expand

Create new tables and structures.

Existing functionality continues operating.

---

## Migrate

Move data and application logic.

Validate consistency.

---

## Contract

Remove deprecated structures only after validation.

---

# Migration 001

## Fan Organization Model

Defined by:

```txt
ADR-001

ADR-002
```

---

## Objective

Introduce support for:

```txt
Primary Organization

Followed Organizations

Global Fan Model
```

without breaking existing fan functionality.

---

## Create

```txt
fan_organizations
```

---

## Data Migration

Backfill:

```txt
fans.organization_id
```

into:

```txt
fan_organizations
```

with:

```txt
relationship_type = PRIMARY

is_primary = true
```

---

## Application Changes

Update services to read:

```txt
fan_organizations
```

instead of:

```txt
fans.organization_id
```

---

## Deprecation

Mark:

```txt
fans.organization_id
```

as deprecated.

Do not remove yet.

---

# Migration 002

## Sports Catalog

Defined by:

```txt
ADR-004
```

---

## Objective

Introduce sport hierarchy.

---

## Create

```txt
sports
```

---

## Initial Seed

Examples:

```txt
### Canonical Seed

| Name | Slug |
|--------|--------|
| Soccer | soccer |
| American Football | american-football |
| Basketball | basketball |
| Rugby | rugby |
| Volleyball | volleyball |
| Tennis | tennis |
| Padel | padel |
| Golf | golf |
| Motorsports | motorsports |
| Esports | esports |
| Other | other |
```

---

# Migration 003

## Competitions

Defined by:

```txt
ADR-004

ADR-005
```

---

## Objective

Introduce competition hierarchy.

---

## Create

```txt
competitions
```

---

## Supported Types

```txt
INTEGRATED

MANAGED
```

---

# Migration 004

## Competition Organizations

Defined by:

```txt
ADR-004

ADR-005
```

---

## Objective

Allow organizations to participate in multiple competitions.

---

## Create

```txt
competition_organizations
```

---

# Migration 005

## Fan Interests

Defined by:

```txt
ADR-006
```

---

## Objective

Allow fans to follow sports and competitions.

---

## Create

```txt
fan_sports

fan_competitions
```

---

# Migration Numbering Rationale

Migrations 001–005 established the global fan relationship and interest model.

Migration 006 introduces **Fan Profile Foundation** before loyalty catalog work because:

```txt
fans is the canonical identity and declarative profile entity

No fan_profiles table will be introduced

Benefits and rewards require a stable global fan profile

Fan onboarding fields must be aligned before loyalty expansion
```

Benefits, rewards, and redemptions shift to Migrations 007–009 accordingly.

---

# Migration 006

## Fan Profile Foundation

Defined by:

```txt
ADR-001

ADR-002
```

---

## Objective

Evolve the existing `fans` table toward the Foundation v1 fan profile model.

Establish a complete global fan identity and declarative profile on `fans` without introducing a separate profile table.

---

## Scope

Expand-only changes to `fans`:

```txt
avatar_url

country_code

country_code backfill (Argentina → AR)

deprecation documentation
```

### Neon Baseline (Already Enforced)

Normalized email uniqueness is **already active in Neon** and is not Migration 006 DDL:

```txt
fans_email_normalized_unique_idx
    UNIQUE ON lower(trim(email))
    WHERE email IS NOT NULL
```

Align existing profile fields with the physical model:

```txt
Core Identity
    first_name
    last_name
    display_name
    email

Profile
    phone
    birth_date
    gender
    city
    country_code
    avatar_url

Lifecycle
    status
```

---

## Data Migration

Backfill legacy `country` values to `country_code` where applicable.

Approved backfill:

```txt
Argentina variants → AR
```

Legacy `country` column retained and deprecated. Do not drop in Migration 006.

---

## Deprecation

Document as deprecated (no DDL removal in Migration 006):

```txt
fans.organization_id   → use fan_organizations

fans.country           → use country_code
```

Removal of `fans.organization_id` belongs to the future contract phase after application adoption of `fan_organizations` is complete.

---

## Out of Scope

```txt
fan_profiles table

DROP or RENAME of fans.organization_id

benefits

rewards

redemptions

fan authentication linkage

relocation of segment, tier, or engagement_score

email uniqueness index (already active in Neon)
```

---

## Application Changes

Update Drizzle schema and documentation to reflect the evolved fan profile model.

Plan application cutover from `fans.organization_id` to `fan_organizations` as a parallel track.

---

# Migration 007

## Benefits

---

## Objective

Introduce organization benefit catalog.

---

## Create

```txt
benefits
```

---

## Future Usage

```txt
Discounts

Priority Access

Exclusive Content

Sponsor Benefits
```

---

# Migration 008

## Rewards

---

## Objective

Introduce reward catalog.

---

## Create

```txt
rewards
```

---

## Future Usage

```txt
Merchandise

Tickets

Experiences

Digital Rewards
```

---

# Migration 009

## Redemptions

---

## Objective

Track reward redemption lifecycle.

---

## Create

```txt
redemptions
```

---

## Supported Statuses

```txt
PENDING

APPROVED

DELIVERED

REJECTED

CANCELLED
```

---

# Migration 010

## Sponsor Domain

---

## Objective

Introduce sponsor ownership model.

---

## Create

```txt
sponsors

sponsor_organizations

sponsor_competitions
```

---

## Existing Tables

Review:

```txt
sponsor_ads

campaign_ads
```

for migration.

---

# Migration 011

## Content Platform

---

## Objective

Introduce organization content management.

---

## Create

```txt
content

content_categories

content_tags
```

---

# Migration 012

## Competition Operations

Defined by:

```txt
ADR-005
```

---

## Objective

Support managed competitions.

---

## Create

```txt
seasons

divisions

matches

standings
```

---

# Migration 013

## EEP Audiences

Defined by:

```txt
ADR-003
```

---

## Objective

Store EEP audience cache.

---

## Create

```txt
audiences

fan_audiences
```

---

# Migration 014

## EEP Segments

Defined by:

```txt
ADR-003
```

---

## Objective

Store EEP segment cache.

---

## Create

```txt
segments

fan_segments
```

---

# Migration 015

## Integration Registry

---

## Objective

Formalize integration ownership.

---

## Create

```txt
integrations
```

---

## Review

Existing:

```txt
integration_jobs
```

---

# Migration 016

## Audit Layer

---

## Objective

Introduce platform auditing.

---

## Create

```txt
audit_logs
```

---

# Migration Validation

Every migration must include:

```txt
Schema Validation

Data Validation

Rollback Plan

Documentation Update
```

---

# Documentation Rules

After each completed migration update:

```txt
current-schema.md

gap-analysis.md

foundation-db-backlog.md

PROJECT_STATE.md
```

---

# Completion Criteria

Foundation Database v1 is complete when:

```txt
Global Fan Model

Fan Profile Foundation

Sports Hierarchy

Competition Hierarchy

Benefits

Rewards

Redemptions

Sponsors

Content

EEP Audiences

EEP Segments

Managed Competitions
```

exist and are operational.

---

# Future Contract Phase

## Migration 017

### Deprecate Legacy Fan Ownership

Objective:

Deprecate:

```txt
fans.organization_id
```

after all services use:

```txt
fan_organizations
```

---

## Migration 018

### Remove Legacy Fan Ownership

Objective:

Remove:

```txt
fans.organization_id
```

when no longer referenced by the application.

---

## Migration 019

### Remove Legacy Organization Sport

Objective:

Remove:

```txt
organizations.sport
```

after migration to:

```txt
sports

competitions

competition_organizations
```

---

# Related Documents

- current-schema.md
- gap-analysis.md
- physical-model-v1.md
- foundation-db-v1.md
- foundation-db-backlog.md
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- ADR-006
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
Soccer

American Football

Basketball

Rugby

Volleyball

Tennis

Padel

Golf

Motorsports

Esports

Other
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

# Migration 006

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

# Migration 007

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

# Migration 008

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

# Migration 009

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

# Migration 010

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

# Migration 011

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

# Migration 012

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

# Migration 013

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

# Migration 014

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

# Migration 015

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
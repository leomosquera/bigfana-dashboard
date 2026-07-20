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

## Match Center Foundation

Defined by:

```txt
ADR-005
```

Status:

```txt
Completed — executed and validated in Neon
```

---

## Objective

Support competition-scoped Match Center operations (seasons, fixtures/results, standings).

Managed and Integrated competitions share the same schema.

---

## Created

```txt
seasons

matches

standings
```

---

## Explicitly deferred

```txt
divisions
venues
competition structure (future ADR)
content.match_id
sponsor_competitions
provider / integration metadata
lineups / match events / statistics
```

---

## Ownership note

```txt
season_id is the single source of truth for competition ownership
on matches and standings (no denormalized competition_id)
```

Design brief:

```txt
docs/sessions/2026-07-17-migration-012-match-center-design.md
```

SQL:

```txt
database/migrations/foundation-v1/012_create_match_center.sql
```

---

# Migration 013

## EEP Audiences Foundation

Defined by:

```txt
ADR-003

ADR-007
```

Status:

```txt
Completed — executed and validated in Neon
```

---

## Objective

Store platform-scoped EEP audience cache and fan memberships.

---

## Created

```txt
audiences

fan_audiences
```

---

## Explicitly deferred

```txt
segments / fan_segments          → Migration 014
organization_id on cache tables
audience retirement state
campaign / sponsor activation FKs
integration_jobs changes         → Migration 015
```

Design brief:

```txt
docs/sessions/2026-07-17-migration-013-eep-audiences-design.md
```

SQL:

```txt
database/migrations/foundation-v1/013_create_eep_audiences.sql
```

---

# Migration 014

## EEP Segments Foundation

Defined by:

```txt
ADR-003

ADR-008
```

Status:

```txt
Completed — executed and validated in Neon
```

---

## Objective

Store platform-scoped EEP segment cache and fan memberships.

---

## Created

```txt
segments

fan_segments
```

---

## Explicitly deferred

```txt
organization_id on cache tables
segment retirement state
campaign / sponsor activation FKs
scores / recommendations
integration_jobs changes         → Migration 015
fan_segment_rules changes
```

Design brief:

```txt
docs/sessions/2026-07-17-migration-014-eep-segments-design.md
```

SQL:

```txt
database/migrations/foundation-v1/014_create_eep_segments.sql
```

---

# Migration 015

## Integration Registry Foundation

Status:

```txt
Completed — executed and validated in Neon
```

---

## Objective

Formalize organization-owned provider enablement registry.

---

## Created

```txt
integrations
```

---

## Reviewed (unchanged)

```txt
integration_jobs
```

---

## Explicitly deferred

```txt
integration_id FK on integration_jobs
credentials / connections
sync workers / webhooks
platform-scoped audience/segment sync jobs
audit lifecycle history              → Migration 016
```

Design brief:

```txt
docs/sessions/2026-07-17-migration-015-integration-registry-design.md
```

SQL:

```txt
database/migrations/foundation-v1/015_create_integrations.sql
```

---

# Migration 016

## Audit Layer Foundation

Status:

```txt
Completed — executed and validated in Neon
```

---

## Objective

Introduce append-only dual-scope business audit trail.

---

## Created

```txt
audit_logs
```

---

## Explicitly deferred

```txt
retention / purge / legal hold / SIEM
DB-enforced append-only privileges / RLS
hash-chaining / WORM
credential access auditing
webhook ingress audit
integration_job_id coupling
per-domain history tables
application-layer Drizzle schema changes
```

Design brief:

```txt
docs/sessions/2026-07-17-migration-016-audit-layer-design.md
```

SQL:

```txt
database/migrations/foundation-v1/016_create_audit_logs.sql
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

Integration Registry

Audit Layer

Managed Competitions
```

exist and are operational.

Expand-phase Foundation DDL through Migration 016 is complete. ADR-009 contract phase COMPLETE: Migration 017 / 018a / F2 / 018b COMPLETE.

Migration 019 staged sequence (Remove Legacy Organization Sport):

```txt
019a = Canonical competition data + COMMENT deprecation — COMPLETE
App  = remove organizations.sport from Drizzle / types — COMPLETE
Gate = memberships + derivation + zero consumers — COMPLETE (PASS)
019b = Physical DROP organizations.sport — COMPLETE
Migration 019 = COMPLETE
```

Frozen staged sequence (ADR-009 Option B):

```txt
017  = Deprecation — COMPLETE
018a = Make Legacy Fan Ownership Omit-Safe — COMPLETE
F2   = Stop projection write + remove Drizzle mapping — COMPLETE
018b = Physical removal — COMPLETE
019a = Canonical competition data + COMMENT — COMPLETE
019b = Physical DROP organizations.sport — COMPLETE
```

Post-019 Foundation status:

```txt
Technical Audit verdict:
  B. FOUNDATION DB READY WITH NON-BLOCKING TECHNICAL DEBT

Migration 020:
  NOT STARTED
  NO FROZEN / RESERVED SCOPE

Do not invent Migration 020 to continue numbering.
Open future DDL only when a specific technical-debt item is explicitly prioritized.
```

---

# Future Contract Phase

## Migration 017

### Deprecate Legacy Fan Ownership

Status:

```txt
Completed — executed and validated in Neon
```

Design brief:

```txt
docs/sessions/2026-07-17-migration-017-deprecate-legacy-fan-ownership-design.md
```

SQL:

```txt
database/migrations/foundation-v1/017_deprecate_legacy_fan_ownership.sql
```

Objective:

Deprecate:

```txt
fans.organization_id
```

Ownership contract:

```txt
ADR-009 Legacy Fan Ownership Deprecation Contract
```

Executed scope:

```txt
COMMENT ON COLUMN fans.organization_id only
No DROP / RENAME / structural ALTER
No fan_organizations changes
No idx_fans_org changes
No data mutation / backfill
Validation: divergent=0 (informational only)
```

Rules:

```txt
fan_organizations is sole authoritative relationship
fans.organization_id still physically exists
fans.organization_id is DEPRECATED / non-authoritative
Business commands write only to fan_organizations
Compatibility projection is implementation detail only
Approved consumer defined in ADR-009; consistency while any remain
Migration 017 = deprecation only (no physical DROP)
Physical removal = Migration 018b (staged after 018a + F2)
```

---

## Migration 018a

### Make Legacy Fan Ownership Omit-Safe

Status:

```txt
Completed — executed and validated in Neon
```

Design brief:

```txt
docs/sessions/2026-07-18-migration-018a-make-legacy-fan-ownership-omit-safe-design.md
```

Session summary:

```txt
docs/sessions/2026-07-18-migration-018a-make-legacy-fan-ownership-omit-safe.md
```

SQL:

```txt
database/migrations/foundation-v1/018a_make_legacy_fan_ownership_omit_safe.sql
```

Objective:

Make deprecated `fans.organization_id` omit-safe for staged application cutover
(old app may write projection; new app may omit) against a shared Neon database.

Executed scope:

```txt
ALTER TABLE fans ALTER COLUMN organization_id DROP NOT NULL
  (NOT NULL → NULLABLE only)
No DROP COLUMN
No DROP of fans_organization_id_fkey
No DROP of idx_fans_org
No type change (UUID)
No DEFAULT introduced
Migration 017 DEPRECATED comment retained
No fan_organizations changes
No production data mutation / backfill
No application / Drizzle changes in this migration
```

Validated Neon state:

```txt
fans.organization_id still exists
UUID NULLABLE, no default
fans_organization_id_fkey unchanged (ON DELETE CASCADE)
idx_fans_org unchanged
DEPRECATED comment retained
fan_organizations structurally unchanged
total_fans unchanged (7)
divergent_legacy_vs_primary = 0
old-style INSERT with organization_id succeeds
omit-style INSERT succeeds
validation rows cleaned up
DDL re-execution idempotent
```

Application state after 018a (historical — subsequently completed):

```txt
Compatibility projection writer still active at 018a completion
Drizzle fans.organizationId mapping still present at 018a completion
Later COMPLETE: Application F2 → Gate PASS → Migration 018b physical removal
```

---

## Migration 018b

### Physical Remove Legacy Fan Ownership

Status:

```txt
Completed — executed and validated in Neon
```

Design brief:

```txt
docs/sessions/2026-07-18-migration-018b-remove-legacy-fan-ownership-design.md
```

Session summary:

```txt
docs/sessions/2026-07-18-migration-018b-remove-legacy-fan-ownership.md
```

SQL:

```txt
database/migrations/foundation-v1/018b_remove_legacy_fan_ownership.sql
```

Objective:

Physically remove:

```txt
fans.organization_id
fans_organization_id_fkey
idx_fans_org
```

Executed scope:

```txt
DROP INDEX IF EXISTS idx_fans_org
ALTER TABLE fans DROP CONSTRAINT IF EXISTS fans_organization_id_fkey
ALTER TABLE fans DROP COLUMN IF EXISTS organization_id
No CASCADE
No fan_organizations changes
No application / Drizzle changes in this migration
No Migration 019 / organizations.sport changes
```

Validated Neon state:

```txt
fans.organization_id ABSENT
fans_organization_id_fkey ABSENT
idx_fans_org ABSENT
fan_organizations structurally unchanged
total_fans 7 → 7
fans_with_primary = 7
fans_without_primary = 0
fans_with_multiple_primary = 0
organizations.sport untouched
Idempotent re-execution PASS
Application: tsc / build / Phase B tests PASS
Repository audit: zero runtime ownership reads/writes; zero Drizzle mapping
```

Final ADR-009 contract state:

```txt
fans = global fan identity
fan_organizations = sole authoritative fan↔organization relationship
Legacy ownership projection = RETIRED
ADR-009 contract phase = COMPLETE
```

---

## Migration 019

### Remove Legacy Organization Sport

Status:

```txt
COMPLETE — EXECUTED AND VALIDATED
019a COMPLETE
Application / Drizzle cutover COMPLETE
019b COMPLETE
```

Objective (achieved):

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

### Migration 019a — Canonical Competition Data + Deprecation

Status:

```txt
Completed — executed and validated in Neon
```

SQL:

```txt
database/migrations/foundation-v1/019a_canonical_competition_data.sql
```

Established:

```txt
competitions:
  liga-profesional-argentina (INTEGRATED, AR, soccer)
  liga-mx (INTEGRATED, MX, soccer)

competition_organizations:
  river-plate  → liga-profesional-argentina
  boca-juniors → liga-profesional-argentina
  toluca       → liga-mx

organizations.sport:
  COMMENT DEPRECATED (non-authoritative) at 019a
  physically removed by 019b
```

Canonical sport path:

```txt
organization
  → competition_organizations
  → competitions
  → sports (slug = soccer)
```

### Migration 019b — Physical DROP

Status:

```txt
COMPLETE — executed and validated in Neon
```

SQL:

```txt
database/migrations/foundation-v1/019b_remove_legacy_organization_sport.sql
```

Final physical state:

```txt
organizations.sport     = ABSENT
organizations.sport_id  = ABSENT
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
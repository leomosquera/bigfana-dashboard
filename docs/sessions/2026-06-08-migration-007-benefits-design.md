# Migration 007 — Benefits Design Brief

Date:

2026-06-08

Status:

```txt
Approved — ready for SQL generation
```

---

## Goal

Define the approved scope for Foundation Database v1 Migration 007.

Introduce the organization-owned **benefits catalog** as the first step of Loyalty Foundation, without eligibility rules, usage tracking, rewards, redemptions, or sponsor linkage.

Target file (future):

```txt
database/migrations/foundation-v1/007_benefits.sql
```

---

## References

```txt
migration-plan-v1.md          → Migration 007

physical-model-v1.md          → benefits domain, Multi-Tenant Rules

foundation-db-backlog.md      → Phase 5 — Loyalty Expansion

domain-model.md               → Benefit entity

docs/02-product/fan-journey.md → loyalty entitlement vs redemption

004_create_competition_organizations.sql → organization_id RESTRICT precedent

006_fan_profile_foundation.sql         → prior migration validation pattern
```

Prior reviews (2026-06-08):

```txt
Loyalty Foundation Architecture Review (approved)

Migration 007 status / updated_at design review (approved)

Migration 007 FK review — organization_id ON DELETE RESTRICT (approved)
```

---

# Final Approved Model

## Entity

| Decision | Status |
|----------|--------|
| `benefits` is organization-owned loyalty catalog data | Approved |
| Benefits are entitlements, not point-priced redeemables | Approved |
| `active` status means catalog visibility only — not fan eligibility | Approved |
| Same `status` set should be reused for Migration 008 `rewards` | Approved (forward note) |

---

## Table: `benefits`

```txt
benefits
├── id              UUID        PK, DEFAULT gen_random_uuid()
├── organization_id UUID        NOT NULL, FK → organizations.id
├── name            TEXT        NOT NULL
├── description     TEXT        NULL
├── status          TEXT        NOT NULL, DEFAULT 'draft'
│                             CHECK IN ('draft', 'active', 'paused', 'archived')
├── created_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
```

### Status Values

| Value | Meaning |
|-------|---------|
| `draft` | Configured in admin; not fan-visible |
| `active` | Published in catalog; fan-visible when eligible (eligibility is future work) |
| `paused` | Temporarily disabled by the organization |
| `archived` | Soft-retired; hidden from catalog; retained for history |

Default: `draft`

---

## Indexes

```txt
benefits_organization_id_idx
    ON (organization_id)

benefits_organization_status_idx
    ON (organization_id, status)
```

---

## Timestamps

| Decision | Status |
|----------|--------|
| `created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()` | Approved |
| `updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()` | Approved |
| No DB trigger for `updated_at` — application layer on UPDATE | Approved |

Aligns with Foundation v1 migrations 001–005. `physical-model-v1.md` will be updated post-execution to include `updated_at`.

---

## EEP Impact

```txt
None at DDL level
```

Future `benefit_used` fan events are application-layer concerns, not Migration 007 scope.

---

# In Scope

Migration 007 is **expand-only** — creates `benefits` only.

```txt
CREATE TABLE benefits

Columns:
    id
    organization_id
    name
    description
    status
    created_at
    updated_at

Constraints:
    benefits_organization_fk
        organization_id → organizations.id ON DELETE RESTRICT

    benefits_status_check
        status IN ('draft', 'active', 'paused', 'archived')

Indexes:
    benefits_organization_id_idx
    benefits_organization_status_idx
```

### Tables Affected

```txt
benefits (CREATE)
```

### Tables Not Affected

```txt
organizations

fans

fan_organizations

fan_levels

fan_points_ledger

campaigns

rewards (Migration 008)

redemptions (Migration 009)

All other Foundation DB v1 tables
```

### Data Impact

```txt
Expand-only

No seed data

No backfill

No ALTER on existing tables
```

---

# Out of Scope

```txt
rewards table (Migration 008)

redemptions table (Migration 009)

benefit eligibility model
    level-benefit junction
    segment rules
    audience rules

benefit usage tracking
    benefit_usages table
    fan_events integration

benefit_type / taxonomy column

sponsor_id FK (Migration 010 — Sponsor Domain)

campaign_id FK

points_required, stock, inventory

slug, metadata JSONB

availability windows (starts_at, ends_at)

unique name per organization constraint

application-layer Drizzle schema changes (parallel track)

EEP sync or integration_jobs changes
```

---

# FK Strategy

## `benefits.organization_id → organizations.id`

```txt
ON DELETE RESTRICT
```

### Rationale

| Factor | Decision |
|--------|----------|
| Organizations are long-lived tenant roots | Hard delete must not silently cascade catalog loss |
| Soft deletion preferred | `organizations.is_active` and `benefits.status = archived` |
| Entity class | Organization-owned business catalog — not a fan junction table |
| Foundation v1 precedent | `competition_organizations.organization_id` → RESTRICT (Migration 004) |

### Not Applicable Patterns

```txt
fan_organizations.organization_id → CASCADE
    junction row with no standalone meaning — different entity class

competitions.sport_id → RESTRICT
    protects global catalog parent — different FK direction
```

### Future Child Tables

When eligibility or usage tables reference `benefits.id`, their `ON DELETE` behavior will be decided in a future migration. Migration 007 does not introduce child FKs.

### Legacy Drizzle Note

Production schema (`campaigns`, `fan_levels`) currently uses `onDelete: "cascade"` on `organization_id`. Migration 007 establishes the Foundation v1 norm (RESTRICT). Harmonization of legacy tables is a future contract-phase concern.

---

# Validation Plan

## Pre-Execution

- [ ] Human approval of this design brief recorded
- [ ] Branch is not `main`
- [ ] Migrations 001–006 confirmed executed and validated in Neon
- [ ] `organizations` table exists with at least one row available for FK test inserts

---

## Post-Execution — Schema Validation

- [ ] Table `benefits` exists
- [ ] Column `id` UUID PK with default
- [ ] Column `organization_id` NOT NULL
- [ ] Column `name` NOT NULL
- [ ] Column `description` nullable
- [ ] Column `status` NOT NULL, default `draft`
- [ ] Constraint `benefits_status_check` rejects invalid values (e.g. `inactive`, `ACTIVE`)
- [ ] Constraint accepts all four approved status values
- [ ] Columns `created_at`, `updated_at` NOT NULL with defaults
- [ ] FK `benefits_organization_fk` references `organizations.id`
- [ ] FK uses ON DELETE RESTRICT
- [ ] Index `benefits_organization_id_idx` exists
- [ ] Index `benefits_organization_status_idx` exists
- [ ] `SELECT COUNT(*) FROM benefits` returns 0 (no seed)
- [ ] Migration is idempotent on re-run

---

## Post-Execution — Data Validation

- [ ] Valid insert with `organization_id` from `organizations` succeeds
- [ ] Insert without `name` rejected (NOT NULL)
- [ ] Insert with invalid `organization_id` rejected (FK)
- [ ] Insert with `status = 'draft'` succeeds (default)
- [ ] Insert with each approved status value succeeds
- [ ] `DELETE FROM organizations WHERE id = …` blocked when benefits rows reference that org (RESTRICT)
- [ ] `updated_at` populated on insert (default NOW())

---

## Post-Execution — Documentation Updates

Per `AI_RULES.md` and `ai-development-workflow.md`:

```txt
docs/04-database/current-schema.md

docs/04-database/gap-analysis.md

docs/04-database/physical-model-v1.md
    → add updated_at and status values to benefits

docs/04-database/foundation-db-backlog.md
    → mark "Create benefits table" in progress / complete

PROJECT_STATE.md
    → update current migration status after execution
```

---

## Post-Execution — Session

- [ ] Create execution session document after Neon validation
- [ ] Suggest commit message for SQL file (human executes commit)

---

# Rollback Strategy

Rollback is valid **only before Migration 008** and only if no application code depends on `benefits`.

```txt
DROP TABLE IF EXISTS benefits;
```

### Rollback Conditions

```txt
No dependent migrations executed (008+)

No application queries reference benefits

No production benefit records that must be preserved
```

### Rollback Does Not

```txt
Modify organizations

Modify any existing loyalty tables (fan_levels, fan_points_ledger)

Drop or alter fan, campaign, or competition tables
```

Re-running Migration 007 after rollback is safe (expand-only `CREATE TABLE IF NOT EXISTS`).

---

# Migration Ownership

## SQL File

```txt
Owner:     Foundation DB v1 implementation agent
Reviewer:  Human developer
Executor:  Human developer (Neon)
Path:      database/migrations/foundation-v1/007_benefits.sql
```

## Design Brief

```txt
Owner:     Product / database architecture review
Status:    Approved
Path:      docs/sessions/2026-06-08-migration-007-benefits-design.md
```

## Documentation Updates (post-execution)

```txt
Owner:     Implementation agent
Approver:  Human developer
Files:     current-schema.md, gap-analysis.md, physical-model-v1.md,
           foundation-db-backlog.md, PROJECT_STATE.md
```

## Application Layer (parallel track)

```txt
Owner:     Application development (post-DDL)
Not blocking Migration 007 execution
Includes:  Drizzle schema, server actions, dashboard Benefit Catalog UI
```

## Approval Gates

| Gate | Required before |
|------|-----------------|
| Design brief approval | SQL generation |
| SQL file review | Neon execution |
| Neon validation | Documentation updates |
| Documentation sync | Marking migration complete in PROJECT_STATE |

---

# Success Criteria

Migration 007 is complete when:

```txt
SQL file exists

SQL executed successfully in Neon

All validation checks pass

Documentation updated

Execution session document created

Commit message suggested
```

Creating the SQL file alone does not mark the migration as completed.

---

# Next Steps

1. Generate `007_benefits.sql` from this brief
2. Human review and commit of SQL file
3. Execute against Neon
4. Run validation plan
5. Update documentation
6. Begin Migration 008 (`rewards`) design brief

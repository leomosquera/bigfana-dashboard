# Migration 008 — Rewards Design Brief

Date:

2026-06-08

Status:

```txt
Approved — ready for SQL generation
```

---

## Goal

Define the approved scope for Foundation Database v1 Migration 008.

Introduce the organization-owned **rewards catalog** as the second step of Loyalty Rewards Foundation, without redemptions, ledger debits, fan linkage, eligibility rules, or sponsor linkage.

Target file (future):

```txt
database/migrations/foundation-v1/008_create_rewards.sql
```

---

## References

```txt
migration-plan-v1.md          → Migration 008

physical-model-v1.md          → rewards domain, Multi-Tenant Rules

foundation-db-backlog.md      → Phase 5 — Loyalty Expansion

domain-model.md               → Reward entity

docs/02-product/fan-journey.md → Points → Reward → Redemption flow

007_create_benefits.sql       → catalog precedent (status, FK, indexes)

docs/sessions/2026-06-08-migration-007-benefits-design.md
```

Prior reviews (2026-06-08):

```txt
Migration 008 Rewards Architecture Review (approved)

Migration 007 completed and validated in Neon
```

---

# Final Approved Model

## Entity

| Decision | Status |
|----------|--------|
| `rewards` is organization-owned loyalty catalog data | Approved |
| Rewards are point-priced redeemables — not entitlements | Approved |
| `active` status means catalog visibility only — not fan eligibility or balance check | Approved |
| Redemption workflow deferred to Migration 009 | Approved |
| No FK between `rewards` and `benefits` | Approved |

---

## Table: `rewards`

```txt
rewards
├── id              UUID        PK, DEFAULT gen_random_uuid()
├── organization_id UUID        NOT NULL, FK → organizations.id
├── name            TEXT        NOT NULL
├── description     TEXT        NULL
├── points_required INTEGER     NOT NULL, CHECK >= 1
├── stock           INTEGER     NULL, CHECK >= 0 when not NULL
├── status          TEXT        NOT NULL, DEFAULT 'draft'
│                             CHECK IN ('draft', 'active', 'paused', 'archived')
├── created_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
```

### Status Values

| Value | Meaning |
|-------|---------|
| `draft` | Configured in admin; not fan-visible |
| `active` | Published in reward catalog; redeemable when fan has sufficient points and stock allows |
| `paused` | Temporarily disabled by the organization |
| `archived` | Soft-retired; hidden from catalog; retained for history |

Default: `draft`

Same set as `benefits` (Migration 007).

---

## Points and Stock Semantics

### `points_required`

| Rule | Value |
|------|-------|
| Minimum | `1` |
| Constraint | `points_required >= 1` |
| Meaning | Point cost to redeem this reward |

Free rewards (`0` points) are **not** supported in Migration 008. Promotional free items belong in `benefits`, not `rewards`.

### `stock`

| Value | Meaning |
|-------|---------|
| `NULL` | Unlimited availability |
| `0` | Out of stock — reward remains in catalog but not redeemable |
| `> 0` | Available units remaining |

| Rule | Value |
|------|-------|
| Nullability | Nullable (`NULL` = unlimited) |
| Constraint | `stock IS NULL OR stock >= 0` |
| Negative stock | Rejected by CHECK |

Stock decrement on redemption is **not** implemented in Migration 008. Decrement logic belongs to Migration 009 and the application layer.

---

## Indexes

```txt
rewards_organization_id_idx
    ON (organization_id)

rewards_organization_status_idx
    ON (organization_id, status)
```

---

## Naming

| Decision | Status |
|----------|--------|
| No unique constraint on `name` per organization | Approved |
| Duplicate reward names within an org are permitted at DB level | Approved |

Application layer may enforce uniqueness if product requires it later.

---

## Timestamps

| Decision | Status |
|----------|--------|
| `created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()` | Approved |
| `updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()` | Approved |
| No DB trigger for `updated_at` — application layer on UPDATE | Approved |

`physical-model-v1.md` will be updated post-execution to include `updated_at`, status values, and stock/points semantics.

---

## EEP Impact

```txt
None at DDL level
```

Future `reward_redeemed` fan events are application-layer concerns, introduced with Migration 009 redemptions.

---

# In Scope

Migration 008 is **expand-only** — creates `rewards` only.

```txt
CREATE TABLE rewards

Columns:
    id
    organization_id
    name
    description
    points_required
    stock
    status
    created_at
    updated_at

Constraints:
    rewards_organization_fk
        organization_id → organizations.id ON DELETE RESTRICT

    rewards_status_check
        status IN ('draft', 'active', 'paused', 'archived')

    rewards_points_required_check
        points_required >= 1

    rewards_stock_check
        stock IS NULL OR stock >= 0

Indexes:
    rewards_organization_id_idx
    rewards_organization_status_idx
```

### Tables Affected

```txt
rewards (CREATE)
```

### Tables Not Affected

```txt
organizations

benefits

fans

fan_organizations

fan_levels

fan_points_ledger

campaigns

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
redemptions table (Migration 009)

redemption status workflow
    PENDING, APPROVED, DELIVERED, REJECTED, CANCELLED

fan_points_ledger changes
    point debit on redeem

fan_events integration
    reward_redeemed events

stock decrement logic
    reserve at PENDING vs commit at APPROVED (Migration 009 decision)

benefit FK or benefit-reward junction

campaign_id FK

sponsor_id FK (Migration 010 — Sponsor Domain)

reward_type / taxonomy column

slug, metadata JSONB, image_url

level-gated eligibility

advanced inventory
    batches, reservations, replenishment

unique name per organization constraint

application-layer Drizzle schema changes (parallel track)

EEP sync or integration_jobs changes
```

---

# FK Strategy

## `rewards.organization_id → organizations.id`

```txt
ON DELETE RESTRICT
```

### Rationale

| Factor | Decision |
|--------|----------|
| Organizations are long-lived tenant roots | Hard delete must not silently cascade catalog loss |
| Soft deletion preferred | `organizations.is_active` and `rewards.status = archived` |
| Entity class | Organization-owned business catalog — same class as `benefits` |
| Foundation v1 precedent | `benefits.organization_id` → RESTRICT (Migration 007) |

### Future Child Tables

`redemptions.reward_id` will reference `rewards.id` in Migration 009. Child `ON DELETE` behavior on `reward_id` will be decided in the 009 design brief.

### Legacy Drizzle Note

Production schema (`campaigns`, `fan_levels`) currently uses `onDelete: "cascade"` on `organization_id`. Migration 008 follows the Foundation v1 RESTRICT norm established in Migrations 004 and 007.

---

# Validation Plan

## Pre-Execution

- [ ] Human approval of this design brief recorded
- [ ] Branch is not `main`
- [ ] Migrations 001–007 confirmed executed and validated in Neon
- [ ] `organizations` table exists with at least one row available for FK test inserts

---

## Post-Execution — Schema Validation

- [ ] Table `rewards` exists
- [ ] Column `id` UUID PK with default
- [ ] Column `organization_id` NOT NULL
- [ ] Column `name` NOT NULL
- [ ] Column `description` nullable
- [ ] Column `points_required` NOT NULL
- [ ] Column `stock` nullable
- [ ] Column `status` NOT NULL, default `draft`
- [ ] Constraint `rewards_status_check` rejects invalid values (e.g. `inactive`, `ACTIVE`)
- [ ] Constraint `rewards_points_required_check` rejects `points_required < 1`
- [ ] Constraint `rewards_stock_check` rejects negative stock
- [ ] Constraint accepts `stock IS NULL` (unlimited)
- [ ] Columns `created_at`, `updated_at` NOT NULL with defaults
- [ ] FK `rewards_organization_fk` references `organizations.id`
- [ ] FK uses ON DELETE RESTRICT
- [ ] Index `rewards_organization_id_idx` exists
- [ ] Index `rewards_organization_status_idx` exists
- [ ] `SELECT COUNT(*) FROM rewards` returns 0 (no seed)
- [ ] Migration is idempotent on re-run

---

## Post-Execution — Data Validation

- [ ] Valid insert with `organization_id`, `name`, `points_required = 1` succeeds
- [ ] Insert without `name` rejected (NOT NULL)
- [ ] Insert without `points_required` rejected (NOT NULL)
- [ ] Insert with `points_required = 0` rejected (CHECK)
- [ ] Insert with `points_required = -1` rejected (CHECK)
- [ ] Insert with `stock = NULL` succeeds (unlimited)
- [ ] Insert with `stock = 0` succeeds (out of stock)
- [ ] Insert with `stock = 10` succeeds (available)
- [ ] Insert with `stock = -1` rejected (CHECK)
- [ ] Insert with invalid `organization_id` rejected (FK)
- [ ] Insert with each approved status value succeeds
- [ ] Duplicate `name` within same organization allowed (no unique constraint)
- [ ] `DELETE FROM organizations WHERE id = …` blocked when rewards rows reference that org (RESTRICT)
- [ ] `updated_at` populated on insert (default NOW())

---

## Post-Execution — Documentation Updates

Per `AI_RULES.md` and `ai-development-workflow.md`:

```txt
docs/04-database/current-schema.md

docs/04-database/gap-analysis.md

docs/04-database/physical-model-v1.md
    → add updated_at, status values, points/stock semantics

docs/04-database/foundation-db-backlog.md
    → mark "Create rewards table" in progress / complete

PROJECT_STATE.md
    → update current migration status after execution
```

---

## Post-Execution — Session

- [ ] Create execution session document after Neon validation
- [ ] Suggest commit message for SQL file (human executes commit)

---

# Rollback Strategy

Rollback is valid **only before Migration 009** and only if no application code depends on `rewards`.

```txt
DROP TABLE IF EXISTS rewards;
```

### Rollback Conditions

```txt
No dependent migrations executed (009+)

No application queries reference rewards

No production reward records that must be preserved
```

### Rollback Does Not

```txt
Modify organizations

Modify benefits

Modify any existing loyalty tables (fan_levels, fan_points_ledger)

Drop or alter fan, campaign, or competition tables
```

Re-running Migration 008 after rollback is safe (expand-only `CREATE TABLE IF NOT EXISTS`).

---

# Migration Ownership

## SQL File

```txt
Owner:     Foundation DB v1 implementation agent
Reviewer:  Human developer
Executor:  Human developer (Neon)
Path:      database/migrations/foundation-v1/008_create_rewards.sql
```

## Design Brief

```txt
Owner:     Product / database architecture review
Status:    Approved
Path:      docs/sessions/2026-06-08-migration-008-rewards-design.md
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
Not blocking Migration 008 execution
Includes:  Drizzle schema, server actions, dashboard Reward Catalog UI
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

Migration 008 is complete when:

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

1. Generate `008_create_rewards.sql` from this brief
2. Human review and commit of SQL file
3. Execute against Neon
4. Run validation plan
5. Update documentation
6. Begin Migration 009 (`redemptions`) design brief

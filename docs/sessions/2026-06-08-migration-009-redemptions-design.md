# Migration 009 — Redemptions Design Brief

Date:

2026-06-08

Status:

```txt
Approved — ready for SQL generation
```

---

## Goal

Define the approved scope for Foundation Database v1 Migration 009.

Introduce the organization-scoped **redemptions** transactional table as the third step of Loyalty Rewards Foundation — the record of a fan claiming a reward — without ledger debits, stock mechanics, fan events, EEP integration, triggers, or stored procedures.

Target file (future):

```txt
database/migrations/foundation-v1/009_create_redemptions.sql
```

---

## References

```txt
migration-plan-v1.md          → Migration 009

physical-model-v1.md          → redemptions domain, Multi-Tenant Rules

current-schema.md             → loyalty domain, existing tables

foundation-db-backlog.md      → Phase 5 — Loyalty Expansion

domain-model.md               → Redemption entity

docs/02-product/fan-journey.md → Points → Reward → Redemption flow

007_create_benefits.sql       → catalog precedent (FK, indexes, timestamps)

008_create_rewards.sql        → parent catalog precedent

docs/sessions/2026-06-08-migration-007-benefits-design.md

docs/sessions/2026-06-08-migration-008-rewards-design.md
```

Prior reviews (2026-06-08):

```txt
Migration 009 Redemptions Architecture Review (approved)

Migration 007 completed and validated in Neon

Migration 008 SQL file created (Neon execution pending human validation)

redeemed_at index strategy review (approved)
```

---

# 1. Design Decisions

## Entity

| Decision | Status |
|----------|--------|
| `redemptions` is a transactional record of a fan claiming a reward | Approved |
| Redemptions are organization-scoped transactional data — not catalog configuration | Approved |
| Redemptions are distinct from `benefits` (entitlements) and `rewards` (point-priced catalog) | Approved |
| `points_cost` is a required snapshot of reward cost at redemption time | Approved |
| Status values use **lowercase** workflow convention | Approved |
| Migration 009 is **DDL transaction storage only** — no business logic | Approved |
| No `ledger_entry_id`, `fan_event_id`, triggers, or procedures in Migration 009 | Approved |

---

## Loyalty Triad

```txt
Benefit     → entitlement catalog       (Migration 007)
Reward      → point-priced catalog      (Migration 008)
Redemption  → fan claim transaction     (Migration 009)
```

Product flow:

```txt
Points (balance)
    ↓
Reward (catalog selection)
    ↓
Redemption (transaction + lifecycle status)
```

---

## Relationships

| FK | Target | ON DELETE | Status |
|----|--------|-----------|--------|
| `organization_id` | `organizations.id` | RESTRICT | Approved |
| `fan_id` | `fans.id` | RESTRICT | Approved |
| `reward_id` | `rewards.id` | RESTRICT | Approved |

### Rationale

| Factor | Decision |
|--------|----------|
| Organizations are long-lived tenant roots | Hard delete must not silently cascade transaction loss |
| Fans use lifecycle status, not hard delete | Preserve redemption history |
| Rewards may be archived | Redemption history must survive catalog retirement |
| Foundation v1 precedent | RESTRICT on org-owned entities (Migrations 004, 007, 008) |
| Entity class | Organization-scoped transactional record — same class as `campaign_responses`, `fan_points_ledger` |

### Tenant Invariant (application-layer)

```txt
redemptions.organization_id MUST equal rewards.organization_id
```

Not enforced by DB CHECK in Migration 009. Future migration may add a constraint if product requires it.

### Fan Membership (application-layer)

Fan should have an active `fan_organizations` row for the redeeming organization. Not enforced in Migration 009 DDL.

---

## Snapshot: `points_cost`

| Rule | Value |
|------|-------|
| Nullability | NOT NULL |
| Constraint | `points_cost >= 1` |
| Meaning | Point cost locked at claim time |
| Source | Application copies `rewards.points_required` on insert |
| Rationale | Catalog `points_required` may change after redemption is recorded |

Migration 009 does **not** validate that `points_cost` matches `rewards.points_required` at insert time. That belongs to the future redemption service.

Free rewards (`0` points) are not supported. Promotional free items belong in `benefits`, not `rewards` (Migration 008 precedent).

---

## Status Model

| Value | Meaning | Terminal? |
|-------|---------|-------------|
| `pending` | Fan submitted claim; default on insert | No |
| `approved` | Organization accepted claim; fulfillment in progress | No |
| `fulfilled` | Reward delivered or digitally issued | Yes |
| `rejected` | Organization denied claim | Yes |
| `cancelled` | Fan or system withdrew before fulfillment | Yes |

Default: `pending`

**Convention:** lowercase, consistent with `benefits.status` and `rewards.status` (Migrations 007–008).

**Supersedes:** `migration-plan-v1.md` lists `PENDING`, `APPROVED`, `DELIVERED`, `REJECTED`, `CANCELLED`. This brief is authoritative. Canonical terminal status is `fulfilled` (not `delivered`).

### Lifecycle (application-layer — not enforced by DDL)

```txt
pending → approved → fulfilled
pending → rejected
pending → cancelled
approved → fulfilled
approved → cancelled
```

Fast-path (`pending` → `fulfilled`) is permitted at the application layer. The database only constrains valid status values.

---

## Timestamps

| Column | Rule | Status |
|--------|------|--------|
| `redeemed_at` | NOT NULL, DEFAULT `NOW()` — fan submission timestamp | Approved |
| `created_at` | NOT NULL, DEFAULT `NOW()` | Approved |
| `updated_at` | NOT NULL, DEFAULT `NOW()` — application layer on UPDATE | Approved |
| No DB trigger for `updated_at` | Same as Migrations 007–008 | Approved |

Type: `TIMESTAMP WITHOUT TIME ZONE` — consistent with Migrations 007–008.

Future columns deferred: `fulfilled_at`, `rejected_at`, `rejection_reason`.

---

## EEP Impact

```txt
None at DDL level
```

Future `reward_redeemed` fan events and `integration_jobs` enqueue are application-layer concerns — deferred.

---

## Deferred to Migration 009 Application Layer

The following are **explicitly out of Migration 009 DDL** and belong to the application layer (parallel track):

```txt
Points debit timing
    when to debit fan_points_ledger on redemption submit vs approval

Stock decrement timing
    when to decrement rewards.stock on redemption submit vs approval
    when to restore stock on rejected / cancelled

Redemption workflow implementation
    balance validation
    stock availability checks
    status transition rules
    point reversals on rejected / cancelled
    fan_events creation (reward_redeemed)
    EEP integration_jobs enqueue
    Redemption Queue admin UX
    Drizzle schema and server actions
```

Also deferred (not in application layer scope for Migration 009):

```txt
ledger_entry_id FK
fan_event_id FK
DB triggers
stored procedures
sponsor integration
```

---

# 2. Final Table Shape

## Table: `redemptions`

```txt
redemptions
├── id              UUID        PK, DEFAULT gen_random_uuid()
├── organization_id UUID        NOT NULL, FK → organizations.id
├── fan_id          UUID        NOT NULL, FK → fans.id
├── reward_id       UUID        NOT NULL, FK → rewards.id
├── status          TEXT        NOT NULL, DEFAULT 'pending'
│                             CHECK IN ('pending', 'approved', 'fulfilled',
│                                       'rejected', 'cancelled')
├── points_cost     INTEGER     NOT NULL, CHECK >= 1
├── redeemed_at     TIMESTAMP   NOT NULL, DEFAULT NOW()
├── created_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
```

### Constraints

```txt
redemptions_organization_fk
    organization_id → organizations.id ON DELETE RESTRICT

redemptions_fan_fk
    fan_id → fans.id ON DELETE RESTRICT

redemptions_reward_fk
    reward_id → rewards.id ON DELETE RESTRICT

redemptions_status_check
    status IN ('pending', 'approved', 'fulfilled', 'rejected', 'cancelled')

redemptions_points_cost_check
    points_cost >= 1
```

### Columns Explicitly Excluded

```txt
ledger_entry_id
fan_event_id
rejection_reason
fulfilled_at
created_by / source
metadata JSONB
campaign_id
sponsor_id
```

---

# 3. Index Strategy

## Approved Indexes

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

## Rationale

| Index | Primary access pattern |
|-------|------------------------|
| `(organization_id, redeemed_at)` | Last redemptions, redemption reports, admin activity feed, org-scoped time-ordered queries |
| `(organization_id, status)` | Redemption Queue — filter pending / approved claims per org |
| `(fan_id)` | Cross-org fan lookup (admin support); secondary to org+fan |
| `(reward_id)` | Per-reward redemption analytics |
| `(organization_id, fan_id)` | Fan redemption history within an org |

## Index Decisions

| Decision | Status |
|----------|--------|
| `(organization_id, redeemed_at)` composite — not standalone `redeemed_at` | Approved |
| No standalone `redemptions_organization_id_idx` — subsumed by `(organization_id, redeemed_at)` leftmost prefix | Approved |
| No `(organization_id, status, redeemed_at)` in v1 — pending queue expected small; defer until measured need | Approved |
| No `(organization_id, fan_id, redeemed_at)` in v1 — fan history sorts small result sets in memory; defer if hot | Approved |

### Precedent

Aligns with transactional table indexing in the application schema:

```txt
fan_points_ledger   → (organization_id, created_at)
fan_events          → (organization_id, event_type, occurred_at)
```

`redemptions` is transactional, not catalog — temporal org-scoped indexing applies.

---

# In Scope

Migration 009 is **expand-only** — creates `redemptions` only.

```txt
CREATE TABLE redemptions

Columns:
    id
    organization_id
    fan_id
    reward_id
    status
    points_cost
    redeemed_at
    created_at
    updated_at

Constraints:
    redemptions_organization_fk     (RESTRICT)
    redemptions_fan_fk              (RESTRICT)
    redemptions_reward_fk           (RESTRICT)
    redemptions_status_check
    redemptions_points_cost_check

Indexes:
    redemptions_organization_redeemed_at_idx
    redemptions_organization_status_idx
    redemptions_fan_id_idx
    redemptions_reward_id_idx
    redemptions_organization_fan_idx
```

### Tables Affected

```txt
redemptions (CREATE)
```

### Tables Not Affected

```txt
organizations
fans
fan_organizations
rewards
benefits
fan_levels
fan_points_ledger
fan_events
campaigns
integration_jobs
All other Foundation DB v1 tables
```

### Data Impact

```txt
Expand-only
No seed data
No backfill
No ALTER on existing tables
No triggers
No stored procedures
```

---

# Out of Scope

```txt
ledger_entry_id FK
fan_event_id FK

fan_points_ledger changes
    point debit on redeem
    point reversal on reject/cancel

rewards.stock changes
    decrement on submit
    restore on reject/cancel

fan_events row creation
    reward_redeemed event_type

integration_jobs / EEP sync

redemption service (server actions, API routes)

DB triggers or stored procedures

stock reservation logic
points debit logic

benefit_usage / benefit_redemptions

shipping / fulfillment metadata
    address, tracking_number, fulfillment_notes

redemption codes / QR / digital asset URLs

per-fan redemption limits

reward.requires_approval column

campaign_id FK
sponsor_id FK (Migration 010)

audit_logs / redemption_status_history table

application-layer Drizzle schema changes (parallel track)

org-scoped balance model fix (fans.engagement_score / fan_organizations)
```

---

# FK Strategy

## `redemptions.organization_id → organizations.id`

```txt
ON DELETE RESTRICT
```

## `redemptions.fan_id → fans.id`

```txt
ON DELETE RESTRICT
```

## `redemptions.reward_id → rewards.id`

```txt
ON DELETE RESTRICT
```

### Legacy Drizzle Note

Production schema (`campaigns`, `fan_levels`) currently uses `onDelete: "cascade"` on `organization_id`. Migration 009 follows the Foundation v1 RESTRICT norm established in Migrations 004, 007, and 008.

---

# 4. Remaining Open Questions

These do **not** block Migration 009 DDL. They must be resolved before the redemption service goes live.

| # | Question | Impact | Recommendation (non-blocking) |
|---|----------|--------|-------------------------------|
| 1 | Is `approved` always required, or can some rewards skip to `fulfilled`? | Application workflow | Allow both paths in service; DB only constrains valid status values |
| 2 | When to debit points — at `pending` or at `approved`? | Double-spend risk | Debit at `pending`; reverse on `rejected`/`cancelled` (application layer) |
| 3 | When to decrement stock — at `pending` or at `approved`? | Overselling risk | Decrement at `pending`; restore on `rejected`/`cancelled` (application layer) |
| 4 | Org-scoped balance: `fans.engagement_score` still tied to deprecated `fans.organization_id` | Redemption service correctness | Parallel track — must resolve before production redemptions |
| 5 | Non-atomic writes (`neon-http` vs `neon-ws` transactions) | Partial failure on multi-table redeem | Migrate to transactional driver before production redemption flows |
| 6 | Fan eligibility: PRIMARY only or any `fan_organizations` relationship? | Who can redeem | Application policy — not enforced in Migration 009 |
| 7 | Per-fan duplicate redemption limits per reward? | Abuse prevention | Application rules first; DB constraint in future migration if needed |
| 8 | Admin-initiated redemptions on behalf of fans? | `created_by` / `source` column | Defer column; add in future migration if product confirms |
| 9 | `rejection_reason` required on `rejected`? | Operational UX | Defer to future migration |
| 10 | EEP sync timing — on `pending` or `fulfilled`? | Intelligence pipeline | Sync on `pending` with status in payload (application layer) |
| 11 | Behavior when reward is `paused`/`archived` after pending redemption exists? | Edge case policy | Grandfather pending rows; application handles transitions |
| 12 | `ledger_entry_id` / `fan_event_id` as FK columns vs JSONB cross-refs? | Traceability | Revisit when redemption service is designed |

---

# Validation Plan

## Pre-Execution

- [x] Human approval of this design brief recorded
- [ ] Branch is not `main`
- [ ] Migrations 001–008 confirmed executed and validated in Neon
- [ ] `organizations`, `fans`, and `rewards` tables exist with test rows available for FK inserts

---

## Post-Execution — Schema Validation

- [ ] Table `redemptions` exists
- [ ] Column `id` UUID PK with default
- [ ] Columns `organization_id`, `fan_id`, `reward_id` NOT NULL
- [ ] Column `status` NOT NULL, default `pending`
- [ ] Column `points_cost` NOT NULL
- [ ] Column `redeemed_at` NOT NULL with default
- [ ] Columns `created_at`, `updated_at` NOT NULL with defaults
- [ ] Constraint `redemptions_status_check` rejects invalid values (e.g. `delivered`, `PENDING`, `inactive`)
- [ ] Constraint `redemptions_status_check` accepts all five approved values
- [ ] Constraint `redemptions_points_cost_check` rejects `points_cost < 1`
- [ ] FK `redemptions_organization_fk` → `organizations.id` ON DELETE RESTRICT
- [ ] FK `redemptions_fan_fk` → `fans.id` ON DELETE RESTRICT
- [ ] FK `redemptions_reward_fk` → `rewards.id` ON DELETE RESTRICT
- [ ] Index `redemptions_organization_redeemed_at_idx` exists
- [ ] Index `redemptions_organization_status_idx` exists
- [ ] Index `redemptions_fan_id_idx` exists
- [ ] Index `redemptions_reward_id_idx` exists
- [ ] Index `redemptions_organization_fan_idx` exists
- [ ] No standalone `redemptions_organization_id_idx` (intentionally omitted)
- [ ] `SELECT COUNT(*) FROM redemptions` returns 0 (no seed)
- [ ] Migration is idempotent on re-run
- [ ] No triggers or procedures created

---

## Post-Execution — Data Validation

- [ ] Valid insert with `organization_id`, `fan_id`, `reward_id`, `points_cost = 100` succeeds
- [ ] Default `status = 'pending'` on insert without explicit status
- [ ] Default `redeemed_at` populated on insert
- [ ] Insert with each approved status value succeeds
- [ ] Insert without `points_cost` rejected (NOT NULL)
- [ ] Insert with `points_cost = 0` rejected (CHECK)
- [ ] Insert with `points_cost = -1` rejected (CHECK)
- [ ] Insert with invalid `organization_id` rejected (FK)
- [ ] Insert with invalid `fan_id` rejected (FK)
- [ ] Insert with invalid `reward_id` rejected (FK)
- [ ] `DELETE FROM organizations WHERE id = …` blocked when redemptions reference org (RESTRICT)
- [ ] `DELETE FROM fans WHERE id = …` blocked when redemptions reference fan (RESTRICT)
- [ ] `DELETE FROM rewards WHERE id = …` blocked when redemptions reference reward (RESTRICT)

---

## Post-Execution — Documentation Updates

Per `AI_RULES.md` and `ai-development-workflow.md`:

```txt
docs/04-database/current-schema.md

docs/04-database/gap-analysis.md

docs/04-database/physical-model-v1.md
    → add status values, points_cost, redeemed_at, updated_at, FK semantics, indexes

docs/04-database/migration-plan-v1.md
    → align status listing to lowercase + fulfilled

docs/04-database/foundation-db-backlog.md
    → mark redemptions tasks in progress / complete

PROJECT_STATE.md
    → update current migration status after execution
```

---

## Post-Execution — Session

- [ ] Create execution session document after Neon validation
- [ ] Suggest commit message for SQL file (human executes commit)

---

# Rollback Strategy

Rollback is valid only if no application code or later migrations depend on `redemptions`.

```txt
DROP TABLE IF EXISTS redemptions;
```

### Rollback Conditions

```txt
No dependent migrations executed (010+)
No application queries reference redemptions
No production redemption records that must be preserved
```

### Rollback Does Not

```txt
Modify organizations, fans, rewards, benefits
Modify fan_points_ledger, fan_events, fan_levels
Drop or alter any other Foundation DB v1 table
```

Re-running Migration 009 after rollback is safe (expand-only `CREATE TABLE IF NOT EXISTS`).

---

# Migration Ownership

## SQL File

```txt
Owner:     Foundation DB v1 implementation agent
Reviewer:  Human developer
Executor:  Human developer (Neon)
Path:      database/migrations/foundation-v1/009_create_redemptions.sql
```

## Design Brief

```txt
Owner:     Product / database architecture review
Status:    Approved
Path:      docs/sessions/2026-06-08-migration-009-redemptions-design.md
```

## Application Layer (parallel track)

```txt
Owner:     Application development (post-DDL)
Not blocking Migration 009 execution
Includes:  Drizzle schema, redemption service, dashboard Redemption Queue UI
Deferred:  points debit timing, stock decrement timing, workflow implementation
```

## Approval Gates

| Gate | Required before |
|------|-----------------|
| Design brief approval | SQL generation |
| Migration 008 executed in Neon | SQL execution |
| SQL file review | Neon execution |
| Neon validation | Documentation updates |
| Documentation sync | Marking migration complete in PROJECT_STATE |

---

# 5. Readiness Verdict for SQL Generation

```txt
READY — SQL generation may proceed
```

### Conditions met

| Criterion | Status |
|-----------|--------|
| Entity definition approved | Yes |
| Relationship FKs locked (all RESTRICT) | Yes |
| `points_cost` snapshot required | Yes |
| Status set locked (lowercase, five values) | Yes |
| Index strategy locked (five indexes, no standalone org or redeemed_at) | Yes |
| Scope locked (DDL only, no business logic) | Yes |
| Deferred application-layer items explicitly documented | Yes |
| Validation plan defined | Yes |
| Rollback strategy defined | Yes |
| Follows Migrations 007–008 expand-only precedent | Yes |

### Pre-SQL gates

| Gate | Status |
|------|--------|
| Design brief approved | Yes |
| Migration 008 executed and validated in Neon | Pending — blocks Neon execution, not SQL file generation |

### Verdict

```txt
SQL generation:     APPROVED — proceed with 009_create_redemptions.sql
Neon execution:     BLOCKED until Migration 008 is validated in Neon
Application work:   NOT BLOCKED by Migration 009 DDL — redemption service remains parallel track
```

---

# Success Criteria

Migration 009 is complete when:

```txt
Design brief approved
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

1. Generate `009_create_redemptions.sql` from this brief
2. Human review and commit of SQL file
3. Confirm Migration 008 validated in Neon
4. Execute Migration 009 against Neon
5. Run validation plan
6. Update documentation
7. Begin redemption service design (application layer — parallel track)

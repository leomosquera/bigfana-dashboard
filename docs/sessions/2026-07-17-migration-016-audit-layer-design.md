# Migration 016 — Audit Layer Foundation
## Design Brief

**Date:** 2026-07-17  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/016_create_audit_logs.sql`

---

## Architecture freeze (approved)

Locked before this Design Brief. Must not change during SQL generation or later review.

| Topic | Decision |
|-------|----------|
| Surface | Single table `audit_logs` |
| Purpose | Business / governance audit of security-significant decisions |
| Not | `fan_events`, `integration_jobs`, application/ops/observability logs |
| Scope | Dual-scope: `organization_id` present (org) or NULL (platform) |
| Fake org context | Forbidden for platform events |
| Actor vs Origin | **Distinct concepts** — never collapsed into one field |
| Actor | Who performed the business action |
| Origin | Where the action originated |
| Entity identity | Canonical business entity id, stable for entity lifetime |
| Record content | Business decisions only — not technical execution details |
| Mutation model | Append-only (INSERT only in application paths) |
| Integration 015 history | Owned by `audit_logs` (no `integration_lifecycle_history`) |
| Jobs relationship | Independent from `integration_jobs` |
| Entity association | Polymorphic logical (`entity_type` + `entity_id`); no ALTER of business tables |
| Redemption / entity history intent | Absorbed by `audit_logs` for Foundation v1 |
| Retention | Durable store; purge/archive/legal-hold deferred |
| ADR | No additional ADR required |

### Required clarifications (approved)

```txt
1. Distinguish Actor from Origin.
   Actor = who performed the business action.
   Origin = where the action originated.
   Do not collapse both concepts into one.

2. audit_logs must reference canonical business entity
   identifiers that remain stable for the entity lifetime.

3. audit_logs records business decisions only.
   Technical execution details belong to operational systems
   such as integration_jobs or observability.
```

---

## 1. Objective

Define the approved DDL scope for Foundation Database v1 Migration 016.

Introduce **Audit Layer Foundation** — the append-only `audit_logs` table that records business decisions affecting auditable entities — without mixing operational logging, without altering existing business tables, and without coupling to `integration_jobs`.

**Business outcome:**

```txt
Platform and organizations gain a durable forensic trail of business decisions
Integration registry lifecycle history deferred from 015 has a home
Entity audit strategy for Foundation v1 is unified (not per-table history tables)
```

**Non-outcomes (explicit):**

```txt
No ALTER of integrations, redemptions, or other business tables
No integration_lifecycle_history table
No FK or payload coupling to integration_jobs
No fan_events changes
No observability / APM / request-log tables
No retention purge jobs
No application-layer / Drizzle changes in this migration
No SQL in this brief phase
```

---

## 2. Architectural Invariants

Frozen for Migration 016.

```txt
- audit_logs is the single Foundation v1 business audit surface.
- Audit records business decisions only.
- Technical execution details belong to integration_jobs / observability — not audit_logs.
- Actor and Origin are distinct required dimensions.
- Actor identifies who performed the business action.
- Origin identifies where the action originated.
- organization_id is nullable (dual-scope); platform events must not invent an organization.
- entity_type + entity_id reference the canonical stable business entity identity.
- entity_id is the BigFana primary key UUID of the audited entity row.
- Actor identity is a soft reference (type + optional id) — not a hard FK to users.
- Append-only: no application UPDATE/DELETE of audit rows.
- No updated_at column (rows are immutable after insert).
- Integration registry lifecycle history is recorded here; current state remains on integrations.
- audit_logs remains independent from integration_jobs.
- No hard FKs from audit_logs to every business entity table.
- organization_id FK (when present) → organizations ON DELETE RESTRICT.
- No triggers.
- No business logic inside DDL.
- Expand-only migration (CREATE audit_logs only).
```

---

## 3. Scope

### In scope (DDL)

```txt
CREATE TABLE audit_logs
```

### Tables affected

```txt
audit_logs (CREATE)
```

### Tables not affected

```txt
integrations
integration_jobs
organizations
users, memberships
fans, audiences, fan_audiences, segments, fan_segments
campaigns, sponsors, content
competitions, seasons, matches, standings
benefits, rewards, redemptions
fan_events
fan_points_ledger
All other Foundation DB v1 tables
```

### Data impact

```txt
Expand-only
No seed data
No backfill of historical transitions predating 016
No ALTER on existing tables
EEP impact: none (audit is BigFana governance; not an EEP sync surface)
```

### General conventions

```txt
BEGIN / COMMIT transaction wrapper
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
UUID PK DEFAULT gen_random_uuid()
TIMESTAMP WITHOUT TIME ZONE for created_at
ON DELETE RESTRICT for organization_id FK (nullable column)
No DB triggers
No seed data
No application logic in migration
```

---

## 4. Ownership and scope model

| Entity | Entity class | Scope |
|--------|--------------|--------|
| `audit_logs` | Dual-scope governance trail | `organization_id` NULLABLE |

**Rules:**

```txt
Organization-scoped business decisions → organization_id = that organization
Platform-scoped business decisions     → organization_id IS NULL
Never assign a fake organization_id to platform events
Org users query their organization_id
Platform admins may query platform rows and cross-org rows under privilege
```

---

## 5. Actor vs Origin

These are **orthogonal** dimensions. Both are required on every audit row.

### 5.1 Actor — who

| `actor_type` | Meaning |
|--------------|---------|
| `user` | Authenticated admin dashboard / admin API principal |
| `system` | Internal automated process that made a business decision |
| `integration` | Trusted external provider path that made a business decision |
| `anonymous` | Identity unavailable (rare; reserved) |

| Field | Rules |
|-------|-------|
| `actor_type` | Required; closed CHECK in Foundation v1 |
| `actor_id` | Optional soft identifier for the actor (UUID); no FK |

**`actor_id` semantics:**

```txt
user        → users.id (UUID soft ref)
system      → optional stable process UUID when one exists; else NULL
integration → optional stable integration/provider identity UUID; else NULL
anonymous   → NULL
```

SQL review correction (approved): `actor_id` / `origin_id` are `UUID NULL` soft references (not TEXT).

Fans are **not** actors in `audit_logs` for Foundation v1. Fan behavior remains in `fan_events`.

### 5.2 Origin — where

| `origin_type` | Meaning |
|---------------|---------|
| `dashboard` | Admin dashboard UI |
| `api` | HTTP / server-action / programmatic API entry |
| `system` | Internal system origin (scheduler, migration, maintenance path) |
| `integration` | Inbound integration channel (future webhooks, provider callbacks) |

| Field | Rules |
|-------|-------|
| `origin_type` | Required; closed CHECK in Foundation v1 |
| `origin_id` | Optional soft context for the origin (UUID); no FK |

**`origin_id` semantics (examples):**

```txt
dashboard   → optional surface/session UUID; else NULL
api         → optional request/correlation UUID (not payload); else NULL
system      → optional process UUID (not attempt counters); else NULL
integration → optional channel/message UUID (not raw webhook body); else NULL
```

### 5.3 Non-collapse examples

Valid combinations (illustrative):

| Actor | Origin | Meaning |
|-------|--------|---------|
| `user` | `dashboard` | Admin changed integration status in UI |
| `user` | `api` | Admin changed status via API token |
| `system` | `system` | Internal process applied a business decision |
| `integration` | `integration` | Provider-driven business decision via integration channel |
| `integration` | `api` | Provider called BigFana API as the entry surface |

**Forbidden:** storing only one of Actor/Origin, or encoding both into a single “source” field.

---

## 6. Business decision vs technical execution

### In `audit_logs` (business decision)

```txt
Integration registry enabled / paused / archived
Redemption approved / rejected / fulfilled (admin decision)
Content published / unpublished
Membership role granted / revoked
Platform suspended an organization
```

### Not in `audit_logs` (technical execution / ops)

```txt
integration_jobs status transitions (pending → processing → synced|failed)
Retry attempts, next_retry_at, max_attempts
Raw sync payloads / HTTP bodies / stack traces
Request latency, APM spans, log lines
EEP intelligence derivation
```

Correlation to jobs (if ever needed later) must not become a first-class execution log inside `audit_logs`. Foundation v1 does **not** add `integration_job_id` columns or FKs.

---

## 7. Entity identity

### Rules

```txt
entity_type  → stable vocabulary naming the business table/entity
entity_id    → UUID primary key of that entity in BigFana
```

`entity_id` **must** be the canonical BigFana primary key of the audited entity and remain stable for that entity’s lifetime.

| Entity example | `entity_type` | `entity_id` |
|----------------|---------------|-------------|
| Integration registry row | `integrations` | `integrations.id` |
| Redemption | `redemptions` | `redemptions.id` |
| Content | `content` | `content.id` |
| Reward | `rewards` | `rewards.id` |
| Organization (platform event) | `organizations` | `organizations.id` |

**Forbidden as `entity_id`:**

```txt
integration_jobs.id
Slugs / names / emails that can change
Composite display keys
Temporary request ids
EEP sync attempt ids
```

**EEP cache note:** If a future audit event targets an EEP-cached row, use BigFana PK (`audiences.id` / `segments.id`). External `eep_id` may appear only inside business `metadata` for correlation — it is not a substitute for `entity_id` in Foundation v1.

**Integration lifecycle (015):**  
Current state remains on `integrations`. Each business lifecycle decision writes an `audit_logs` row with `entity_type = 'integrations'` and `entity_id = integrations.id`.

---

## 8. Action vocabulary

`action` records the **business decision verb**.

### Foundation v1 closed CHECK

```txt
created
updated
status_changed
linked
unlinked
published
unpublished
approved
rejected
cancelled
fulfilled
archived
restored
```

Widening the action set requires an expand-only migration (same pattern as provider CHECK widening).

Application writers choose the most specific matching action (prefer `status_changed` / `approved` over generic `updated` when applicable).

---

## 9. Table specification

### Entity: `audit_logs`

**Purpose:** Append-only dual-scope trail of business decisions.

#### Columns

```txt
audit_logs
├── id               UUID        PK, DEFAULT gen_random_uuid()
├── organization_id  UUID        NULL, FK → organizations.id
├── actor_type       TEXT        NOT NULL
├── actor_id         UUID        NULL
├── origin_type      TEXT        NOT NULL
├── origin_id        UUID        NULL
├── action           TEXT        NOT NULL
├── entity_type      TEXT        NOT NULL
├── entity_id        UUID        NOT NULL
├── metadata         JSONB       NOT NULL, DEFAULT '{}'::jsonb
└── created_at       TIMESTAMP   NOT NULL, DEFAULT NOW()
```

#### Column semantics

| Column | Rules |
|--------|-------|
| `organization_id` | Tenant scope when org-owned; NULL for platform; never fake |
| `actor_type` / `actor_id` | Who — see §5.1 |
| `origin_type` / `origin_id` | Where — see §5.2 |
| `action` | Business decision verb — see §8 |
| `entity_type` | Business entity vocabulary (TEXT); Foundation starter set documented below |
| `entity_id` | Canonical stable BigFana entity PK — see §7 |
| `metadata` | Business decision context only — see §9.1 |
| `created_at` | Immutable event time (= insert time); no `updated_at` |

#### 9.1 `metadata` contract

```txt
Allowed examples:
  previous_status / new_status
  business reason codes
  field-level business diffs (non-secret)
  related canonical entity ids for linkage decisions

Forbidden examples:
  raw HTTP bodies
  credentials / secrets
  stack traces
  retry counters / job attempt payloads
  full integration_jobs rows
```

`metadata` supplements business context only and must never become the
authoritative source of current business state.

Default: `'{}'::jsonb`  
Shape is application-owned; DDL does not constrain JSON keys.

#### Constraints

**Foreign keys**

```txt
audit_logs_organization_fk
    organization_id → organizations.id
    ON DELETE RESTRICT
```

Nullable FK: platform rows omit `organization_id`.

**No FK** from `actor_id`, `origin_id`, or `entity_id` to business tables.

**CHECK**

```txt
audit_logs_actor_type_check
    actor_type IN (
        'user',
        'system',
        'integration',
        'anonymous'
    )

audit_logs_origin_type_check
    origin_type IN (
        'dashboard',
        'api',
        'system',
        'integration'
    )

audit_logs_action_check
    action IN (
        'created',
        'updated',
        'status_changed',
        'linked',
        'unlinked',
        'published',
        'unpublished',
        'approved',
        'rejected',
        'cancelled',
        'fulfilled',
        'archived',
        'restored'
    )
```

**Uniqueness**

```txt
None beyond PK
```

Duplicate business decisions at different times are valid distinct rows.

#### Indexes

```txt
audit_logs_organization_idx
    ON (organization_id)

audit_logs_organization_created_idx
    ON (organization_id, created_at DESC)

audit_logs_entity_idx
    ON (entity_type, entity_id)

audit_logs_entity_created_idx
    ON (entity_type, entity_id, created_at DESC)

audit_logs_actor_idx
    ON (actor_type, actor_id)

audit_logs_created_idx
    ON (created_at DESC)
```

---

## 10. Entity type vocabulary (documentation; not a CHECK)

Foundation v1 writers should use table-aligned names:

```txt
integrations
redemptions
rewards
benefits
content
sponsors
sponsor_organizations
organizations
memberships
users
campaigns
```

`entity_type` remains TEXT without CHECK so new auditable entities do not require a migration. Values must still name a real business entity, never `integration_jobs` or log streams.

Every emitted `entity_type` value must be documented as part of the platform's canonical entity vocabulary.

---

## 11. Relationships

```txt
organizations 1:N audit_logs   (optional; NULL for platform rows)

audit_logs N:1 (logical) auditable business entity
  via (entity_type, entity_id)
```

```txt
audit_logs.organization_id ──► organizations.id   (nullable)
```

**Conceptual (no DDL):**

```txt
integrations lifecycle decisions  → audit_logs rows
redemption admin decisions        → audit_logs rows
```

**Not modeled in 016:**

```txt
FK audit_logs.entity_id → polymorphic targets
FK audit_logs.actor_id → users
integration_job_id column
per-entity history tables
```

---

## 12. Append-only and retention

```txt
Application paths: INSERT only
No UPDATE of audit_logs rows
No DELETE of audit_logs rows for routine cleanup
Corrections: future compensating INSERT events (policy deferred)
Retention / cold archive / legal hold: deferred beyond Foundation v1
DDL does not encode purge windows
```

---

## 13. Deferred items

Explicitly **out of Migration 016**:

```txt
ALTER of any existing business table
integration_lifecycle_history
integration_job_id / execution correlation columns
FK to users / memberships for actor
DB triggers enforcing append-only privileges
RLS policies
SIEM export
Legal hold
Automated retention / purge
Hash-chaining / WORM
Credential / secret access auditing
Webhook ingress tables
Fan-facing activity history product surface
Specialized per-domain history tables
application-layer Drizzle schema changes (parallel track)
seed / historical backfill of pre-016 transitions
```

---

## 14. Validation checklist

### Pre-execution

- [x] Human approval of this Design Brief recorded
- [x] Branch is not `main`
- [x] Migrations 001–015 confirmed executed and validated in Neon
- [x] `organizations` exists for FK test inserts
- [x] Architecture freeze + three clarifications confirmed unchanged

### Post-execution — Schema

**`audit_logs`**

- [x] Table exists
- [x] PK `id` UUID with default
- [x] `organization_id` NULLABLE, FK RESTRICT → `organizations`
- [x] `actor_type` NOT NULL; CHECK accepts four values; rejects others
- [x] `actor_id` NULLABLE UUID (soft ref; no FK)
- [x] `origin_type` NOT NULL; CHECK accepts four values; rejects others
- [x] `origin_id` NULLABLE UUID (soft ref; no FK)
- [x] `action` NOT NULL; CHECK accepts Foundation v1 action set
- [x] `entity_type` NOT NULL TEXT
- [x] `entity_id` NOT NULL UUID
- [x] `metadata` NOT NULL JSONB default `{}`
- [x] `created_at` NOT NULL with default
- [x] No `updated_at` column
- [x] Indexes: organization, organization+created, entity, entity+created, actor, created

**Other tables**

- [x] `integrations` / `integration_jobs` schema unchanged

### Post-execution — Data / behavior

- [x] `SELECT COUNT(*) FROM audit_logs` = 0 (no seed)
- [x] Org-scoped insert with actor+origin succeeds
- [x] Platform-scoped insert (`organization_id` NULL) succeeds
- [x] Reject invalid actor_type / origin_type / action
- [x] Reject invalid `organization_id` when provided
- [x] DELETE organization blocked when org-scoped audit rows exist (RESTRICT)
- [x] Re-run migration idempotent (`IF NOT EXISTS`)

---

## 15. Rollback strategy

**Before application adoption:**

```txt
DROP TABLE IF EXISTS audit_logs;
```

**After application adoption:** dedicated reverse migration and forensic/data-preservation review required.

**Impact on `integrations` / `integration_jobs`:** none (untouched).

---

## 16. SQL generation notes (non-DDL; for implementer after approval)

```txt
File: database/migrations/foundation-v1/016_create_audit_logs.sql
Wrap in BEGIN / COMMIT
Follow 015 header comment style
CREATE audit_logs only — do not ALTER other tables
Document Actor vs Origin distinction in header comments
Document business-decision-only boundary vs integration_jobs
Document canonical entity_id = BigFana PK UUID
Document append-only (no updated_at)
Document dual-scope nullable organization_id
Do not add columns or tables beyond this brief
Do not generate SQL until this Design Brief is approved
```

---

## 17. References

```txt
docs/04-database/migration-plan-v1.md            → Migration 016
docs/04-database/foundation-db-backlog.md        → Phase 11 Audit Logs
docs/04-database/current-schema.md               → integrations lifecycle note → 016
docs/07-dashboard/dashboard-information-architecture.md → Audit Logs
docs/07-dashboard/permission-matrix.md           → audit_logs.view
docs/sessions/2026-07-17-migration-015-integration-registry-design.md
database/migrations/foundation-v1/015_create_integrations.sql
docs/decisions/ADR-003-eep-responsibilities.md
```

**Approved architecture inputs:**

```txt
Migration 016 Audit Layer Architecture Review (approved)
Required clarifications freeze (approved — Actor≠Origin; canonical entity ids; business decisions only)
No additional ADR required
```

---

## 18. Approval gate

| Item | Status |
|------|--------|
| Architecture freeze | Locked above |
| Clarifications (Actor/Origin, canonical ids, business-only) | Locked |
| Scope: `audit_logs` CREATE only | Locked |
| Column/constraint/index definitions | Approved (actor_id/origin_id → UUID soft refs) |
| SQL generation / Neon execution / validation | Complete — 38/38 |
| Documentation alignment | Complete |

**Next Foundation step:** Migration 017 — Deprecate Legacy Fan Ownership Architecture Review.

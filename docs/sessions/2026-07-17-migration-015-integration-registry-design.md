# Migration 015 — Integration Registry Foundation
## Design Brief

**Date:** 2026-07-17  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/015_create_integrations.sql`

---

## Architecture freeze (approved)

Locked before this Design Brief. Must not change during SQL generation or later review.

| Topic | Decision |
|-------|----------|
| What an Integration is | Org-owned provider enablement registry row |
| Ownership | BigFana owns registry; providers own external systems |
| Scope | Organization-owned (`organization_id` required) |
| Cardinality | Exactly **one** row per `(organization_id, provider)`, regardless of lifecycle state |
| Lifecycle history | Transitions update that row; historical records → future audit layer (016) |
| Provider identity | Stable platform vocabulary codes (e.g. `eep`) |
| Jobs relationship | Conceptual `integrations` 1:N `integration_jobs` |
| Jobs association (015) | Logical via `(organization_id, provider)` |
| Physical `integration_id` FK on jobs | **Deferred** — no safe expand-only path proven for 015 |
| Platform-scoped EEP audience/segment sync jobs | **Not defined** in 015; must not use artificial organization context |
| Credentials / connections / workers / webhooks / audit | Deferred |

---

## 1. Objective

Define the approved DDL scope for Foundation Database v1 Migration 015.

Introduce **Integration Registry Foundation** — the organization-owned `integrations` table that records which external providers an organization has enabled — without altering `integration_jobs`, credentials, connections, or sync workers.

**Business outcome:**

```txt
Organizations can have a durable enablement record per provider
Jobs remain the async execution plane (existing integration_jobs)
Future providers can be registered without redesigning the registry
```

**Non-outcomes (explicit):**

```txt
No ALTER of integration_jobs
No integration_id FK on jobs
No credential / secret storage
No connection sub-tables
No sync workers or webhook ingress
No platform-scoped job model for audience/segment sync
No application-layer / Drizzle changes in this migration
```

---

## 2. Architectural Invariants

Frozen for Migration 015.

```txt
- integrations is an organization-owned provider enablement registry.
- Exactly one registry row per (organization_id, provider), regardless of lifecycle state.
- Lifecycle transitions UPDATE that row; history belongs to the future audit layer.
- Provider codes are stable platform vocabulary.
- integrations and integration_jobs have a conceptual 1:N relationship.
- Existing organization-scoped jobs associate logically through (organization_id, provider).
- Physical integration_id FK on integration_jobs remains deferred.
- Migration 015 does not define platform-scoped EEP audience/segment synchronization jobs.
- Migration 015 must not assign platform cache sync to an artificial organization context.
- Credentials, connections, workers, webhook ingress, and audit remain deferred.
- Sync execution continues to follow ADR-003: asynchronous, retryable, idempotent, non-blocking.
- No triggers.
- No business logic inside DDL.
- Expand-only migration (CREATE integrations only).
```

---

## 3. Scope

### In scope (DDL)

```txt
CREATE TABLE integrations
```

### Tables affected

```txt
integrations (CREATE)
```

### Tables not affected

```txt
integration_jobs
organizations
fans, audiences, fan_audiences, segments, fan_segments
campaigns, sponsors, content
competitions, seasons, matches, standings
benefits, rewards, redemptions
All other Foundation DB v1 tables
```

### Data impact

```txt
Expand-only
No seed data
No backfill
No ALTER on integration_jobs
EEP impact: registry surface only (no live sync changes)
```

### General conventions

```txt
BEGIN / COMMIT transaction wrapper
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
UUID PK DEFAULT gen_random_uuid()
TIMESTAMP WITHOUT TIME ZONE for created_at / updated_at
ON DELETE RESTRICT for organization_id FK
No DB triggers
No seed data
No application logic in migration
```

---

## 4. Ownership

| Entity | Entity class | Scope |
|--------|--------------|--------|
| `integrations` | Organization-owned business data | `organization_id` required |

**Rules:**

```txt
BigFana owns the registry
External providers own their systems
Jobs remain BigFana-owned execution records (pre-existing)
```

---

## 5. Lifecycle

### Registry lifecycle (single row per org + provider)

| Status | Meaning |
|--------|---------|
| `draft` | Registered but not enabled for job acceptance |
| `active` | Enabled; org may enqueue/process jobs for this provider |
| `paused` | Temporarily disabled; retain row |
| `archived` | Soft-retired; retain row (no second row for same provider) |

Default: `draft`

**Cardinality rule:**

```txt
Re-enable after archive/pause → UPDATE the same row
Never INSERT a second (organization_id, provider) row
```

Lifecycle history is **not** stored in Migration 015. Future Migration 016 (Audit Layer) owns historical transition records.

### Job lifecycle (unchanged — out of DDL scope)

```txt
pending → processing → synced | failed | retrying
```

Owned by existing `integration_jobs`. Not modified by Migration 015.

---

## 6. Provider identity

| Rule | Value |
|------|-------|
| Representation | Opaque stable code in `provider` TEXT |
| Scope | Platform vocabulary (shared across orgs) |
| Initial known code | `eep` |
| Extensibility | New providers add new codes; no new registry tables |
| Uniqueness with org | UNIQUE `(organization_id, provider)` |

**Closed CHECK for Foundation v1:**

```txt
provider IN ('eep')
```

Adding a future provider requires an expand-only migration to widen the CHECK (or a later policy change). This keeps invalid codes out of Foundation while documenting the extension path.

Provider codes are **not** EEP entity IDs (`audiences.eep_id` / `segments.eep_id`).

---

## 7. Table specification

### Entity: `integrations`

**Purpose:** Organization-owned enablement registry for an external provider.

#### Columns

```txt
integrations
├── id               UUID        PK, DEFAULT gen_random_uuid()
├── organization_id  UUID        NOT NULL, FK → organizations.id
├── provider         TEXT        NOT NULL
├── status           TEXT        NOT NULL, DEFAULT 'draft'
├── created_at       TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at       TIMESTAMP   NOT NULL, DEFAULT NOW()
```

#### Column semantics

| Column | Rules |
|--------|-------|
| `organization_id` | Tenant boundary |
| `provider` | Stable platform provider code (see §6) |
| `status` | Registry enablement lifecycle (see §5) |
| `created_at` / `updated_at` | Foundation timestamps; no trigger; app updates `updated_at` on lifecycle changes |

#### Constraints

**Foreign keys**

```txt
integrations_organization_fk
    organization_id → organizations.id
    ON DELETE RESTRICT
```

**CHECK**

```txt
integrations_provider_check
    provider IN ('eep')

integrations_status_check
    status IN (
        'draft',
        'active',
        'paused',
        'archived'
    )
```

**Uniqueness**

```txt
integrations_organization_provider_unique
    UNIQUE (organization_id, provider)
```

Applies regardless of `status` (archived rows still occupy the identity).

#### Indexes

```txt
integrations_organization_idx
    ON (organization_id)

integrations_organization_status_idx
    ON (organization_id, status)

integrations_organization_provider_unique
    UNIQUE (organization_id, provider)

integrations_provider_idx
    ON (provider)
```

---

## 8. Relationships

```txt
organizations 1:N integrations
integrations  1:N integration_jobs   ← conceptual only in 015
```

```txt
integrations.organization_id ──► organizations.id
```

**Logical job association (no DDL FK in 015):**

```txt
integration_jobs.organization_id = integrations.organization_id
AND
integration_jobs.provider        = integrations.provider
```

**Not modeled in 015:**

```txt
integration_jobs.integration_id FK
credentials / secrets columns
connection sub-tables
webhook tables
platform-scoped jobs without organization_id
```

---

## 9. Deferred items

Explicitly **out of Migration 015**:

```txt
ALTER integration_jobs
integration_id FK on integration_jobs
integration_connections
credential / secret storage
sync workers / processors
webhook ingress tables
platform-scoped EEP audience/segment sync job model
artificial organization context for platform sync

audit_logs / lifecycle history (Migration 016)
widening provider CHECK beyond 'eep' (future expand-only migration when needed)

DB trigger for updated_at
seed data
application-layer Drizzle schema changes (parallel track)
```

---

## 10. Validation checklist

### Pre-execution

- [ ] Human approval of this Design Brief recorded
- [ ] Branch is not `main`
- [ ] Migrations 001–014 confirmed executed and validated in Neon
- [ ] `organizations` exists for FK test inserts
- [ ] `integration_jobs` schema unchanged baseline noted

### Post-execution — Schema

**`integrations`**

- [ ] Table exists
- [ ] PK `id` UUID with default
- [ ] `organization_id` NOT NULL, FK RESTRICT → `organizations`
- [ ] `provider` NOT NULL; CHECK accepts `eep`; rejects others
- [ ] `status` NOT NULL, default `draft`; CHECK accepts four values
- [ ] UNIQUE `(organization_id, provider)`
- [ ] `created_at` / `updated_at` NOT NULL with defaults
- [ ] Indexes: organization, organization+status, provider

**`integration_jobs`**

- [ ] Schema unchanged (no new columns, no new FKs)

### Post-execution — Data / behavior

- [ ] `SELECT COUNT(*) FROM integrations` = 0 (no seed)
- [ ] Valid insert `(org, eep, draft)` succeeds
- [ ] Reject duplicate `(organization_id, provider)` even if status differs
- [ ] Reject invalid provider / status
- [ ] Reject invalid `organization_id`
- [ ] DELETE organization blocked when integrations exist (RESTRICT)
- [ ] Re-run migration idempotent (`IF NOT EXISTS`)

---

## 11. Rollback strategy

**Before application adoption:**

```txt
DROP TABLE IF EXISTS integrations;
```

**After application adoption:** dedicated reverse migration and data preservation review required.

**Impact on `integration_jobs`:** none (untouched).

---

## 12. SQL generation notes (non-DDL; for implementer after approval)

```txt
File: database/migrations/foundation-v1/015_create_integrations.sql
Wrap in BEGIN / COMMIT
Follow 014 header comment style
CREATE integrations only — do not ALTER integration_jobs
Document frozen Architecture decisions in header comments
Document logical job association via (organization_id, provider)
Document that platform-scoped audience/segment sync jobs are out of scope
Do not add columns or tables beyond this brief
```

---

## 13. References

```txt
docs/04-database/migration-plan-v1.md            → Migration 015
docs/04-database/physical-model-v1.md            → Integration Domain
docs/04-database/current-schema.md               → integration_jobs (existing)
docs/08-integrations/integrations-strategy.md
docs/decisions/ADR-003-eep-responsibilities.md
docs/04-database/foundation-db-backlog.md        → Phase 10
010_create_sponsors.sql                          → status / RESTRICT precedent
013_create_eep_audiences.sql                     → Foundation DDL style
src/db/schema/integrations.ts                    → existing jobs shape (reference only)
```

**Approved architecture inputs:**

```txt
Migration 015 Integration Registry Architecture Review (approved)
Required clarifications freeze (approved — listed in Architecture freeze)
```

---

## 14. Approval gate

| Item | Status |
|------|--------|
| Architecture freeze | Locked above |
| Scope: `integrations` CREATE only | Locked |
| No `integration_jobs` ALTER / FK | Locked |
| Column/constraint/index definitions | Approved |
| SQL generation / Neon execution / validation | Complete |
| Documentation alignment | Complete |

**Next Foundation step:** Migration 016 — Audit Layer Architecture Review.

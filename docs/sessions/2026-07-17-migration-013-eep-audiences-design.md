# Migration 013 — EEP Audiences Foundation
## Design Brief

**Date:** 2026-07-17  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/013_create_eep_audiences.sql`

---

## 1. Objective

Define the approved DDL scope for Foundation Database v1 Migration 013.

Introduce **EEP Audiences Foundation** — BigFana’s local cache of EEP-owned audiences and fan memberships — without segments, activation FKs, or integration job orchestration.

**Business outcome:**

```txt
BigFana can store EEP audience definitions locally
BigFana can store fan ↔ audience membership locally
Campaigns / sponsors can later activate against cached audiences
Fan UX never depends on synchronous EEP availability
```

**Non-outcomes (explicit):**

```txt
No EEP segment cache (Migration 014)
No campaign ↔ audience targeting tables
No sponsor ↔ audience tables
No BigFana-authored audience CRUD as source of truth
No application-layer / Drizzle changes in this migration
```

---

## 2. Architectural Invariants

Frozen for Migration 013. Must not change during SQL generation or later review.

```txt
- EEP is the source of truth for audiences and memberships.
- BigFana stores a local cache only.
- audiences is platform-scoped (no organization_id).
- fan_audiences is platform-scoped (no organization_id).
- Organization scope applies only at activation time (later migrations / app).
- EEP Audience ID is globally unique across all organizations (ADR-007).
- EEP Audience ID is stable for the lifetime of the audience (ADR-007).
- EEP Audience ID is never reused for a different audience (ADR-007).
- eep_id is the idempotent upsert key for the audiences cache.
- Audience lifecycle is sync-driven (not a BigFana catalog draft/active workflow).
- Membership is EEP-derived N:N (fan ↔ audience); not computed in SQL.
- fan_segment_rules remains BigFana-owned and is not part of this migration.
- segments / fan_segments are deferred to Migration 014.
- No triggers.
- No business logic inside DDL.
- Expand-only migration.
```

---

## 3. Scope

### In scope (DDL)

```txt
CREATE TABLE audiences
CREATE TABLE fan_audiences
```

### Tables affected

```txt
audiences      (CREATE)
fan_audiences  (CREATE)
```

### Tables not affected

```txt
fans
organizations
fan_organizations
fan_segment_rules
fan_experiences
segments, fan_segments (future 014)
campaigns, sponsors
competitions, seasons, matches, standings
content
integration_jobs
All other Foundation DB v1 tables
```

### Data impact

```txt
Expand-only
No seed data
No backfill
No ALTER on existing tables
EEP impact: cache surface only (no live sync in this migration)
```

### General conventions

```txt
BEGIN / COMMIT transaction wrapper
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
UUID PK DEFAULT gen_random_uuid()
TIMESTAMP WITHOUT TIME ZONE for created_at / updated_at
ON DELETE RESTRICT for all business FKs
No DB triggers
No seed data
No application logic in migration
```

---

## 4. Ownership

| Entity | Entity class | Scope |
|--------|--------------|--------|
| `audiences` | EEP intelligence cache | Platform (no `organization_id`) |
| `fan_audiences` | EEP membership cache | Platform (no `organization_id`) |

**Rules:**

```txt
EEP owns audience definitions and membership
BigFana caches for local read / future activation
Fans are global (ADR-001) — membership uses fan_id
organization_id is intentionally absent
```

---

## 5. Lifecycle

```txt
EEP create / update / retire audience
        ↓ async sync (future integration)
BigFana audiences upsert by eep_id
        ↓
EEP membership export
        ↓
BigFana fan_audiences upsert / replace
```

| Concern | Owner |
|---------|--------|
| Audience identity | EEP (`eep_id`) |
| Audience display fields | EEP → cache |
| Membership set | EEP → cache |
| Activation (campaigns, sponsors) | BigFana (later) |

**Retirement:** Sync-driven. Migration 013 does **not** introduce a BigFana catalog status workflow (`draft` / `active` / …). Soft-retire / hard-remove mechanics are application/integration concerns after DDL exists.

---

## 6. Table responsibilities

### 6.1 `audiences`

**Purpose:** Local cache of an EEP Audience definition.

**Responsibilities:**

```txt
Store globally unique eep_id (ADR-007)
Store display name / optional description
Support idempotent upsert by eep_id
```

**Not responsible for:**

```txt
Organization tenancy
Membership lists
Segment classification
Campaign targeting
Sync job orchestration
```

#### Columns

```txt
audiences
├── id            UUID        PK, DEFAULT gen_random_uuid()
├── eep_id        TEXT        NOT NULL
├── name          TEXT        NOT NULL
├── description   TEXT        NULL
├── created_at    TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at    TIMESTAMP   NOT NULL, DEFAULT NOW()
```

#### Column semantics

| Column | Rules |
|--------|-------|
| `eep_id` | Globally unique, stable, never-reused EEP Audience ID (ADR-007); upsert key |
| `name` | Display name from EEP; not a uniqueness key |
| `description` | Optional text from EEP |
| `created_at` / `updated_at` | Foundation timestamps; `updated_at` also signals cache freshness; no trigger |

#### Constraints

**Uniqueness**

```txt
audiences_eep_id_unique
    UNIQUE INDEX ON (eep_id)
```

Exact match uniqueness (EEP IDs are opaque integration identifiers — not case-folded display slugs).

**No** `organization_id`.  
**No** catalog `status` CHECK in Migration 013.

#### Indexes

```txt
audiences_eep_id_unique
    UNIQUE ON (eep_id)

audiences_name_idx
    ON (name)
```

`audiences_name_idx` supports admin listing/search; name uniqueness is not enforced.

---

### 6.2 `fan_audiences`

**Purpose:** Local cache of fan membership in an EEP Audience.

**Responsibilities:**

```txt
Record fan ↔ audience membership
Enforce one row per pair
```

**Not responsible for:**

```txt
Organization tenancy
Computing membership from rules
Segment membership (014)
```

#### Columns

```txt
fan_audiences
├── id            UUID        PK, DEFAULT gen_random_uuid()
├── fan_id        UUID        NOT NULL, FK → fans.id
├── audience_id   UUID        NOT NULL, FK → audiences.id
├── created_at    TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at    TIMESTAMP   NOT NULL, DEFAULT NOW()
```

#### Column semantics

| Column | Rules |
|--------|-------|
| `fan_id` | Global fan (ADR-001) |
| `audience_id` | Cached audience row (BigFana UUID PK) |
| `created_at` / `updated_at` | Foundation timestamps; no trigger |

#### Constraints

**Foreign keys**

```txt
fan_audiences_fan_fk
    fan_id → fans.id
    ON DELETE RESTRICT

fan_audiences_audience_fk
    audience_id → audiences.id
    ON DELETE RESTRICT
```

**Uniqueness**

```txt
fan_audiences_unique_membership
    UNIQUE (fan_id, audience_id)
```

**No** `organization_id`.

#### Indexes

```txt
fan_audiences_fan_idx
    ON (fan_id)

fan_audiences_audience_idx
    ON (audience_id)

fan_audiences_unique_membership
    UNIQUE (fan_id, audience_id)
```

---

## 7. Relationships

```txt
audiences 1:N fan_audiences
fans      1:N fan_audiences
```

```txt
fan_audiences.fan_id      ──► fans.id
fan_audiences.audience_id ──► audiences.id
```

**Identity path for sync:**

```txt
EEP Audience ID  →  audiences.eep_id  →  audiences.id  →  fan_audiences.audience_id
```

**Not modeled:**

```txt
organization_id on audiences
organization_id on fan_audiences
campaign_id / sponsor_id FKs
segments / fan_segments
scores / recommendations
```

---

## 8. Deferred items

Explicitly **out of Migration 013**:

```txt
segments
fan_segments

campaign ↔ audience targeting
sponsor ↔ audience linkage

organization_id on audiences or fan_audiences
BigFana catalog status workflow (draft / active / …)
is_active / retired flags (defer until sync retire contract needs them)

raw EEP JSON payload columns
sync_status / sync_error / last_synced_at beyond updated_at
integration_jobs changes (Migration 015)
altering fan_segment_rules

DB trigger for updated_at
seed data
application-layer Drizzle schema changes (parallel track)
```

**Migration 014:** EEP Segments Foundation (`segments`, `fan_segments`) — same cache pattern expected; segment identity may need its own contract confirmation if not covered by analogy to ADR-007.

---

## 9. Validation checklist

### Pre-execution

- [ ] Human approval of this Design Brief recorded
- [ ] ADR-007 Status = Accepted
- [ ] Branch is not `main`
- [ ] Migrations 001–012 confirmed executed and validated in Neon
- [ ] `fans` table exists for FK test inserts

### Post-execution — Schema

**`audiences`**

- [ ] Table exists
- [ ] PK `id` UUID with default
- [ ] `eep_id` NOT NULL
- [ ] Unique index/constraint on `eep_id`
- [ ] `name` NOT NULL; `description` nullable
- [ ] `created_at` / `updated_at` NOT NULL with defaults
- [ ] **No `organization_id` column**
- [ ] No catalog `status` column
- [ ] Index on `name`

**`fan_audiences`**

- [ ] Table exists
- [ ] FKs RESTRICT → `fans`, `audiences`
- [ ] UNIQUE `(fan_id, audience_id)`
- [ ] Indexes on `fan_id`, `audience_id`
- [ ] `created_at` / `updated_at` present
- [ ] **No `organization_id` column**

### Post-execution — Data / behavior

- [ ] `SELECT COUNT(*)` on both tables = 0 (no seed)
- [ ] Valid insert: audience by `eep_id` → fan_audiences membership
- [ ] Reject duplicate `eep_id`
- [ ] Reject duplicate `(fan_id, audience_id)`
- [ ] Reject invalid `fan_id` / `audience_id`
- [ ] DELETE audience blocked when memberships exist (RESTRICT)
- [ ] DELETE fan blocked when memberships exist (RESTRICT)
- [ ] Re-run migration idempotent (`IF NOT EXISTS`)

### Cross-domain

- [ ] `fan_segment_rules` unchanged
- [ ] No `segments` / `fan_segments` tables created
- [ ] Campaigns / sponsors unchanged

---

## 10. Rollback strategy

**Before application adoption and before Migration 014 depends on these tables:**

```txt
DROP TABLE IF EXISTS fan_audiences;
DROP TABLE IF EXISTS audiences;
```

Order matters: drop children before parents.

**After application adoption:** dedicated reverse migration and data preservation review required.

**EEP impact of rollback:** none (cache only; EEP remains source of truth).

---

## 11. SQL generation notes (non-DDL; for implementer after approval)

```txt
File: database/migrations/foundation-v1/013_create_eep_audiences.sql
Wrap in BEGIN / COMMIT
Follow 012 header comment style
Create tables in order: audiences → fan_audiences
Do NOT add organization_id
Document ADR-007 identity guarantees in header comments
Do not add columns or tables beyond this brief
```

---

## 12. References

```txt
docs/decisions/ADR-007-eep-audience-identity.md   → Accepted contract
docs/decisions/ADR-003-eep-responsibilities.md
docs/decisions/ADR-001-global-fan-model.md
docs/decisions/ADR-006-global-sports-community-vision.md
docs/05-eep/eep-architecture.md
docs/05-eep/eep-segmentation-strategy.md
docs/04-database/migration-plan-v1.md            → Migration 013
docs/04-database/physical-model-v1.md            → EEP Domain
004_create_competition_organizations.sql         → junction UNIQUE + RESTRICT precedent
012_create_match_center.sql                      → Foundation DDL style
```

**Approved architecture inputs:**

```txt
Migration 013 EEP Audiences Architecture Review (approved)
ADR-007 EEP Audience Identity (Accepted)
Audience vs segment separation (approved — segments → 014)
```

---

## 13. Approval gate

| Item | Status |
|------|--------|
| Scope: `audiences` + `fan_audiences` only | Locked |
| Architectural Invariants | Locked |
| ADR-007 identity contract | Accepted |
| Column/constraint/index definitions | Approved |
| SQL generation / Neon execution / validation | Complete |
| Documentation alignment | Complete |

**Next Foundation step:** Migration 014 — EEP Segments Architecture Review.

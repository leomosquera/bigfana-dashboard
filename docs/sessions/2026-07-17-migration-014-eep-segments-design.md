# Migration 014 — EEP Segments Foundation
## Design Brief

**Date:** 2026-07-17  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/014_create_eep_segments.sql`

---

## Architecture freeze (approved)

Locked before this Design Brief. Must not change during SQL generation or later review.

| Topic | Decision |
|-------|----------|
| Identity contract | ADR-008 Accepted |
| Entity ownership | EEP owns segments and memberships |
| Source of truth | EEP |
| BigFana role | Local cache only |
| Platform vs org scope | Platform-scoped — **no `organization_id`** |
| Segment semantics | Logical classification of fans (not activation audiences) |
| Membership | N:N via `fan_segments` (`fan` ↔ `segment`) |
| Surrogate vs canonical | `segments.id` = BigFana surrogate; `eep_id` = canonical sync key |
| Parallel to 013 | Same cache pattern as `audiences` / `fan_audiences` |
| Beyond 014 | Scores, recommendations, activation FKs, sync jobs, `fan_segment_rules` changes |

```txt
IN SCOPE
  segments
  fan_segments

OUT OF SCOPE
  audiences / fan_audiences changes
  organization_id on segment tables
  segment retirement state columns
  campaign / sponsor targeting FKs
  scores / recommendations
  altering fan_segment_rules
  integration_jobs (Migration 015)
```

---

## 1. Objective

Define the approved DDL scope for Foundation Database v1 Migration 014.

Introduce **EEP Segments Foundation** — BigFana’s local cache of EEP-owned segments and fan memberships — without activation FKs, scores, or integration job orchestration.

**Business outcome:**

```txt
BigFana can store EEP segment definitions locally
BigFana can store fan ↔ segment membership locally
Classification can be read without synchronous EEP availability
Audiences (013) and segments (014) remain distinct cache layers
```

**Non-outcomes (explicit):**

```txt
No audience table changes
No BigFana-authored segment CRUD as source of truth
No campaign / sponsor targeting FKs
No application-layer / Drizzle changes in this migration
```

---

## 2. Architectural Invariants

Frozen for Migration 014.

```txt
- EEP is the source of truth for segments and memberships.
- BigFana stores a local cache only.
- segments is platform-scoped (no organization_id).
- fan_segments is platform-scoped (no organization_id).
- EEP Segment ID is globally unique across all organizations (ADR-008).
- EEP Segment ID is stable for the lifetime of the segment (ADR-008).
- EEP Segment ID is never reused for a different segment (ADR-008).
- eep_id is the idempotent synchronization / upsert key.
- segments.id (UUID) is a BigFana internal surrogate key only.
- eep_id is the canonical external synchronization identifier.
- Segment lifecycle is sync-driven (not a BigFana catalog draft/active workflow).
- Membership is EEP-derived N:N (fan ↔ segment); not computed in SQL.
- Segments classify fans; audiences activate fans — domains remain separate.
- fan_segment_rules remains BigFana-owned and is not part of this migration.
- No triggers.
- No business logic inside DDL.
- Expand-only migration.
```

---

## 3. Scope

### In scope (DDL)

```txt
CREATE TABLE segments
CREATE TABLE fan_segments
```

### Tables affected

```txt
segments      (CREATE)
fan_segments  (CREATE)
```

### Tables not affected

```txt
audiences, fan_audiences
fans
organizations
fan_organizations
fan_segment_rules
fan_experiences
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
| `segments` | EEP intelligence cache | Platform (no `organization_id`) |
| `fan_segments` | EEP membership cache | Platform (no `organization_id`) |

**Rules:**

```txt
EEP owns segment definitions and membership
BigFana caches for local read / future intelligence consumption
Fans are global (ADR-001) — membership uses fan_id
organization_id is intentionally absent
```

---

## 5. Lifecycle

```txt
EEP create / update / retire segment
        ↓ async sync (future integration)
BigFana segments upsert by eep_id
        ↓
EEP membership export
        ↓
BigFana fan_segments upsert / replace
```

| Concern | Owner |
|---------|--------|
| Segment identity | EEP (`eep_id`) |
| Segment display fields | EEP → cache |
| Membership set | EEP → cache |
| Local surrogate PK | BigFana (`segments.id`) |

**Retirement:** Sync-driven. Migration 014 intentionally stores **no** segment retirement state (`status` / `is_active` / `retired`). Soft-retire / hard-remove mechanics are application/integration concerns after DDL exists.

**Timestamps:** `updated_at` is maintained by the application during successful synchronization (no DB trigger).

---

## 6. Segment semantics

| Concept | Meaning |
|---------|---------|
| Segment | Logical classification of fans (e.g. VIP, At Risk, Highly Engaged) |
| Audience (013) | Group available for activation (campaigns / sponsors) |

```txt
Segments classify
Audiences activate
```

No FK between `segments` and `audiences` in Migration 014.

---

## 7. Table responsibilities

### 7.1 `segments`

**Purpose:** Local cache of an EEP Segment definition.

**Responsibilities:**

```txt
Store globally unique eep_id (ADR-008)
Store display name / optional description
Support idempotent upsert by eep_id
```

**Not responsible for:**

```txt
Organization tenancy
Membership lists
Audience activation
Scores / recommendations
Sync job orchestration
```

#### Columns

```txt
segments
├── id            UUID        PK, DEFAULT gen_random_uuid()   ← surrogate only
├── eep_id        TEXT        NOT NULL                       ← canonical sync ID
├── name          TEXT        NOT NULL
├── description   TEXT        NULL
├── created_at    TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at    TIMESTAMP   NOT NULL, DEFAULT NOW()
```

#### Column semantics

| Column | Rules |
|--------|-------|
| `id` | BigFana internal surrogate UUID only — not an EEP identity |
| `eep_id` | Globally unique, stable, never-reused EEP Segment ID (ADR-008); upsert key |
| `name` | Display name from EEP; not a uniqueness key |
| `description` | Optional text from EEP |
| `created_at` / `updated_at` | Foundation timestamps; `updated_at` signals cache freshness; app-maintained on sync |

#### Constraints

```txt
segments_eep_id_unique
    UNIQUE INDEX ON (eep_id)
```

Exact match uniqueness (opaque integration identifiers — not case-folded display slugs).

**No** `organization_id`.  
**No** catalog `status` / retirement columns.

#### Indexes

```txt
segments_eep_id_unique
    UNIQUE ON (eep_id)

segments_name_idx
    ON (name)
```

---

### 7.2 `fan_segments`

**Purpose:** Local cache of fan membership in an EEP Segment.

**Responsibilities:**

```txt
Record fan ↔ segment membership
Enforce one row per pair
```

**Not responsible for:**

```txt
Organization tenancy
Computing membership from fan_segment_rules
Audience membership (013)
```

#### Columns

```txt
fan_segments
├── id            UUID        PK, DEFAULT gen_random_uuid()
├── fan_id        UUID        NOT NULL, FK → fans.id
├── segment_id    UUID        NOT NULL, FK → segments.id
├── created_at    TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at    TIMESTAMP   NOT NULL, DEFAULT NOW()
```

#### Column semantics

| Column | Rules |
|--------|-------|
| `fan_id` | Global fan (ADR-001) |
| `segment_id` | Cached segment row (BigFana surrogate UUID PK) |
| `created_at` / `updated_at` | Foundation timestamps; no trigger |

#### Constraints

**Foreign keys**

```txt
fan_segments_fan_fk
    fan_id → fans.id
    ON DELETE RESTRICT

fan_segments_segment_fk
    segment_id → segments.id
    ON DELETE RESTRICT
```

**Uniqueness**

```txt
fan_segments_unique_membership
    UNIQUE (fan_id, segment_id)
```

**No** `organization_id`.

#### Indexes

```txt
fan_segments_fan_idx
    ON (fan_id)

fan_segments_segment_idx
    ON (segment_id)

fan_segments_unique_membership
    UNIQUE (fan_id, segment_id)
```

---

## 8. Relationships

```txt
segments 1:N fan_segments
fans     1:N fan_segments
```

```txt
fan_segments.fan_id     ──► fans.id
fan_segments.segment_id ──► segments.id
```

**Identity path for sync:**

```txt
EEP Segment ID  →  segments.eep_id  →  segments.id  →  fan_segments.segment_id
```

**Not modeled:**

```txt
organization_id on segments
organization_id on fan_segments
FK between segments and audiences
campaign_id / sponsor_id FKs
scores / recommendations
```

---

## 9. Deferred items

Explicitly **out of Migration 014**:

```txt
organization_id on segments or fan_segments
segment retirement state (status / is_active / retired)
raw EEP JSON payload columns
sync_status / sync_error / last_synced_at beyond updated_at
integration_jobs changes (Migration 015)

campaign ↔ segment targeting
sponsor ↔ segment linkage
scores / recommendations tables

altering fan_segment_rules
altering audiences / fan_audiences

DB trigger for updated_at
seed data
application-layer Drizzle schema changes (parallel track)
```

---

## 10. Validation checklist

### Pre-execution

- [ ] Human approval of this Design Brief recorded
- [ ] ADR-008 Status = Accepted
- [ ] Branch is not `main`
- [ ] Migrations 001–013 confirmed executed and validated in Neon
- [ ] `fans` table exists for FK test inserts

### Post-execution — Schema

**`segments`**

- [ ] Table exists
- [ ] PK `id` UUID with default (surrogate)
- [ ] `eep_id` NOT NULL
- [ ] Unique index on `eep_id`
- [ ] `name` NOT NULL; `description` nullable
- [ ] `created_at` / `updated_at` NOT NULL with defaults
- [ ] **No `organization_id` column**
- [ ] No retirement/status columns
- [ ] Index on `name`

**`fan_segments`**

- [ ] Table exists
- [ ] FKs RESTRICT → `fans`, `segments`
- [ ] UNIQUE `(fan_id, segment_id)`
- [ ] Indexes on `fan_id`, `segment_id`
- [ ] **No `organization_id` column**

### Post-execution — Data / behavior

- [ ] `SELECT COUNT(*)` on both tables = 0 (no seed)
- [ ] Valid insert: segment by `eep_id` → fan_segments membership
- [ ] Reject duplicate `eep_id`
- [ ] Reject duplicate `(fan_id, segment_id)`
- [ ] Reject invalid FKs
- [ ] DELETE segment blocked when memberships exist (RESTRICT)
- [ ] DELETE fan blocked when memberships exist (RESTRICT)
- [ ] Re-run migration idempotent (`IF NOT EXISTS`)

### Cross-domain

- [ ] `audiences` / `fan_audiences` unchanged
- [ ] `fan_segment_rules` unchanged
- [ ] No campaign / sponsor FKs added

---

## 11. Rollback strategy

**Before application adoption and before later migrations depend on these tables:**

```txt
DROP TABLE IF EXISTS fan_segments;
DROP TABLE IF EXISTS segments;
```

Order matters: drop children before parents.

**After application adoption:** dedicated reverse migration and data preservation review required.

**EEP impact of rollback:** none (cache only; EEP remains source of truth).

---

## 12. SQL generation notes (non-DDL; for implementer after approval)

```txt
File: database/migrations/foundation-v1/014_create_eep_segments.sql
Wrap in BEGIN / COMMIT
Follow 013 header comment style
Create tables in order: segments → fan_segments
Do NOT add organization_id
Document ADR-008 identity guarantees + surrogate vs eep_id in header
Document no retirement state; updated_at app-maintained on successful sync
Do not add columns or tables beyond this brief
```

---

## 13. References

```txt
docs/decisions/ADR-008-eep-segment-identity.md   → Accepted contract
docs/decisions/ADR-007-eep-audience-identity.md
docs/decisions/ADR-003-eep-responsibilities.md
docs/decisions/ADR-001-global-fan-model.md
docs/05-eep/eep-architecture.md
docs/05-eep/eep-segmentation-strategy.md
docs/04-database/migration-plan-v1.md            → Migration 014
docs/04-database/physical-model-v1.md            → EEP Domain
013_create_eep_audiences.sql                     → parallel cache precedent
```

**Approved architecture inputs:**

```txt
Migration 014 Architecture Review paused → ADR-008 path (approved)
ADR-008 EEP Segment Identity (Accepted)
Surrogate vs eep_id editorial clarification (approved)
Audience vs segment separation (approved)
```

---

## 14. Approval gate

| Item | Status |
|------|--------|
| Architecture freeze | Locked above |
| Scope: `segments` + `fan_segments` only | Locked |
| Architectural Invariants | Locked |
| ADR-008 identity contract | Accepted |
| Column/constraint/index definitions | Approved |
| SQL generation / Neon execution / validation | Complete |
| Documentation alignment | Complete |

**Next Foundation step:** Migration 015 — Integration Registry Architecture Review.

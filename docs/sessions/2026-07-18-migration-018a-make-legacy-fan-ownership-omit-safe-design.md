# Migration 018a — Make Legacy Fan Ownership Omit-Safe
## Design Brief

**Date:** 2026-07-18  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/018a_make_legacy_fan_ownership_omit_safe.sql`  
**Contract:** ADR-009 Accepted — Frozen  
**New ADR:** Not required

---

## Architecture freeze (approved)

Locked before this Design Brief. Must not change during SQL generation or later review.

| Topic | Decision |
|-------|----------|
| Contract | ADR-009 Legacy Fan Ownership Deprecation Contract |
| Source of truth | `fan_organizations` only |
| Legacy column | `fans.organization_id` — DEPRECATED / non-authoritative |
| Approved strategy | Option B — Staged Contract |
| Migration 017 | Deprecation (COMMENT) — **COMPLETE** |
| Migration **018a** | Make column **omit-safe** (`NOT NULL` → **NULLABLE**) |
| Application **F2** | Stop projection write + remove Drizzle mapping — **after 018a** |
| Migration **018b** | Physical DROP (column + FK + index) — **after post-F2 gates** |
| Migration 019 | Remove Legacy Organization Sport — **unchanged / out of scope** |
| Business writes | Only to `fan_organizations` |
| Compatibility projection | Implementation detail only — never a second business persistence model |
| Peer dual-write | Forbidden |
| DROP column / FK / index | Forbidden in 018a |
| Application / Drizzle changes | Forbidden in 018a |

### Frozen contract sequence

```txt
017   = deprecation — COMPLETE
018a  = Make Legacy Fan Ownership Omit-Safe (this migration)
F2    = stop projection write + remove Drizzle mapping + re-gate
018b  = Physical Remove Legacy Fan Ownership (BLOCKED until post-F2 gates)
019   = Remove Legacy Organization Sport (unchanged)
```

### Why 018a exists

Application and database are independently deployed. Old and new app versions may temporarily coexist against the same Neon database.

```txt
OLD APP  → may continue writing fans.organization_id (PRIMARY projection)
NEW APP  → may omit fans.organization_id after F2
SHARED DB → must accept BOTH behaviors during rollout
```

Therefore the intermediate physical state must be:

```txt
fans.organization_id UUID NULL
```

while retaining the column, FK, index, and DEPRECATED comment.

---

## Definitions (from ADR-009 — unchanged)

**Approved consumer**

```txt
Any retained reader or writer of fans.organization_id
that has not yet been formally retired during the contract phase.

Includes: application services, reports, exports, scripts,
operational tooling.
```

**Compatibility projection**

```txt
Temporary mirror of canonical PRIMARY organization_id
from fan_organizations onto fans.organization_id.

Implementation detail only.
Must never become a second business persistence model.
```

**ADR-009 nullability interpretation (confirmed)**

```txt
ADR-009 transition invariant:

  If fans.organization_id IS NOT NULL,
  it must equal the canonical PRIMARY organization_id
  in fan_organizations
  OR no approved consumer still depends on the legacy column.

Making the deprecated projection NULLABLE is consistent with ADR-009.
ADR-009 does not require the projection to remain NOT NULL.
```

---

## 1. Objective

Define the approved scope for Foundation Database v1 Migration **018a**.

Make `fans.organization_id` **omit-safe** for staged application cutover — by changing nullability from `NOT NULL` to `NULL` — without physically removing the column, without altering FK/index/comment semantics, and without any application or Drizzle change in this migration.

**Business outcome:**

```txt
Shared Neon DB can accept:
  - old app INSERTs that supply organization_id
  - future F2 app INSERTs that omit organization_id

Canonical ownership remains fan_organizations only
Legacy column remains DEPRECATED / non-authoritative / compatibility-only
Deployment compatibility window unlocked for Application F2
```

**Non-outcomes (explicit):**

```txt
No DROP of fans.organization_id
No DROP of fans_organization_id_fkey
No DROP of idx_fans_org
No RENAME
No type change (remains UUID)
No DEFAULT introduced
No comment rewrite required (Migration 017 DEPRECATED comment retained)
No fan_organizations changes
No data backfill / mutation
No application / Drizzle / F2 work in this migration
No Migration 018b Design Brief or SQL
No Migration 019 work
```

---

## 2. Architectural Invariants

Frozen for Migration 018a.

```txt
- ADR-009 is Accepted and Frozen.
- fan_organizations is the sole authoritative fan↔org relationship.
- fans.organization_id is DEPRECATED and non-authoritative.
- Business commands write only to fan_organizations.
- Any temporary fans.organization_id write is a compatibility projection
  of PRIMARY only — never an independent business write.
- Compatibility projection must never become a second business persistence model.
- Peer dual-write is forbidden.
- New features must not use fans.organization_id as ownership.
- While approved consumers / writers remain (current app through F2),
  non-null legacy values must stay consistent with PRIMARY
  (ADR-009 transition invariant).
- 018a changes nullability only — column remains physically present.
- Physical removal is Migration 018b only, after post-F2 gates.
- Migration 019 (organizations.sport) is unrelated and unchanged.
- No application behavior change in 018a.
- Current projection writer remains active until F2.
- Current Drizzle mapping remains active until F2.
```

---

## 3. Scope

### In scope (DDL)

```txt
ALTER fans.organization_id
  DROP NOT NULL
  (nullability only: NOT NULL → NULLABLE)
```

Exact SQL syntax is deferred to SQL generation after this Design Brief is approved.

### In scope (documentation / validation — non-DDL)

```txt
Record omit-safe contract in migration header
Provide schema / consistency / insert-behavior validation queries
Document staged sequence 018a → F2 → 018b
```

### Tables affected

```txt
fans (nullability of organization_id only)
```

### Tables not affected

```txt
fan_organizations
organizations
All other Foundation DB v1 tables
```

### Objects that must remain unchanged

```txt
fans.organization_id column existence
UUID type
No column DEFAULT
fans_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
  ON DELETE CASCADE
idx_fans_org
  CREATE INDEX ... ON public.fans USING btree (organization_id)
Migration 017 DEPRECATED column comment
fan_organizations schema and data
```

### Data impact

```txt
No row mutations required by Migration 018a DDL
No backfill
No seed data
Existing non-null organization_id values remain as-is
```

### Application / Drizzle impact (this migration)

```txt
None
Current createOrganizationFan projection write remains active
Current Drizzle fans.organizationId mapping remains active
Application Phase F2 is a separate later step
```

### General conventions

```txt
BEGIN / COMMIT transaction wrapper
Structural ALTER limited to DROP NOT NULL on organization_id
No CREATE / DROP TABLE
No DROP COLUMN / DROP CONSTRAINT / DROP INDEX
No DB triggers
No application logic in migration
```

---

## 4. Target physical state after 018a

### Column

```txt
fans.organization_id
```

### Expected definition

```txt
type          = uuid
nullable      = YES
default       = none
FK            = fans_organization_id_fkey (unchanged)
index         = idx_fans_org (unchanged)
comment       = Migration 017 DEPRECATED text retained
```

### Live Neon baseline (Phase G — 2026-07-18, pre-018a)

```txt
type          = uuid
nullable      = NO
default       = none
FK            = fans_organization_id_fkey
                → organizations(id) ON DELETE CASCADE
                ON UPDATE NO ACTION
index         = idx_fans_org (btree, non-unique)
comment       = DEPRECATED (ADR-009 / Migration 017) ...
consistency   = divergent_legacy_vs_primary = 0
```

018a must change **only** `nullable: NO → YES`.

---

## 5. Consistency expectations

Migration 018a does not rewrite application services.

Until Application F2:

```txt
Current app continues writing PRIMARY compatibility projection
Non-null legacy values must remain consistent with PRIMARY
```

### Transition invariant (ADR-009 — still in force)

```txt
For every fan with fans.organization_id IS NOT NULL:
  fans.organization_id
    = fan_organizations.organization_id
      WHERE fan_id = fans.id
        AND is_primary = TRUE
```

After F2 (out of scope for this brief):

```txt
New creates may leave organization_id NULL
Canonical ownership remains fan_organizations only
NULL legacy values are expected and non-authoritative
```

---

## 6. Deferred work (explicit)

### Application Phase F2 (after 018a is executed and validated)

```txt
Stop createOrganizationFan compatibility projection write
Remove Drizzle fans.organizationId mapping
Simplify Fan / FanView / toFanView if appropriate
No ownership behavior changes
fan_organizations PRIMARY creation remains mandatory
R04 global email behavior unchanged
Re-run ADR-009 hard gates
```

### Migration 018b (only after every post-F2 gate passes)

```txt
DROP fans_organization_id_fkey (as required for column drop)
DROP INDEX idx_fans_org
DROP COLUMN fans.organization_id
```

018b remains **BLOCKED**. Do not design or generate 018b in this task.

### Migration 019

```txt
Remove Legacy Organization Sport — unchanged / unrelated
```

---

## 7. Explicitly out of Migration 018a

```txt
DROP / RENAME fans.organization_id
DROP fans_organization_id_fkey
DROP idx_fans_org
ALTER COLUMN type
SET / DROP DEFAULT (must introduce no default)
Rewriting or clearing the Migration 017 DEPRECATED comment
fan_organizations DDL or data changes
Application Phase F2
Drizzle schema changes
Stopping the compatibility projection writer
Migration 018b Design Brief / SQL
Migration 019 / organizations.sport
fans.country removal
Loyalty redesign
Any Neon execution in this Design Brief phase
```

---

## 8. Validation checklist

### Pre-execution

- [ ] Human approval of this Design Brief recorded
- [ ] Branch is not `main`
- [ ] ADR-009 Accepted — Frozen
- [ ] Migration 017 confirmed executed and validated in Neon
- [ ] Phase G live baseline recorded (nullable = NO, divergent = 0)
- [ ] `fans.organization_id` column exists
- [ ] `fan_organizations` exists
- [ ] No Application F2 / 018b work mixed into this migration

### Post-execution — Schema

- [ ] `fans.organization_id` still exists (not dropped)
- [ ] Type remains `uuid`
- [ ] `is_nullable` = **YES**
- [ ] `column_default` is null (no default)
- [ ] FK `fans_organization_id_fkey` unchanged:
      - references `organizations(id)`
      - `ON DELETE CASCADE`
      - `ON UPDATE NO ACTION` (or equivalent pre-018a rule unchanged)
- [ ] `idx_fans_org` still present with same definition:
      - `CREATE INDEX idx_fans_org ON public.fans USING btree (organization_id)`
- [ ] DEPRECATED comment retained (ADR-009 / Migration 017 / fan_organizations / physical removal language)
- [ ] `fan_organizations` schema unchanged

### Post-execution — Data / consistency

```sql
-- Existing data: row count sanity (record before/after; must match)
SELECT COUNT(*) AS total_fans FROM fans;

-- Divergent legacy vs PRIMARY for non-null legacy values (must remain 0)
SELECT COUNT(*) AS divergent
FROM fans f
LEFT JOIN fan_organizations fo
  ON fo.fan_id = f.id
 AND fo.is_primary = TRUE
WHERE f.organization_id IS NOT NULL
  AND (fo.organization_id IS NULL OR fo.organization_id <> f.organization_id);
```

- [ ] Total fan count unchanged by migration DDL
- [ ] `divergent = 0` for non-null legacy values
- [ ] No unintended NULL updates to existing rows from the migration itself  
      (018a DDL must not rewrite existing values)

### Post-execution — Insert behavior (validation rows; must be cleaned up)

Use a disposable organization and disposable fan ids. Do **not** leave validation rows in production data.

**A. Old-style INSERT (with `organization_id`) must succeed**

```txt
INSERT into fans supplying organization_id (plus required identity fields)
Expect: success
Cleanup: DELETE the validation fan row (and any accidental FO row if created)
```

**B. New-style INSERT (omitting `organization_id`) must succeed**

```txt
INSERT into fans omitting organization_id
Expect: success; organization_id IS NULL
Cleanup: DELETE the validation fan row
```

Notes:

```txt
These INSERT checks validate DB nullability only.
They are not an application createOrganizationFan test.
Do not create fan_organizations rows unless needed for cleanup safety.
Validation rows must be safely cleaned up before marking 018a complete.
```

### Idempotency / re-run expectations

```txt
Re-running DROP NOT NULL on an already-nullable column should be safe
(no-op or equivalent success) — confirm exact Postgres behavior in SQL review.
Do not invent a second structural change to force idempotency.
```

---

## 9. Rollback strategy

**018a is soft / reversible relative to physical DROP.**

If rollback is required before F2 (and all existing `organization_id` values are still non-null):

```txt
ALTER fans.organization_id SET NOT NULL
```

Preconditions for safe rollback to `NOT NULL`:

```txt
No NULL values exist in fans.organization_id
(otherwise SET NOT NULL fails)
```

If any NULL rows exist (e.g. after premature F2 creates), rollback to `NOT NULL` requires data remediation first — out of scope for this brief.

**018b remains separately gated** and is not rolled back by undoing 018a nullability.

---

## 10. SQL generation notes (non-DDL; for implementer after approval)

```txt
File (proposed):
  database/migrations/foundation-v1/018a_make_legacy_fan_ownership_omit_safe.sql

Wrap in BEGIN / COMMIT
Follow Migration 017 header comment style
Document ADR-009 + staged sequence 018a → F2 → 018b in header
DDL: nullability change only (DROP NOT NULL)
Do NOT DROP COLUMN / FK / INDEX
Do NOT SET DEFAULT
Do NOT rewrite COMMENT unless human explicitly requests
Do NOT touch fan_organizations
Do NOT include application / Drizzle changes
SQL generated, reviewed, executed, and validated in Neon
Do NOT design Migration 018b in the same change set
```

---

## 11. EEP / existing data impact

| Area | Impact |
|------|--------|
| EEP sync | None — no identity or relationship contract change |
| Existing fans | None — values unchanged; still non-null after 018a |
| `fan_organizations` | None |
| Loyalty / segments / campaigns | None in 018a (no app change) |

---

## 12. References

```txt
docs/decisions/ADR-009-legacy-fan-ownership-deprecation.md
docs/decisions/ADR-001-global-fan-model.md
docs/decisions/ADR-002-primary-and-followed-organizations.md
docs/04-database/migration-plan-v1.md
docs/04-database/physical-model-v1.md
docs/04-database/current-schema.md
docs/04-database/foundation-db-backlog.md
docs/sessions/2026-07-18-adr-009-application-cutover-plan.md
docs/sessions/2026-07-17-migration-017-deprecate-legacy-fan-ownership-design.md
docs/sessions/2026-07-17-migration-017-deprecate-legacy-fan-ownership.md
database/migrations/foundation-v1/017_deprecate_legacy_fan_ownership.sql
database/migrations/foundation-v1/001_create_fan_organizations.sql
src/db/schema/fans.ts                          (unchanged by 018a)
src/server/services/fans.ts                    (unchanged by 018a)
```

**Approved architecture inputs:**

```txt
Phase G Migration 018 Gate Assessment / Live Neon Verification
Option B — Staged Contract (human approved)
Sequencing Option 2 — 018a / 018b (human approved)
018a scope freeze (human approved)
No new ADR required (human confirmed)
```

---

## 13. Approval gate

| Item | Status |
|------|--------|
| ADR-009 | Accepted — Frozen |
| Staged sequence 017 → 018a → F2 → 018b → 019 | Frozen |
| Scope: nullability only (`NOT NULL` → `NULLABLE`) | Locked |
| No DROP column / FK / index | Locked |
| No application / Drizzle / F2 in this migration | Locked |
| No new ADR | Confirmed |
| SQL generation | Complete |
| Neon execution / validation | Complete — ALL CHECKS PASS |
| Completion documentation | Complete |
| Migration 018b | **BLOCKED** (post-F2 gates) |

---

## 14. Completion

Migration 018a is **COMPLETE** in Neon.

```txt
Do NOT start Application Phase F2 in this documentation step
Do NOT design or generate Migration 018b
Do NOT modify Migration 019
Migration 018b physical removal remains BLOCKED
```

**Next step:** Application Phase F2 — stop compatibility projection write + remove Drizzle `fans.organizationId` mapping, then re-run ADR-009 hard gates.

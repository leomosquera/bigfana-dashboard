# Migration 017 — Deprecate Legacy Fan Ownership
## Design Brief

**Date:** 2026-07-17  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/017_deprecate_legacy_fan_ownership.sql`  
**Contract:** ADR-009 Accepted — Frozen

---

## Architecture freeze (approved)

Locked before this Design Brief. Must not change during SQL generation or later review.

| Topic | Decision |
|-------|----------|
| Contract | ADR-009 Legacy Fan Ownership Deprecation Contract |
| Source of truth | `fan_organizations` only |
| Legacy column | `fans.organization_id` — DEPRECATED / non-authoritative |
| Migration 017 | Deprecation only |
| Migration 018 | Exclusive physical removal |
| Business writes | Only to `fan_organizations` |
| Compatibility projection | Implementation detail only — never a second business persistence model |
| Approved consumer | Defined in ADR-009; consistency duty while any remain |
| Peer dual-write | Forbidden |
| DROP / RENAME | Forbidden in 017 |

### Definitions (from ADR-009)

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

---

## 1. Objective

Define the approved scope for Foundation Database v1 Migration 017.

Formalize **deprecation** of `fans.organization_id` under ADR-009 — without physically removing or renaming the column, and without altering `fan_organizations`.

**Business outcome:**

```txt
Legacy ownership column is explicitly DEPRECATED in the database
fan_organizations remains the sole authoritative relationship
Contract phase begins with a soft, reversible step
```

**Non-outcomes (explicit):**

```txt
No DROP of fans.organization_id
No RENAME of fans.organization_id
No DROP of idx_fans_org
No ALTER that changes nullability / FK / type of organization_id
No changes to fan_organizations schema
No application / Drizzle cutover in this migration
No Migration 018 work
```

---

## 2. Architectural Invariants

Frozen for Migration 017.

```txt
- ADR-009 is Accepted and Frozen.
- fan_organizations is the sole authoritative fan↔org relationship.
- fans.organization_id is DEPRECATED and non-authoritative.
- Business commands write only to fan_organizations.
- Any temporary fans.organization_id write is a compatibility projection
  derived from PRIMARY only — never an independent business write.
- Compatibility projection is an implementation detail only and must never
  become a second business persistence model.
- While any approved consumer exists, the projection must remain consistent.
- Projection maintenance may stop only after all approved consumers are retired.
- Migration 017 does not physically remove the column.
- Migration 018 is the exclusive physical removal step.
- Peer dual-write is forbidden.
- New features must not use fans.organization_id as ownership.
```

---

## 3. Scope

### In scope (DDL)

```txt
COMMENT ON COLUMN fans.organization_id
```

Optional accompanying comment clarity only — no structural schema change.

### In scope (documentation / validation — non-DDL)

```txt
Record deprecation contract in migration header
Provide consistency validation queries
Document approved-consumer / projection rules for implementers
```

### Tables affected

```txt
fans (COMMENT ON COLUMN organization_id only)
```

### Tables not affected

```txt
fan_organizations
organizations
All other Foundation DB v1 tables
```

### Data impact

```txt
No row mutations required by Migration 017 DDL
No backfill in 017 (backfill already performed in Migration 001)
No seed data
```

### General conventions

```txt
BEGIN / COMMIT transaction wrapper
COMMENT ON COLUMN only — no CREATE / DROP / ALTER TABLE
No DB triggers
No application logic in migration
```

---

## 4. Deprecation artifact

### Column

```txt
fans.organization_id
```

### Required COMMENT text (exact meaning; wording may be tightened in SQL)

```txt
DEPRECATED (ADR-009 / Migration 017).
Non-authoritative. Sole source of truth is fan_organizations.
May exist only as a compatibility projection of the canonical PRIMARY
relationship. Must not be used as a business persistence model.
Physical removal is Migration 018 only.
```

### Structural state after 017

```txt
Column remains present
Type / nullability / FK unchanged
idx_fans_org may remain (supports approved consumers until 018)
```

---

## 5. Consistency expectations (application / ops — not DDL)

Migration 017 does not rewrite application services. Parallel-track cutover must obey ADR-009:

```txt
1. Business commands write fan_organizations only
2. Optional projection write → fans.organization_id = PRIMARY only
3. Approved consumers may keep reading until formally retired
4. New features must not depend on fans.organization_id
```

### Transition invariant

```txt
For every fan with fans.organization_id IS NOT NULL:
  fans.organization_id
    = fan_organizations.organization_id
      WHERE fan_id = fans.id
        AND is_primary = TRUE
```

Or: no approved consumer remains (projection may then stop; column still present until 018).

---

## 6. Deferred to Migration 018

```txt
DROP COLUMN fans.organization_id
DROP INDEX idx_fans_org (if solely for legacy column)
Drizzle / TypeScript removal of organizationId on fans
Hard cutover proof (zero approved consumers)
```

018 hard gates remain those in ADR-009.

---

## 7. Explicitly out of Migration 017

```txt
DROP / RENAME fans.organization_id
ALTER COLUMN type / nullability / FK
fan_organizations DDL changes
Application service rewrite
Report / export / script cutover execution
fans.country removal
organizations.sport removal (019)
Loyalty redesign
```

---

## 8. Validation checklist

### Pre-execution

- [ ] Human approval of this Design Brief recorded
- [ ] Branch is not `main`
- [ ] ADR-009 Accepted — Frozen
- [ ] Migrations 001–016 confirmed executed and validated in Neon
- [ ] `fans.organization_id` column exists
- [ ] `fan_organizations` exists

### Post-execution — Schema

- [ ] `fans.organization_id` still exists (not dropped)
- [ ] Column type / nullability unchanged vs pre-017 baseline
- [ ] `idx_fans_org` still present (unless already absent for unrelated reasons)
- [ ] Column comment present and references DEPRECATED / ADR-009 / Migration 017
- [ ] `fan_organizations` schema unchanged

### Post-execution — Consistency (informational; may be non-zero until cutover)

```sql
-- Divergent legacy projections (should trend to 0 before 018)
SELECT COUNT(*) AS divergent
FROM fans f
LEFT JOIN fan_organizations fo
  ON fo.fan_id = f.id
 AND fo.is_primary = TRUE
WHERE f.organization_id IS NOT NULL
  AND (fo.organization_id IS NULL OR fo.organization_id <> f.organization_id);
```

- [ ] Query runs successfully
- [ ] Result recorded (zero not required to complete 017)

### Idempotency

- [ ] Re-run COMMENT ON COLUMN succeeds (overwrites comment)

---

## 9. Rollback strategy

**Before or after 017 (soft):**

```txt
COMMENT ON COLUMN fans.organization_id IS NULL;
-- or restore prior comment text if one existed
```

Column itself was never removed — no data restore required.

**018 remains separately gated** and is not rolled back by undoing 017 comments.

---

## 10. SQL generation notes (non-DDL; for implementer after approval)

```txt
File: database/migrations/foundation-v1/017_deprecate_legacy_fan_ownership.sql
Wrap in BEGIN / COMMIT
Follow 016 header comment style
Document ADR-009 contract in header
COMMENT ON COLUMN fans.organization_id only
Do NOT DROP / RENAME / ALTER TABLE
Do NOT touch fan_organizations
Do not generate SQL until this Design Brief is approved
```

---

## 11. References

```txt
docs/decisions/ADR-009-legacy-fan-ownership-deprecation.md
docs/decisions/ADR-001-global-fan-model.md
docs/decisions/ADR-002-primary-and-followed-organizations.md
docs/04-database/migration-plan-v1.md            → Migration 017 / 018
docs/04-database/physical-model-v1.md            → fans.organization_id DEPRECATED
docs/04-database/foundation-db-backlog.md        → Phase 12
database/migrations/foundation-v1/001_create_fan_organizations.sql
docs/sessions/2026-07-17-adr-009-legacy-fan-ownership-deprecation.md
```

**Approved architecture inputs:**

```txt
Migration 017 Architecture Review (approved)
ADR-009 Accepted — Frozen (including editorial clarifications)
Clarification: projection is implementation detail only
Clarification: approved consumer defined once in ADR-009
```

---

## 12. Approval gate

| Item | Status |
|------|--------|
| ADR-009 | Accepted — Frozen |
| Architecture freeze | Locked above |
| Scope: COMMENT ON COLUMN only | Locked |
| No DROP / RENAME / structural ALTER | Locked |
| SQL generation / Neon execution / validation | Complete — 11/11 |
| Documentation alignment | Complete |

**Next Foundation step:** Migration 018 readiness / ADR-009 hard cutover gate assessment. Do NOT generate 018 Design Brief or SQL until gates are verified.

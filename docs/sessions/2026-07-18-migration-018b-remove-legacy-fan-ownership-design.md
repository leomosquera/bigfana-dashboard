# Migration 018b — Remove Legacy Fan Ownership
## Design Brief

**Date:** 2026-07-18  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/018b_remove_legacy_fan_ownership.sql`  
**Contract:** ADR-009 Accepted — Frozen  
**New ADR:** Not required  
**Execution:** COMPLETE — irreversible DROP approved, executed, and validated

---

## Architecture freeze (proposed for approval)

Locked by this Design Brief once approved. Must not change during SQL generation or later review without reopening the brief.

| Topic | Decision |
|-------|----------|
| Contract | ADR-009 Legacy Fan Ownership Deprecation Contract |
| Source of truth | `fan_organizations` only |
| Legacy column | `fans.organization_id` — physically remove in 018b |
| Approved strategy | Option B — Staged Contract (017 → 018a → F2 → 018b) |
| Migration 017 | Deprecation (COMMENT) — **COMPLETE** |
| Migration 018a | Omit-safe (`NULLABLE`) — **COMPLETE** |
| Application F2 | Stop projection write + remove Drizzle mapping — **COMPLETE** |
| Post-F2 gate assessment | All technical gates **PASS** — **COMPLETE** |
| Migration **018b** | Physical DROP (column + FK + index) — **COMPLETE** |
| Migration 019 | Remove Legacy Organization Sport — **unchanged / out of scope** |
| Application / Drizzle changes in 018b | **Forbidden** (already cut over in F2) |
| `fan_organizations` changes | **Forbidden** |
| Peer dual-write / new projection | **Forbidden** |
| Human approval for irreversible DROP | **Granted** — Neon executed and validated |

### Frozen contract sequence

```txt
017   = deprecation — COMPLETE
018a  = Make Legacy Fan Ownership Omit-Safe — COMPLETE
F2    = stop projection write + remove Drizzle mapping — COMPLETE
Gate  = post-F2 ADR-009 technical gates — COMPLETE (PASS)
018b  = Physical Remove Legacy Fan Ownership — COMPLETE
019   = Remove Legacy Organization Sport (next focus / not started)
```

### Why 018b exists

ADR-009 completes only when the deprecated legacy ownership surface is physically gone.

```txt
Application already ignores fans.organization_id (F2)
Neon still physically retains:
  - fans.organization_id (UUID NULLABLE, DEPRECATED)
  - fans_organization_id_fkey
  - idx_fans_org

018b removes that residual physical surface.
```

After 018b:

```txt
fans                 = global fan identity only (ADR-001)
fan_organizations    = sole physical + logical fan↔organization relationship
```

---

## Definitions (from ADR-009 — unchanged)

**Approved consumer**

```txt
Any retained reader or writer of fans.organization_id
that has not yet been formally retired during the contract phase.

Includes: application services, reports, exports, scripts,
operational tooling.
```

Post-F2 gate assessment: **zero approved consumers remain**.

**Compatibility projection**

```txt
Temporary mirror of canonical PRIMARY organization_id
from fan_organizations onto fans.organization_id.

Implementation detail only.
Must never become a second business persistence model.
```

Post-F2: projection writers are retired. 018b discards residual projection values.

---

## 1. Goal

Define the approved scope for Foundation Database v1 Migration **018b**.

Physically remove the deprecated legacy fan ownership column `fans.organization_id` and the physical objects that exist solely because of that column (`fans_organization_id_fkey`, `idx_fans_org`), without changing `fan_organizations`, application code, or Drizzle.

**Business outcome:**

```txt
Legacy ownership column and its sole dependents are gone from Neon
fan_organizations remains sole authoritative relationship
Contract-phase ownership retirement completes at the database layer
```

**Non-outcomes (explicit):**

```txt
No application / Drizzle changes in this migration
No fan_organizations DDL or data rewrite
No fan model / PRIMARY / FOLLOWING semantic changes
No loyalty / engagement_score / campaign / EEP redesign
No data backfill or repair beyond discarding legacy projection values
No Migration 019 work
No authorization to execute Neon DROP by this brief alone
```

---

## 2. Background

### Staged Option B path (approved)

```txt
017  → COMMENT deprecation (soft)
018a → NULLABLE omit-safe (deployment compatibility)
F2   → application stops reading / writing / mapping
Gate → technical ADR-009 hard gates re-verified
018b → physical DROP (hard contract)
```

### Post-F2 technical readiness

Technical verdict (2026-07-18):

```txt
TECHNICALLY READY FOR MIGRATION 018b DESIGN BRIEF
```

Human authorization for irreversible physical DROP:

```txt
NOT YET
```

This Design Brief does **not** grant that authorization.

---

## 3. Accepted ADR contracts

| ADR | Relevance to 018b |
|-----|-------------------|
| ADR-001 | Fan identity remains global on `fans` |
| ADR-002 | Relationships remain in `fan_organizations` (PRIMARY / FOLLOWING) |
| ADR-009 | Sole SoT = `fan_organizations`; physical removal is exclusive final step |

No new ADR is required for 018b (see §19).

---

## 4. Current application state

Application Phase F2 is COMPLETE.

```txt
ZERO runtime ownership reads of fans.organization_id
ZERO runtime writes to fans.organization_id
ZERO compatibility projection writes
ZERO Drizzle mapping of fans.organizationId
Fan / NewFan / FanView do not expose legacy ownership
Scripts / reports / tooling independent of legacy column
Command / tenant / session organizationId remain where semantically valid
fan_organizations is sole application source of truth
R03 / R04 / R05 frozen and unchanged
```

`createOrganizationFan` (post-F2):

```txt
1. Global normalized email duplicate check (R04)
2. INSERT fans WITHOUT organization_id
3. INSERT fan_organizations PRIMARY (mandatory)
4. EEP enqueue
5. Segment recompute
```

**Implication for 018b:** no coordinated application or Drizzle change is required at DROP time. Physical absence of the column matches current app mapping.

---

## 5. Current Neon state

`fans.organization_id` still physically exists:

```txt
type            = uuid
is_nullable     = YES
column_default  = none
comment         = DEPRECATED (ADR-009 / Migration 017) — retained
```

Known physical dependents (expected):

```txt
fans_organization_id_fkey
  FOREIGN KEY (organization_id)
  REFERENCES organizations(id)
  ON DELETE CASCADE
  ON UPDATE NO ACTION

idx_fans_org
  btree (organization_id)
  non-unique
```

Post-F2 live consistency (read-only audit):

```txt
total_fans                    = 7
fans_with_PRIMARY             = 7
fans_without_PRIMARY          = 0
fans_with_multiple_PRIMARY    = 0
divergent_legacy_vs_primary   = 0
unexpected views/triggers/RLS/functions on column = none
```

Non-null legacy values may still exist on older rows; they are non-authoritative and agree with PRIMARY where present. NULL legacy values are acceptable. Neither case is a blocker for DROP.

---

## 6. Technical gate result

| Gate | Status |
|------|--------|
| Zero approved readers | PASS |
| Zero writers including projection | PASS |
| PRIMARY / legacy consistency | PASS |
| Application no longer maps column | PASS |
| Drizzle / types no longer map column | PASS |
| Scripts / reports / tooling independent | PASS |
| No unexpected DB dependencies | PASS |
| Human approval for irreversible DROP | **NOT YET** |

Technical readiness enables this Design Brief. It does **not** authorize Neon execution.

---

## 7. Scope

### In scope (DDL — EXECUTED AND VALIDATED)

```txt
1. Remove idx_fans_org
2. Remove fans_organization_id_fkey
3. Remove fans.organization_id
4. Post-removal schema validation
```

### In scope (process / documentation)

```txt
Confirm fan_organizations unchanged
Confirm application / Drizzle require no coordinated changes
Document data impact (discard legacy projection values)
Document rollback philosophy (hard contract)
Document pre-execution human gate
Document post-migration validation checklist
Document idempotency strategy for future SQL
```

---

## 8. Out of scope

```txt
Application changes
Drizzle changes
fan_organizations changes (structure or data rewrite)
Fan model redesign
PRIMARY / FOLLOWING semantic changes
Loyalty redesign
engagement_score redesign
Campaign redesign
EEP / integration changes
Data backfill / repair
Deleting fans
New compatibility projection
Reintroducing fans.organization_id as a business model
Migration 019 / organizations.sport
Any unrelated Foundation cleanup
```

---

## 9. Objects affected

| Object | Action | Rationale |
|--------|--------|-----------|
| `idx_fans_org` | DROP | Exists solely for `fans.organization_id` |
| `fans_organization_id_fkey` | DROP | Exists solely for `fans.organization_id` |
| `fans.organization_id` | DROP COLUMN | Deprecated non-authoritative legacy projection |
| DEPRECATED column comment | Goes away with column | No separate COMMENT cleanup required |
| `fan_organizations` | **Unchanged** | Sole SoT |
| Other `fans` columns / constraints | **Unchanged** | Identity / lifecycle / EEP / scores retained |
| Migration 019 objects | **Unchanged** | Out of scope |

---

## 10. Data impact

Migration 018b removes a deprecated legacy column containing **compatibility projection values**.

Those values are:

```txt
non-authoritative
no longer read by application / runtime / tooling
no longer written
already represented canonically by fan_organizations PRIMARY
  relationships where applicable
```

Therefore physical removal **intentionally discards legacy projection data**.

```txt
This is expected contract-phase data removal, not business-data loss.
```

Canonical fan↔organization relationships remain exclusively in:

```txt
fan_organizations
```

**Do not** create a backup/shadow ownership table or new persistence model.

Optional pre-execution operational safety (validation only, not a new schema):

```txt
Record counts:
  total_fans
  fans_with_PRIMARY
  fans_without_PRIMARY
  divergent_legacy_vs_primary (expect 0)

Optional one-time export of (fan_id, organization_id) pairs
from fans.organization_id for operator audit — ephemeral,
not a Foundation table.
```

Fan rows themselves must not be deleted. Fan count must remain unchanged.

---

## 11. Dependency strategy

PostgreSQL `ALTER TABLE ... DROP COLUMN` typically auto-drops same-table indexes and constraints that depend solely on that column.

However, Foundation contract migrations prioritize:

```txt
migration auditability
explicit intent
predictable validation
rollback documentation
```

Therefore 018b **must not** rely on implicit DROP COLUMN cascade alone as the documented strategy.

---

## 12. Exact physical removal strategy recommendation

### Decision: Option A — Explicit DROP order

Preferred future SQL shape (conceptual — **not generated in this brief**):

```txt
1. DROP INDEX     idx_fans_org
2. DROP CONSTRAINT fans_organization_id_fkey
3. DROP COLUMN    fans.organization_id
```

### Rationale

```txt
+ Explicit intent in migration history
+ Each object can be validated before/after
+ Clearer rollback documentation (recreate index / FK / column)
+ Avoids ambiguity about what PostgreSQL auto-dropped
+ Matches Foundation preference for readable contract DDL
```

### Rejected for primary strategy: Option B — DROP COLUMN only

```txt
Relying solely on DROP COLUMN auto-dependency cleanup
is technically often sufficient, but weaker for auditability
and post-step validation messaging in a hard contract migration.
```

SQL generation may still note that PostgreSQL would auto-drop dependents; the **approved** migration must perform explicit removals first (or equivalent explicit statements), then DROP COLUMN.

---

## 13. Idempotency strategy

### Decision: Defensive `IF EXISTS` + post-condition assertions

Recommended for future SQL:

```txt
DROP INDEX IF EXISTS idx_fans_org;
ALTER TABLE fans DROP CONSTRAINT IF EXISTS fans_organization_id_fkey;
ALTER TABLE fans DROP COLUMN IF EXISTS organization_id;
```

Plus **mandatory** post-migration validation that all three objects are absent (see §16).

### Rationale

```txt
Foundation migrations historically favor safe re-execution where practical.
018b is irreversible in business intent, but DDL re-run safety remains useful
for interrupted operator sessions and documented re-checks.
```

### Drift detection

`IF EXISTS` alone can hide unexpected pre-state (objects already missing).

Mitigation (required in SQL / validation docs, not soft-optional):

```txt
Pre-check (informational or hard-fail — freeze at SQL review):
  Prefer hard-fail if organization_id is already absent when first
  executing in a given environment, OR log WARN + continue with
  IF EXISTS if the environment is known partially applied.

Post-check (hard requirement in all cases):
  FAIL validation if any of:
    fans.organization_id still exists
    fans_organization_id_fkey still exists
    idx_fans_org still exists
```

**Frozen preference for SQL generation:**

```txt
Use IF EXISTS for the three DROP statements.
Treat post-validation absence checks as the hard contract gate.
At SQL human review, decide whether pre-existence of the column
is WARN-only or FAIL-fast for first execution in Neon.
Default recommendation: FAIL-fast pre-check if column missing
before any DROP runs (detect wrong database / already applied),
combined with IF EXISTS for safe retry after partial progress.
```

Exact SQL wording is deferred to SQL generation after this brief is approved.

---

## 14. Rollback philosophy

ADR-009:

```txt
017  → soft / reversible
018a → soft-ish deployment compatibility
018b → hard contract migration
```

### Honest rollback model

Physical DROP is **not** a trivial transactional reversal after successful adoption.

| Scenario | Behavior |
|----------|----------|
| Transaction / statement failure mid-migration | Operator stops; inspect partial state; re-run with IF EXISTS + validation; do not invent ad-hoc fixes |
| Rollback **before** Neon adoption (brief/SQL rejected) | No reverse migration needed — column still present |
| Reverse **after** successful physical removal | Requires a **dedicated reverse migration** that recreates `fans.organization_id` (UUID NULLABLE, no business SoT), FK, index, and optionally rebuilds projection values from canonical PRIMARY `fan_organizations` |

```txt
Do NOT pretend rollback is a simple transactional undo
after application has adopted the post-018b schema.
```

Reverse migration (if ever needed) is a separate, explicitly approved Foundation action — not part of 018b forward SQL.

---

## 15. Pre-execution human gate

Even with technical readiness, SQL execution remains human-gated.

Before Neon execution, **all** of the following must be true:

```txt
1. This Design Brief approved (Status → FINAL / approved)
2. SQL generated: database/migrations/foundation-v1/018b_*.sql
3. SQL reviewed and approved by human
4. Technical gates still considered valid
   (no relevant reader/writer/mapping regression since post-F2 gate)
5. Human explicitly approves irreversible DROP
6. Only then execute Neon
```

If meaningful time or application changes occur between gate assessment and execution, run a **lightweight re-check**:

```txt
- ripgrep: fans.organizationId / fans.organization_id in src/ + scripts/
- confirm Drizzle fans schema still unmapped
- live Neon: dependents still only FK + idx_fans_org
- live Neon: divergent_legacy_vs_primary = 0
- live Neon: fans_without_PRIMARY = 0 (for fans that require PRIMARY)
```

This Design Brief **does not** satisfy step 5.

---

## 16. Post-migration validation checklist

Future SQL / completion validation must confirm:

```txt
[ ] 1.  fans.organization_id no longer exists
[ ] 2.  fans_organization_id_fkey no longer exists
[ ] 3.  idx_fans_org no longer exists
[ ] 4.  fans table otherwise structurally unchanged
        (identity / status / EEP / engagement_score / etc. retained)
[ ] 5.  fan_organizations still exists and is structurally unchanged
[ ] 6.  Canonical PRIMARY relationships remain intact
        (fans_with_PRIMARY unchanged vs pre-check; no multi-PRIMARY)
[ ] 7.  Fan count unchanged (total_fans pre == post)
[ ] 8.  No fan business rows deleted
[ ] 9.  Application build / types remain compatible
        (tsc + build; column physically absent matches unmapped Drizzle)
[ ] 10. New fan creation path still: fans + PRIMARY fan_organizations
[ ] 11. Phase B membership semantic tests still pass
[ ] 12. No Migration 019 objects touched
```

Optional informational checks:

```txt
[ ] DEPRECATED comment gone with column (expected)
[ ] No unexpected new dependents introduced
```

---

## 17. Risks

| Risk | Mitigation |
|------|------------|
| Hidden reader/writer reintroduced after gate assessment | Lightweight re-check before Neon |
| Wrong environment / schema drift | FAIL-fast pre-check that column exists; post-check absence |
| Partial DROP leaves inconsistent catalog | Explicit ordered DROPs + IF EXISTS retry + hard post-validation |
| Mistaken belief that DROP loses business ownership | Document data impact: projection only; SoT = `fan_organizations` |
| Attempt to “soft rollback” after success | Document hard contract + dedicated reverse migration only |
| Scope creep into 019 / loyalty / EEP | Out-of-scope freeze in this brief |

Non-blocker (recorded debt, unrelated to DROP):

```txt
neon-http create path remains non-transactional
(INSERT fans → INSERT fan_organizations → best-effort DELETE).
Independent of 018b physical removal.
```

---

## 18. Deferred work

```txt
SQL generation for 018b          → COMPLETE
Neon execution                   → COMPLETE (validated)
Documentation completion updates → COMPLETE (this session)
Migration 019                    → next Foundation focus / Architecture Review candidate
Loyalty / engagement_score redesign → out of scope
Transactional create redesign (neon-ws) → independent debt
```

---

## 19. ADR assessment

**No new ADR required.**

Reason:

```txt
ADR-009 already defines:
  - authoritative relationship (fan_organizations)
  - deprecation contract
  - projection rules
  - sequencing
  - physical removal as final contract step
  - hard rollback philosophy for removal

Migration 018b implements an already Accepted / Frozen contract.
No unexpected architectural issue was discovered in post-F2 gates.
```

---

## 20. Execution result

```txt
Design Brief approved.
SQL generated, reviewed, and approved.
Explicit human DROP approval granted.
Neon execution COMPLETE via neon-http sql.transaction([...]).

Removed:
  idx_fans_org
  fans_organization_id_fkey
  fans.organization_id

Validated:
  fan_organizations unchanged
  PRIMARY intact (7/7)
  fan count 7 → 7
  organizations.sport untouched
  tsc / build / Phase B tests PASS
  repository audit PASS
  idempotent re-run PASS

ADR-009 contract phase COMPLETE.
```

### Final status

```txt
Migration 018b:
  DESIGN BRIEF FINAL
  EXECUTED AND VALIDATED IN NEON
  COMPLETE
```

---

## Related

```txt
ADR-001, ADR-002, ADR-009
docs/sessions/2026-07-18-adr-009-application-cutover-plan.md
docs/sessions/2026-07-18-migration-018a-make-legacy-fan-ownership-omit-safe-design.md
docs/sessions/2026-07-18-migration-018a-make-legacy-fan-ownership-omit-safe.md
Post-F2 ADR-009 Gate Assessment (2026-07-18) — TECHNICALLY READY FOR DESIGN BRIEF
```

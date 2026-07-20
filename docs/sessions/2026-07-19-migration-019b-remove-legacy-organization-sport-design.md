# Migration 019b — Remove Legacy Organization Sport
## Design Brief

**Date:** 2026-07-19  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/019b_remove_legacy_organization_sport.sql`  
**Theme:** Migration 019 — Remove Legacy Organization Sport  
**Contract:** ADR-004 / ADR-005 Accepted — Frozen  
**New ADR:** Not required  
**Execution:** COMPLETE — irreversible DROP approved, executed, and validated

---

## Architecture freeze (proposed for approval)

Locked by this Design Brief once approved. Must not change during SQL generation or later review without reopening the brief.

| Topic | Decision |
|-------|----------|
| Overall theme | Migration 019 — Remove Legacy Organization Sport |
| Hierarchy | ADR-004: Sport → Competition → Organization |
| Competition types | ADR-005: `INTEGRATED` \| `MANAGED` only |
| Canonical sport path | `organization → competition_organizations → competitions → sports` |
| Legacy field | `organizations.sport` — free-text; physically remove in 019b |
| Direct org→sport FK | **Forbidden** (`organizations.sport_id` not introduced) |
| Migration **019a** | Canonical competition data + COMMENT deprecation — **COMPLETE** |
| Application / Drizzle cutover | Remove `organizations.sport` mapping/types — **COMPLETE** |
| Post-cutover Gate Assessment | All technical gates **PASS** — **COMPLETE** |
| Migration **019b** | Physical DROP `organizations.sport` — **COMPLETE** |
| Application / Drizzle changes in 019b | **Forbidden** (already cut over) |
| Canonical competition tables / data | **Unchanged** (already authoritative) |
| Cups / international competitions | Out of scope |
| Migration 020 | Out of scope / not started |
| Human approval for irreversible DROP | **Granted** — Neon executed and validated |

### Frozen contract sequence

```txt
019a  = Canonical competition data + COMMENT deprecation — COMPLETE
App   = remove organizations.sport from Drizzle / inferred Organization types — COMPLETE
Gate  = post-cutover technical gates — COMPLETE (PASS)
019b  = Physical DROP organizations.sport — COMPLETE
Migration 019 = COMPLETE
```

### Why 019b exists

Migration 019 completes only when the deprecated legacy organization sport surface is physically gone.

```txt
Application already ignores organizations.sport (App cutover)
Neon still physically retains:
  - organizations.sport (TEXT NOT NULL, default 'football', DEPRECATED)

019b removes that residual physical surface.
```

After 019b:

```txt
organizations                    = tenant identity / branding only (no sport column)
competition_organizations        = membership of orgs in competitions
competitions → sports            = canonical sport context
```

Canonical business data is **not** stored in `organizations.sport`. Physical DROP discards only non-authoritative legacy free-text.

---

## 1. Objective

Define the approved scope for Foundation Database v1 Migration **019b**.

Physically remove the deprecated legacy column `organizations.sport` from Neon, without changing application code, Drizzle schemas, canonical competition tables, or competition membership data.

**Business outcome:**

```txt
Legacy organizations.sport column is gone from Neon
Canonical sport/competition context remains via
  organization → competition_organizations → competitions → sports
Multi-competition membership capability preserved
Contract-phase retirement of Organization Sport completes at the database layer
```

**Non-outcomes (explicit):**

```txt
No application / Drizzle changes in this migration
No organizations.sport_id
No new Organization → Sport FK / relation
No sports / competitions / competition_organizations DDL
No competition or membership data rewrite
No omit-safe / NULLABLE intermediate migration
No cup / international competition work
No Migration 020 work
No authorization to execute Neon DROP by this brief alone
```

---

## 2. Background

### Staged Migration 019 path (approved)

```txt
019a → Canonical competitions + memberships + COMMENT deprecation
App  → remove Drizzle mapping / inferred Organization.sport
Gate → post-cutover technical hard gates re-verified
019b → physical DROP (hard contract)
```

### Post-cutover technical readiness

Technical verdict (2026-07-19 Post-Cutover Gate Assessment):

```txt
TECHNICALLY READY FOR MIGRATION 019b DESIGN BRIEF
```

Human authorization for irreversible physical DROP:

```txt
NOT YET
```

This Design Brief does **not** grant that authorization.

Approval of this Design Brief alone must **not** authorize Neon execution.

---

## 3. Accepted ADR contracts

| ADR | Relevance to 019b |
|-----|-------------------|
| ADR-004 | Sport → Competition → Organization hierarchy remains canonical |
| ADR-005 | Competition types remain `INTEGRATED` \| `MANAGED`; no competition-type change |

No new ADR is required for 019b (see §13).

Do not introduce a new architectural model.

---

## 4. Current application state

Application / Drizzle cutover is COMPLETE.

```txt
ZERO runtime reads of organizations.sport
ZERO runtime writes to organizations.sport
ZERO Drizzle mapping of organizations.sport
Organization / NewOrganization do not expose sport
Session / auth / OrgProvider do not depend on sport
Scripts / reports / tooling independent of legacy column
No "football" fallback introduced
No competition joins required for current UI
```

**Implication for 019b:** no coordinated application or Drizzle change is required at DROP time. Physical absence of the column matches current app mapping.

Canonical tables `sports`, `competitions`, `competition_organizations` exist in Neon but remain unmapped in Drizzle until a future feature needs them. That absence does **not** block 019b.

---

## 5. Current Neon state (Gate Assessment — verified live)

`organizations.sport` still physically exists:

```txt
exists          = yes
type            = text
is_nullable     = NO
column_default  = 'football'::text
comment         = DEPRECATED (ADR-004 / Migration 019a) — retained
values          = football × 3
```

Known physical dependents (Gate Assessment):

```txt
indexes on sport                          = none
constraints involving sport               = none
views / materialized views                = none
triggers                                  = none
RLS policies                              = none
functions (pg_depend)                     = none
generated columns                         = none
organizations.sport_id                    = absent
pg_depend                                 = pg_attrdef only (column default)
```

Canonical replacement integrity (Gate Assessment):

```txt
sports                              = 11
competitions                        = 2
competition_organizations           = 3
organizations                       = 3
sports.slug = soccer                = 1
sports.slug = football              = 0

liga-profesional-argentina
  → soccer / INTEGRATED / AR / is_active = true

liga-mx
  → soccer / INTEGRATED / MX / is_active = true

river-plate  → liga-profesional-argentina → soccer
boca-juniors → liga-profesional-argentina → soccer
toluca       → liga-mx → soccer

organizations with >=1 membership   = 3
organizations without membership    = 0
```

Multi-competition safety:

```txt
UNIQUE (competition_id, organization_id) present
NO unique constraint on organization_id alone
019b DROP does not affect multi-competition capability
```

---

## 6. Technical gate result

| Gate | Status |
|------|--------|
| Zero runtime readers of `organizations.sport` | PASS |
| Zero runtime writers | PASS |
| Zero Drizzle mapping | PASS |
| Zero DTO/type exposure | PASS |
| Zero scripts/reports/tooling dependency | PASS |
| Canonical soccer row valid | PASS |
| Required competitions valid | PASS |
| Required memberships valid | PASS |
| All organizations have ≥1 membership | PASS |
| Canonical sport derivation succeeds | PASS |
| Multi-competition capability preserved | PASS |
| No unexpected DB dependents | PASS |
| No hidden external writer identified (in-repo) | PASS |
| App build/type validation healthy | PASS |
| Human approval for irreversible DROP | **NOT YET** |

Technical readiness enables this Design Brief. It does **not** authorize Neon execution.

---

## 7. Exact frozen scope

### In scope (DDL — pending SQL after brief approval)

```txt
1. Physically remove organizations.sport
2. Post-removal schema validation
```

Expected conceptual DDL shape (not generated here):

```txt
ALTER TABLE organizations
  DROP COLUMN ... sport ...
```

Exact SQL syntax, `IF EXISTS` wording, and fail-fast pre-checks are deferred to SQL generation after this Design Brief is approved.

### In scope (process / documentation)

```txt
Confirm competition_organizations / competitions / sports unchanged
Confirm application / Drizzle require no coordinated changes
Document data impact (discard non-authoritative legacy free-text)
Document rollback philosophy (hard contract)
Document pre-execution human gates
Document post-migration validation checklist
Document idempotency / fail-fast strategy for future SQL
Document that no omit-safe intermediate migration is required
```

### Tables structurally affected

```txt
organizations   (DROP COLUMN sport only)
```

### Tables / data not altered

```txt
sports
competitions
competition_organizations
memberships
fans
fan_organizations
All other Foundation DB v1 tables
```

---

## 8. Explicit out-of-scope summary

```txt
Application changes
Drizzle changes
organizations.sport_id
New Organization → Sport FK / relation
ALTER of type / nullability / default as a separate omit-safe step
sports catalog mutation
competitions DDL or data rewrite
competition_organizations DDL or data rewrite
Cup / international competition inserts
Backup / shadow sport column or new persistence model
CASCADE DROP to hide unexpected dependents
Migration 020 or any later Foundation work
Authorization to execute Neon by Design Brief approval alone
```

---

## 9. Dependency strategy

Gate Assessment found **no** indexes, FKs, views, triggers, RLS policies, or functions depending on `organizations.sport`.

The only catalog dependent is:

```txt
pg_attrdef  — column default "'football'::text"
```

PostgreSQL removes that default automatically when the column is dropped.

### Approved strategy for 019b

```txt
Option A (approved for this migration):
  Direct DROP COLUMN of organizations.sport

No companion DROP INDEX / DROP CONSTRAINT statements are required,
because none exist for this column.
```

### Explicit rule

```txt
Do NOT invent FK / index names.
Do NOT use CASCADE.
Unexpected dependents must fail loudly.
```

### Contrast with Migration 018b

018b required explicit companion drops (`idx_fans_org`, `fans_organization_id_fkey`) because those objects existed solely for the legacy column.

019b has no such companion objects. Explicit companion removals are therefore **not** part of the frozen scope.

---

## 10. Idempotency / fail-fast recommendation

### Decision: Fail-fast pre-check + defensive DROP + hard post-validation

Recommended for future SQL (conceptual):

```txt
1. FAIL-FAST if organizations.sport is already absent
   (wrong database / already applied / unexpected drift)

2. DROP COLUMN with IF EXISTS (or equivalent defensive form)
   for safe retry after partial operator progress

3. HARD post-validation:
   FAIL if organizations.sport still exists
```

### Rationale

```txt
Foundation migrations favor safe re-execution where practical.
019b is irreversible in business intent, but DDL re-run safety
remains useful for interrupted operator sessions.

Fail-fast on already-absent column detects wrong target DB
before claiming success.
```

Exact SQL wording is deferred to SQL generation after this brief is approved.

At SQL human review, confirm the fail-fast / `IF EXISTS` combination remains consistent with Foundation 018b-style contract migrations.

---

## 11. Transaction strategy

### Recommendation

```txt
Single short DDL transaction / statement group for DROP COLUMN.
No multi-step data migration.
No long-running locks beyond ordinary ALTER TABLE DROP COLUMN.
```

### Notes

```txt
- No DML required
- No backfill required
- No dual-write window
- Canonical competition data must not be touched inside the transaction
```

Exact transaction wrapping is deferred to SQL generation / SQL review.

---

## 12. Data-impact assessment

Migration 019b removes a deprecated legacy free-text column.

Those values are:

```txt
non-authoritative
no longer read by application / runtime / tooling
no longer written / mapped
already represented canonically by:
  organization → competition_organizations → competitions → sports
```

Therefore physical removal **intentionally discards legacy free-text values** (`football` × 3).

```txt
This is expected contract-phase data removal, not business-data loss.
```

Canonical organization competition/sport context remains exclusively via:

```txt
competition_organizations
competitions
sports
```

**Do not** create a backup/shadow `organizations.sport` table or introduce `organizations.sport_id`.

Optional pre-execution operational safety (validation only, not a new schema):

```txt
Record baselines:
  organizations count (= 3)
  competition_organizations count (= 3)
  competitions count (= 2)
  sports count (= 11)
  sport derivation for river-plate / boca-juniors / toluca
  organizations.sport value distribution (football × 3)
```

Organization rows themselves must not be deleted. Organization count must remain unchanged.

---

## 13. ADR assessment

| Question | Answer |
|----------|--------|
| Remains consistent with ADR-004? | Yes — hierarchy unchanged |
| Remains consistent with ADR-005? | Yes — competition types unchanged |
| Introduces new architectural model? | No |
| Introduces `organizations.sport_id`? | No — forbidden |
| Requires new ADR? | **No** |

Canonical model after 019b (unchanged from ADR-004):

```txt
sports
  → competitions
    → competition_organizations
      → organizations
```

Organizations may continue to belong to multiple competitions without schema changes.

---

## 14. Human approval gates

Clearly separated. Approval of earlier gates does **not** satisfy later gates.

| # | Gate | Status at Design Brief time |
|---|------|-----------------------------|
| 1 | Design Brief approval | **WAITING** (this document) |
| 2 | SQL generation | Blocked until #1 |
| 3 | SQL review | Blocked until #2 |
| 4 | Explicit human irreversible DROP approval | Blocked until #3 |
| 5 | Neon execution | Blocked until #4 |
| 6 | Completion documentation | After successful Neon validation |

```txt
IMPORTANT:
Approval of the Design Brief alone must NOT authorize Neon execution.
```

If meaningful time or application changes occur between Gate Assessment and Neon execution, run a **lightweight re-check**:

```txt
- ripgrep: organizations.sport / organization.sport / org.sport in src/ + scripts/
- confirm Drizzle organizations schema still unmapped
- live Neon: organizations.sport still present; dependents still none beyond default
- live Neon: all organizations still have >=1 competition membership
- live Neon: derivation still succeeds for river-plate / boca-juniors / toluca
```

This Design Brief **does not** satisfy gates #2–#5.

---

## 15. Pre-execution gates (checklist)

Before Neon execution, **all** of the following must be true:

```txt
[ ] 1. This Design Brief approved (Status → FINAL / approved)
[ ] 2. SQL generated: database/migrations/foundation-v1/019b_*.sql
[ ] 3. SQL reviewed and approved by human
[ ] 4. Technical gates still considered valid
       (no reader/writer/mapping regression since post-cutover gate)
[ ] 5. Human explicitly approves irreversible DROP
[ ] 6. Only then execute Neon
```

---

## 16. Post-migration validation plan

Future SQL / completion validation must confirm:

```txt
[ ] 1.  organizations.sport no longer exists
[ ] 2.  organizations.sport_id still does not exist
[ ] 3.  organizations table otherwise structurally unchanged
        (id / name / slug / branding / country / timezone / is_active / timestamps)
[ ] 4.  sports count unchanged (expect 11)
[ ] 5.  competitions count unchanged (expect 2)
[ ] 6.  competition_organizations count unchanged (expect 3)
[ ] 7.  organizations count unchanged (expect 3)
[ ] 8.  Required memberships still present exactly once each
[ ] 9.  Canonical sport derivation still succeeds for all three orgs
[ ] 10. Multi-competition unique constraint still present
        UNIQUE (competition_id, organization_id)
[ ] 11. No unique constraint on organization_id alone
[ ] 12. Application build / types remain compatible
        (tsc + build; column physically absent matches unmapped Drizzle)
[ ] 13. No Migration 020 objects introduced
```

Optional informational checks:

```txt
- Confirm DEPRECATED comment is gone because column is gone
- Confirm no residual indexes/constraints named around sport on organizations
```

---

## 17. Rollback philosophy

Migration 019 staged hardness:

```txt
019a → soft-ish (data + COMMENT; column retained)
App  → application contract cutover
019b → hard contract migration
```

### Honest rollback model

Physical DROP is **not** a trivial transactional reversal after successful adoption.

| Scenario | Behavior |
|----------|----------|
| Statement failure mid-migration | Operator stops; inspect state; re-run with defensive DROP + validation; do not invent ad-hoc fixes |
| Rollback **before** Neon adoption (brief/SQL rejected) | No reverse migration needed — column still present |
| Reverse **after** successful physical removal | Requires a **dedicated reverse migration** that recreates `organizations.sport` (TEXT, historically NOT NULL + default `'football'`) and optionally restores free-text values — **not** a return to canonical ownership |

```txt
Do NOT pretend rollback is a simple transactional undo
after application has adopted the post-019b schema.

Canonical sport ownership must never be restored onto organizations.sport.
```

Reverse migration (if ever needed) is a separate, explicitly approved Foundation action — not part of 019b forward SQL.

---

## 18. Omit-safe analysis (explicit)

Unlike ADR-009 / `fans.organization_id`, Migration 019 does **not** require an omit-safe (`NULLABLE`) intermediate migration before DROP.

Reasons (Gate Assessment):

```txt
ZERO application reads
ZERO application writes
ZERO Drizzle mapping
ZERO scripts/tooling writers
Column default already satisfies any unrelated legacy INSERT that omits sport
before DROP; after DROP, current app does not reference the column
```

**Frozen conclusion:**

```txt
No ADR-009-style omit-safe migration is required for organizations.sport.
Direct 019b physical DROP is independently deployable for this application,
provided technical gates remain green at execution time.
```

---

## 19. Prospective DROP scope (assessment — no SQL)

```txt
ALTER TABLE organizations DROP COLUMN sport
```

Companion object removal:

```txt
None required beyond PostgreSQL automatic removal of column default (pg_attrdef).
```

Do not use `CASCADE`.

---

## 20. Files / references

```txt
docs/sessions/2026-07-19-migration-019a-canonical-competition-data-design.md
docs/sessions/2026-07-19-migration-019a-canonical-competition-data.md
docs/sessions/2026-07-19-migration-019-organization-sport-application-cutover.md
docs/decisions/ADR-004-sports-competitions-organizations.md
docs/decisions/ADR-005-managed-vs-integrated-competitions.md
docs/04-database/current-schema.md
docs/04-database/physical-model-v1.md
docs/04-database/gap-analysis.md
docs/04-database/migration-plan-v1.md
docs/04-database/foundation-db-backlog.md
PROJECT_STATE.md
src/db/schema/organizations.ts   (already unmapped — do not change in 019b)
```

Future SQL path (only after brief approval):

```txt
database/migrations/foundation-v1/019b_remove_legacy_organization_sport.sql
```

---

## 21. Approval record

```txt
Design Brief status:  FINAL — approved, executed, and validated in Neon
SQL path:             database/migrations/foundation-v1/019b_remove_legacy_organization_sport.sql
Neon:                 EXECUTED AND VALIDATED
App / Drizzle:        Not modified during 019b execution
Migration 020:        Not started
Irreversible DROP:    Granted + executed
Completion session:   docs/sessions/2026-07-19-migration-019b-remove-legacy-organization-sport.md
```

### Process completed

```txt
1. Human SQL review — PASS
2. Explicit human irreversible DROP approval — granted
3. Neon execution — COMPLETE
4. Completion documentation — COMPLETE
```

---

## 22. Explicit non-actions retained from SQL-generation / execution

```txt
No application behavior changes in 019b
No Drizzle schema field additions
No sports / competitions / competition_organizations data changes
No Migration 020 started
No organizations.sport_id introduced
No new ADR created
```

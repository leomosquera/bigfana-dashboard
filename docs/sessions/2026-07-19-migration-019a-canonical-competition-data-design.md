# Migration 019a — Canonical Competition Data + Legacy Organization Sport Deprecation
## Design Brief

**Date:** 2026-07-19  
**Status:** FINAL — approved, executed, and validated in Neon  
**SQL:** `database/migrations/foundation-v1/019a_canonical_competition_data.sql`  
**Theme:** Migration 019 — Remove Legacy Organization Sport  
**Contract:** ADR-004 / ADR-005 Accepted — Frozen  
**New ADR:** Not required  
**Canonical Competition Data Package:** HUMAN APPROVED

---

## Architecture freeze (approved)

Locked before this Design Brief. Must not change during SQL generation or later review.

| Topic | Decision |
|-------|----------|
| Overall theme | Migration 019 — Remove Legacy Organization Sport |
| Hierarchy | ADR-004: Sport → Competition → Organization |
| Competition types | ADR-005: `INTEGRATED` \| `MANAGED` only |
| Canonical sport path | `organization → competition_organizations → competitions → sports` |
| Legacy field | `organizations.sport` — free-text; to become DEPRECATED in 019a |
| Normalization | `organizations.sport = 'football'` → `sports.slug = 'soccer'` |
| Direct org→sport FK | **Forbidden** (`organizations.sport_id` not introduced) |
| Migration **019a** | Canonical competition data + memberships + COMMENT deprecation |
| Application cutover | Remove `organizations.sport` from Drizzle / types — **after 019a** |
| Gate assessment | Canonical relationships + zero consumers — **after app cutover** |
| Migration **019b** | Physical DROP `organizations.sport` — **BLOCKED** |
| Cups / international competitions | Out of scope for 019a |
| Application / Drizzle changes | Forbidden in 019a |
| DROP / RENAME / ALTER `organizations.sport` structure | Forbidden in 019a |

### Frozen contract sequence

```txt
019a  = Canonical competition data + COMMENT deprecation (this migration)
App   = remove organizations.sport from Drizzle / inferred Organization types
Gate  = verify memberships, sport derivation, zero consumers
019b  = Physical DROP organizations.sport (BLOCKED until gates pass)
```

### Why 019a exists

Canonical ADR-004 tables exist but were intentionally empty. Live organizations still carry legacy `organizations.sport = 'football'`. Before physical DROP, Foundation must:

```txt
1. Establish minimum real competition catalog rows
2. Establish organization↔competition memberships
3. Mark organizations.sport DEPRECATED at the database level
```

Without inventing a direct `organizations.sport_id` shortcut.

---

## 1. Objective

Define the approved scope for Foundation Database v1 Migration **019a**.

Populate the approved minimum canonical competition package, establish the three approved memberships, and deprecate `organizations.sport` via `COMMENT ON COLUMN` — without dropping or structurally altering the legacy column, and without any application or Drizzle change in this migration.

**Business outcome:**

```txt
Canonical organization → competition → sport path exists for all three tenants
River Plate and Boca Juniors share Liga Profesional Argentina
Toluca belongs to Liga MX
Both competitions resolve to sports.slug = soccer
organizations.sport is explicitly DEPRECATED / non-authoritative
Physical column remains present until Migration 019b
```

**Non-outcomes (explicit):**

```txt
No DROP of organizations.sport
No RENAME of organizations.sport
No ALTER of organizations.sport type / nullability / default
No organizations.sport_id
No new Organization → Sport FK
No sports catalog mutation (no football row; no soccer rename)
No application / Drizzle / type cutover in this migration
No Migration 019b Design Brief or SQL
No cup / international competition rows
No external provider identifiers
No historical joined_at reconstruction
```

---

## 2. Architectural invariants

Frozen for Migration 019a.

```txt
- ADR-004 / ADR-005 remain Accepted and Frozen.
- No new ADR is required.
- Canonical hierarchy:
    sports
      → competitions
        → competition_organizations
          → organizations
- An organization may belong to multiple competitions.
- Future competitions (Copa Libertadores, Copa Argentina, etc.)
  are added later by inserting/reusing competitions + memberships only.
- No organizations schema change is required for future multi-competition.
- organizations.sport is legacy free-text only after 019a COMMENT.
- New features must not use organizations.sport as canonical sport ownership.
- Canonical sport after cutover:
    organization
      → competition_organizations
      → competitions
      → sports (slug = soccer)
- Physical removal of organizations.sport is Migration 019b only.
- Application / Drizzle mapping of organizations.sport remains until app cutover.
```

---

## 3. Scope

### In scope (DML + DDL comment)

```txt
1. Fail-fast verify sports.slug = 'soccer' resolves to exactly one row
2. Fail-fast verify organizations.slug IN
     ('river-plate', 'boca-juniors', 'toluca') each resolve to exactly one row
3. Create/reuse competitions:
     - liga-profesional-argentina
     - liga-mx
4. Create/reuse competition_organizations memberships:
     - river-plate → liga-profesional-argentina
     - boca-juniors → liga-profesional-argentina
     - toluca → liga-mx
5. COMMENT ON COLUMN organizations.sport
     (DEPRECATED / non-authoritative / replaced by canonical path /
      physical removal deferred to Migration 019b)
```

Exact SQL syntax is deferred to SQL generation after this Design Brief is approved.

### In scope (documentation / validation — non-SQL in this step)

```txt
Record contract in migration header (when SQL is authored)
Provide post-migration validation checklist
Document app cutover → gate → 019b sequence
```

### Tables affected

```txt
competitions                    (INSERT of approved rows if absent)
competition_organizations       (INSERT of approved memberships if absent)
organizations                   (COMMENT ON COLUMN sport only)
```

### Tables not structurally altered

```txt
sports
organizations (no column ADD/DROP/ALTER besides COMMENT)
All other Foundation DB v1 tables
```

### Data impact

```txt
Expected inserts if catalog/memberships empty:
  - 2 competition rows
  - 3 competition_organizations rows

No UPDATE of organizations.sport values
No DELETE of unrelated competitions/memberships
No sports INSERT/UPDATE/DELETE
```

### General conventions

```txt
BEGIN / COMMIT transaction wrapper
Deterministic slug-based lookups
Fail-fast on missing/ambiguous sources or conflicting semantics
No DB triggers
No application logic in migration
Idempotent re-run safe when data already matches package
```

---

## 4. Exact canonical data package (frozen)

### Sport (reuse only)

| Lookup | Required value |
|--------|----------------|
| `sports.slug` | `soccer` |
| Cardinality | Exactly **1** row |
| Mutations | **None** |

Do **not** create `sports.slug = 'football'`.  
Do **not** rename soccer.

### Competitions (create or compatible reuse)

#### Competition 1

| Column | Required value |
|--------|----------------|
| `name` | `Liga Profesional Argentina` |
| `slug` | `liga-profesional-argentina` |
| `sport_id` | `sports.id` WHERE `slug = 'soccer'` |
| `competition_type` | `INTEGRATED` |
| `country_code` | `AR` |
| `is_active` | `TRUE` |
| `id` / timestamps | Schema defaults (`gen_random_uuid()`, `NOW()`) |

#### Competition 2

| Column | Required value |
|--------|----------------|
| `name` | `Liga MX` |
| `slug` | `liga-mx` |
| `sport_id` | same soccer `sport_id` as Competition 1 |
| `competition_type` | `INTEGRATED` |
| `country_code` | `MX` |
| `is_active` | `TRUE` |
| `id` / timestamps | Schema defaults |

### Memberships (create or reuse)

| Organization slug | Competition slug | `joined_at` |
|-------------------|------------------|-------------|
| `river-plate` | `liga-profesional-argentina` | `NULL` |
| `boca-juniors` | `liga-profesional-argentina` | `NULL` |
| `toluca` | `liga-mx` | `NULL` |

Rules:

```txt
River Plate and Boca Juniors → SAME competition row
Toluca → Liga MX competition row
Both competitions → SAME soccer sport row
No extra memberships in 019a
No cup/international competitions in 019a
```

### Deterministic lookup freeze

| Entity | Primary lookup |
|--------|----------------|
| Organization | `organizations.slug` |
| Sport | `sports.slug` |
| Competition | `competitions.slug` |

Do **not** use organization display `name` as primary lookup.

Optional secondary UUID assertions may be used in validation notes, but slug remains authoritative for execution.

---

## 5. Idempotency strategy

Prefer existing unique keys:

```txt
competitions.slug                                   UNIQUE
competition_organizations (competition_id, organization_id)  UNIQUE
```

### Competitions

| Precondition | Behavior |
|--------------|----------|
| slug absent | INSERT approved canonical row |
| slug present **and** compatible with approved semantics | REUSE — no duplicate, no mutation |
| slug present **and** conflicting semantics | **FAIL** transaction — do not overwrite |

### Memberships

| Precondition | Behavior |
|--------------|----------|
| `(competition_id, organization_id)` absent | INSERT (`joined_at = NULL`) |
| already present | REUSE — no duplicate, no mutation of unrelated fields |
| unrelated existing memberships | **Leave untouched** |

### Compatibility definition for an existing competition slug

Treat as **compatible** only if **all** of the following match the approved package exactly:

```txt
sport_id         → resolves to sports.slug = 'soccer'
competition_type → 'INTEGRATED'
country_code     → 'AR' or 'MX' as approved for that slug
name             → exact approved display name
is_active        → TRUE
```

### Why `name` and `is_active` are strict

```txt
name:
  Part of the human-approved Foundation package.
  Slug collision with a different display identity is a semantic conflict.
  Silent rename would mutate business catalog data — forbidden.

is_active:
  Foundation package requires active competitions.
  Silent reactivation (UPDATE is_active) would mutate business state.
  If slug exists but is_active = FALSE → FAIL for human review.
```

Do **not** silently mutate conflicting competition rows to “fix” them into the package.

---

## 6. Conflict / fail-fast strategy

Migration execution **must abort** (raise exception; roll back transaction) if any of the following occur:

### Source resolution failures

```txt
sports.slug = 'soccer' resolves to 0 rows
sports.slug = 'soccer' resolves to >1 rows
organizations.slug = 'river-plate' missing or ambiguous
organizations.slug = 'boca-juniors' missing or ambiguous
organizations.slug = 'toluca' missing or ambiguous
```

### Competition semantic conflicts

```txt
competitions.slug = 'liga-profesional-argentina' exists but:
  - sport_id is not soccer, OR
  - competition_type <> 'INTEGRATED', OR
  - country_code IS DISTINCT FROM 'AR', OR
  - name <> 'Liga Profesional Argentina', OR
  - is_active IS NOT TRUE

competitions.slug = 'liga-mx' exists but:
  - sport_id is not soccer, OR
  - competition_type <> 'INTEGRATED', OR
  - country_code IS DISTINCT FROM 'MX', OR
  - name <> 'Liga MX', OR
  - is_active IS NOT TRUE
```

### Safety invariants during execution

```txt
Do not create sports.slug = 'football'
Do not UPDATE/DELETE sports rows
Do not UPDATE organizations.sport values
Do not DELETE unrelated competitions or memberships
Do not INSERT cups / international competitions
```

Conceptual fail-fast (non-executable pseudocode only):

```txt
IF count(sports where slug='soccer') <> 1 THEN FAIL
IF any required org slug missing THEN FAIL
FOR each approved competition slug:
  IF exists AND not compatible THEN FAIL
  IF absent THEN create
FOR each approved membership:
  IF absent THEN create ELSE reuse
COMMENT organizations.sport DEPRECATED
```

---

## 7. Deprecation contract

### After successful 019a

```txt
competitions + competition_organizations
  = canonical organization competition / sport path

organizations.sport
  = DEPRECATED legacy free-text compatibility field
    (physically still present; values unchanged)
```

No new feature may treat `organizations.sport` as canonical sport ownership.

### Required COMMENT meaning (exact SQL wording deferred)

```txt
DEPRECATED (ADR-004 / Migration 019a).
Non-authoritative.
Canonical organization competition and sport context is derived via
competition_organizations → competitions → sports.
Must not be used as canonical sport ownership.
Physical removal is Migration 019b only.
```

### Structural state of `organizations.sport` after 019a

```txt
Column remains present
Type / nullability / default unchanged
  (live baseline: text NOT NULL DEFAULT 'football')
Row values unchanged
COMMENT marks DEPRECATED
```

---

## 8. Validation plan

### Pre-execution

- [ ] Human approval of this Design Brief recorded
- [ ] Canonical Competition Data Package remains approved
- [ ] Branch is not `main`
- [ ] Migrations 001–018b confirmed executed/validated in Neon as applicable
- [ ] `sports`, `competitions`, `competition_organizations`, `organizations` exist
- [ ] Live CHECK allows `INTEGRATED` / `MANAGED` only
- [ ] Unique keys exist: `competitions.slug`, `(competition_id, organization_id)`

### Post-execution — Catalog / memberships

- [ ] Exactly one `sports.slug = 'soccer'`
- [ ] Zero `sports.slug = 'football'`
- [ ] Sports catalog row count unchanged vs pre-019a baseline
- [ ] Exactly one `competitions.slug = 'liga-profesional-argentina'`
- [ ] Exactly one `competitions.slug = 'liga-mx'`
- [ ] Both competitions reference soccer `sport_id`
- [ ] Both have `competition_type = 'INTEGRATED'`
- [ ] Country codes `AR` / `MX` respectively
- [ ] Both `is_active = TRUE`
- [ ] Names match approved package exactly
- [ ] Membership: `river-plate` → `liga-profesional-argentina`
- [ ] Membership: `boca-juniors` → `liga-profesional-argentina`
- [ ] Membership: `toluca` → `liga-mx`
- [ ] No duplicate membership rows for those pairs
- [ ] Unrelated competitions/memberships (if any) remain untouched
- [ ] Organization count unchanged
- [ ] Canonical sport derivation succeeds for all three orgs:
      org → membership → competition → sports.slug = 'soccer'

### Post-execution — Legacy column

- [ ] `organizations.sport` column still exists
- [ ] Type / nullability / default unchanged
- [ ] All `organizations.sport` values unchanged vs pre-019a (expect `'football'` for the three tenants)
- [ ] Column comment present and references DEPRECATED / ADR-004 / Migration 019a / competition path / 019b

### Idempotency

- [ ] Re-run of 019a succeeds with no duplicate competitions/memberships
- [ ] Re-run does not mutate compatible existing rows

### Validation cleanup expectations

```txt
019a creates durable Foundation canonical data — NOT temporary validation fixtures.
The two competitions and three memberships MUST REMAIN after successful execution.
Do not delete them as “cleanup.”
COMMENT remains until superseded by 019b DROP (or explicit human rollback of comment).
```

---

## 9. Rollback philosophy

Distinguish two artifacts:

### A. Schema deprecation COMMENT

```txt
Soft / reversible.
Safe to clear or restore prior comment without data loss.
Does not remove competitions or memberships.
```

### B. Canonical data introduced by 019a

```txt
competitions rows (liga-profesional-argentina, liga-mx)
competition_organizations memberships (3 approved pairs)
```

Rollback of canonical data:

```txt
Safe ONLY before dependent application/product adoption
AND only if no other relationships now depend on those competition rows
  (e.g. seasons, matches, fan_competitions, sponsor links — currently none expected)

After adoption / dependent rows exist:
  NO automatic destructive rollback

Prefer contract-aware human decision over automatic DELETE.
FK ON DELETE RESTRICT on competition_organizations will block
naive competition deletes while memberships exist.
```

019a rollback must **never** imply Migration 019b DROP undo semantics — 019b is separately gated and irreversible once executed.

---

## 10. Explicitly OUT OF SCOPE for 019a

```txt
DROP organizations.sport
RENAME organizations.sport
ALTER organizations.sport type / nullability / default
organizations.sport_id
new Organization → Sport FK
modifying sports.slug = 'soccer'
creating sports.slug = 'football'
application code changes
Drizzle changes
removing organizations.sport from app types
Migration 019b Design Brief
Migration 019b SQL
Migration 019b Neon execution
cup / international competition catalog
external provider identifiers
competition branding / licensing metadata
historical joined_at reconstruction
silent mutation of conflicting competition rows
```

The legacy column must remain physically present after 019a.

---

## 11. Post-019a next steps (do not start now)

After successful 019a SQL approval, Neon execution, validation, and documentation alignment:

```txt
1. Application cutover
   - remove organizations.sport from Drizzle organizations schema
   - remove from inferred Organization / NewOrganization types
   - confirm no runtime readers/writers remain

2. Gate assessment
   - zero runtime readers of organizations.sport
   - zero runtime writers
   - zero Drizzle mapping
   - three canonical memberships intact
   - sport derivation via soccer path valid for all three orgs
   - no unexpected DB dependencies on organizations.sport

3. Migration 019b Design Brief

4. Human review of 019b Design Brief

5. Migration 019b SQL

6. Explicit human approval for irreversible DROP

7. Neon execution of 019b
```

Do **not** start any of these steps from this Design Brief approval alone.

---

## 12. ADR assessment

```txt
No new ADR required.

Plan remains fully within:
  ADR-004 Sports, Competitions and Organizations
  ADR-005 Managed vs Integrated Competitions

competition_type = INTEGRATED is the existing CHECK vocabulary
for professional external-provider leagues (ADR-005 examples).
```

---

## 13. SQL generation notes (for implementer after approval)

```txt
File (generated for human review — NOT EXECUTED):
  database/migrations/foundation-v1/019a_canonical_competition_data.sql

Wrap in BEGIN / COMMIT
Follow foundation-v1 header comment style (see 017 / 018a)
Document ADR-004 / ADR-005 / Migration 019 theme in header
Resolve sport/orgs/competitions by slug
Fail-fast on missing/ambiguous/conflicting rows
Idempotent create-or-reuse for competitions + memberships
COMMENT ON COLUMN organizations.sport only structural DDL
Do NOT DROP / RENAME / ALTER organizations.sport
Do NOT mutate sports catalog
Do NOT UPDATE organizations.sport values
Do NOT author Migration 019b in the same change
```

---

## 14. References

```txt
docs/decisions/ADR-004-sports-competitions-organizations.md
docs/decisions/ADR-005-managed-vs-integrated-competitions.md
docs/04-database/migration-plan-v1.md              → Migration 019
docs/04-database/physical-model-v1.md              → competitions / Global Catalog Rules
docs/04-database/current-schema.md
docs/04-database/gap-analysis.md
docs/04-database/foundation-db-backlog.md
database/migrations/foundation-v1/002_create_sports.sql
database/migrations/foundation-v1/003_create_competitions.sql
database/migrations/foundation-v1/004_create_competition_organizations.sql
src/db/schema/organizations.ts                     → sport still mapped (cutover later)
```

**Approved architecture inputs:**

```txt
Migration 019 Architecture Review decisions (frozen)
Migration 019 Canonical Competition Data Package (HUMAN APPROVED)
Staging Option A:
  019a data + COMMENT → app cutover → gate → 019b DROP
```

---

## 15. Approval gate

| Item | Status |
|------|--------|
| ADR-004 / ADR-005 | Accepted — Frozen |
| Canonical Competition Data Package | HUMAN APPROVED |
| Architecture freeze | Locked above |
| Scope: data + COMMENT only | Locked |
| No DROP / RENAME / structural ALTER of organizations.sport | Locked |
| No app / Drizzle changes in 019a | Locked |
| SQL generation | Complete |
| Neon execution | Complete — executed and validated |
| Idempotent re-run | PASS |
| Application / Drizzle cutover | NOT STARTED — NEXT |
| Migration 019b | **BLOCKED** |
| Physical DROP `organizations.sport` | **BLOCKED** |

**Next Foundation step:** Application / Drizzle cutover (remove `organizations.sport` mapping/types), then Gate assessment.  
Do **not** start Migration 019b Design Brief or DROP until Gate PASS and explicit human approval.

---

## 16. Design Brief delivery confirmation

| Item | Status |
|------|--------|
| Design Brief file created | Yes — this document |
| SQL generated | **Yes** |
| Neon DDL/DML executed | **Yes** — validated |
| Application code modified | **No** (cutover next) |
| Drizzle modified | **No** (cutover next) |
| `organizations.sport` DROP | **No** — column still exists / DEPRECATED |
| Migration 019b work | **No** |
| Completion docs updated | **Yes** (this completion step) |
| Physical DROP | **BLOCKED** |

# Legacy Fan Country Physical Removal
## Design Brief

**Date:** 2026-07-19  
**Status:** COMPLETE — SQL reviewed, DROP approved, Neon executed, validated, docs closed  
**Working identity:** Legacy Fan Country Physical Removal  
**Migration number:** NOT ASSIGNED  
**SQL:** `database/migrations/foundation-v1/remove_legacy_fan_country.sql`  
**Theme:** Physical cleanup after Block D fan geographic application cutover  
**New ADR:** Not required  
**Execution:** COMPLETE — EXECUTED AND VALIDATED in Neon  
**Completion session:** `docs/sessions/2026-07-20-legacy-fan-country-physical-removal.md`

---

## Approval authority (explicit)

```txt
Design Brief: HUMAN APPROVED
SQL: GENERATED and HUMAN REVIEWED
Human irreversible DROP approval: GRANTED
Neon execution: COMPLETE
Validation: COMPLETE
Completion documentation: COMPLETE
```

Historical note: Design Brief approval alone did not authorize Neon execution;
execution required the separate irreversible DROP approval that was later granted.

---

## Architecture freeze (proposed for approval)

Locked by this Design Brief once approved. Must not change during SQL generation or later review without reopening the brief.

| Topic | Decision |
|-------|----------|
| Working identity | Legacy Fan Country Physical Removal |
| Canonical geography | `fans.country_code` — ISO-3166-1 alpha-2 or NULL |
| Legacy field | `fans.country` — free-text; physically remove |
| Destructive scope | Exact: `DROP COLUMN fans.country` |
| `fans.country_code` | **Unchanged** (no ALTER, no CHECK change) |
| Application / Drizzle | **Forbidden** in this migration (Block D already complete) |
| Omit-safe / NULLABLE intermediate | **Not required** (already nullable; unused) |
| CASCADE | **Forbidden** |
| DML / backfill | **Forbidden** |
| Migration number | **NOT ASSIGNED** |
| Migration 020 | **NOT STARTED / NO FROZEN SCOPE** |
| New ADR | **Not required** |
| Human irreversible DROP approval | **Granted — Neon DROP COMPLETE** |

### Frozen contract sequence

```txt
Migration 006   = ADD country_code + CHECK + Argentina backfill — COMPLETE
Block C         = Architecture Review — COMPLETE
Block D         = Application cutover (country_code SoT; country unmapped) — COMPLETE
Block E         = Post-cutover gate assessment — COMPLETE (verdict A)
This brief      = Design physical DROP fans.country — APPROVED
SQL generation  = COMPLETE (human reviewed)
Neon DROP       = COMPLETE — EXECUTED AND VALIDATED
```

### Why this removal exists

Block D completed the application cutover. Neon retained unused legacy free-text until physical removal:

```txt
fans.country  — TEXT NULLABLE, no default, unused → PHYSICALLY REMOVED
```

Canonical geography remains authoritative in:

```txt
fans.country_code  — TEXT NULLABLE + fans_country_code_check
```

Physical removal discards only redundant non-authoritative legacy representation.

---

## 1. Objective

Define the approved scope for the future physical removal of `fans.country` from Neon, without changing application code, Drizzle schemas, `fans.country_code`, or any unrelated Foundation contracts.

**Business outcome:**

```txt
Legacy fans.country column is gone from Neon
Canonical fan geography remains fans.country_code
ISO-2 CHECK fans_country_code_check remains
No application behavior change (already cut over in Block D)
```

**Non-outcomes (explicit):**

```txt
No application / Drizzle changes in this migration
No changes to fans.country_code
No new country tables or catalog redesign
No DB CHECK modifications
No EEP feature work
No fan_status cleanup
No indexes
No organization / competition geography changes
No Migration 020 freeze or assignment by this brief
No authorization to execute Neon DROP by this brief alone
```

---

## 2. Background

### Completed path

```txt
006   → country_code expand + CHECK + backfill
Block C → READY FOR COUNTRY_CODE CUTOVER DESIGN
Block D → write/read/UI/Drizzle cutover to country_code
Block E → TECHNICALLY READY FOR DROP DESIGN BRIEF
```

### Gate assessment snapshot (Block E)

```txt
Zero legacy runtime readers/writers: PASS
Zero Drizzle mapping: PASS
Zero DTO/UI dependency: PASS
Canonical create/update use country_code: PASS
Live data: 7 fans; 0 legacy-only; 0 divergent; 1 Argentina↔AR
DROP discards sole geographic information: NO
Unexpected DB dependents: NONE
EEP / out-of-repo writers: UNKNOWN (operational gates)
```

### Architectural invariants (must remain)

```txt
fans.organization_id = ABSENT
organizations.sport = ABSENT
organizations.sport_id = ABSENT
fan_organizations = fan ownership SoT
competition_organizations → competitions → sports = org sport path
fans.country_code = canonical fan geographic field
```

---

## 3. Frozen scope

### In scope

```txt
Physical removal of fans.country
Pre-execution validation (SQL + repository + operational)
Post-execution validation
Idempotency strategy
Transaction strategy
Dependency safety (no CASCADE)
Data-impact statement
Rollback philosophy
Deployment compatibility gates
```

### Explicitly out of scope

```txt
Changes to fans.country_code
New country tables
Country catalog redesign
DB CHECK modifications (fans_country_code_check stays as-is)
ISO validation / country-codes.ts changes
FanForm / actions / services / Drizzle changes
EEP feature work
fan_status cleanup
Indexes
NEW-F18 broader Drizzle mapping
organizations.country changes
competitions.country_code changes
Migration 020 assignment or freeze
```

### Intended destructive statement (conceptual — not SQL)

```txt
ALTER TABLE fans
  DROP COLUMN country;
```

Exact SQL generated at:

`database/migrations/foundation-v1/remove_legacy_fan_country.sql`

(for human review; Neon execution still blocked)

---

## 4. Migration identity

```txt
Working identity:
  Legacy Fan Country Physical Removal

Future physical-removal migration required.
Migration number NOT ASSIGNED.

Migration 020:
  NOT STARTED
  NO FROZEN SCOPE
```

A migration number may only be assigned by explicit human decision later. This brief must not invent or reserve Migration 020.

---

## 5. Pre-execution gates

### 5.1 SQL-verifiable gates

Future SQL / Neon pre-checks must verify (or fail loudly):

```txt
1. Table fans exists
2. Column fans.country_code exists
3. Constraint fans_country_code_check exists
4. If fans.country is present:
     - type TEXT (or equivalent character type)
     - NULLABLE
     - no unexpected default that would alter DROP semantics
5. Zero rows: country IS NOT NULL AND country_code IS NULL
6. Zero divergent legacy/canonical pairs
     (consistent Argentina↔AR / equivalent mappings only)
7. country_code values: all NULL or matching ^[A-Z]{2}$
8. No unexpected dependents on fans.country
     (views / triggers / indexes / FKs / policies)
9. Fan count captured for post-check invariance
10. country_code distribution captured for post-check invariance
```

If `fans.country` is already absent → treat as **ALREADY APPLIED** (idempotent success path; see §8).

If schema is drifted (wrong type, unexpected dependents) → **FAIL** (do not DROP).

### 5.2 Repository-verifiable gates

Must remain true immediately before execution authorization:

```txt
1. Drizzle fans schema does not map country
2. Zero runtime READ of fans.country
3. Zero runtime WRITE of fans.country
4. Create/Update DTOs use countryCode only
5. FanForm / FansClient / FanProfileDrawer use countryCode + labels
6. Historical scripts that ADD country are quarantined or acknowledged
   (scripts/migrate-fans-v1.ts)
```

### 5.3 Operational / human gates

SQL cannot verify these. Execution remains blocked until a human/operator confirms:

```txt
1. Block D deployment is fully propagated
2. No active pre-Block-D application instances requiring fans.country
3. Rollback-to-old-app incompatibility after DROP is explicitly accepted
4. Out-of-repo writer risk reviewed:
     No known external integration or writer still requires fans.country
5. EEP / external systems reviewed:
     No known consumer of fans.country
     (Block E: UNKNOWN — must not be converted to PASS without review)
6. Explicit irreversible human DROP approval obtained
```

If out-of-repo / EEP confirmation cannot be obtained → **execution remains blocked**.  
This does **not** block Design Brief approval or later SQL generation.

---

## 6. External writer / EEP gate

Block E status:

```txt
EEP compatibility: UNKNOWN
Out-of-repo writers: UNKNOWN
In-repo secondary writers: ZERO
```

Design requirement:

```txt
Before Neon execution, a human/operator must confirm that no known
out-of-repo integration or external writer still writes or requires
fans.country.

If this cannot be confirmed, Neon execution remains blocked.
```

Do not convert UNKNOWN → PASS in SQL or documentation without human confirmation.

---

## 7. Rolling deployment safety

| Combination | Compatible? |
|-------------|-------------|
| New Block D app + DB pre-DROP | YES |
| New Block D app + DB post-DROP | YES |
| Old pre-Block-D app + DB pre-DROP | YES |
| Old pre-Block-D app + DB post-DROP | **NO** |

Therefore execution requires:

```txt
Block D deployment fully propagated
No active old instances requiring fans.country
Rollback compatibility risk explicitly accepted
```

No omit-safe intermediate migration is designed: legacy `country` is already nullable and the new app does not depend on it.

---

## 8. Dependency strategy

Block E found **no** dependencies on `fans.country`.

Future removal:

```txt
DROP COLUMN without CASCADE
Unexpected dependents → fail loudly
Do not invent CASCADE cleanup
```

---

## 9. Idempotency strategy

| State | Expected behavior |
|-------|-------------------|
| **FIRST EXECUTION** | Pre-checks PASS → DROP `country` → post-checks PASS |
| **ALREADY APPLIED / RE-RUN** | `country` absent → success / no-op path; still verify `country_code` + CHECK intact |
| **DRIFTED STATE** | Unexpected type, dependents, legacy-only rows, or invalid codes → **FAIL** (no DROP) |

Recommended SQL-generation guidance (not SQL):

```txt
Prefer IF EXISTS semantics for DROP COLUMN where supported
Hard post-check: column MUST be absent after success path
Hard post-check: country_code + fans_country_code_check MUST remain
```

---

## 10. Transaction strategy

Conceptual shape (not executable SQL):

```txt
BEGIN
  → pre-check (SQL-verifiable gates)
  → DROP legacy column fans.country
  → post-check (column absent; country_code intact; counts unchanged)
COMMIT
```

```txt
No DML
No backfill
No CASCADE
Single transaction preferred
```

---

## 11. Data impact

Live snapshot at Block E assessment:

| Field | Distribution |
|-------|--------------|
| `country` | 6 NULL, 1 `"Argentina"` |
| `country_code` | 6 NULL, 1 `"AR"` |
| legacy-only rows | **0** |
| divergent rows | **0** |

Physical removal discards only redundant/non-authoritative legacy free-text representation.

Canonical geography remains in `fans.country_code`.

**Canonical business-data loss?**

```txt
NO
```

…provided pre-execution gates still hold at execution time (especially zero legacy-only / zero divergent).

---

## 12. Post-removal validation

### Neon / SQL

```txt
fans.country ABSENT
fans.country_code PRESENT
fans_country_code_check PRESENT
fan count unchanged vs pre-check
country_code distribution unchanged vs pre-check
no invalid country_code values
architectural invariants unchanged
  (no organization_id / sport / sport_id resurrection)
```

### Application

```txt
npx tsc --noEmit PASS
npm run build PASS
scoped eslint PASS
relevant tests PASS (at minimum fan-organizations)
repository search: zero legacy fans.country runtime references
```

---

## 13. Rollback philosophy

Physical removal is a **hard contract**.

```txt
No reverse SQL in this migration
Restoring the column requires a separate approved migration
Restored free-text must never become canonical again
  (country_code remains SoT)
Rollback to a pre-Block-D application after DROP
  is not automatically supported
```

---

## 14. ADR assessment

```txt
New ADR required: NO
```

Rationale: physical cleanup of a field already retired by completed application cutover (Block D) under an existing Foundation profile contract (Migration 006 / physical-model `country_code`). No new architectural choice is introduced.

Do not create an ADR for this brief.

---

## 15. Approval checklist (for humans)

Before marking this Design Brief **APPROVED**:

```txt
[ ] Frozen scope accepted (DROP country only)
[ ] Out-of-scope list accepted
[ ] Operational gates understood (deploy / EEP / external writers)
[ ] Migration number remains NOT ASSIGNED
[ ] Migration 020 remains NOT STARTED / NO FROZEN SCOPE
[ ] Acknowledge: brief approval ≠ Neon execution authority
```

Before SQL generation (after brief approval):

```txt
[x] Explicit human authorization to generate SQL
```

Before Neon execution (after SQL review):

```txt
[ ] All SQL-verifiable pre-checks green at execution time
[ ] Repository zero-surface reconfirmed
[ ] Block D deployment propagation confirmed
[ ] No active pre-Block-D instances confirmed
[ ] Out-of-repo / EEP writer review confirmed
[ ] Explicit irreversible DROP approval recorded
```

---

## 16. Related documents

- `docs/sessions/2026-07-19-fan-geographic-data-contract-architecture-review.md`
- `docs/sessions/2026-07-19-fan-geographic-data-application-cutover.md`
- `docs/sessions/2026-07-19-legacy-fan-country-post-cutover-gate-assessment.md`
- Migration 006 fan profile foundation
- `docs/04-database/current-schema.md`
- Pattern reference: Migration 019b Design Brief (direct DROP after app cutover)

---

## 17. Closure status (post-execution)

```txt
SQL reviewed
Human irreversible DROP approved
Neon DROP executed and validated
Idempotent re-run validated
Application validation passed
Completion documentation complete
Migration number NOT ASSIGNED
Migration 020 NOT STARTED / NO FROZEN SCOPE
```

See completion session:

`docs/sessions/2026-07-20-legacy-fan-country-physical-removal.md`

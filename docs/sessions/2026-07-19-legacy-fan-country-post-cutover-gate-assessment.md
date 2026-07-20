# Gate Assessment — Legacy `fans.country` Post-Cutover

Date:

2026-07-19

Status:

```txt
ASSESSMENT ONLY — PHYSICAL REMOVAL NOT COMPLETE
NO DESIGN BRIEF
NO SQL
NO NEON MUTATION
```

---

## Executive verdict

```txt
A. TECHNICALLY READY FOR LEGACY FAN COUNTRY DROP DESIGN BRIEF
```

No technical application/data/DB-dependency blockers.

Physical DROP remains **not authorized**.

Maximum next process step: Design Brief (migration number **not** assigned; Migration 020 remains unreserved).

---

## Verified Block D contract

```txt
Canonical field:     fans.country_code
Create/Update:       write countryCode only (no dual-write)
Read/UI:             countryCode + getCountryLabel()
Drizzle:             country unmapped; countryCode mapped
Legacy fans.country: physically present in Neon
```

---

## Live Neon — legacy column

```txt
exists:     YES
type:       text
nullable:   YES
default:    none
comment:    none
CHECK:      none on country
indexes:    none on country
FK/views/triggers/RLS/policies/pg_depend: NONE
```

`ALTER TABLE fans DROP COLUMN country` would affect **no** unexpected dependents (NONE).

---

## Live Neon — country_code integrity

```txt
total:           7
NULL:            6
populated:       1 (AR)
invalid ISO-2:   0
non-normalized:  0
wrong length:    0
```

DB CHECK present: `fans_country_code_check` (`NULL OR ^[A-Z]{2}$`).

---

## Legacy vs canonical comparison

```txt
LEGACY NULL / CANONICAL NULL:              6
LEGACY VALUE / CANONICAL CONSISTENT:       1  (Argentina ↔ AR)
LEGACY VALUE / CANONICAL DIVERGENT:        0
LEGACY VALUE / CANONICAL NULL:            0
LEGACY NULL / CANONICAL VALUE:            0
```

Would DROP discard the only geographic information for any fan?

```txt
NO
```

Evidence: zero rows with `country IS NOT NULL AND country_code IS NULL`.

---

## Repository zero-surface (legacy fan country)

```txt
A–R legacy runtime / Drizzle / DTO / UI / scripts active: ZERO
S docs/migrations/history: allowed residual
T unrelated: organizations.country, competitions.countryCode, design-system mocks
```

Historical note: `scripts/migrate-fans-v1.ts` can ADD `country` if re-run — not an active writer; quarantine before/after DROP design.

---

## Rolling deployment

```txt
New Block D app + DB pre-DROP:   OK
New Block D app + DB post-DROP:  OK (column unmapped)
Old pre-Block D app + pre-DROP:  OK
Old pre-Block D app + post-DROP: BREAKS (SELECT/INSERT/UPDATE country via old Drizzle)
```

Operational gates before Neon DROP:

```txt
- Block D deployment fully propagated
- No active pre-Block D instances / rollback-to-old acknowledged
- Out-of-repo writers: UNKNOWN (confirm operationally)
- Human irreversible DROP approval
```

---

## Direct DROP vs staged

```txt
Recommend: Direct physical DROP after Design Brief + human approval
```

Rationale: already nullable, no default, zero mapping/readers/writers, no unexpected dependents — unlike ADR-009 `organization_id` which required omit-safe 018a. Closer to Migration 019b pattern after app cutover.

---

## Hard gates (summary)

```txt
Zero legacy readers/writers/mapping/DTO/UI: PASS
Canonical create/update paths: PASS
Canonical values valid: PASS
No sole-geo loss: PASS
No unexpected DB dependents: PASS
EEP: UNKNOWN (no geography payload; prefer country_code when built)
In-repo secondary writers: PASS (zero active)
Out-of-repo writers: UNKNOWN
New app before/after DROP: PASS
Old-app rollback risk: PASS (understood — operational)
Human DROP approval: NOT YET
```

---

## Future migration

```txt
Future physical-removal migration required.
Migration number NOT assigned.

Migration 020:
NOT STARTED
NO FROZEN SCOPE
```

---

## Recommended next step

Authorize **Design Brief** for physical `DROP COLUMN fans.country` (unnumbered migration; do not freeze as Migration 020 unless explicitly decided).

---

## Explicit non-actions (this session)

```txt
No Design Brief / SQL / migration / Neon DDL / DML
No application / Drizzle changes
No physical DROP
Migration 020 NOT STARTED / NO FROZEN SCOPE
```

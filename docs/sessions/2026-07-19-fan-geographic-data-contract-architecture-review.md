# Architecture Review — Fan Geographic Data Contract

Date:

2026-07-19

Status:

```txt
ARCHITECTURE REVIEW ONLY — NO IMPLEMENTATION
NO COMPLETION CLAIMS
```

---

## Goal

Determine the current contract and safest end-state for:

```txt
fans.country
fans.country_code
```

before any application cutover, backfill, or destructive DDL.

---

## Executive verdict

```txt
READY FOR COUNTRY_CODE CUTOVER DESIGN
```

Evidence supports Option A (`country_code` as sole canonical ISO-3166-1 alpha-2 field).

Live dataset is small and clean (7 fans; 1 consistent Argentina→AR pair; 6 both NULL).

Migration 006 / physical-model already designate `country_code` as the Foundation target and `country` as deprecated.

---

## Live Neon schema (read-only)

| Column | Type | Nullable | Default | CHECK | Indexes | Comment |
|--------|------|----------|---------|-------|---------|---------|
| country | text | YES | none | none | none | none |
| country_code | text | YES | none | `NULL OR ^[A-Z]{2}$` (`fans_country_code_check`) | none | none |

No views/functions/triggers found via column comments; no country-related indexes.

---

## Live data profile (read-only)

```txt
total_fans:           7
both NULL:            6
country only:         0
country_code only:    0
both populated:       1
```

Distinct values:

```txt
country:       NULL (6), "Argentina" (1)
country_code:  NULL (6), "AR" (1)
```

Both-populated pair:

```txt
Argentina ↔ AR   — semantically consistent
```

Interpretation of `country` today: free-text English/display country name (one value: "Argentina").

Interpretation of `country_code` today: ISO-3166-1 alpha-2 (one value: "AR"), from Migration 006 backfill.

---

## Normalization assessment (live rows)

| Category | Count | Rows |
|----------|-------|------|
| AUTO-MAPPABLE | 1 | Argentina → AR (already both populated) |
| HUMAN-REVIEW REQUIRED | 0 | — |
| INVALID / UNKNOWN | 0 | — |
| NULL / no geography | 6 | both NULL — remain NULL under nullable contract |

No production backfill required for current live data beyond preserving existing AR.

Future create/update paths must write ISO-2 into `country_code` (UI currently accepts free text into `country` only).

---

## Repository usage (fan-specific)

| Class | Finding |
|-------|---------|
| A READ country | FanForm edit hydrate; FanProfileDrawer location line |
| B WRITE country | createOrganizationFan INSERT; updateFan UPDATE |
| C READ country_code | none in runtime |
| D WRITE country_code | none in runtime |
| E Drizzle | fans.ts maps both |
| F Types | Fan / FanView infer both; create/update inputs only `country` |
| G/H API DTO | dashboard CreateFanInput / UpdateFanInput: `country?` only |
| I/J Create/Update | write `country` only; never `countryCode` |
| K FanForm | free-text "País", placeholder "ej. Argentina" |
| L Profile drawer | displays `fan.country` with city |
| M Demo API | no country fields |
| N Import/export | none found |
| O Scripts | historical migrate-fans-v1 adds `country`; no active tooling write |
| P EEP | enqueues job by entity id only; no fan geography payload builder found |
| Q Segmentation / campaigns / gamification | no country dependency |
| R Tests | none covering country |
| S Docs/migrations | Migration 006 + design brief; current-schema deprecation note |
| T Unrelated | organizations.country; competitions.countryCode; design-system mock |

---

## Create / update flows (current)

### Create

```txt
FanForm.country (free text)
  → createFan(CreateFanInput.country)
  → createOrganizationFan(... country)
  → INSERT fans.country
  → country_code NOT written (stays NULL for new fans)
  → enqueueFanEepJob(entityId only)
```

### Update

```txt
FanForm.country
  → updateFan(... country)
  → UPDATE fans.country
  → country_code NOT written
  → enqueueFanEepJob(entityId only)
```

Divergence risk: new/edited fans can populate `country` while leaving `country_code` NULL (not observed in current 7-row set for creates after 006, but contract allows it).

---

## EEP contract

```txt
UNKNOWN / NOT YET WIRED for geography fields
```

Current code only enqueues `integration_jobs` with `entityType=fan` + `entityId`. No mapper was found that serializes `country` or `country_code` into an EEP payload.

Cutover should treat EEP as:

```txt
prefer country_code (ISO-2) when a fan sync payload is implemented
```

---

## Semantic assessment

UI pairs "Ciudad" + "País" → profile **location / residence geography**, not organization country, not explicitly nationality.

Target Foundation meaning (Migration 006 / physical-model):

```txt
fans.country_code = ISO-3166-1 alpha-2 for fan profile geography
nullable
human-readable labels derived in UI/i18n from the code
```

No evidence of a second independent geographic concept requiring both columns.

---

## Alternatives

| Option | Verdict |
|--------|---------|
| A — country_code sole SoT; deprecate/remove country | **RECOMMENDED** |
| B — keep both with distinct semantics | REJECT — duplicated SoT; no independent semantics |
| C — keep country canonical; drop country_code | REJECT — contradicts Migration 006 + Foundation model + CHECK already on code |
| D — other | none evidenced |

---

## Recommended canonical model

```txt
Canonical field:     fans.country_code
Semantic:            fan profile geography / residence country
Format:              ISO-3166-1 alpha-2 (^[A-Z]{2}$)
Nullable:            YES (optional profile field)
Display names:       derived in UI / i18n from country_code
Legacy field:        fans.country — deprecate → stop writes → unmap → DROP later
EEP:                 use country_code when payload exists
API/demo:            accept/emit country_code (optionally derived label in responses)
New ADR:             NO (clarification against Migration 006 is enough)
                     unless product insists nationality ≠ residence
```

---

## Rolling deployment analysis

Safe path = expand/contract:

1. App starts writing `country_code` (and optionally still writes `country` briefly)
2. App reads prefer `country_code`, fallback `country` if needed
3. Deploy fully
4. Stop writing/reading `country`
5. Unmap Drizzle `country`
6. Later migration DROP `country` only after gate

```txt
OLD APP + DB with both columns:     OK (old writes country)
NEW APP + DB with both columns:     OK (new writes country_code)
NEW APP + DROP country too early:   BREAKS if Drizzle/SQL still selects country
```

Do **not** DROP until zero readers/writers + Drizzle unmapped + deployed.

---

## Recommended cutover sequence (conceptual)

```txt
C1  Contract freeze (this review) — country_code = SoT
C2  Application write cutover — create/update write country_code
    (optional short dual-write of country for rollback safety)
C3  Application read/UI cutover — FanForm ISO selector or code input;
    drawer/API prefer country_code (+ localized label)
C4  Stop legacy country writes
C5  Remove fans.country from DTOs / form state
C6  Remove Drizzle country mapping
C7  Gate assessment (zero consumers)
C8  Future DB migration: DROP country (+ comment cleanup)
    — number NOT assigned; Migration 020 remains unreserved
```

Given live data size, C2–C6 can be one aggressive implementation block if dual-write or direct cutover is accepted. C8 remains separately gated destructive DDL.

No mandatory data backfill for current Neon rows.

---

## Future migration requirement

```txt
YES — eventually required to DROP fans.country
Migration number: NOT ASSIGNED
Migration 020: NOT STARTED / NO FROZEN SCOPE
```

Application cutover itself is primarily **code-only** (column already exists + CHECK).

---

## Hard gates before DROP country

```txt
Zero runtime readers of fans.country
Zero runtime writers of fans.country
Zero Drizzle mapping of country
Zero demo/API/DTO dependency on country
country_code valid or NULL for all rows (CHECK already enforces format)
No divergent both-populated pairs
EEP payload (if any) uses country_code
No scripts/tooling dependency
No hidden DB dependents
Human approval for destructive DDL
```

---

## Explicit non-actions (this session)

```txt
No app changes
No Drizzle changes
No Neon DDL
No Neon DML
No SQL generated
No migration created
Migration 020 NOT STARTED
Migration 020 NO FROZEN SCOPE
```

---

## Recommended next step

Human approval to authorize an **implementation block** for application cutover to `country_code` (write + read/UI + stop legacy writes + Drizzle unmap of `country`), keeping physical DROP as a later gated migration.

---

## Related

- Migration 006 + design brief
- current-schema.md deprecated `country` note
- physical-model-v1.md fans.country_code
- F07b mapping-only (no cutover)

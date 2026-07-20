# Session Summary

Date:

2026-07-17

---

## Goal

Resolve the Migration 017 blocker: record the contract-phase ownership and write rules for deprecating `fans.organization_id`, as required by ADR-001’s deferred migration path.

---

## Completed Work

- Migration 017 Architecture Review approved (with two clarifications)
- Created and **Accepted** ADR-009 Legacy Fan Ownership Deprecation Contract
  - `docs/decisions/ADR-009-legacy-fan-ownership-deprecation.md`
- Updated ADR index, `migration-plan-v1.md`, and `PROJECT_STATE.md`

---

## Accepted Contract (ADR-009)

```txt
fan_organizations is the sole authoritative fan↔organization relationship.
fans.organization_id is DEPRECATED and non-authoritative.
```

Write rules:

```txt
Business commands write only to fan_organizations
Any temporary fans.organization_id write is a derived PRIMARY projection only
Legacy writers must not independently choose or mutate the legacy column
```

Consistency:

```txt
Legacy projection must remain consistent while any approved consumer exists
(application services, reports, exports, scripts, operational tooling)
Projection may stop only after all readers and writers are formally retired
```

Sequencing:

```txt
Migration 017 = deprecation only
Migration 018 = exclusive physical removal
```

---

## Editorial freeze

```txt
Compatibility projection = implementation detail only
  (never a second business persistence model)

Approved consumer = defined once in ADR-009
  (any retained reader/writer not yet formally retired)
```

Status: **Accepted — Frozen**

---

## Gate

```txt
ADR-009 is Accepted and Frozen.
Migration 017 Design Brief may proceed.
Do not generate SQL until Design Brief is approved.
```

---

## Next Steps

1. Human approval of Migration 017 Design Brief
   - `docs/sessions/2026-07-17-migration-017-deprecate-legacy-fan-ownership-design.md`
2. SQL only after brief approval (`COMMENT ON COLUMN` only; no DROP)
3. Migration 018 remains blocked until approved consumers are retired

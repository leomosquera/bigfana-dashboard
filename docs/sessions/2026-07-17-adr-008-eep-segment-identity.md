# Session Summary

Date:

2026-07-17

---

## Goal

Resolve the Migration 014 blocker: define what uniquely identifies an EEP Segment, as an integration contract (not schema design).

---

## Completed Work

- Architecture Review for Migration 014 correctly paused (identity contract missing)
- Created and **Accepted** ADR-008 EEP Segment Identity
  - `docs/decisions/ADR-008-eep-segment-identity.md`
- Updated ADR index and `PROJECT_STATE.md`

---

## Accepted Contract (ADR-008)

```txt
An EEP Segment is identified by a globally unique and stable EEP Segment ID.
```

Guarantees:

```txt
Globally unique across all organizations
Stable for the lifetime of the segment
Never reused for a different segment
Idempotent synchronization / upsert key
organization_id is not part of the identity
```

Editorial clarification:

```txt
segments.id (UUID)  → BigFana internal surrogate key only
segments.eep_id     → canonical external synchronization identifier
```

---

## Next Steps

1. Migration 014 Architecture freeze + Design Brief
2. Human SQL review after brief approval
3. Neon execution and validation

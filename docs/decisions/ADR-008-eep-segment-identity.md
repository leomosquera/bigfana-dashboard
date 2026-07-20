# ADR-008 EEP Segment Identity

## Status

Accepted

---

## Context

Foundation Database v1 Migration 014 (EEP Segments) required an explicit integration contract before Design Brief or DDL.

Architecture Review correctly stopped because segment identity is not covered by ADR-007.

ADR-007 explicitly lists segment identity as out of scope:

```txt
Segment identity (Migration 014 / future ADR if needed)
```

Existing documentation (ADR-003, EEP segmentation strategy) stated that EEP owns segments and BigFana stores a local cache. It did **not** define the uniqueness scope, stability, or reuse rules of EEP segment identities.

That gap is an **integration contract**, not a column-level database preference.

---

## Problem

What uniquely identifies an EEP Segment in the BigFana ↔ EEP contract?

The decision must explicitly define:

```txt
1. Globally unique vs organization-scoped
2. Stability for the lifetime of the segment
3. Whether the ID is never reused
4. Whether it is the idempotent synchronization key
```

Without this answer:

- cache ownership/scoping cannot be frozen
- `organization_id` presence/absence is guesswork
- idempotent sync keys are undefined
- Migration 014 Design Brief and SQL must not proceed

---

## Alternatives Considered

### Alternative A — Globally Unique Segment Identities

EEP assigns each segment a stable identity that is unique across the entire EEP/BigFana platform.

BigFana caches segments without `organization_id`.

Membership (`fan_segments`) is fan ↔ segment at platform scope.

#### Pros

- Aligns with ADR-001 global fans
- Aligns with ADR-007 audience identity contract (symmetric EEP cache model)
- Aligns with ADR-006 global community / cross-org intelligence vision
- Matches EEP as a platform intelligence engine
- Simplest cache model and sync upsert key

#### Cons

- Requires EEP to emit globally unique segment IDs
- Org-specific segments must still use globally unique IDs (namespaced by EEP if needed)

---

### Alternative B — Organization-Scoped Segment Identities

EEP segment identities are unique only within an organization.

BigFana cache must include `organization_id` as part of the identity.

#### Pros

- Natural fit if EEP is strictly tenant-partitioned
- Clear org isolation in cache tables

#### Cons

- Diverges from ADR-007 audience identity model without strong product need
- Complicates membership for global fans
- Weaker fit for a single EEP intelligence plane

---

### Alternative C — Inherit ADR-007 by Analogy Without a New ADR

Treat ADR-007 as implicitly applying to segments.

#### Pros

- Faster path to Migration 014

#### Cons

- ADR-007 explicitly excludes segment identity
- Leaves the integration contract undocumented
- Repeats the Migration 013 blocker class of error

---

## Decision

BigFana adopts **Alternative A**.

### Contract

```txt
An EEP Segment is identified by a globally unique and stable EEP Segment ID.
```

### Identity guarantees

The EEP Segment ID:

1. **Is globally unique** across all organizations.
2. **Is stable** for the lifetime of the segment.
3. **Is never reused** for a different segment after the original segment ends or is retired.
4. **Is the idempotent synchronization / upsert key** for BigFana’s segment cache.
5. Does **not** require `organization_id` as part of the identity.

### Surrogate vs canonical identity

```txt
segments.id (UUID)  → BigFana internal surrogate key only
segments.eep_id     → canonical external synchronization identifier
```

Internal UUIDs must not be treated as EEP identities. Sync, reconciliation, and idempotent upserts use `eep_id`.

### Scope consequences for Migration 014

```txt
segments        → platform-scoped cache (no organization_id)
fan_segments    → platform-scoped membership (fan ↔ segment)
```

Organization scope, if needed later, applies at consumption / activation time — not as part of segment identity.

### EEP obligation

EEP (or the integration that exposes EEP segments to BigFana) must provide globally unique, stable, non-reusable segment identities.

If a future EEP product surface is strictly organization-partitioned, EEP must still expose globally unique IDs to BigFana (for example by namespacing inside the EEP identity). BigFana does not use `(organization_id, eep_id)` as the primary segment identity under this ADR.

### Relationship to ADR-007

```txt
ADR-007  → EEP Audience Identity
ADR-008  → EEP Segment Identity
```

The contracts are parallel and independent. ADR-008 does not amend ADR-007.

The same surrogate vs canonical rule applies to audiences (`audiences.id` vs `audiences.eep_id`) under ADR-007’s cache model.

### Out of scope for this ADR

```txt
Column lists and SQL
Segment display name uniqueness
Audience identity (ADR-007)
fan_segment_rules changes
Scores / recommendations
Campaign / sponsor targeting tables
Sync job orchestration details
```

---

## Consequences

### Positive

- Unblocks Migration 014 Design Brief and SQL path
- Makes the segment integration contract explicit and testable
- Keeps EEP cache identity model consistent across audiences and segments
- Prevents silent identity collisions from ID reuse
- Clarifies that BigFana UUIDs are not EEP identifiers

### Negative

- Depends on EEP/integration compliance with global uniqueness, stability, and non-reuse
- If EEP cannot meet this contract, this ADR must be superseded before production sync
- Slight ADR proliferation (intentional — contracts must not be implied)

---

## Migration 014 Gate

```txt
ADR-008 is Accepted.
Migration 014 Design Brief may proceed.
```

---

## Related Documents

- PROJECT_STATE.md
- ADR-001 Global Fan Model
- ADR-003 EEP Responsibilities
- ADR-006 Global Sports Community Vision
- ADR-007 EEP Audience Identity
- docs/05-eep/eep-architecture.md
- docs/05-eep/eep-segmentation-strategy.md
- docs/04-database/migration-plan-v1.md → Migration 014
- docs/04-database/physical-model-v1.md → EEP Domain (segments sketch)

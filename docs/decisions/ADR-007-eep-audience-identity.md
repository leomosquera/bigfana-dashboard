# ADR-007 EEP Audience Identity

## Status

Accepted

---

## Context

Foundation Database v1 Migration 013 (EEP Audiences) required an explicit integration contract before Design Brief or DDL.

Architecture Review approved:

- EEP owns audiences; BigFana stores a local cache
- `audiences` and `fan_audiences` are the 013 cache surface
- Segments remain deferred to Migration 014
- Audience vs segment separation is approved

Existing documentation stated that EEP generates audiences and BigFana consumes them (ADR-003), and that global audiences may span organizations (ADR-006). It did **not** define the uniqueness scope of EEP audience identities.

That gap is an **integration contract**, not a column-level database preference.

---

## Problem

What uniquely identifies an EEP Audience in the BigFana ↔ EEP contract?

Specifically, are EEP audience identities:

```txt
A) Globally unique across all organizations
B) Organization-scoped (unique only within an organization)
```

Without this answer:

- cache ownership/scoping cannot be frozen
- `organization_id` presence/absence is guesswork
- idempotent sync keys are undefined
- Migration 013 Design Brief and SQL must not proceed

---

## Alternatives Considered

### Alternative A — Globally Unique Audience Identities

EEP assigns each audience a stable identity that is unique across the entire EEP/BigFana platform.

BigFana caches audiences without `organization_id`.

Membership (`fan_audiences`) is fan ↔ audience at platform scope.

Organization tenancy applies at activation time (campaigns, sponsors), not on the audience cache row.

#### Pros

- Aligns with ADR-001 global fans
- Aligns with ADR-006 global / cross-org audiences
- Matches EEP as a platform intelligence engine (not per-tenant mini-engines by default)
- Simplest cache model and sync upsert key
- Avoids duplicate audience rows per organization for the same EEP audience

#### Cons

- Requires EEP to actually emit globally unique IDs
- Org-specific “private” audiences must still use globally unique IDs (namespaced by EEP, not by BigFana `organization_id`)

---

### Alternative B — Organization-Scoped Audience Identities

EEP audience identities are unique only within an organization.

BigFana cache must include `organization_id` (or equivalent tenant key) as part of the identity.

#### Pros

- Natural fit if EEP is strictly tenant-partitioned
- Clear org isolation in the cache tables

#### Cons

- Conflicts with ADR-006 cross-org / global audience vision unless every global audience is duplicated or specially modeled
- Complicates membership for global fans across orgs
- Forces Migration 013 to revisit ownership before DDL
- Weaker fit for a single EEP intelligence plane

---

### Alternative C — Dual Identity Model (global + org-scoped)

Support both global and organization-scoped audience identity schemes in one cache.

#### Pros

- Maximum flexibility

#### Cons

- Premature complexity for Foundation v1
- Ambiguous sync and uniqueness rules
- Violates expand-only simplicity until a real EEP contract requires it

---

## Decision

BigFana adopts **Alternative A**.

### Contract

```txt
An EEP Audience is identified by a globally unique and stable EEP Audience ID.
```

### Identity guarantees

The EEP Audience ID:

1. **Is globally unique** across all organizations.
2. **Is stable** for the lifetime of the audience.
3. **Is never reused** for a different audience after the original audience ends or is retired.
4. Is the idempotent upsert key for BigFana’s audience cache.
5. Does **not** require `organization_id` as part of the identity.

### Scope consequences for Migration 013

```txt
audiences        → platform-scoped cache (no organization_id)
fan_audiences    → platform-scoped membership (fan ↔ audience)
```

Organization scope remains an **activation** concern (campaigns, sponsors, dashboards), not an audience-identity concern.

### EEP obligation

EEP (or the integration that exposes EEP audiences to BigFana) must provide globally unique, stable, non-reusable audience identities.

If a future EEP product surface is strictly organization-partitioned, EEP must still expose globally unique IDs to BigFana (for example by namespacing inside the EEP identity). BigFana does not use `(organization_id, eep_id)` as the primary identity under this ADR.

### Out of scope for this ADR

```txt
Column lists and SQL
Audience display names uniqueness
Segment identity (Migration 014 / future ADR if needed)
Campaign ↔ audience targeting tables
Sync job orchestration details
```

---

## Consequences

### Positive

- Unblocks Migration 013 Design Brief and SQL path
- Makes the integration contract explicit and testable
- Keeps audience cache aligned with global fan + global community vision
- Avoids premature org-scoped cache complexity
- Prevents silent identity collisions from ID reuse

### Negative

- Depends on EEP/integration compliance with global uniqueness, stability, and non-reuse
- If EEP cannot meet this contract, this ADR must be superseded before relying on production sync
- Org-only mental models must treat activation scoping separately from identity

---

## Migration 013 Gate

```txt
ADR-007 is Accepted.
Migration 013 Design Brief may proceed.
```

---

## Related Documents

- PROJECT_STATE.md
- ADR-001 Global Fan Model
- ADR-003 EEP Responsibilities
- ADR-006 Global Sports Community Vision
- docs/05-eep/eep-architecture.md
- docs/05-eep/eep-segmentation-strategy.md
- docs/04-database/migration-plan-v1.md → Migration 013
- docs/04-database/physical-model-v1.md → EEP Domain (audiences sketch)

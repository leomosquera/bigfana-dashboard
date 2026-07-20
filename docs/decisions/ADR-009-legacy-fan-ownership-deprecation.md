# ADR-009 Legacy Fan Ownership Deprecation Contract

## Status

Accepted — Frozen

---

## Context

Foundation Database v1 has completed the expand phase through Migration 016.

Migration 001 created `fan_organizations` and backfilled PRIMARY relationships from `fans.organization_id`.

ADR-001 adopted the Global Fan Model and stated:

```txt
The migration path will be defined in future ADRs.
```

ADR-002 adopted Primary and Followed Organizations, with `fan_organizations` as the target relationship surface.

Migration Plan v1 splits contract work:

```txt
017 — Deprecate Legacy Fan Ownership
018 — Remove Legacy Fan Ownership
```

Architecture Review for Migration 017 approved the deprecation direction, but the contract-phase ownership and write rules were not yet recorded in an Accepted ADR.

That gap is a **fan-model / multi-tenant ownership contract**, not a column-list or SQL preference.

---

## Problem

What is the authoritative ownership path during and after deprecation of `fans.organization_id`?

Specifically:

```txt
1. What does DEPRECATED mean for fans.organization_id?
2. What is the sole source of truth for fan↔organization relationships?
3. How may writes and reads transition without dual-write ambiguity?
4. When may the legacy projection stop being maintained?
5. What may Migration 017 change vs Migration 018?
```

Without this answer:

- application cutover remains ambiguous
- dual-write peer sources can diverge
- Migration 017 Design Brief / SQL must not proceed
- Migration 018 DROP risk is uncontrolled

---

## Alternatives Considered

### Alternative A — Peer Dual-Write During Transition

Business commands write both `fan_organizations` and `fans.organization_id` as independent sources.

#### Pros

- Maximizes short-term compatibility for legacy readers

#### Cons

- Dual-write ambiguity
- Divergence risk when writers disagree
- Violates ADR-001/002 target ownership
- Makes 018 consistency proofs unreliable

---

### Alternative B — Drop Immediately in Migration 017

Remove `fans.organization_id` as soon as deprecation is declared.

#### Pros

- Ends legacy surface quickly

#### Cons

- Application still reads `fans.organizationId` widely
- Collapses deprecate and remove into one irreversible step
- Violates sequenced contract-phase plan (017 vs 018)

---

### Alternative C — Canonical `fan_organizations` + Derived Compatibility Projection

Business commands write only to `fan_organizations`.

`fans.organization_id` may be maintained only as a derived projection of the canonical PRIMARY relationship for approved legacy consumers, until all readers/writers are retired.

Physical removal is Migration 018 only.

#### Pros

- Single authoritative write path
- Clear SoT (`fan_organizations`)
- Preserves compatibility without peer dual-write
- Matches expand → migrate → contract sequencing
- Aligns with ADR-001 deferred migration-path requirement

#### Cons

- Temporary projection maintenance cost
- Application cutover remains a parallel track before 018

---

## Decision

BigFana adopts **Alternative C**.

### Contract

```txt
fan_organizations is the sole authoritative fan↔organization relationship.
fans.organization_id is DEPRECATED and non-authoritative.
```

### Definitions

#### Approved consumer

An **approved consumer** is any retained reader or writer of `fans.organization_id` that has not yet been formally retired during the contract phase.

This includes, without limitation:

```txt
application services
reports
exports
scripts
operational tooling
```

Until every approved consumer is formally retired, the legacy projection consistency duty remains in force.

#### Compatibility projection

The **compatibility projection** is an **implementation detail only**.

It means temporarily mirroring the canonical PRIMARY `organization_id` from `fan_organizations` onto `fans.organization_id` so approved consumers keep working.

It must **never** become a second business persistence model.

Forbidden:

```txt
Treating fans.organization_id as an independent business write target
Inventing org membership only in fans.organization_id
Using the projection as a parallel loyalty / tenancy store
```

### Deprecation meaning (Migration 017)

```txt
DEPRECATED = retained for compatibility, not authoritative
```

Migration 017:

- formalizes deprecation
- does **not** physically remove the column
- does **not** rename the column

Migration 018:

- is the **exclusive** physical removal step (`DROP` / related index cleanup)
- proceeds only after hard application cutover gates

### Source of truth

```txt
Canonical relationship ownership → fan_organizations
Canonical fan identity           → fans (global; ADR-001)
Legacy column                    → fans.organization_id (non-authoritative)
```

Primary and followed relationships are read from `fan_organizations`.

Loyalty ownership remains the PRIMARY organization via `fan_organizations` (ADR-002).

### Write rules

```txt
Business commands must write only to fan_organizations.
```

Any temporary write to `fans.organization_id` is allowed **only** as a compatibility projection derived from the canonical PRIMARY relationship in `fan_organizations`.

Legacy writers must **not** independently choose or mutate `fans.organization_id`.

Rejected:

```txt
Peer dual-write where both columns are independent sources of truth
```

### Consistency rules

While any approved consumer exists, the legacy projection **must remain consistent** with the canonical PRIMARY relationship.

The legacy projection may stop being maintained **only after** all approved consumers have been formally retired.

### Read transition

```txt
Target reads     → fan_organizations only
Temporary reads  → fans.organization_id may continue for approved consumers
New features     → must not use fans.organization_id as ownership
```

### Transition invariant (until 018)

```txt
If fans.organization_id IS NOT NULL,
it must equal the fan’s PRIMARY organization_id in fan_organizations
OR no approved consumer still depends on the legacy column.
```

### Preconditions

Before Migration 017 Design Brief / any 017 work:

```txt
ADR-009 Accepted (Frozen)
ADR-001 / ADR-002 remain Accepted
fan_organizations exists (Migration 001)
Architecture Review freeze approved
```

Before Migration 018 physical removal:

```txt
Zero approved consumers of fans.organization_id
Zero writers of fans.organization_id (including projection writers)
Consistency verification complete
Application / Drizzle / tooling no longer map the column
Human approval for irreversible contract DDL
```

### Rollback philosophy

```txt
017 (deprecate) → soft / reversible (column never removed)
018 (remove)    → hard contract; dedicated reverse migration required if ever undone
```

### Out of scope for this ADR

```txt
Column lists and SQL for 017/018
Application service rewrite details
DROP fans.organization_id (Migration 018 execution)
fans.country removal
organizations.sport removal (Migration 019)
Loyalty balance redesign beyond ownership SoT
```

---

## Consequences

### Positive

- Fulfills ADR-001’s deferred migration-path requirement
- Unblocks Migration 017 Design Brief under a clear ownership contract
- Prevents dual-write ambiguity
- Keeps `fan_organizations` canonical (ADR-001 / ADR-002)
- Separates deprecation (017) from physical removal (018)
- Protects approved consumers with an explicit consistency duty
- Prevents the compatibility projection from becoming a second persistence model

### Negative

- Projection maintenance cost until cutover completes
- 018 remains blocked until approved consumers are retired
- Contract-phase discipline required (no opportunistic DROP)

---

## Migration 017 Gate

```txt
ADR-009 is Accepted and Frozen.
Migration 017 Design Brief may proceed.
Migration 017 remains deprecation only.
Migration 018 remains the exclusive physical removal step.
```

---

## Related Documents

- PROJECT_STATE.md
- ADR-001 Global Fan Model
- ADR-002 Primary and Followed Organizations
- docs/04-database/migration-plan-v1.md → Migrations 001, 017, 018
- docs/04-database/physical-model-v1.md → fans.organization_id DEPRECATED
- database/migrations/foundation-v1/001_create_fan_organizations.sql

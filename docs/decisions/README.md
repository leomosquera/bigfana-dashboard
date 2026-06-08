# Architecture Decision Records (ADRs)

## Purpose

This directory contains all important architectural, product, platform, and technical decisions made during the evolution of BigFana.

The purpose of ADRs is to preserve knowledge and ensure that future developers and AI agents understand:

- why a decision was made
- which alternatives were considered
- what consequences the decision has
- what assumptions were accepted

ADRs are part of the official project documentation.

---

# When to Create an ADR

An ADR must be created whenever a decision affects:

- product architecture
- database architecture
- EEP responsibilities
- integration strategy
- authentication strategy
- multi-tenant architecture
- fan model
- competition model
- loyalty model
- sponsor model
- major technical decisions
- long-term scalability

Do not create ADRs for:

- bug fixes
- small refactors
- UI adjustments
- implementation details
- temporary experiments

---

# ADR Naming Convention

Format:

```txt
ADR-XXX-short-title.md
```

Examples:

```txt
ADR-001-global-fan-model.md
ADR-002-primary-and-followed-organizations.md
ADR-003-eep-responsibilities.md
```

Numbers must be sequential.

ADR numbers must never be reused.

If an ADR becomes obsolete, create a new ADR that supersedes it.

Do not modify historical ADRs except for typo corrections.

---

# ADR Structure

Every ADR must contain the following sections.

```md
# ADR-XXX Title

## Status

Proposed | Accepted | Superseded | Deprecated

## Context

Describe the situation and business context.

## Problem

Describe the problem that needs a decision.

## Alternatives Considered

List the alternatives evaluated.

### Alternative A

Pros

Cons

### Alternative B

Pros

Cons

## Decision

Describe the selected solution.

## Consequences

Describe the expected impact.

### Positive

- item
- item

### Negative

- item
- item

## Related Documents

- PROJECT_STATE.md
- Relevant ADRs
- Relevant module documentation
```

---

# Source of Truth

ADRs are considered part of the official source of truth for BigFana.

If documentation conflicts exist:

Priority order:

1. Latest Accepted ADR
2. PROJECT_STATE.md
3. Product Documentation
4. Architecture Documentation
5. Chat History

Chat conversations are never considered the primary source of truth.

---

# Current ADR Roadmap

The first ADRs planned for BigFana are:

```txt
ADR-001-global-fan-model.md

ADR-002-primary-and-followed-organizations.md

ADR-003-eep-responsibilities.md

ADR-004-sports-competitions-organizations.md

ADR-005-managed-vs-integrated-competitions.md

ADR-006-global-sports-community-vision.md
```

These ADRs define the foundation of the platform and should be created before major database redesign work begins.
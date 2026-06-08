# ADR-001 Global Fan Model

## Status

Accepted

---

## Context

BigFana is initially commercialized as a platform for sports organizations, clubs, leagues, and competitions.

Historically, fan platforms are designed around a single organization where each fan belongs exclusively to one club.

During the BigFana Foundation v1 phase, the long-term vision evolved toward a global sports community model where multiple organizations can coexist within the same ecosystem.

The platform must support future growth without requiring a complete redesign of the fan model.

---

## Problem

Should a fan belong exclusively to a single organization, or should BigFana support a global fan identity capable of interacting with multiple organizations?

The decision impacts:

- database design
- loyalty architecture
- EEP segmentation
- sponsor activations
- competitions
- future community features
- scalability of the platform

---

## Alternatives Considered

### Alternative A — Single Organization Fan

A fan belongs to exactly one organization.

Example:

```txt
Fan
└── River Plate
```

#### Pros

- Simple implementation
- Easy loyalty management
- Straightforward permissions

#### Cons

- Does not reflect real fan behavior
- Prevents global community features
- Limits future sponsor opportunities
- Requires redesign if BigFana expands internationally

---

### Alternative B — Global Fan Model

A fan exists independently of organizations.

The fan may interact with multiple organizations while maintaining a primary relationship with one of them.

Example:

```txt
Fan

├── Primary Organization
│   └── River Plate
│
├── Followed Organization
│   └── Real Madrid
│
├── Followed Organization
│   └── Inter Miami
│
└── Followed Organization
    └── Argentina National Team
```

#### Pros

- Matches real fan behavior
- Enables global sports communities
- Enables advanced EEP segmentation
- Enables future sponsor activations across organizations
- Supports multiple sports
- Supports future competitions and leagues

#### Cons

- Requires additional relationship modeling
- More complex loyalty architecture
- More complex fan profile management

---

## Decision

BigFana adopts the Global Fan Model.

A fan is a platform-level entity.

Organizations do not own fan identities.

Organizations own relationships with fans.

Each fan may have:

- one primary organization
- multiple followed organizations
- followed competitions
- followed sports
- future platform-wide interests

The primary organization represents the fan's main loyalty relationship.

Followed organizations represent interests and content preferences.

---

## Consequences

### Positive

- Supports future global community vision
- Supports multiple sports
- Supports international growth
- Supports advanced EEP segmentation
- Supports future competition ecosystems
- Enables sponsor opportunities across communities
- Avoids future architectural redesign

### Negative

- Additional relationship tables will be required
- Loyalty rules become more complex
- Fan onboarding flows require additional validation

---

## Implementation Principles

The current database may continue using organization-scoped fans during Foundation v1.

The future target model should evolve toward:

```txt
Fan
    │
    ├── Primary Organization
    │
    ├── Followed Organizations
    │
    ├── Followed Competitions
    │
    └── Interests
```

The migration path will be defined in future ADRs.

---

## Related Documents

- PROJECT_STATE.md
- ADR-002 Primary and Followed Organizations
- ADR-004 Sports Competitions Organizations
- ADR-006 Global Sports Community Vision
# ADR-002 Primary and Followed Organizations

## Status

Accepted

---

## Context

ADR-001 established that BigFana adopts a Global Fan Model.

A fan is no longer exclusively tied to a single organization.

However, sports organizations require a strong loyalty relationship with their own communities, while fans often interact with multiple organizations across different countries, competitions, and sports.

The platform must support both realities:

- organizational loyalty
- global sports interests

---

## Problem

How should BigFana model the relationship between a fan and multiple organizations while preserving loyalty ownership and community identity?

The decision impacts:

- fan onboarding
- loyalty programs
- rewards
- benefits
- EEP segmentation
- sponsor activations
- future global community features

---

## Alternatives Considered

### Alternative A — Single Organization Relationship

A fan belongs to only one organization.

Example:

```txt
Fan
└── River Plate
```

#### Pros

- Simple implementation
- Simple loyalty management
- Easy reporting

#### Cons

- Does not reflect real-world fan behavior
- Limits future growth
- Prevents global community features
- Restricts segmentation opportunities

---

### Alternative B — Multiple Equal Organizations

A fan may belong equally to many organizations.

Example:

```txt
Fan
├── River Plate
├── Real Madrid
├── Inter Miami
└── Argentina
```

#### Pros

- Maximum flexibility
- Supports many interests

#### Cons

- No clear loyalty ownership
- Difficult benefit management
- Difficult sponsor attribution
- Weak community identity

---

### Alternative C — Primary and Followed Organizations

A fan has one primary organization and may follow multiple additional organizations.

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

- Preserves loyalty ownership
- Reflects real fan behavior
- Supports future community growth
- Enables advanced segmentation
- Maintains sponsor attribution

#### Cons

- Requires additional relationship modeling
- Requires onboarding validation rules

---

## Decision

BigFana adopts the Primary and Followed Organizations model.

Each fan must have:

```txt
1 Primary Organization
```

Each fan may have:

```txt
0..N Followed Organizations
```

The primary organization represents:

- loyalty ownership
- points
- levels
- rewards
- benefits
- community identity
- sponsor relationship

Followed organizations represent:

- content interests
- sports interests
- audience segmentation
- future community interactions

---

## Loyalty Ownership

Loyalty belongs to the primary organization.

The following elements are organization-owned:

- points
- levels
- benefits
- rewards
- loyalty campaigns

These assets are not shared across organizations by default.

---

## Followed Organizations

Followed organizations allow fans to:

- consume content
- follow results
- receive notifications
- participate in community experiences
- enrich behavioral profiles

Following an organization does not grant access to that organization's loyalty program.

---

## National Teams

National teams are treated as organizations.

Example:

```txt
Argentina National Team
Brazil National Team
Spain National Team
```

Fans may select national teams as followed organizations.

Future validation rules may limit conflicting selections if required by product strategy.

---

## Future Competitions

Competition participation may introduce temporary representation relationships.

Example:

```txt
FIFA Club World Cup

Fan
└── Represents River Plate
```

These relationships are separate from primary and followed organizations.

They will be addressed in future ADRs.

---

## Future Database Direction

The target conceptual model becomes:

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

Future database structures may include:

```txt
fan_organizations
fan_competitions
fan_interests
```

The exact implementation will be defined during Foundation Database v1.

---

## Consequences

### Positive

- Preserves club identity
- Preserves loyalty ownership
- Supports global fan behavior
- Supports advanced EEP segmentation
- Supports sponsor targeting
- Enables future sports ecosystem growth

### Negative

- Additional relationship modeling required
- Additional onboarding complexity
- More validation rules required

---

## Related Documents

- PROJECT_STATE.md
- ADR-001 Global Fan Model
- ADR-004 Sports Competitions Organizations
- ADR-006 Global Sports Community Vision
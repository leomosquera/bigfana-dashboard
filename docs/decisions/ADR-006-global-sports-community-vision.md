# ADR-006 Global Sports Community Vision

## Status

Accepted

---

## Context

BigFana is initially commercialized as a SaaS platform for sports organizations.

The initial customers are expected to be:

- professional clubs
- leagues
- sports organizations
- competitions

However, during Foundation v1, the long-term vision evolved beyond individual organizations.

The platform is being designed to eventually connect multiple sports communities into a single global ecosystem.

This vision influences:

- product architecture
- fan model
- competition model
- EEP integration
- sponsor strategy
- long-term scalability

---

## Problem

Should BigFana remain exclusively an organization-centric platform, or should it be designed as a future global network of sports communities?

The decision impacts:

- product positioning
- database architecture
- fan relationships
- sponsor opportunities
- future monetization models
- platform scalability

---

## Alternatives Considered

### Alternative A — Organization Platform Only

BigFana operates exclusively as a platform for individual organizations.

Example:

```txt
Club
    ↓
Fans
```

Each organization exists independently.

There is no relationship between communities.

#### Pros

- Simpler architecture
- Clear business model
- Easier implementation

#### Cons

- Limited growth potential
- Limited audience intelligence
- Reduced sponsor opportunities
- No cross-community experiences

---

### Alternative B — Global Community Platform Only

BigFana focuses primarily on a global sports audience.

Organizations become secondary.

#### Pros

- Large audience network
- Strong network effects

#### Cons

- Weak value proposition for organizations
- Difficult initial adoption
- Misaligned with primary customers

---

### Alternative C — Organization First, Global Community Ready

Organizations remain the primary customer.

BigFana is designed from the beginning to connect communities in the future.

#### Pros

- Strong initial business model
- Long-term scalability
- Supports network effects
- Maximizes future opportunities
- Preserves organization value

#### Cons

- Requires additional architectural planning
- Some concepts may not be used immediately

---

## Decision

BigFana adopts an Organization First, Global Community Ready strategy.

Organizations remain the core customer and primary value driver.

At the same time, the platform must be designed to support a future global network of interconnected sports communities.

---

## Organization Principle

Each organization manages its own:

- community
- loyalty program
- points
- levels
- rewards
- benefits
- campaigns
- sponsors
- content

Organizations maintain ownership and control of their fan relationships.

BigFana provides the tools required to manage those communities.

---

## Global Community Principle

BigFana connects multiple sports communities within a single platform.

A fan may:

- have a primary organization
- follow multiple organizations
- follow competitions
- follow sports
- participate in platform-wide experiences

The platform must support future interactions across communities.

---

## Loyalty Principle

Loyalty remains organization-owned.

By default:

```txt
Points
Levels
Benefits
Rewards
```

belong to the organization that created them.

No global loyalty program exists by default.

Future shared loyalty programs may be introduced through explicit platform features.

---

## Sponsor Principle

Sponsors may operate at different levels.

Examples:

```txt
Organization Sponsor
```

```txt
Competition Sponsor
```

```txt
Platform Sponsor
```

The platform must support future sponsor activations across multiple communities.

---

## EEP Principle

BigFana generates behavioral activity.

EEP transforms activity into intelligence.

Example:

```txt
BigFana
    ↓
Behavioral Events
    ↓
EEP
    ↓
Audiences
    ↓
BigFana Campaigns
```

Global audiences may eventually span multiple organizations, competitions, and sports.

---

## Future Community Opportunities

The global community vision enables future experiences such as:

- cross-community campaigns
- global rankings
- international sponsor activations
- competition-wide engagement programs
- platform-wide achievements
- fan identity enrichment
- sports interest discovery

These capabilities are not required during Foundation v1 but must remain architecturally possible.

---

## Long-Term Platform Vision

BigFana begins as:

```txt
Sports Organization SaaS
```

and evolves toward:

```txt
Global Sports Community Network
```

Organizations remain the foundation of the ecosystem.

The platform becomes the connection layer between communities.

---

## Consequences

### Positive

- Preserves current business model
- Supports long-term growth
- Enables future network effects
- Increases sponsor opportunities
- Supports richer EEP segmentation
- Supports multiple sports and competitions
- Avoids future architectural redesign

### Negative

- Requires forward-looking architecture
- Some concepts will not be immediately used
- Additional modeling complexity

---

## Strategic Statement

BigFana is sold as a platform for sports organizations.

BigFana is designed as a future global network of sports communities.

This principle must guide future product, architecture, database, and integration decisions.

---

## Related Documents

- PROJECT_STATE.md
- ADR-001 Global Fan Model
- ADR-002 Primary and Followed Organizations
- ADR-003 EEP Responsibilities
- ADR-004 Sports, Competitions and Organizations Model
- ADR-005 Managed vs Integrated Competitions
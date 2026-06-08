# BigFana Database Decisions Review

## Purpose

This document freezes the major database decisions approved for Foundation Database v1.

The objective is to avoid future architectural drift and provide a clear reference before executing migrations.

This document must be reviewed whenever a decision impacts:

- data ownership
- tenant boundaries
- fan relationships
- competition structure
- EEP responsibilities

---

# Decision 001

## Global Fan Model

Status:

```txt
Approved
```

---

## Decision

Fans are global platform entities.

A fan exists independently from any organization.

---

## Implementation

```txt
fans
```

stores the fan identity.

```txt
fan_organizations
```

stores fan relationships with organizations.

---

## Example

```txt
Juan Perez

↓

River Plate (Primary)

↓

Real Madrid (Following)

↓

Argentina National Team (Following)
```

---

## Related ADR

```txt
ADR-001

ADR-002
```

---

# Decision 002

## Organization Ownership

Status:

```txt
Approved
```

---

## Decision

Organizations remain the primary tenant boundary.

Most business entities belong to organizations.

---

## Examples

```txt
Campaigns

Benefits

Rewards

Content

Integrations

Loyalty Programs
```

---

## Implementation

Organization-owned entities must contain:

```txt
organization_id
```

---

# Decision 003

## Multi-Sport Architecture

Status:

```txt
Approved
```

---

## Decision

BigFana supports multiple sports.

Sports are first-class entities.

---

## Implementation

```txt
sports
```

---

## Examples

Canonical catalog per `migration-plan-v1.md` Migration 002:

```txt
| Name              | Slug              |
|-------------------|-------------------|
| Soccer            | soccer            |
| American Football | american-football |
| Basketball        | basketball        |
| Rugby             | rugby             |
| Volleyball        | volleyball        |
| Tennis            | tennis            |
| Padel             | padel             |
| Golf              | golf              |
| Motorsports       | motorsports       |
| Esports           | esports           |
| Other             | other             |
```

Canonical slugs and i18n normalization rules are defined in `physical-model-v1.md` → Global Catalog Rules.

---

## Related ADR

```txt
ADR-004
```

---

# Decision 004

## Competition Hierarchy

Status:

```txt
Approved
```

---

## Decision

Organizations may participate in multiple competitions.

Competitions belong to sports.

---

## Implementation

```txt
sports

↓

competitions

↓

competition_organizations
```

---

## Examples

```txt
River Plate

↓

Liga Profesional

↓

Copa Libertadores

↓

Copa Argentina
```

---

## Related ADR

```txt
ADR-004

ADR-005
```

---

# Decision 005

## Fan Interests

Status:

```txt
Approved
```

---

## Decision

Fans may follow:

```txt
Organizations

Competitions

Sports
```

independently.

---

## Implementation

```txt
fan_organizations

fan_competitions

fan_sports
```

---

## Related ADR

```txt
ADR-006
```

---

# Decision 006

## Sponsor Ownership

Status:

```txt
Approved
```

---

## Decision

Sponsors are global entities.

Sponsors may relate to:

```txt
Organizations

Competitions
```

---

## Implementation

```txt
sponsors

sponsor_organizations

sponsor_competitions
```

---

## Example

```txt
Coca Cola

↓

River Plate

↓

Toluca

↓

Liga MX
```

---

# Decision 007

## EEP Ownership

Status:

```txt
Approved
```

---

## Decision

EEP owns:

```txt
Audiences

Segments

Scores

Recommendations
```

BigFana consumes these results.

---

## Implementation

BigFana stores local cache tables:

```txt
audiences

segments

fan_audiences

fan_segments
```

---

## Related ADR

```txt
ADR-003
```

---

# Decision 008

## Event Ownership

Status:

```txt
Approved
```

---

## Decision

BigFana is the source of truth for behavioral events.

---

## Implementation

```txt
fan_events
```

---

## Purpose

```txt
Analytics

Loyalty

EEP Synchronization

Audience Generation
```

---

# Decision 009

## Managed Competitions

Status:

```txt
Approved
```

---

## Decision

BigFana may operate competitions directly.

---

## Implementation

```txt
seasons

divisions

matches

standings
```

---

## Competition Types

```txt
INTEGRATED

MANAGED
```

---

## Related ADR

```txt
ADR-005
```

---

# Decision 010

## Migration Strategy

Status:

```txt
Approved
```

---

## Decision

Database evolution follows:

```txt
Expand

↓

Migrate

↓

Contract
```

---

## Rules

Never remove existing structures until replacement structures are fully operational.

---

# Foundation DB v1 Approval

Status:

```txt
Approved
```

The following foundations are considered validated:

```txt
Global Fan Model

Organization Ownership

Sports Hierarchy

Competition Hierarchy

Fan Interests

Sponsor Ownership

EEP Ownership

Event Ownership

Managed Competitions

Migration Strategy
```

---

# Next Step

The next phase is:

```txt
Foundation Database v1 Implementation
```

starting with:

```txt
001_create_fan_organizations

002_create_sports

003_create_competitions

004_create_competition_organizations
```

---

# Related Documents

- current-schema.md
- gap-analysis.md
- physical-model-v1.md
- migration-plan-v1.md
- foundation-db-v1.md
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- ADR-006
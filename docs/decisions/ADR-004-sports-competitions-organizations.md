# ADR-004 Sports, Competitions and Organizations Model

## Status

Accepted

---

## Context

BigFana was initially conceived as a platform for football clubs.

During Foundation v1, the long-term vision expanded to support multiple sports, leagues, competitions, communities, and future sports ecosystems.

The platform must support:

- football clubs
- national teams
- basketball teams
- rugby teams
- esports organizations
- amateur leagues
- private leagues
- university competitions
- creator-driven competitions
- future sports ecosystems

Without a formal hierarchy, future expansion would require significant redesign.

---

## Problem

How should BigFana model the relationship between sports, competitions, and organizations?

The model must:

- support multiple sports
- support multiple competition types
- support professional and amateur ecosystems
- support future global growth
- remain simple enough for Foundation v1

---

## Alternatives Considered

### Alternative A — Organizations Only

```txt
Organization
```

Examples:

```txt
River Plate
Real Madrid
Argentina
Chicago Bulls
```

#### Pros

- Simple implementation
- Small database model

#### Cons

- No sports hierarchy
- No competition ownership
- Difficult future expansion
- Difficult reporting and segmentation

---

### Alternative B — Sport and Organization

```txt
Sport
    ↓
Organization
```

Examples:

```txt
Football
    └── River Plate

Basketball
    └── Chicago Bulls
```

#### Pros

- Supports multiple sports
- Relatively simple

#### Cons

- No competition structure
- Difficult tournament management
- Does not support leagues correctly

---

### Alternative C — Sport, Competition and Organization

```txt
Sport
    ↓
Competition
    ↓
Organization
```

Examples:

```txt
Football
    ↓
Liga Profesional Argentina
    ↓
River Plate
```

```txt
Football
    ↓
La Liga
    ↓
Real Madrid
```

```txt
Basketball
    ↓
NBA
    ↓
Chicago Bulls
```

#### Pros

- Scalable
- Flexible
- Supports future competitions
- Supports multiple sports
- Supports global ecosystem vision

#### Cons

- Additional modeling complexity
- More relationships required

---

## Decision

BigFana adopts the following conceptual hierarchy:

```txt
Sport
    ↓
Competition
    ↓
Organization
```

---

## Sport

Represents the sport category.

Examples:

```txt
Football
Basketball
Rugby
Esports
Tennis
Volleyball
Motorsports
```

Sports provide:

- categorization
- navigation
- segmentation
- reporting

---

## Competition

Represents a league, tournament, championship, or organized ecosystem.

Examples:

```txt
Liga Profesional Argentina
La Liga
Premier League
Liga MX
NBA
Kings League
```

Competitions provide:

- standings
- fixtures
- seasons
- rankings
- match structure

Competitions belong to a sport.

---

## Organization

Represents the entity followed by fans.

Examples:

```txt
River Plate
Boca Juniors
Real Madrid
Argentina National Team
Chicago Bulls
Porcinos FC
```

Organizations belong to one or more competitions.

Organizations are the primary entities that interact with fans.

Organizations manage:

- loyalty
- rewards
- benefits
- campaigns
- sponsors
- communities

---

## National Teams

National teams are treated as organizations.

Examples:

```txt
Argentina National Team
Brazil National Team
Spain National Team
```

They participate in competitions just like clubs.

Examples:

```txt
FIFA World Cup
Copa América
UEFA Euro
```

---

## Future Seasons

Competitions may contain seasons.

Example:

```txt
Liga Profesional Argentina
    ↓
Season 2026
```

Season management will be defined in a future ADR.

---

## Future Divisions

Competitions may contain divisions.

Example:

```txt
Liga Profesional
    ├── First Division
    ├── Reserve Division
    └── Youth Division
```

Division management will be defined in a future ADR.

---

## Future Fan Relationships

Fans may follow:

```txt
Organizations
Competitions
Sports
```

Examples:

```txt
Primary Organization:
River Plate

Followed Organizations:
Real Madrid
Inter Miami

Followed Competition:
Champions League

Followed Sport:
Basketball
```

---

## Consequences

### Positive

- Supports multiple sports
- Supports future competitions
- Supports future leagues
- Supports global fan ecosystem
- Enables richer EEP segmentation
- Supports sponsor targeting
- Supports future international growth

### Negative

- Additional entities required
- Additional relationships required
- More complex reporting model

---

## Future Database Direction

The target conceptual model becomes:

```txt
Sport
    ↓
Competition
    ↓
Organization
    ↓
Fan Relationships
```

Potential future tables:

```txt
sports

competitions

competition_organizations

fan_organizations

fan_competitions

fan_sports
```

Exact implementation will be defined during Foundation Database v1.

---

## Related Documents

- PROJECT_STATE.md
- ADR-001 Global Fan Model
- ADR-002 Primary and Followed Organizations
- ADR-005 Managed vs Integrated Competitions
- ADR-006 Global Sports Community Vision
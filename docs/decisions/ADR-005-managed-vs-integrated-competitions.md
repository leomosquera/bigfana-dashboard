# ADR-005 Managed vs Integrated Competitions

## Status

Accepted

---

## Context

BigFana initially focused on supporting existing professional sports organizations.

As the platform vision evolved, a new requirement emerged:

BigFana must support both:

- existing professional competitions that already have external data providers
- competitions fully managed inside BigFana

Examples:

### Existing Competitions

```txt
Liga Profesional Argentina
Premier League
La Liga
Liga MX
NBA
```

These competitions already have:

- fixtures
- standings
- statistics
- schedules
- historical data

available through specialized sports data providers.

---

### BigFana Managed Competitions

```txt
Kings League
Creator League
Private Community League
University League
Neighborhood League
Corporate League
```

These competitions may not have external systems.

BigFana must be capable of managing the entire competition lifecycle.

---

## Problem

Should all competitions behave the same way, or should BigFana distinguish between externally managed competitions and internally managed competitions?

The decision impacts:

- database design
- fixture management
- standings
- scheduling
- integrations
- future monetization
- scalability

---

## Alternatives Considered

### Alternative A — All Competitions Are External

BigFana only consumes competition data.

Examples:

```txt
Sports APIs
Data providers
League feeds
```

#### Pros

- Simpler implementation
- Reduced operational responsibility

#### Cons

- Cannot support custom competitions
- Cannot support amateur leagues
- Cannot support Kings League style ecosystems
- Limits future growth

---

### Alternative B — All Competitions Are Managed by BigFana

BigFana manages every competition.

#### Pros

- Full control
- Consistent architecture

#### Cons

- Massive operational complexity
- Duplicates existing sports providers
- Unnecessary effort for professional leagues

---

### Alternative C — Hybrid Model

Competitions may be either:

```txt
Integrated
```

or

```txt
Managed
```

#### Pros

- Maximum flexibility
- Supports professional leagues
- Supports custom competitions
- Supports future growth

#### Cons

- Requires additional modeling
- Requires multiple data flows

---

## Decision

BigFana adopts a Hybrid Competition Model.

Every competition must have a competition type.

Supported types:

```txt
Integrated
Managed
```

---

## Integrated Competitions

Integrated competitions consume data from external providers.

Examples:

```txt
Liga Profesional Argentina
Premier League
La Liga
Liga MX
NBA
Champions League
Copa Libertadores
```

BigFana does not own the competition data.

BigFana consumes:

- fixtures
- standings
- matches
- results
- statistics

through integrations.

BigFana focuses on:

- fan engagement
- content
- loyalty
- sponsors
- campaigns

---

## Managed Competitions

Managed competitions are fully operated by BigFana.

Examples:

```txt
Kings League
Creator League
University League
Neighborhood League
Corporate League
Private Tournament
```

BigFana owns:

- teams
- fixtures
- standings
- schedules
- results
- seasons
- divisions

BigFana becomes the competition management platform.

---

## Competition Lifecycle

Managed competitions may support:

```txt
Competition
    ↓
Season
    ↓
Division
    ↓
Fixture
    ↓
Match
    ↓
Standings
```

This capability is optional and only applies to managed competitions.

---

## Fan Experience

Fans should not notice differences between competition types.

Example:

```txt
Follow Competition
View Standings
View Matches
Receive Notifications
Participate in Campaigns
```

The experience remains consistent.

The data source changes internally.

---

## EEP Impact

Both competition types generate behavioral events.

Examples:

```txt
Match Prediction

Trivia Participation

Competition Follow

Content Interaction
```

EEP should not need to distinguish competition type for audience generation.

Competition metadata may still be available for advanced segmentation.

---

## Future Opportunities

The managed competition model enables BigFana to become:

```txt
Competition Platform
```

for:

- amateur leagues
- creator leagues
- community competitions
- private tournaments
- educational competitions
- corporate tournaments

without depending on external systems.

---

## Consequences

### Positive

- Supports professional ecosystems
- Supports amateur ecosystems
- Supports creator ecosystems
- Supports future Kings League style products
- Avoids unnecessary duplication
- Increases platform flexibility

### Negative

- Additional modeling complexity
- Additional operational workflows
- More competition states to manage

---

## Future Database Direction

Competitions should support:

```txt
competition_type

INTEGRATED
MANAGED
```

Potential future fields:

```txt
external_provider
external_competition_id
sync_strategy
```

Managed competitions may introduce future entities:

```txt
seasons
divisions
fixtures
matches
standings
```

Exact implementation will be defined during Foundation Database v1.

---

## Related Documents

- PROJECT_STATE.md
- ADR-001 Global Fan Model
- ADR-003 EEP Responsibilities
- ADR-004 Sports, Competitions and Organizations Model
- ADR-006 Global Sports Community Vision
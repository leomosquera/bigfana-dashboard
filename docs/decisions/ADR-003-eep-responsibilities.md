# ADR-003 EEP Responsibilities

## Status

Accepted

---

## Context

BigFana and EEP are complementary platforms with different responsibilities.

BigFana focuses on fan experience, engagement, loyalty, campaigns, content, sponsors, and operational management.

EEP acts as the behavioral intelligence engine responsible for audience analysis, segmentation, scoring, and insights.

As BigFana evolves, it is critical to clearly define the boundary between both systems to avoid duplicated functionality, architectural confusion, and future maintenance issues.

---

## Problem

Which responsibilities belong to BigFana and which responsibilities belong to EEP?

Without clear ownership:

- features may be duplicated
- integrations become inconsistent
- reporting becomes unreliable
- segmentation logic may diverge
- future scalability becomes difficult

The platform requires a formal separation of concerns.

---

## Alternatives Considered

### Alternative A — BigFana Handles Everything

BigFana manages:

- fan experience
- loyalty
- segmentation
- audiences
- analytics
- recommendations
- scoring

#### Pros

- Fewer systems
- Simpler deployment

#### Cons

- Duplicates EEP functionality
- Creates analytical complexity
- Reduces scalability
- Increases development effort

---

### Alternative B — EEP Handles Everything

EEP manages:

- fan experience
- loyalty
- campaigns
- content
- segmentation
- audiences

#### Pros

- Single source of execution

#### Cons

- EEP becomes operational software
- Poor separation of concerns
- Slower product evolution
- Reduced flexibility

---

### Alternative C — Clear Separation of Responsibilities

BigFana manages experience and operations.

EEP manages intelligence and behavioral analysis.

#### Pros

- Clear ownership
- Better scalability
- Easier maintenance
- Better product focus
- Reduced duplication

#### Cons

- Requires integration layer
- Requires event synchronization

---

## Decision

BigFana and EEP will have clearly separated responsibilities.

BigFana is responsible for:

- fan experience
- loyalty programs
- points
- levels
- benefits
- rewards
- campaigns
- sponsors
- content
- notifications
- competitions
- matches
- standings
- fan interactions
- dashboards
- administration
- operational workflows

EEP is responsible for:

- audience generation
- behavioral segmentation
- exposure scoring
- fan scoring
- profile enrichment
- recommendations
- behavioral intelligence
- analytics
- insights
- audience exports
- campaign targeting intelligence

---

## Event Flow

BigFana generates events.

EEP consumes events.

Example:

```txt
Fan answers a trivia

BigFana
    ↓
fan_event
    ↓
integration_job
    ↓
EEP
```

---

Example:

```txt
Fan redeems a reward

BigFana
    ↓
fan_event
    ↓
integration_job
    ↓
EEP
```

---

Example:

```txt
Fan attends a match

BigFana
    ↓
fan_event
    ↓
integration_job
    ↓
EEP
```

---

## Audience Flow

EEP generates audiences.

BigFana consumes audiences.

Example:

```txt
EEP

Audience:
Fans interested in European Football

    ↓

BigFana

Creates sponsor campaign
for that audience
```

---

Example:

```txt
EEP

Audience:
Highly engaged fans

    ↓

BigFana

Creates premium reward campaign
```

---

## Synchronization Rules

Synchronization must always be:

- asynchronous
- retryable
- idempotent
- non-blocking

Fan experience must never depend on EEP availability.

If EEP is unavailable:

```txt
BigFana continues operating

Events are queued

Synchronization is retried later
```

---

## Future Responsibilities

Future intelligence features belong to EEP.

Examples:

- predictive engagement
- churn prediction
- recommendation engines
- audience scoring
- sponsor targeting intelligence
- behavioral clustering

Future experience features belong to BigFana.

Examples:

- loyalty experiences
- fan journeys
- benefits
- rewards
- competitions
- gamification
- content experiences

---

## Consequences

### Positive

- Clear platform ownership
- Better scalability
- Easier maintenance
- Reduced duplication
- Better separation of concerns
- Cleaner integrations

### Negative

- Requires robust integration layer
- Requires event synchronization monitoring
- Requires contract management between systems

---

## Integration Principles

BigFana is the system of engagement.

EEP is the system of intelligence.

BigFana sends behavior.

EEP returns intelligence.

Neither platform should duplicate the core responsibility of the other.

---

## Related Documents

- PROJECT_STATE.md
- ADR-001 Global Fan Model
- ADR-002 Primary and Followed Organizations
- EEP Swagger Documentation
- Future Foundation Database v1 Documentation
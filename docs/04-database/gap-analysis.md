# BigFana Gap Analysis

## Purpose

This document compares the current Neon implementation against the Foundation Database v1 target architecture.

The objective is to identify:

- reusable structures
- required refactors
- missing entities
- migration priorities

This document serves as the bridge between:

```txt
Current Schema

↓

Foundation DB v1

↓

Physical Model v1
```

---

# Analysis Summary

Current implementation provides a strong foundation for:

```txt
Organizations

Users

Fans

Sports Catalog

Competitions Catalog

Campaigns

Loyalty

Events

EEP Synchronization
```

The largest architectural gaps exist in:

```txt
Global Fan Model (transition phase)

Organization Sport Refactor

Sponsor Domain

Benefits

Rewards

EEP Audiences

EEP Segments
```

---

# Reusable Foundations

These entities align with the target architecture and should be preserved.

---

# Organizations

## Status

```txt
Reusable
```

---

## Existing Tables

```txt
organizations
```

---

## Notes

The organization remains the primary tenant boundary.

No major redesign required.

---

# Users & Memberships

## Status

```txt
Reusable
```

---

## Existing Tables

```txt
users

memberships
```

---

## Notes

Current structure aligns with:

```txt
RBAC

Multi-Tenant Access
```

---

# Campaign Engine

## Status

```txt
Reusable
```

---

## Existing Tables

```txt
campaigns

campaign_questions

campaign_options

campaign_responses
```

---

## Notes

Current implementation supports:

```txt
Trivia

Polls

Predictions

Surveys
```

No major redesign required.

---

# Event System

## Status

```txt
Reusable
```

---

## Existing Tables

```txt
fan_events
```

---

## Notes

Strategic foundation for:

```txt
EEP

Analytics

Behavior Tracking

Audience Generation
```

Must be preserved.

---

# Integration Jobs

## Status

```txt
Reusable
```

---

## Existing Tables

```txt
integration_jobs
```

---

## Notes

Current architecture already follows:

```txt
Event

↓

Job

↓

External System
```

No major redesign required.

---

# Loyalty Foundation

## Status

```txt
Reusable
```

---

## Existing Tables

```txt
fan_levels

fan_points_ledger
```

---

## Notes

Current implementation provides a strong starting point for:

```txt
Points

Levels

Benefits

Rewards
```

Requires expansion, not replacement.

---

# Required Refactors

These entities exist but require structural evolution.

---

# Fan Ownership Model

## Status

```txt
Implemented (Transition Phase)
```

---

## Current Model

```txt
fans.organization_id
```

---

## Target Model

```txt
fans

fan_organizations
```

---

## Reason

Support:

```txt
Primary Organization

Followed Organizations

Global Community Vision
```

---

## Priority

```txt
Critical
```

---

## Related ADRs

```txt
ADR-001

ADR-002
```

---

# Organization Sport Reference

## Status

```txt
Refactor Required
```

---

## Current Model

```txt
organizations.sport
```

---

## Target Model

```txt
sports

competitions

competition_organizations
```

---

## Reason

Support:

```txt
Multiple Sports

Multiple Competitions

Future Expansion
```

---

## Priority

```txt
High
```

---

## Related ADR

```txt
ADR-004
```

---

# Sponsor Model

## Status

```txt
Refactor Required
```

---

## Current Model

```txt
sponsor_ads

campaign_ads
```

---

## Target Model

```txt
sponsors

sponsor_organizations

sponsor_ads
```

---

## Reason

Sponsor becomes a first-class domain.

---

## Priority

```txt
Medium
```

---

# Missing Foundations

These entities do not currently exist.

---

# Sports Domain

## Status

```txt
Implemented (catalog)
```

---

## Existing Tables

```txt
sports
```

---

## Notes

Global sports catalog seeded with 11 canonical sports.

`slug` is the canonical global sport identifier per Global Catalog Rules.

`organizations.sport` refactor remains pending.

---

## Priority

```txt
High
```

---

## Related ADR

```txt
ADR-004
```

---

# Competitions Domain

## Status

```txt
Implemented (hierarchy complete — catalog + membership)
```

---

## Existing Tables

```txt
competitions

competition_organizations
```

---

## Notes

Global competition catalog implemented with no seed data.

`slug` is the canonical competition identifier.

`competition_type` supports `INTEGRATED` and `MANAGED`.

Organization–competition membership implemented with no seed data.

`organizations.sport` refactor remains pending.

---

## Priority

```txt
High
```

---

## Related ADR

```txt
ADR-004

ADR-005
```

---

# Seasons

## Status

```txt
Missing
```

---

## Required Tables

```txt
seasons
```

---

## Priority

```txt
Medium
```

---

# Divisions

## Status

```txt
Missing
```

---

## Required Tables

```txt
divisions
```

---

## Priority

```txt
Medium
```

---

# Matches

## Status

```txt
Missing
```

---

## Required Tables

```txt
matches
```

---

## Priority

```txt
Medium
```

---

# Standings

## Status

```txt
Missing
```

---

## Required Tables

```txt
standings
```

---

## Priority

```txt
Medium
```

---

# Fan Interests

## Status

```txt
Missing
```

---

## Required Tables

```txt
fan_sports

fan_competitions
```

---

## Priority

```txt
Medium
```

---

## Related ADR

```txt
ADR-006
```

---

# Benefits

## Status

```txt
Missing
```

---

## Required Tables

```txt
benefits
```

---

## Priority

```txt
High
```

---

# Rewards

## Status

```txt
Missing
```

---

## Required Tables

```txt
rewards
```

---

## Priority

```txt
High
```

---

# Redemptions

## Status

```txt
Missing
```

---

## Required Tables

```txt
redemptions
```

---

## Priority

```txt
High
```

---

# Sponsor Domain

## Status

```txt
Missing
```

---

## Required Tables

```txt
sponsors

sponsor_organizations
```

---

## Priority

```txt
Medium
```

---

# EEP Audiences

## Status

```txt
Missing
```

---

## Required Tables

```txt
audiences

fan_audiences
```

---

## Priority

```txt
Medium
```

---

## Related ADR

```txt
ADR-003
```

---

# EEP Segments

## Status

```txt
Missing
```

---

## Required Tables

```txt
segments

fan_segments
```

---

## Priority

```txt
Medium
```

---

## Related ADR

```txt
ADR-003
```

---

# Future Foundations

Not required for Phase 1.

---

## Marketplace

```txt
Deferred
```

---

## Subscriptions

```txt
Deferred
```

---

## Fantasy Sports

```txt
Deferred
```

---

## Fan Wallet

```txt
Deferred
```

---

## Digital Collectibles

```txt
Deferred
```

---

# Migration Priorities

Recommended order:

```txt
1. Fan Ownership Model

2. Sports Hierarchy

3. Competitions

4. Benefits

5. Rewards

6. Redemptions

7. Sponsors

8. Audiences

9. Segments

10. Match Center
```

---

# Overall Assessment

Current implementation already covers approximately:

```txt
70% of Phase 1
```

The foundation is considered strong.

Most future work consists of:

```txt
Expansion

Normalization

Strategic Refactors
```

rather than large-scale redesign.

---

# Next Step

The next database document is:

```txt
physical-model-v1.md
```

which defines:

```txt
Real Tables

Real Columns

Real Relationships

Real Constraints

Real Indexes
```

for Foundation Database v1.

---

# Related Documents

- current-schema.md
- foundation-db-v1.md
- foundation-db-backlog.md
- logical-model.md
- physical-model-v1.md
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- ADR-006
# BigFana Foundation Database Backlog

## Purpose

This document converts Foundation Database v1 into actionable implementation tasks.

The objective is to provide a clear execution plan for evolving the current database toward the target architecture.

This backlog should be continuously updated as tasks are completed.

---

# Status Legend

```txt
[ ] Not Started

[-] In Progress

[x] Completed

[!] Blocked
```

---

# Phase 0 — Current Schema Validation

## Objective

Fully document the current Neon schema.

---

### Current Schema Documentation

- [ ] Document all tables
- [ ] Document all columns
- [ ] Document all foreign keys
- [ ] Document all indexes
- [ ] Document all enums
- [ ] Document all constraints

Deliverable:

```txt
current-schema.md updated
```

---

### Gap Analysis Validation

- [ ] Compare current schema against logical model
- [ ] Identify reusable entities
- [ ] Identify missing entities
- [ ] Identify migration candidates
- [ ] Identify deprecated structures

Deliverable:

```txt
gap-analysis.md updated
```

---

# Phase 1 — Global Fan Model

Defined by:

```txt
ADR-001

ADR-002
```

---

## Fan Organization Relationship

Current model:

```txt
fans.organization_id
```

Target model:

```txt
fan_organizations
```

---

### New Entities

- [x] Create fan_organizations

---

### New Features

- [ ] Support primary organization
- [ ] Support followed organizations
- [ ] Support organization affinity
- [ ] Support organization relationship metadata

---

### Migration

- [ ] Migrate existing fans
- [ ] Preserve organization ownership
- [ ] Validate data consistency

---

# Phase 2 — Sports Hierarchy

Defined by:

```txt
ADR-004
```

---

## Sports

- [x] Create sports table
- [x] Create sport catalog seed

---

## Competitions

- [x] Create competitions table
- [x] Create competition types

Supported:

```txt
INTEGRATED

MANAGED
```

---

## Competition Memberships

- [ ] Create competition_organizations
- [ ] Create competition metadata structure

---

## Organization Evolution

- [ ] Replace organizations.sport
- [ ] Migrate existing organization sport references

---

# Phase 3 — Fan Interests

---

## Fan Sports

- [ ] Create fan_sports

---

## Fan Competitions

- [ ] Create fan_competitions

---

## Future Readiness

- [ ] Support multi-sport fans
- [ ] Support competition following
- [ ] Support recommendation engine inputs

---

# Phase 4 — Loyalty Expansion

---

## Benefits

- [ ] Create benefits table
- [ ] Create benefit eligibility model
- [ ] Create benefit usage tracking

---

## Rewards

- [ ] Create rewards table
- [ ] Create reward inventory structure
- [ ] Create reward metadata model

---

## Redemptions

- [ ] Create redemptions table
- [ ] Create redemption status workflow
- [ ] Create redemption audit history

---

# Phase 5 — Sponsor Ecosystem

---

## Sponsors

- [ ] Create sponsors table

---

## Organization Sponsors

- [ ] Create sponsor_organizations

---

## Competition Sponsors

- [ ] Create sponsor_competitions

---

## Sponsor Metadata

- [ ] Define sponsor categories
- [ ] Define sponsor status model

---

# Phase 6 — Content Platform

---

## Content

- [ ] Create content table

---

## Content Categories

- [ ] Create content_categories

---

## Content Tags

- [ ] Create content_tags

---

## Content Relationships

- [ ] Create content_tag pivot model

---

# Phase 7 — Match Center

Defined by:

```txt
ADR-005
```

---

## Seasons

- [ ] Create seasons table

---

## Divisions

- [ ] Create divisions table

---

## Matches

- [ ] Create matches table

---

## Standings

- [ ] Create standings table

---

## Competition Tracking

- [ ] Create competition statistics model
- [ ] Create fixture management model

---

# Phase 8 — EEP Intelligence

Defined by:

```txt
ADR-003
```

---

## Audiences

- [ ] Create audiences table

---

## Segments

- [ ] Create segments table

---

## Audience Memberships

- [ ] Create fan_audiences

---

## Segment Memberships

- [ ] Create fan_segments

---

## Synchronization

- [ ] Define audience sync process
- [ ] Define segment sync process
- [ ] Define reconciliation process

---

# Phase 9 — Integration Layer

---

## Integration Registry

- [ ] Create integrations table

---

## Integration Connections

- [ ] Create integration_connections

---

## Integration Credentials

- [ ] Define credential strategy

---

## Integration Jobs

Review existing structure:

- [ ] Validate integration_jobs
- [ ] Extend if required

---

# Phase 10 — Audit and Events

---

## Fan Events

Review existing implementation:

- [ ] Validate fan_events
- [ ] Validate event taxonomy

---

## Audit Logs

- [ ] Create audit_logs

---

## Change Tracking

- [ ] Define entity audit strategy

---

# Technical Review Tasks

---

## Naming Consistency

- [ ] Validate table naming conventions
- [ ] Validate foreign key naming conventions
- [ ] Validate index naming conventions

---

## Multi-Tenant Review

- [ ] Validate organization ownership
- [ ] Validate tenant boundaries
- [ ] Validate future global fan model

---

## Performance Review

- [ ] Review indexes
- [ ] Review high-volume tables
- [ ] Review event storage strategy

---

# Migration Governance

Before any migration:

- [ ] Update current-schema.md
- [ ] Update gap-analysis.md
- [ ] Update PROJECT_STATE.md if required
- [ ] Obtain migration approval

---

# Success Criteria

Foundation Database v1 is complete when:

- [ ] Global Fan Model exists
- [ ] Sports hierarchy exists
- [ ] Competition hierarchy exists
- [ ] Loyalty expansion exists
- [ ] Sponsor ecosystem exists
- [ ] Content platform exists
- [ ] Match center exists
- [ ] EEP audiences and segments exist

without requiring architectural redesign.

---

# Related Documents

- foundation-db-v1.md
- current-schema.md
- gap-analysis.md
- logical-model.md
- ADR-001
- ADR-002
- ADR-003
- ADR-004
- ADR-005
- ADR-006
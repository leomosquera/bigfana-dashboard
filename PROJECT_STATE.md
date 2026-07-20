# BigFana - PROJECT_STATE.md

## Current Phase

### Lifecycle context (operational gates)

BigFana is currently a greenfield development project.
There is no production environment with real users or customers.
Operational migration gates must not invent production rolling-deployment
or legacy-production rollback requirements until a production environment exists.
Current deployable surface for Foundation work: Vercel Preview on
feature/foundation-db-v1 (Block D at ecc515f / HEAD 165640f).

Foundation v1 - Database Implementation

Architecture, ADRs, product modules, EEP integration, roadmap, and dashboard information architecture are defined and accepted.

Foundation Database v1 physical model in Neon is ready with non-blocking technical debt.

Current focus:

- Migration 019 COMPLETE (019a + App cutover + 019b)
- organizations.sport physically REMOVED from Neon
- organizations.sport_id ABSENT
- Canonical sport path: organization -> competition_organizations -> competitions -> sports (soccer)
- Post-019 Technical Audit COMPLETE — verdict B (READY WITH NON-BLOCKING TECHNICAL DEBT)
- Documentation alignment after Migrations 017-019 COMPLETE
- Drizzle Representation Cleanup COMPLETE (F05 / F06 / F07 / F09 / NEW-F15 / NEW-F16)
  - Neon physical schema UNCHANGED
  - Drizzle/application representation ALIGNED for in-scope findings
- Block A / NEW-F17 COMPLETE — remaining mapped-runtime timestamp representation verified
  - auth / campaigns / gamification / EIL: live Neon timestamptz; Drizzle withTimezone ALIGNED
  - No Drizzle field changes required; intentional timestamptz preserved
- F08 COMPLETE (Block B) — sports / competitions / competition_organizations mapped in Drizzle
  - Competition application features: NOT IMPLEMENTED
- Block D COMPLETE — fans.country_code application SoT
- Legacy fans.country physical DROP COMPLETE — EXECUTED AND VALIDATED (unnumbered; not Migration 020)
- Fan geography SoT: fans.country_code
- Migration 020: NOT STARTED / NO FROZEN SCOPE
---

# Product Vision

BigFana is a Fan Engagement, Loyalty, Intelligence, and Monetization Platform for Sports Organizations.

The platform is designed following an:

```txt
Organization First
Global Community Ready
```

strategy.

Organizations remain the primary customer.

The platform is designed to evolve into a global network of sports communities.

Defined by:

```txt
ADR-006
```

---

# Current Architecture Status

Completed:

```txt
Business Model

Fan Journey

System Architecture

EEP Architecture

Dashboard Information Architecture

Integration Strategy

Domain Model

Logical Model

Foundation Database v1

Product Roadmap v1
```

The architecture foundation is considered established.

---

# Database Status

Current database:

```txt
PostgreSQL

Neon
```

Documentation completed:

```txt
domain-model.md

logical-model.md

current-schema.md

gap-analysis.md

foundation-db-v1.md
```

Current priority:

```txt
Foundation DB READY WITH NON-BLOCKING TECHNICAL DEBT

ADR-009 Contract Phase COMPLETE

Migration 019 COMPLETE - Remove Legacy Organization Sport
  (019a + App cutover + 019b EXECUTED AND VALIDATED)

Post-019 documentation alignment COMPLETE

Drizzle Representation Cleanup COMPLETE
  (F05 / F06 / F07 / F09 / NEW-F15 / NEW-F16)

Block A / NEW-F17 COMPLETE
  (auth / campaigns / gamification / EIL timestamptz verified ALIGNED)

F08 / Block B COMPLETE
  (sports / competitions / competition_organizations Drizzle mapped; features NOT implemented)

Migration 020 NOT STARTED / NO FROZEN SCOPE

Remaining representation debt (not Migration 020):
  Optional: unused fan_status PG type hygiene
  Legacy fans.country physical DROP: COMPLETE — EXECUTED AND VALIDATED
    (unnumbered; Migration 020 NOT STARTED / NO FROZEN SCOPE)
```

No major schema redesign should occur without an explicitly approved migration scope.

---

# EEP Status

Architecture defined.

Ownership model established.

Defined by:

```txt
ADR-003

eep-architecture.md
```

Current direction:

```txt
BigFana generates behavior

EEP generates intelligence
```

Future implementation work will focus on:

```txt
Event Synchronization

Audience Synchronization

Segment Synchronization
```

---

# Product Status

Core modules defined:

```txt
Organizations

Users & Permissions

Fans

Campaigns

Loyalty

Competitions

Content

Sponsors

Intelligence

Integrations
```

Documented in:

```txt
modules-catalog.md
```

---

# Dashboard Status

Administrative information architecture defined.

Documented in:

```txt
dashboard-information-architecture.md
```

Future work:

```txt
Dashboard UX

Dashboard UI

Module Screens

Permission Matrix

Navigation Components
```

---

# Roadmap Status

Current roadmap defined in:

```txt
product-roadmap-v1.md
```

Current implementation priority:

```txt
Phase 1

Organizations

Users

Fans

Campaigns

Points

Levels

EEP Integration

Dashboard
```

---

# Repository Structure

Important directories:

```txt
docs/00-vision/
docs/01-business/
docs/02-product/
docs/03-architecture/
docs/04-database/
docs/05-eep/
docs/06-app/
docs/07-dashboard/
docs/08-integrations/
docs/09-roadmap/

docs/decisions/
docs/sessions/
```

Documentation inside these directories is considered part of the product and must remain synchronized with implementation.

---

# Architectural Decisions

The following ADRs are currently accepted:

```txt
ADR-001 Global Fan Model

ADR-002 Primary and Followed Organizations

ADR-003 EEP Responsibilities

ADR-004 Sports Competitions and Organizations

ADR-005 Managed vs Integrated Competitions

ADR-006 Global Sports Community Vision
```

Future architecture decisions must be documented using ADRs.

---

# Current Priority

The current project priority is:

```txt
Foundation Database v1 — READY WITH NON-BLOCKING TECHNICAL DEBT

ADR-009 Contract Phase COMPLETE

Migration 019 COMPLETE

Drizzle Representation Cleanup COMPLETE (F05-F07 / F09 / NEW-F15 / NEW-F16)

Migration 020 NOT STARTED / NO FROZEN SCOPE

Dashboard Definition

V1 Development Planning
```

No implementation should bypass documented architecture decisions.

---

# Source of Truth

Primary documents:

```txt
PROJECT_STATE.md

docs/decisions/*

docs/04-database/*

docs/03-architecture/*

docs/05-eep/*

docs/07-dashboard/*
```

If implementation and documentation diverge, documentation must be updated immediately.

---

---

# Foundation DB v1 Progress

Completed migrations:

- 001_create_fan_organizations (executed and validated)
- 002_create_sports (executed and validated)
- 003_create_competitions (executed and validated)
- 004_create_competition_organizations (executed and validated)
- 005_create_fan_interests (executed and validated)
- 006_fan_profile_foundation (executed and validated)
- 007_create_benefits (executed and validated)
- 008_create_rewards (executed and validated)
- 009_create_redemptions (executed and validated)
- 010_create_sponsors (executed and validated)
- 011_create_content (executed and validated)
- 012_create_match_center (executed and validated)
- 013_create_eep_audiences (executed and validated)
- 014_create_eep_segments (executed and validated)
- 015_create_integrations (executed and validated)
- 016_create_audit_logs (executed and validated)
- 017_deprecate_legacy_fan_ownership (executed and validated)
- 018a_make_legacy_fan_ownership_omit_safe (executed and validated)
- 018b_remove_legacy_fan_ownership (executed and validated)
- 019a_canonical_competition_data (executed and validated)
- 019b_remove_legacy_organization_sport (executed and validated)

Current phase:

Migration 019 - Remove Legacy Organization Sport - COMPLETE

Current status:
- Migration 019a COMPLETE - executed and validated in Neon
- Application / Drizzle cutover COMPLETE
- Migration 019b COMPLETE - executed and validated in Neon
- organizations.sport: ABSENT
- organizations.sport_id: ABSENT
- competitions: liga-profesional-argentina, liga-mx (soccer / INTEGRATED)
- memberships: river-plate / boca-juniors -> AR; toluca -> MX
- Canonical path: organization -> competition_organizations -> competitions -> sports
- Migration 019 contract phase: COMPLETE
- Migration 020: NOT STARTED (no frozen scope)

Next:
- Documentation alignment after Migrations 017-019: COMPLETE
- Drizzle Representation Cleanup (F05 / F06 / F07 / F09 / NEW-F15 / NEW-F16): COMPLETE
- Block A / NEW-F17 COMPLETE (mapped-runtime timestamptz verified ALIGNED)
- F08 / Block B COMPLETE (catalog Drizzle schemas mapped; features NOT implemented)
- Block D COMPLETE (fans.country_code application cutover)
- Legacy fans.country physical DROP COMPLETE — EXECUTED AND VALIDATED (unnumbered)
- Fan geography SoT: fans.country_code
- Migration 020: NOT STARTED / NO FROZEN SCOPE
- Do NOT invent Migration 020 scope
- Do NOT start Migration 020 Design Brief or SQL
- Do NOT treat remaining optional debt as automatic Migration 020

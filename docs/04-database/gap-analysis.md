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

Foundation Database v1 (through Migration 019) is architecturally ready in Neon:

```txt
Verdict (Technical Audit post-019):
  B. FOUNDATION DB READY WITH NON-BLOCKING TECHNICAL DEBT

Migration 020:
  NOT STARTED
  NO FROZEN / RESERVED SCOPE
```

Current Neon implementation provides a strong foundation for:

```txt
Organizations

Users

Fans (global identity + fan_organizations)

Sports Catalog

Competitions Catalog

Competition Organizations (canonical org→sport path)

Campaigns

Loyalty

Sponsors

Content

Events

EEP cache tables (audiences / segments)
```

## Resolved Foundation gaps

These were previously the largest Foundation blockers and are now **COMPLETE**:

```txt
Global Fan Model (ADR-001 / ADR-002 / ADR-009)
  — fan_organizations sole authoritative ownership
  — fans.organization_id PHYSICALLY REMOVED (018b)

Organization Sport Refactor (ADR-004 / ADR-005 / Migration 019)
  — organizations.sport PHYSICALLY REMOVED (019b)
  — organizations.sport_id ABSENT
  — canonical path: organization → competition_organizations → competitions → sports
```

## Remaining non-blocking technical debt

Documented by the post-019 Naming / FK / Index Consistency Audit. **Not** Migration 020 scope unless explicitly prioritized later:

```txt
F05  COMPLETE — Drizzle TEXT model aligned (no Neon enum migration)
F06  COMPLETE — MembershipRole aligned to Neon CHECK (owner/admin/tenant/analyst)
F07  COMPLETE — avatar_url / country_code mapped in Drizzle
Block D COMPLETE — fans.country → country_code application cutover
Legacy fans.country physical DROP COMPLETE — EXECUTED AND VALIDATED (unnumbered; not Migration 020)
F08  COMPLETE — sports / competitions / competition_organizations mapped in Drizzle (Block B)
F09  COMPLETE — false Drizzle index declarations removed/aligned (no indexes created in Neon)
NEW-F15 COMPLETE — fans / fan_events / integration_jobs timestamp tz representation aligned
NEW-F16 COMPLETE — fans.display_name nullability aligned to Neon
NEW-F17 COMPLETE — auth / campaigns / gamification / EIL timestamptz verified ALIGNED (Block A)
F10–F14  Redundant indexes, PRIMARY sync CHECK, naming eras, unused enum type, etc.
```

## Future application-readiness work

Not Foundation DB blockers. Database DDL exists; product/feature wiring may still be pending:

```txt
EEP audience / segment sync processes (tables exist — Migrations 013–014)

Drizzle representation of catalog tables (when features need them)

Feature UX for FOLLOWING organizations, fan interests, match center, etc.
```

Do not treat application-readiness or Drizzle mapping gaps as open Foundation architecture gaps.

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

# Integration Registry

## Status

```txt
Implemented (Migration 015)
```

---

## Existing Tables

```txt
integrations

integration_jobs
```

---

## Notes

`integrations` — org-owned provider enablement registry.

Exactly one row per `(organization_id, provider)` for all lifecycle statuses.

Lifecycle transitions UPDATE the same row; history recorded in `audit_logs` (Migration 016).

`integration_jobs` — pre-existing async queue; unchanged in 015.

Logical association via `(organization_id, provider)`. Physical `integration_id` FK deferred.

Provider vocabulary Foundation v1: `eep` only.

No seed data on `integrations` — validated: 0 rows.

---

## Priority

```txt
Medium — registry DDL complete; credentials / connections / workers deferred
```

---

## Related ADR

```txt
ADR-003
```

---

# Audit Layer

## Status

```txt
Implemented (Migration 016)
```

---

## Existing Tables

```txt
audit_logs
```

---

## Notes

`audit_logs` — append-only dual-scope business audit trail.

Actor and Origin are distinct soft-reference dimensions (`actor_id` / `origin_id` UUID, no FKs).

Canonical `entity_id` = BigFana entity PK UUID.

Business decisions only; independent from `integration_jobs` and `fan_events`.

`metadata` supplements context only — never authoritative current state.

`entity_type` open TEXT; emitted values must be documented in canonical entity vocabulary.

Owns integration registry lifecycle history deferred from Migration 015.

No seed data — validated: 0 rows.

---

## Priority

```txt
Low — Foundation DDL complete; writers / retention / SIEM deferred
```

---

# Loyalty Foundation

## Status

```txt
Complete (DDL — Migrations 007–009)
```

---

## Existing Tables

```txt
fan_levels

fan_points_ledger

benefits

rewards

redemptions
```

---

## Notes

Loyalty Foundation is complete at the DDL level:

```txt
Points

Levels

Benefits (catalog — Migration 007)

Rewards (catalog — Migration 008)

Redemptions (transactions — Migration 009)
```

Benefit eligibility and usage tracking are deferred.

Points debit, stock decrement, and redemption workflow implementation are deferred to the application layer.

Requires application-layer expansion, not schema replacement.

---

# Required Refactors

These entities exist but require structural evolution.

---

# Fan Ownership Model

## Status

```txt
COMPLETE — ADR-009 contract phase finished
017 deprecation COMPLETE
018a omit-safe COMPLETE
Application Phase F2 COMPLETE
018b physical removal COMPLETE (executed and validated in Neon)
```

---

## Current Model

```txt
fans                 = global fan identity (ADR-001)
fan_organizations    = sole authoritative fan↔organization relationship
                       (PRIMARY / FOLLOWING — ADR-002 / ADR-009)

fans.organization_id          = PHYSICALLY REMOVED (Migration 018b)
fans_organization_id_fkey     = PHYSICALLY REMOVED
idx_fans_org                  = PHYSICALLY REMOVED

Legacy ownership projection   = RETIRED
Legacy projection writer      = RETIRED
Legacy Drizzle mapping        = REMOVED
```

---

## Target Model

```txt
Achieved.

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
COMPLETE — ADR-009 contract phase finished (017 / 018a / F2 / 018b)
```

---

## Related ADRs

```txt
ADR-001

ADR-002

ADR-009
```

---

# Organization Sport Reference

## Status

```txt
COMPLETE — Migration 019 finished
019a COMPLETE
Application / Drizzle cutover COMPLETE
019b COMPLETE — organizations.sport physically REMOVED
organizations.sport_id ABSENT
```

---

## Current Model

```txt
Canonical (sole):
  organization
    → competition_organizations
    → competitions
    → sports

Legacy organizations.sport:
  REMOVED (Migration 019b)
```

---

## Target Model

```txt
Achieved.

sports

competitions

competition_organizations

(organizations.sport removed — COMPLETE)
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
COMPLETE — Migration 019 contract phase finished
```

---

## Related ADR

```txt
ADR-004

ADR-005
```

---

# Sponsor Model

## Status

```txt
Implemented (Migration 010 — foundation)
```

---

## Existing Tables

```txt
sponsors

sponsor_organizations

sponsor_ads

campaign_ads
```

---

## Notes

Global sponsor catalog and org partnership junction complete at DDL level (Migration 010).

`sponsors.slug` — case-insensitive uniqueness via `sponsors_slug_unique ON lower(slug)`.

Status values: `draft`, `active`, `paused`, `archived`.

`sponsor_ads` still uses denormalized `sponsor_name` — `sponsor_id` FK reconciliation deferred.

`sponsor_competitions` deferred to future 010b.

No seed data — validated: 0 rows.

---

## Priority

```txt
Medium — foundation DDL complete; sponsor_ads reconciliation and competition sponsorship deferred
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

`organizations.sport` physically REMOVED (Migration 019b COMPLETE). Canonical sport ownership is competition-derived only.

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
Migration 019a Foundation minimum package present
```

---

## Existing Tables

```txt
competitions

competition_organizations
```

---

## Notes

Global competition catalog implemented.

`slug` is the canonical competition identifier.

`competition_type` supports `INTEGRATED` and `MANAGED`.

Migration 019a established Foundation minimum rows (validated in Neon):

```txt
competitions = 2
  liga-profesional-argentina
  liga-mx

competition_organizations = 3
  river-plate / boca-juniors → liga-profesional-argentina
  toluca → liga-mx
```

`organizations.sport` REMOVED (019b COMPLETE). Foundation minimum competitions + memberships remain authoritative.

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
Implemented (Migration 012)
```

---

## Existing Tables

```txt
seasons
```

---

## Notes

Competition-owned season container. Case-insensitive unique name per competition.

`starts_at` / `ends_at` are optional DATE bounds.

---

## Priority

```txt
Medium — foundation DDL complete
```

---

# Divisions

## Status

```txt
Deferred — Competition Structure future ADR
```

---

## Required Tables

```txt
divisions (or stages / generalized structure — undecided)
```

---

## Notes

Migration 012 intentionally did not create `divisions`. A future ADR must define whether competitions use divisions, stages, conferences, groups, brackets, or a generalized model.

---

## Priority

```txt
Medium — blocked on Competition Structure ADR
```

---

# Matches

## Status

```txt
Implemented (Migration 012)
```

---

## Existing Tables

```txt
matches
```

---

## Notes

Fixtures + results in one table. Scoped by `season_id` only (no denormalized `competition_id`).

No venue columns. No lineups, events, or statistics.

---

## Priority

```txt
Medium — foundation DDL complete
```

---

# Standings

## Status

```txt
Implemented (Migration 012)
```

---

## Existing Tables

```txt
standings
```

---

## Notes

Persisted snapshots per `(season_id, organization_id)`. Never calculated in SQL.

No denormalized `competition_id`.

---

## Priority

```txt
Medium — foundation DDL complete
```

---

# Match Center Domain

## Status

```txt
Implemented (Migration 012)
```

---

## Existing Tables

```txt
seasons

matches

standings
```

---

## Notes

Match Center Foundation complete at DDL level.

Managed and Integrated competitions share the same schema (ADR-005).

Competition ownership path: `match|standing → season → competition`.

Deferred: competition structure, venues, `content.match_id`, provider metadata, match events/stats.

No seed data — validated: 0 rows.

---

## Priority

```txt
Medium — foundation DDL complete; application Match Center UX deferred
```

---

# Fan Profile Foundation

## Status

```txt
Implemented
```

---

## Target

```txt
fans — global identity and declarative profile

avatar_url

country_code (ISO 3166-1 alpha-2)

fans_email_normalized_unique_idx
```

---

## Notes

Migration 006 complete. No `fan_profiles` table.

Legacy free-text `fans.country` was physically removed (unnumbered Legacy Fan Country Physical Removal COMPLETE). Canonical fan geography is `fans.country_code`. `fans.organization_id` was physically removed by Migration 018b (COMPLETE). `fan_organizations` is the sole authoritative fan↔organization relationship.

---

## Related ADRs

```txt
ADR-001

ADR-002
```

---

# Fan Interests

## Status

```txt
Implemented
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
Implemented (catalog — Migration 007)
```

---

## Required Tables

```txt
benefits
```

---

## Notes

Organization-owned benefit catalog. Status values: `draft`, `active`, `paused`, `archived`.

`organization_id` → ON DELETE RESTRICT.

No eligibility, usage tracking, sponsor linkage, or campaign FK in Migration 007.

No seed data — validated: 0 rows.

---

## Priority

```txt
High — catalog complete; eligibility and usage deferred
```

---

# Rewards

## Status

```txt
Implemented (catalog — Migration 008)
```

---

## Existing Tables

```txt
rewards
```

---

## Notes

Organization-owned point-priced rewards catalog. Catalog-only — no ledger debits, eligibility rules, or stock decrement logic.

`active` status means catalog visibility only; balance and stock checks at redemption time (application layer).

No seed data — validated: 0 rows.

---

## Priority

```txt
High — catalog complete
```

---

# Redemptions

## Status

```txt
Implemented (Migration 009)
```

---

## Existing Tables

```txt
redemptions
```

---

## Notes

Organization-scoped transactional record of a fan claiming a reward.

DDL transaction storage only — no `ledger_entry_id`, `fan_event_id`, triggers, or procedures.

`points_cost` snapshots `rewards.points_required` at claim time.

Status workflow: `pending`, `approved`, `fulfilled`, `rejected`, `cancelled` (lowercase). Transitions enforced at application layer.

Points debit timing, stock decrement timing, and redemption service are deferred to application layer.

No seed data — validated: 0 rows.

---

## Priority

```txt
High — DDL complete; application workflow deferred
```

---

# Sponsor Domain

## Status

```txt
Implemented (Migration 010)
```

---

## Existing Tables

```txt
sponsors

sponsor_organizations
```

---

## Notes

Global sponsor catalog and organization sponsorship relationships.

`sponsor_organizations.sponsor_id` → `sponsors.id` ON DELETE RESTRICT.

`sponsor_organizations.organization_id` → `organizations.id` ON DELETE RESTRICT.

UNIQUE `(sponsor_id, organization_id)`.

Remaining gaps:

```txt
sponsor_competitions (deferred)
sponsor_ads.sponsor_id reconciliation
sponsor categories
```

No seed data — validated: 0 rows.

---

## Priority

```txt
Medium — foundation complete; ads reconciliation and competition sponsorship deferred
```

---

# Content Domain

## Status

```txt
Implemented (Migration 011)
```

---

## Existing Tables

```txt
content
```

---

## Notes

Organization-owned publishable content with publication lifecycle.

Status values: `draft`, `published`, `paused`, `archived`.

`content_type` values: `news`, `article`, `announcement`, `video`, `match_update`.

`content_slug_unique` — UNIQUE on `(organization_id, lower(slug))`.

No campaign, sponsor, match, or taxonomy FKs in Migration 011.

`content.match_id` remains deferred past Migration 012.

No seed data — validated: 0 rows.

---

## Priority

```txt
Medium — foundation DDL complete; application publish workflow deferred
```

---

# Content Taxonomy (Deferred)

## Status

```txt
Deferred — Migration 011b (Content Taxonomy Foundation)
```

---

## Target Tables

```txt
content_categories

content_tags

content_category_assignments

content_tag_assignments
```

---

## Reason

Taxonomy without assignment relationships creates orphan catalogs with no operational value. Same Foundation principle as Migration 010 (sponsor_competitions deferred).

---

## Priority

```txt
Low — not required for Content Foundation DDL
```

---

# EEP Audiences

## Status

```txt
Implemented (Migration 013)
```

---

## Existing Tables

```txt
audiences

fan_audiences
```

---

## Notes

Platform-scoped EEP cache (ADR-007). No `organization_id`.

`eep_id` is globally unique, stable, never-reused upsert key.

No retirement state in 013. `updated_at` application-maintained on successful sync.

No seed data — validated: 0 rows.

---

## Priority

```txt
Medium — foundation DDL complete; live sync and activation FKs deferred
```

---

## Related ADR

```txt
ADR-003

ADR-007
```

---

# EEP Segments

## Status

```txt
Implemented (Migration 014)
```

---

## Existing Tables

```txt
segments

fan_segments
```

---

## Notes

Platform-scoped EEP cache (ADR-008). No `organization_id`.

`eep_id` is globally unique, stable, never-reused upsert key.  
`segments.id` is a BigFana surrogate key only.

No retirement state in 014. `updated_at` application-maintained on successful sync.

No seed data — validated: 0 rows.

---

## Priority

```txt
Medium — foundation DDL complete; live sync deferred
```

---

## Related ADR

```txt
ADR-003

ADR-008
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
1. Fan Ownership Model (COMPLETE — 017 / 018a / F2 / 018b)

2. Sports Hierarchy (complete)

3. Competitions (complete)

4. Fan Interests (complete)

5. Fan Profile Foundation (complete)

6. Benefits (complete)

7. Rewards (complete)

8. Redemptions (complete)

9. Sponsors (complete)

10. Content (complete)

11. Match Center (complete)

12. Audiences (complete)

13. Segments (complete)

14. Integration Registry (complete)

15. Audit Layer (complete)

16. Legacy fan ownership deprecation COMMENT (complete — Migration 017)

17. Legacy fan ownership omit-safe NULLABLE (complete — Migration 018a)

18. Legacy fan ownership physical removal (complete — Migration 018b)
```

---

# Overall Assessment

```txt
Foundation expand-phase DDL (001–016): COMPLETE
ADR-009 contract phase (017 / 018a / F2 / 018b): COMPLETE
Migration 019 (019a / App cutover / 019b): COMPLETE

Technical Audit verdict:
  B. FOUNDATION DB READY WITH NON-BLOCKING TECHNICAL DEBT
```

The Foundation physical model is considered architecturally ready.

Remaining work is **not** Foundation redesign. It is:

```txt
Documentation alignment (this pass) — COMPLETE

Drizzle ↔ Neon representation cleanup (F05 / F06 / F07 / F09 / NEW-F15 / NEW-F16) — COMPLETE

Block A / NEW-F17 — COMPLETE (mapped-runtime timestamptz verified ALIGNED; no Drizzle field changes)

F08 catalog Drizzle schemas — COMPLETE (Block B; representation only — competition features NOT implemented)

Optional performance / constraint technical debt (F10–F14, optional composites) — only when explicitly prioritized

Feature development on top of existing Foundation tables
```

Do **not** invent Migration 020 solely to continue numbering. Future schema migrations require an explicitly approved, scoped technical need.

---

# Next Step

```txt
Migration 019 — COMPLETE
Migration 020 — NOT STARTED / NO FROZEN SCOPE

Drizzle Representation Cleanup: COMPLETE
  (F05 / F06 / F07 / F09 / NEW-F15 / NEW-F16)

Block A / NEW-F17: COMPLETE
  (auth / campaigns / gamification / EIL timestamptz ALIGNED)

F08 catalog Drizzle schemas: COMPLETE (Block B)
  (sports / competitions / competition_organizations mapped; features NOT implemented)

Do NOT:
  - invent Migration 020 scope
  - start Migration 020 Design Brief or SQL
  - treat remaining optional debt as automatic Migration 020
```

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
- ADR-007
- ADR-008
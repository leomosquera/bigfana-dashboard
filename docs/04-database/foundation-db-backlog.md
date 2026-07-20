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

- [x] Document all tables
- [x] Document all columns
- [x] Document all foreign keys
- [x] Document all indexes
- [x] Document all enums / CHECK-constrained TEXT domains
- [x] Document all constraints

Deliverable:

```txt
current-schema.md updated (aligned post-Migration 019)
```

---

### Gap Analysis Validation

- [x] Compare current schema against logical model
- [x] Identify reusable entities
- [x] Identify missing entities
- [x] Identify migration candidates
- [x] Identify deprecated structures (resolved via 017–019)

Deliverable:

```txt
gap-analysis.md updated (aligned post-Migration 019)
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
Canonical: fan_organizations (sole authoritative)
fans.organization_id          — PHYSICALLY REMOVED (Migration 018b COMPLETE)
fans_organization_id_fkey     — PHYSICALLY REMOVED
idx_fans_org                  — PHYSICALLY REMOVED
```

Target model:

```txt
Achieved — fan_organizations only
```

---

### New Entities

- [x] Create fan_organizations

---

### Database / Foundation readiness

- [x] PRIMARY / FOLLOWING model in `fan_organizations` (Migration 001)
- [x] Partial unique PRIMARY invariant (`fan_organizations_primary_idx`)
- [x] Legacy `fans.organization_id` retired (017 → 018a → F2 → 018b COMPLETE)

### Feature implementation (not Foundation DB blockers)

- [ ] Support primary organization UX / product flows beyond current runtime
- [ ] Support followed organizations UX / product flows
- [ ] Support organization affinity
- [ ] Support organization relationship metadata

---

### Migration

- [x] Migrate existing fans into `fan_organizations` (Migration 001 backfill)
- [x] Preserve organization ownership during cutover
- [x] Validate data consistency (through Migration 018b)

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
- [x] Execute Migration 003 in Neon (validated: 0 rows, no seed)

Supported:

```txt
INTEGRATED

MANAGED
```

---

## Competition Memberships

- [x] Create competition_organizations
- [x] Execute Migration 004 in Neon (validated: FKs, indexes, unique constraint)
- [x] Foundation minimum memberships (Migration 019a — validated: 3 rows)
- [ ] Create competition metadata structure (future / feature — not a Foundation blocker)

### Application readiness note

```txt
Neon: sports / competitions / competition_organizations exist + canonical seed live
Drizzle: catalog tables mapped (F08 COMPLETE — Block B)
Competition application features: NOT IMPLEMENTED (feature readiness only)
This is NOT a Foundation DB blocker.
```

---

## Organization Evolution

- [x] Migrate existing organization sport references (Migration 019a — canonical competitions + memberships)
- [x] Deprecate `organizations.sport` via COMMENT (Migration 019a)
- [x] Application / Drizzle cutover — remove `organizations.sport` mapping/types
- [x] Replace / physically remove `organizations.sport` (Migration 019b — COMPLETE)

Organization Sport Refactor = **COMPLETE** (Migration 019).

---

# Phase 3 — Fan Interests

---

## Fan Sports

- [x] Create fan_sports

---

## Fan Competitions

- [x] Create fan_competitions

---

## Execution

- [x] Execute Migration 005 in Neon

---

## Future Readiness

- [ ] Support multi-sport fans
- [ ] Support competition following
- [ ] Support recommendation engine inputs

---

# Phase 4 — Fan Profile Foundation

Defined by:

```txt
ADR-001

ADR-002
```

Migration:

```txt
006 — Fan Profile Foundation
```

---

## Fan Profile Model

- [x] Align `fans` with physical-model-v1.md profile fields
- [x] Add `avatar_url`
- [x] Add `country_code` and migrate from legacy `country`
- [x] Normalized email uniqueness (`fans_email_normalized_unique_idx` — active in Neon)
- [x] Document `organization_id` as deprecated (no removal in this migration)
- [x] Document `country` as deprecated (no removal in this migration)

---

## Execution

- [x] Migration 006 SQL file created (`006_fan_profile_foundation.sql`)
- [x] Execute Migration 006 in Neon
- [x] Validate schema and backfill per design brief

---

## Documentation

- [x] Update current-schema.md fan column inventory
- [x] Update gap-analysis.md fan profile gaps

---

# Phase 5 — Loyalty Expansion

Migration references:

```txt
007 — Benefits

008 — Rewards

009 — Redemptions
```

---

## Benefits

- [x] Create benefits table (`007_create_benefits.sql`)
- [ ] Create benefit eligibility model
- [ ] Create benefit usage tracking

---

## Execution

- [x] Migration 007 SQL file created (`007_create_benefits.sql`)
- [x] Execute Migration 007 in Neon
- [x] Validate schema per design brief

---

## Documentation

- [x] Update current-schema.md benefits inventory
- [x] Update gap-analysis.md benefits status
- [x] Update PROJECT_STATE.md

---

## Rewards

- [x] Create rewards table (`008_create_rewards.sql`)
- [ ] Create reward inventory structure
- [ ] Create reward metadata model

---

## Execution (Migration 008)

- [x] Migration 008 SQL file created (`008_create_rewards.sql`)
- [x] Execute Migration 008 in Neon
- [x] Validate schema per design brief

---

## Documentation (Migration 008)

- [x] Update current-schema.md rewards inventory
- [x] Update gap-analysis.md rewards status
- [x] Update PROJECT_STATE.md

---

## Redemptions

- [x] Create redemptions table (`009_create_redemptions.sql`)
- [ ] Create redemption status workflow
- [x] Redemption audit history intent absorbed by `audit_logs` (Migration 016)

---

## Execution (Migration 009)

- [x] Migration 009 SQL file created (`009_create_redemptions.sql`)
- [x] Execute Migration 009 in Neon
- [x] Validate schema per design brief

---

## Documentation (Migration 009)

- [x] Update current-schema.md redemptions inventory
- [x] Update gap-analysis.md redemptions status
- [x] Update physical-model-v1.md redemptions domain
- [x] Update PROJECT_STATE.md

---

# Phase 6 — Sponsor Ecosystem

---

## Sponsors

- [x] Create sponsors table (`010_create_sponsors.sql`)

---

## Organization Sponsors

- [x] Create sponsor_organizations

---

## Competition Sponsors

- [ ] Create sponsor_competitions (deferred — 010b)

---

## Sponsor Metadata

- [ ] Define sponsor categories
- [x] Define sponsor status model (`draft`, `active`, `paused`, `archived`)

---

## Execution (Migration 010)

- [x] Migration 010 SQL file created (`010_create_sponsors.sql`)
- [x] Execute Migration 010 in Neon
- [x] Validate schema per design brief

---

## Documentation (Migration 010)

- [x] Update current-schema.md sponsors inventory
- [x] Update gap-analysis.md sponsors status
- [x] Update physical-model-v1.md sponsors domain
- [x] Update foundation-db-backlog.md
- [x] Update PROJECT_STATE.md

---

# Phase 7 — Content Platform

---

## Content

- [x] Create content table (`011_create_content.sql`)

---

## Execution (Migration 011)

- [x] Migration 011 SQL file created (`011_create_content.sql`)
- [x] Execute Migration 011 in Neon
- [x] Validate schema per design brief

---

## Documentation (Migration 011)

- [x] Update current-schema.md content inventory
- [x] Update gap-analysis.md content status
- [x] Update physical-model-v1.md content domain
- [x] Update foundation-db-backlog.md
- [x] Update PROJECT_STATE.md

---

# Phase 7b — Content Taxonomy Foundation (Deferred)

---

## Content Categories

- [ ] Create content_categories

---

## Content Tags

- [ ] Create content_tags

---

## Content Category Assignments

- [ ] Create content_category_assignments

---

## Content Tag Assignments

- [ ] Create content_tag_assignments

---

# Phase 8 — Match Center

Defined by:

```txt
ADR-005

Migration 012
```

Status:

```txt
Complete (Foundation DDL)
```

---

## Seasons

- [x] Create seasons table

---

## Divisions

- [ ] Create divisions table (deferred — Competition Structure future ADR)

---

## Matches

- [x] Create matches table

---

## Standings

- [x] Create standings table

---

## Competition Tracking

- [ ] Create competition statistics model
- [ ] Create fixture management model (application / later migrations)
- [ ] Competition Structure ADR (divisions vs stages vs groups vs brackets)

---

# Phase 9 — EEP Intelligence

Defined by:

```txt
ADR-003

ADR-007

ADR-008
```

Status:

```txt
Complete (Foundation DDL) — Migrations 013–014
```

---

## Audiences

- [x] Create audiences table (Migration 013)
- [x] Create fan_audiences (Migration 013)

---

## Segments

- [x] Create segments table (Migration 014)
- [x] Create fan_segments (Migration 014)

---

## Synchronization

- [ ] Define audience sync process
- [ ] Define segment sync process
- [ ] Define reconciliation process
- [x] EEP Segment identity contract (ADR-008 Accepted)

---

# Phase 10 — Integration Layer

Status:

```txt
Complete (Foundation DDL) — Migration 015 registry
```

---

## Integration Registry

- [x] Create integrations table (Migration 015)

---

## Integration Connections

- [ ] Create integration_connections

---

## Integration Credentials

- [ ] Define credential strategy

---

## Integration Jobs

Review existing structure:

- [x] Validate integration_jobs (unchanged in 015; logical assoc via org+provider)
- [ ] Extend if required (`integration_id` FK deferred)

---

# Phase 11 — Audit and Events

Status:

```txt
Complete (Foundation DDL) — Migration 016 audit_logs
```

---

## Fan Events

Review existing implementation:

- [ ] Validate fan_events
- [ ] Validate event taxonomy

---

## Audit Logs

- [x] Create audit_logs (Migration 016 — executed and validated)
- [x] Dual-scope org/platform ownership
- [x] Actor separated from Origin (UUID soft refs, no FKs)
- [x] Canonical BigFana entity identifiers
- [x] Business decisions only (independent from integration_jobs)
- [x] Append-only (no updated_at)

---

## Change Tracking

- [x] Define entity audit strategy (`audit_logs` polymorphic association)
- [x] Capture integration registry lifecycle history (owned by audit_logs)

---

# Phase 12 — Contract Phase

Status:

```txt
COMPLETE — ADR-009 fan ownership retirement finished
017 COMPLETE
018a COMPLETE
Application Phase F2 COMPLETE
018b COMPLETE (executed and validated in Neon)

Migration 019 (Remove Legacy Organization Sport) — COMPLETE:
019a COMPLETE (executed and validated in Neon)
Application / Drizzle cutover COMPLETE
019b COMPLETE (executed and validated in Neon)
```

---

## Migration 017 — Deprecate Legacy Fan Ownership

- [x] Architecture Review
- [x] ADR-009 Legacy Fan Ownership Deprecation Contract (Accepted — Frozen)
- [x] Design Brief approved
- [x] SQL generated (`017_deprecate_legacy_fan_ownership.sql`)
- [x] Neon execution and validation (11/11; divergent=0 informational)
- [x] Deprecate `fans.organization_id` via COMMENT ON COLUMN only
- [x] Confirm no DROP / RENAME / structural ALTER / data mutation
- [x] Confirm `idx_fans_org` and `fan_organizations` unchanged
- [x] Confirm application ownership reads cut over to `fan_organizations` (Phases A–E)
- [x] Confirm Application Phase F2 retires projection write + Drizzle mapping

---

## Migration 018a — Make Legacy Fan Ownership Omit-Safe

- [x] Staged Option B sequencing approved (018a → F2 → 018b; 019 unchanged)
- [x] Design Brief approved (`2026-07-18-migration-018a-make-legacy-fan-ownership-omit-safe-design.md`)
- [x] SQL generated (`018a_make_legacy_fan_ownership_omit_safe.sql`)
- [x] Human SQL review approved
- [x] Neon execution and validation (ALL CHECKS PASS)
- [x] `fans.organization_id` still physically present (at 018a completion)
- [x] Type remains UUID; now NULLABLE; no default
- [x] `fans_organization_id_fkey` unchanged (at 018a completion)
- [x] `idx_fans_org` unchanged (at 018a completion)
- [x] Migration 017 DEPRECATED comment retained
- [x] `fan_organizations` structurally unchanged
- [x] No production data mutation (`total_fans` unchanged; divergent=0)
- [x] Old-style and omit-style INSERTs validated; validation rows cleaned up
- [x] DDL re-execution idempotent

---

## Application Phase F2 — COMPLETE (2026-07-18)

- [x] Stop `createOrganizationFan` compatibility projection write
- [x] Remove Drizzle `fans.organizationId` mapping
- [x] Simplify `Fan` / `FanView` types if appropriate (`FanView ≡ Fan`; `toFanView` identity)
- [x] Keep `fan_organizations` PRIMARY creation mandatory
- [x] Keep R04 global email behavior unchanged
- [x] No ownership/tenancy behavior regressions (R03/R04/R05 unchanged)

---

## Migration 018b readiness / gate assessment — COMPLETE (PASS)

- [x] Zero reads of `fans.organization_id` (application services)
- [x] Zero writes of `fans.organization_id` (including projection writers)
- [x] Zero Drizzle / schema mappings of `fans.organizationId`
- [x] Zero reads/writes in reports, exports, scripts, operational tooling
- [x] Consistency verification complete
- [x] Human approval recorded for irreversible contract DDL

---

## Migration 018b — Physical Remove Legacy Fan Ownership — COMPLETE

- [x] Design Brief approved (`2026-07-18-migration-018b-remove-legacy-fan-ownership-design.md`)
- [x] SQL generated (`018b_remove_legacy_fan_ownership.sql`)
- [x] Final pre-Neon SQL review PASS
- [x] Explicit human DROP approval recorded
- [x] Neon execution and validation (ALL CHECKS PASS)
- [x] Removed `idx_fans_org`
- [x] Removed `fans_organization_id_fkey`
- [x] Removed `fans.organization_id`
- [x] `fan_organizations` unchanged; PRIMARY intact; fan count unchanged
- [x] `organizations.sport` untouched
- [x] Application validation: tsc / build / Phase B tests PASS
- [x] Idempotent re-execution PASS
- [x] Completion documentation updated

---

## Migration 019a — Canonical Competition Data + Deprecation — COMPLETE

- [x] Canonical Competition Data Package approved
- [x] Design Brief approved (`2026-07-19-migration-019a-canonical-competition-data-design.md`)
- [x] SQL generated (`019a_canonical_competition_data.sql`)
- [x] Neon execution and validation (ALL CHECKS PASS)
- [x] Competitions: `liga-profesional-argentina`, `liga-mx` (soccer / INTEGRATED)
- [x] Memberships: river-plate / boca-juniors → AR; toluca → MX
- [x] `organizations.sport` COMMENT DEPRECATED (column still present)
- [x] Idempotent re-execution PASS
- [x] Completion documentation updated

---

## Migration 019b — Physical Remove Legacy Organization Sport — COMPLETE

- [x] Application / Drizzle cutover — remove `organizations.sport` (COMPLETE)
- [x] Gate assessment — zero consumers + derivation intact (PASS)
- [x] Migration 019b Design Brief approved
- [x] SQL generated (`019b_remove_legacy_organization_sport.sql`)
- [x] Final Pre-Neon SQL Review PASS
- [x] Explicit human irreversible DROP approval recorded
- [x] Neon execution and validation (ALL CHECKS PASS)
- [x] Idempotent re-execution PASS
- [x] Application validation: tsc / build / Phase B tests / scoped eslint PASS
- [x] `organizations.sport` physically REMOVED
- [x] `organizations.sport_id` ABSENT
- [x] Canonical competitions + memberships unchanged
- [x] Completion documentation updated

## Later contract migrations (plan)

- [x] Migration 019 — Remove Legacy Organization Sport (COMPLETE)
- [ ] Migration 020 — NOT STARTED / NO FROZEN / RESERVED SCOPE

Do **not** invent Migration 020 scope from residual technical debt.
Open a new migration only when a specific DDL item is explicitly prioritized and approved.

---

# Technical Review Tasks

Post-019 Naming / FK / Index Consistency Audit: **COMPLETE**.

Verdict:

```txt
B. FOUNDATION DB READY WITH NON-BLOCKING TECHNICAL DEBT
NO MIGRATION 020 REQUIRED FROM THIS AUDIT
```

---

## Naming Consistency

- [x] Validate table naming conventions (audit: KEEP AS-IS for cosmetic era mix)
- [x] Validate foreign key naming conventions (audit: KEEP AS-IS `*_fk` vs `*_fkey`)
- [x] Validate index naming conventions (audit: KEEP AS-IS `idx_*` vs `{table}_*_idx`)

---

## Multi-Tenant Review

- [x] Validate organization ownership (`fan_organizations` SoT; ADR-009 COMPLETE)
- [x] Validate tenant boundaries (org-scoped business data + global fan identity)
- [x] Validate global fan model Foundation readiness (COMPLETE; feature UX may continue)

---

## Performance Review

- [x] Review indexes (audit complete — F09/F10 remain as optional debt)
- [ ] Review high-volume tables under production load (operational — future)
- [ ] Review event storage strategy under production load (operational — future)

---

## Remaining non-blocking technical debt (do not auto-scope as Migration 020)

```txt
F05  COMPLETE — Drizzle TEXT model aligned
F06  COMPLETE — MembershipRole aligned to Neon CHECK
F07  COMPLETE — avatar_url / country_code mapped
Block D COMPLETE — fans country_code application cutover (physical DROP country deferred)
F08  COMPLETE — catalog tables mapped in Drizzle (Block B; features NOT implemented)
F09  COMPLETE — Drizzle index declarations aligned to Neon (no DDL)
NEW-F15 COMPLETE — timestamp tz representation (fans / fan_events / integration_jobs)
NEW-F16 COMPLETE — display_name nullability aligned
NEW-F17 COMPLETE — auth / campaigns / gamification / EIL timestamptz verified ALIGNED (Block A)
F10–F14  redundant indexes / PRIMARY sync CHECK / naming / unused enum / etc.
Optional composites (performance) — only with workload evidence
```

Completed technical phase (no Neon DDL):

```txt
Drizzle ↔ Neon Representation Cleanup — COMPLETE
```

---

# Migration Governance

Before any migration:

- [ ] Update current-schema.md
- [ ] Update gap-analysis.md
- [ ] Update PROJECT_STATE.md if required
- [ ] Obtain migration approval

---

# Success Criteria

Distinguish three layers:

```txt
1. Database / Foundation readiness  — DDL + canonical invariants in Neon
2. Drizzle / application readiness  — schema mappings + runtime consumers
3. Feature implementation           — product UX / sync processes / workflows
```

## Database / Foundation readiness

Foundation Database v1 DDL is considered complete when:

- [x] Global Fan Model exists (`fan_organizations` SoT; legacy ownership removed)
- [x] Fan profile foundation exists
- [x] Sports hierarchy exists
- [x] Competition hierarchy exists (including Foundation minimum memberships)
- [x] Loyalty expansion exists
- [x] Sponsor foundation exists (sponsor_competitions and sponsor_ads reconciliation deferred)
- [x] Content foundation exists (taxonomy deferred to 011b)
- [x] Match center exists (Foundation DDL — Migrations 012)
- [x] EEP audiences and segments exist (Foundation DDL — Migrations 013–014)

without requiring architectural redesign.

## Explicitly still open (not Foundation blockers)

- [x] Drizzle ↔ Neon representation cleanup (F05 / F06 / F07 / F09 / NEW-F15 / NEW-F16)
- [x] Block A / NEW-F17 timestamp representation verification (mapped runtime timestamptz ALIGNED)
- [x] Drizzle mapping for sports / competitions / competition_organizations (F08 — Block B COMPLETE)
- [x] fans.country → country_code functional cutover (Block D — application COMPLETE; physical DROP deferred)
- [ ] EEP audience / segment sync process implementation
- [ ] Feature UX for FOLLOWING / fan interests / match center / etc.

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
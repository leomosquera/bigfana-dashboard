# Foundation DB v1 Checkpoint

Date:

2026-06-08

Status:

```txt
Checkpoint — post Migration 009 validation
```

---

## Purpose

Record the state of Foundation Database v1 after Migrations 001–009 have been executed and validated in Neon.

This document summarizes progress, remaining work, risks, and readiness for Migration 010 (Sponsors Foundation).

---

## Sources Reviewed

```txt
docs/04-database/current-schema.md
docs/04-database/physical-model-v1.md
docs/04-database/gap-analysis.md
PROJECT_STATE.md
docs/04-database/foundation-db-backlog.md
docs/04-database/migration-plan-v1.md
```

---

# 1. Foundation DB v1 Progress Summary

Foundation Database v1 is actively executing in Neon under the **Expand → Migrate → Contract** strategy.

```txt
Migrations 001–009   executed and validated
Documentation        aligned after each migration
Current phase        Sponsors Foundation
Current migration    010_sponsors
Phase 1 coverage     ~75% (per gap-analysis.md)
```

## What is complete

| Domain | Status |
|--------|--------|
| Global Fan Model (DDL) | `fan_organizations` — transition phase; application cutover pending |
| Fan Profile Foundation | Migration 006 — `fans` canonical profile aligned |
| Sports Hierarchy | Migration 002 — global catalog seeded (11 sports) |
| Competitions Hierarchy | Migrations 003–004 — catalog + org memberships (0 rows, no seed) |
| Fan Interests | Migration 005 — `fan_sports`, `fan_competitions` |
| Loyalty Foundation | Migrations 007–009 — benefits, rewards, redemptions (DDL complete) |
| Campaigns | Pre-existing — reusable, no redesign |
| Events & Integrations | Pre-existing — `fan_events`, `integration_jobs` foundation |
| Points & Levels | Pre-existing — `fan_points_ledger`, `fan_levels` |

## What is in progress

```txt
Migration 010 — Sponsors Foundation (not started)
```

## What remains for Foundation DB v1 completion

```txt
010 — Sponsors
011 — Content
012 — Competition Operations (Match Center)
013 — EEP Audiences
014 — EEP Segments
015 — Integration Registry
016 — Audit Layer
017–019 — Contract phase (legacy deprecation/removal)
```

## Documentation health

Per-migration documentation updates are current through Migration 009:

- `current-schema.md` — loyalty domain complete
- `physical-model-v1.md` — rewards and redemptions aligned with executed schema
- `gap-analysis.md` — loyalty marked complete; next step sponsors
- `foundation-db-backlog.md` — Phase 5 complete; Phase 6 pending
- `PROJECT_STATE.md` — focus on Migration 010

Phase 0 schema validation tasks in `foundation-db-backlog.md` remain partially open (full column/FK/enum inventory audit not formally closed).

---

# 2. Implemented Migrations (001–009)

| # | Migration | Table(s) / Change | Domain | Validated |
|---|-----------|-------------------|--------|-----------|
| 001 | `create_fan_organizations` | `fan_organizations` + backfill | Global Fan Model | Yes |
| 002 | `create_sports` | `sports` + seed (11 canonical sports) | Sports Catalog | Yes |
| 003 | `create_competitions` | `competitions` | Competitions | Yes |
| 004 | `create_competition_organizations` | `competition_organizations` | Competition Memberships | Yes |
| 005 | `create_fan_interests` | `fan_sports`, `fan_competitions` | Fan Interests | Yes |
| 006 | `fan_profile_foundation` | `fans` expand (`avatar_url`, `country_code`, backfill) | Fan Profile | Yes |
| 007 | `create_benefits` | `benefits` | Loyalty — Entitlements Catalog | Yes |
| 008 | `create_rewards` | `rewards` | Loyalty — Point-Priced Catalog | Yes |
| 009 | `create_redemptions` | `redemptions` | Loyalty — Claim Transactions | Yes |

## Loyalty triad (Migrations 007–009)

```txt
benefits      → entitlement catalog (no point cost)
rewards       → point-priced catalog (points_required, stock)
redemptions   → fan claim transaction (points_cost snapshot, workflow status)
```

All three use organization-scoped ownership, `ON DELETE RESTRICT` on parent FKs, lowercase status conventions, and expand-only DDL with no seed data.

---

# 3. Remaining Migrations (010+)

Per `migration-plan-v1.md`:

| # | Migration | Objective | Tables |
|---|-----------|-----------|--------|
| 010 | Sponsors | Sponsor ownership model | `sponsors`, `sponsor_organizations`, `sponsor_competitions` |
| 011 | Content | Organization content management | `content`, `content_categories`, `content_tags` |
| 012 | Competition Operations | Managed competitions (ADR-005) | `seasons`, `divisions`, `matches`, `standings` |
| 013 | EEP Audiences | EEP audience cache (ADR-003) | `audiences`, `fan_audiences` |
| 014 | EEP Segments | EEP segment cache (ADR-003) | `segments`, `fan_segments` |
| 015 | Integration Registry | Formalize integrations | `integrations` (+ review `integration_jobs`) |
| 016 | Audit Layer | Platform auditing | `audit_logs` |

## Contract phase (post Foundation v1)

| # | Migration | Objective |
|---|-----------|-----------|
| 017 | Deprecate legacy fan ownership | Document `fans.organization_id` deprecated |
| 018 | Remove legacy fan ownership | Drop `fans.organization_id` after app cutover |
| 019 | Remove legacy organization sport | Drop `organizations.sport` after catalog migration |

## Backlog items outside migration DDL

Still open in `foundation-db-backlog.md`:

```txt
Benefit eligibility and usage tracking
Reward inventory structure / metadata model
Redemption status workflow (application layer)
Redemption audit history
Fan organization application cutover
organizations.sport refactor
Phase 0 full schema audit
Technical review tasks (naming, multi-tenant, performance)
```

---

# 4. Remaining Architectural Gaps

Per `gap-analysis.md` — largest gaps after Migration 009:

## Critical / High

| Gap | Status | Notes |
|-----|--------|-------|
| Global Fan Model application cutover | Transition phase | `fan_organizations` exists; services still reference `fans.organization_id` |
| Organization sport refactor | Pending | `organizations.sport` free-text vs `sports`/`competitions` catalog |
| Sponsor Domain | Missing | Only `sponsor_ads` + `campaign_ads`; no `sponsors` global catalog |

## Medium

| Gap | Status | Notes |
|-----|--------|-------|
| EEP Audiences | Missing | No `audiences`, `fan_audiences` cache tables |
| EEP Segments | Missing | No `segments`, `fan_segments` cache tables |
| Content Platform | Missing | Migration 011 |
| Match Center | Missing | Migration 012 (ADR-005 managed competitions) |
| Integration Registry | Partial | `integration_jobs` exists; `integrations` table missing |
| Audit Layer | Missing | Migration 016 |

## Application-layer gaps (DDL complete, logic missing)

| Gap | Domain |
|-----|--------|
| Benefit eligibility and usage tracking | Loyalty |
| Redemption service (points debit, stock decrement, status transitions) | Loyalty |
| `reward_redeemed` fan events + EEP sync on redemption | Events / EEP |
| Org-scoped points balance model | Points |
| Drizzle schema alignment with Neon | Application |
| Dashboard module screens | UI |

## Known limitations (current-schema.md)

```txt
Matches / Standings
Benefit eligibility and usage tracking
Sponsors Domain (global catalog)
EEP Audiences
EEP Segments
```

---

# 5. Risks Introduced by Current Schema

## Structural / transitional risks

**1. Dual fan ownership model**

`fans.organization_id` is deprecated but still present and used by application code (e.g. `awardPoints()` scopes balance reads via deprecated column). `fan_organizations` is the target source of truth. Risk: incorrect tenant scoping for multi-org fans until application cutover completes.

**2. Org-scoped balance on global fan**

`fans.engagement_score` is a single column on a global fan entity. Points ledger is org-scoped (`fan_points_ledger.organization_id`). Risk: redemption and loyalty flows may debit or display wrong balance without org-scoped balance resolution.

**3. FK delete behavior inconsistency**

Foundation v1 migrations (004, 007–009) use `ON DELETE RESTRICT`. Legacy tables (`campaigns`, `fan_levels`, `fan_points_ledger.organization_id`) use `CASCADE`. Risk: inconsistent data preservation behavior across domains; harmonization deferred to contract phase.

**4. Legacy `organizations.sport`**

Free-text sport field coexists with normalized `sports` catalog. Risk: data divergence until Migration 019 contract phase.

## Loyalty-specific risks (post 009)

**5. DDL without application enforcement**

`redemptions` stores claim records but Migration 009 intentionally excludes:

- `ledger_entry_id` / `fan_event_id` traceability FKs
- points debit logic
- stock decrement logic
- DB enforcement of `redemptions.organization_id = rewards.organization_id`

Risk: manual or application inserts can create orphaned or inconsistent redemption records until redemption service is implemented.

**6. Non-atomic multi-table writes**

`neon-http` driver does not support interactive transactions. Redemption flow will require writes to `redemptions`, `fan_points_ledger`, `rewards.stock`, and `fan_events`. Risk: partial failure states without transactional wrapper (`neon-ws` migration needed).

**7. Empty loyalty catalogs**

All loyalty tables validated at 0 rows. Risk: low immediate production risk, but no real-world constraint validation yet.

## Sponsor-specific risks (pre-010)

**8. Incomplete sponsor model**

`sponsor_ads` references `organization_id` directly without a global `sponsors` entity. Risk: Migration 010 must reconcile existing ad data; potential breaking changes to `sponsor_ads` FK strategy.

## Operational risks

**9. Documentation drift**

`migration-plan-v1.md` still lists uppercase redemption statuses (`DELIVERED` vs executed `fulfilled`). Risk: future agents referencing stale migration plan without checking design briefs.

**10. Phase 0 audit incomplete**

Full schema inventory audit in backlog remains open. Risk: undocumented columns or constraints in pre-Foundation tables may surprise future migrations.

---

# 6. Recommended Priorities After 010

## Immediate (Migration 010)

```txt
1. Migration 010 design brief — sponsors, sponsor_organizations, sponsor_competitions
2. Review sponsor_ads / campaign_ads migration strategy
3. Execute and validate in Neon
4. Update documentation per AI_RULES.md workflow
```

## Foundation DB v1 continuation (migrations)

Recommended order per `gap-analysis.md` and `migration-plan-v1.md`:

```txt
010 — Sponsors          (current — unblocks sponsor benefits, activations)
011 — Content           (organization content platform)
012 — Match Center      (ADR-005 managed competitions)
013 — EEP Audiences     (ADR-003 intelligence cache)
014 — EEP Segments      (ADR-003 intelligence cache)
015 — Integration Registry
016 — Audit Layer
```

## Parallel application tracks (not blocked by 010)

These should progress alongside database migrations:

```txt
Fan organization cutover
    services read fan_organizations instead of fans.organization_id

Org-scoped points balance
    resolve engagement_score vs fan_points_ledger per organization

Redemption service
    points debit timing, stock decrement, status transitions, fan_events

Drizzle schema sync
    align application schema with Neon Foundation v1 tables

Dashboard Loyalty module
    Benefit Catalog, Reward Catalog, Redemption Queue UI
```

## Contract phase (after Foundation v1 + application adoption)

```txt
017 — Deprecate fans.organization_id
018 — Remove fans.organization_id
019 — Remove organizations.sport
Harmonize legacy CASCADE FKs to RESTRICT where appropriate
```

---

# 7. Readiness Assessment for Sponsor Foundation

## Verdict

```txt
READY for Migration 010 design brief and SQL planning
NOT READY for blind SQL execution — design brief required first
```

## Prerequisites met

| Prerequisite | Status |
|--------------|--------|
| Migrations 001–009 validated in Neon | Yes |
| `organizations` tenant root exists | Yes |
| `competitions` + `competition_organizations` for `sponsor_competitions` FK | Yes |
| `physical-model-v1.md` sponsor domain defined | Yes |
| `migration-plan-v1.md` Migration 010 scoped | Yes |
| Existing `sponsor_ads` + `campaign_ads` for migration review | Yes |
| Documentation synchronized through 009 | Yes |
| Loyalty Foundation complete — no blocking dependency | Yes |

## Prerequisites not yet met

| Item | Status | Action |
|------|--------|--------|
| Migration 010 design brief | Not created | Create `docs/sessions/YYYY-MM-DD-migration-010-sponsors-design.md` |
| `sponsor_ads` FK migration strategy | Undefined | Decide: add `sponsor_id` FK, backfill, or parallel coexistence |
| Sponsor status convention | Undefined in executed schema | Align with lowercase catalog convention (007–009 precedent) |
| Global vs org-scoped sponsor rules | Defined in physical model | Confirm `sponsors` global, `sponsor_organizations` junction |
| `sponsor_competitions` scope for v1 | In migration plan | Confirm in design brief |
| Application Drizzle schema for sponsors | Not started | Parallel track post-DDL |

## Key design questions for Migration 010

| # | Question |
|---|----------|
| 1 | Is `sponsors` a global entity (no `organization_id`) per physical model? |
| 2 | How does `sponsor_ads` relate to new `sponsors` table — ALTER or deferred? |
| 3 | `sponsor_competitions` included in 010 or deferred? |
| 4 | Status values for sponsors — reuse `draft/active/paused/archived`? |
| 5 | `ON DELETE RESTRICT` on all sponsor FKs — same Foundation v1 norm? |
| 6 | Seed data for sponsors — none (consistent with 007–009)? |

## Recommended next actions

```txt
1. Create Migration 010 sponsors design brief
2. Human approval of design brief
3. Generate 010_create_sponsors.sql (expand-only)
4. Execute and validate in Neon
5. Update current-schema.md, gap-analysis.md, physical-model-v1.md, PROJECT_STATE.md
6. Review sponsor_ads migration path as separate decision
```

---

# Checkpoint Summary

```txt
Foundation DB v1 is approximately 75% complete at the DDL level.

Migrations 001–009 are executed, validated, and documented.

Loyalty Foundation (benefits → rewards → redemptions) is complete at DDL.

The schema is expand-only, backward-compatible, and aligned with ADRs 001–006.

The primary risks are transitional (dual fan ownership, org-scoped balance)
and application-layer gaps (redemption service, EEP cache tables).

Migration 010 Sponsors Foundation is the documented next step and is
architecturally ready for design brief creation.
```

---

## Related Documents

- `docs/sessions/2026-06-08-migration-009-redemptions-design.md`
- `docs/sessions/2026-06-08-migration-008-rewards-design.md`
- `docs/sessions/2026-06-08-migration-007-benefits-design.md`
- `docs/04-database/migration-plan-v1.md`
- `PROJECT_STATE.md`

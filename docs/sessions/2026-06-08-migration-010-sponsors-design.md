# Migration 010 — Sponsors Design Brief

Date:

2026-06-08

Status:

```txt
Approved — ready for SQL generation
```

---

## Goal

Define the approved scope for Foundation Database v1 Migration 010.

Introduce the **global sponsor catalog** and **organization sponsorship relationships** as Sponsors Foundation, without competition sponsorship, `sponsor_ads` reconciliation, loyalty linkage, or application-layer changes.

Target file:

```txt
database/migrations/foundation-v1/010_create_sponsors.sql
```

---

## References

```txt
docs/sessions/2026-06-08-foundation-v1-checkpoint.md
docs/04-database/migration-plan-v1.md          → Migration 010
docs/04-database/physical-model-v1.md          → Sponsor Domain, Global Entities
docs/04-database/gap-analysis.md               → Sponsor Domain
docs/04-database/current-schema.md             → sponsor_ads baseline
docs/04-database/foundation-db-backlog.md      → Phase 6 — Sponsor Ecosystem
docs/04-database/database-decisions-review.md  → Decision 006 — Sponsors global
004_create_competition_organizations.sql       → junction table precedent
007_create_benefits.sql                        → status, FK, index precedent
002_create_sports.sql                          → global catalog slug precedent
```

Prior reviews (2026-06-08):

```txt
Migration 010 Sponsors Architecture Review (approved)
sponsor_competitions scope evaluation (approved — defer)
Migrations 001–009 completed and validated in Neon
```

---

## Approved Scope Decision

| In scope (Migration 010) | Deferred |
|--------------------------|----------|
| `sponsors` | `sponsor_competitions` → future **010b** or **Migration 012** |
| `sponsor_organizations` | ALTER `sponsor_ads` / `campaign_ads` |
| | `sponsor_id` on benefits, rewards, redemptions |
| | Sponsor categories, metadata, financial fields |
| | `starts_at` / `ends_at` on `sponsor_organizations` |

Rationale for deferring `sponsor_competitions`:

```txt
competitions = 0 rows
competition_organizations = 0 rows
gap-analysis.md critical gap = sponsors + sponsor_organizations only
Phase 5 product roadmap = org-centric sponsor platform
No migration 011–016 FK dependency on sponsor_competitions
```

Temporary workaround until 010b/012:

League-wide sponsors may be modeled as multiple `sponsor_organizations` rows (one per participating org). Document as interim pattern only.

---

# 1. Final Entity Definitions

## `sponsors`

Purpose: Global platform catalog of commercial partners (brands).

Entity class: Global entity — no `organization_id`.

Examples:

```txt
Nike
Adidas
Coca-Cola
Regional/local brands
```

Responsibilities (product level, future application):

```txt
Canonical brand identity (name, slug, logo, website)
Platform-wide sponsor lifecycle (status)
Anchor for org sponsorship relationships
Future: sponsor_ads.sponsor_id, loyalty linkage, analytics
```

Not responsible for:

```txt
Org-scoped ad creatives (sponsor_ads)
Campaign placement (campaign_ads)
Competition-level deals (deferred — sponsor_competitions)
Contract terms, investment, ROI (application/product layer)
Partnership date windows (deferred — starts_at/ends_at removed from scope)
```

---

## `sponsor_organizations`

Purpose: Junction table recording which organizations have a sponsorship relationship with a global sponsor.

Entity class: Relationship entity — links global sponsor to tenant organization.

Examples:

```txt
Coca-Cola ↔ Club América
Nike ↔ River Plate
Macro ↔ San Lorenzo
```

Responsibilities:

```txt
Declare org ↔ sponsor partnership
Support org-scoped sponsor management and future ad/sponsor_id validation
```

Not responsible for:

```txt
Sponsor identity (sponsors)
Ad creative content (sponsor_ads)
Sponsorship role/type ("title sponsor", "official partner") — deferred
Competition-level sponsorship — deferred (sponsor_competitions)
Partnership date windows — deferred (starts_at/ends_at excluded)
```

---

## Entity relationship (Migration 010)

```txt
sponsors (global)
    │
    └── 1:N ── sponsor_organizations ── N:1 ── organizations (tenant)

sponsor_ads (existing, unchanged)
    └── organization_id only; sponsor_name denormalized until future migration

sponsor_competitions (deferred)
    └── sponsor_id ↔ competition_id
```

---

# 2. Sponsor Ownership Model

| Layer | Table | Owner | Scope |
|-------|-------|-------|-------|
| Brand identity | `sponsors` | Platform (global catalog) | Cross-tenant |
| Org partnership | `sponsor_organizations` | Relationship record | Per org + sponsor pair |
| Ad creative | `sponsor_ads` | Organization | Unchanged in 010 |
| Campaign link | `campaign_ads` | Organization | Unchanged in 010 |

Rules:

```txt
sponsors has NO organization_id
All org context flows through sponsor_organizations
One canonical sponsor record per brand (slug is canonical identifier)
Duplicate sponsor names across brands permitted; slug must be unique
```

Alignment:

```txt
ADR-006 — Organization First, Global Community Ready
physical-model-v1.md → Global Entities
database-decisions-review.md → Decision 006
```

Sponsorship levels (conceptual — not separate DDL in 010):

| Level | Expression in 010 |
|-------|---------------------|
| Organization Sponsor | `sponsor_organizations` |
| Competition Sponsor | Deferred (`sponsor_competitions`) |
| Platform Sponsor | No junction — future product concern |

---

# 3. `sponsors` Table Shape

```txt
sponsors
├── id              UUID        PK, DEFAULT gen_random_uuid()
├── name            TEXT        NOT NULL
├── slug            TEXT        NOT NULL
├── website_url     TEXT        NULL
├── logo_url        TEXT        NULL
├── status          TEXT        NOT NULL, DEFAULT 'draft'
│                             CHECK IN ('draft', 'active', 'paused', 'archived')
├── created_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
```

### Column semantics

| Column | Rules |
|--------|-------|
| `name` | Display name; not globally unique |
| `slug` | Canonical global identifier (kebab-case); globally unique |
| `website_url` | Optional brand website |
| `logo_url` | Optional brand logo asset URL |
| `status` | Sponsor lifecycle on platform — see §5 |
| `created_at` / `updated_at` | Standard Foundation v1 timestamps |

### Slug uniqueness

```txt
sponsors_slug_unique
    UNIQUE INDEX ON (lower(slug))
```

Case-insensitive canonical slug enforcement. No table-level `UNIQUE (slug)` constraint.

No seed data in Migration 010.

---

# 4. `sponsor_organizations` Table Shape

```txt
sponsor_organizations
├── id              UUID        PK, DEFAULT gen_random_uuid()
├── sponsor_id      UUID        NOT NULL, FK → sponsors.id
├── organization_id UUID        NOT NULL, FK → organizations.id
├── created_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at      TIMESTAMP   NOT NULL, DEFAULT NOW()

UNIQUE (sponsor_id, organization_id)
    → sponsor_organizations_unique_membership
```

### Column semantics

| Column | Rules |
|--------|-------|
| `sponsor_id` | References global sponsor |
| `organization_id` | References tenant organization |
| `created_at` / `updated_at` | Standard Foundation v1 timestamps |

### Cardinality

```txt
One row per (sponsor_id, organization_id) pair
No duplicate junction rows for same pair
```

Precedent: `competition_organizations` (Migration 004) — junction with UNIQUE pair, RESTRICT FKs.

---

# 5. Status Strategy

## `sponsors.status`

Reuse loyalty catalog convention (Migrations 007–009):

| Value | Meaning |
|-------|---------|
| `draft` | Registered in admin; not yet published platform-wide |
| `active` | Published global sponsor; eligible for org partnerships and future ad linkage |
| `paused` | Temporarily disabled platform-wide |
| `archived` | Soft-retired; hidden from new partnerships; history preserved |

Default: `draft`

Notes:

```txt
active on sponsors means catalog visibility — not org partnership validity
No requirement in 010 that active sponsors have at least one sponsor_organizations row
Invalid values rejected by CHECK constraint
```

## `sponsor_organizations`

No `status` column in Migration 010.

Partnership state derived from parent `sponsors.status` (application layer).

---

# 6. FK Strategy

| FK | Target | ON DELETE |
|----|--------|-----------|
| `sponsor_organizations.sponsor_id` | `sponsors.id` | **RESTRICT** |
| `sponsor_organizations.organization_id` | `organizations.id` | **RESTRICT** |

No FKs on `sponsors` — root global catalog entity.

Tables not modified:

```txt
sponsor_ads.organization_id → organizations (legacy CASCADE — unchanged)
campaign_ads → campaigns, sponsor_ads (legacy CASCADE — unchanged)
```

Future FK (deferred):

```txt
sponsor_ads.sponsor_id → sponsors.id (RESTRICT recommended)
```

Tenant invariant (application layer, not DB CHECK in 010):

When `sponsor_ads.sponsor_id` is added later, ads should reference sponsors linked to the same organization via `sponsor_organizations`.

---

# 7. Index Strategy

## `sponsors`

```txt
sponsors_slug_unique
    UNIQUE INDEX ON (lower(slug))    — case-insensitive slug; no separate status index
```

No `sponsors_status_idx` — excluded per approved decision.

No index on `name` — slug is canonical; name search is application concern.

## `sponsor_organizations`

```txt
sponsor_organizations_sponsor_idx
    ON (sponsor_id)

sponsor_organizations_organization_idx
    ON (organization_id)

sponsor_organizations_unique_membership
    UNIQUE (sponsor_id, organization_id)
```

Precedent: `competition_organizations` indexes (Migration 004).

---

# 8. ON DELETE Policy Rationale

| FK | Policy | Rationale |
|----|--------|-----------|
| `sponsor_organizations.sponsor_id → sponsors` | RESTRICT | Preserve partnership history; retire sponsors via `status = archived` |
| `sponsor_organizations.organization_id → organizations` | RESTRICT | Organizations are long-lived tenant roots; soft delete preferred |
| Hard delete sponsor | Blocked while junction rows exist | Same as benefits/rewards org RESTRICT pattern |
| Hard delete organization | Blocked while junction rows exist | Consistent with Migration 004, 007–009 |

Foundation v1 norm:

```txt
Catalog and relationship entities use RESTRICT
Legacy campaign engine CASCADE on sponsor_ads deferred to contract phase
```

Soft deletion path:

```txt
sponsors.status = archived
organizations.is_active = false
```

---

# In Scope

Migration 010 is **expand-only** — creates two tables only.

```txt
CREATE TABLE sponsors
CREATE TABLE sponsor_organizations
```

### Tables affected

```txt
sponsors (CREATE)
sponsor_organizations (CREATE)
```

### Tables not affected

```txt
organizations
competitions
competition_organizations
sponsor_ads
campaign_ads
benefits, rewards, redemptions
fans, fan_organizations
campaigns
All other Foundation DB v1 tables
```

### Data impact

```txt
Expand-only
No seed data
No backfill
No ALTER on existing tables
EEP impact: none
```

---

# Out of Scope

```txt
sponsor_competitions (deferred — 010b or Migration 012)

starts_at / ends_at on sponsor_organizations

sponsors_status_idx

ALTER sponsor_ads
    add sponsor_id
    deprecate sponsor_name
    backfill from sponsor_name

ALTER campaign_ads

sponsor_id on benefits, rewards, redemptions

sponsor_categories table

sponsorship role/type/level columns

metadata JSONB on sponsors

financial fields

platform sponsor flag or junction

DB trigger for updated_at

application-layer Drizzle schema changes (parallel track)

EEP sync fields on sponsors

seed data for sponsors

unique constraint on sponsors.name
```

---

# 9. Validation Plan

## Pre-execution

- [ ] Human approval of this design brief recorded
- [ ] Branch is not `main`
- [ ] Migrations 001–009 confirmed executed and validated in Neon
- [ ] `organizations` table exists with at least one row for FK test inserts

---

## Post-execution — Schema validation

### `sponsors`

- [ ] Table `sponsors` exists
- [ ] Column `id` UUID PK with default
- [ ] Column `name` NOT NULL
- [ ] Column `slug` NOT NULL
- [ ] Index `sponsors_slug_unique` exists — UNIQUE on `lower(slug)`
- [ ] No table-level `UNIQUE (slug)` constraint on `sponsors`
- [ ] Columns `website_url`, `logo_url` nullable
- [ ] Column `status` NOT NULL, default `draft`
- [ ] Constraint rejects invalid status (e.g. `inactive`, `ACTIVE`)
- [ ] Columns `created_at`, `updated_at` NOT NULL with defaults
- [ ] No `sponsors_status_idx` (intentionally omitted)
- [ ] `SELECT COUNT(*) FROM sponsors` returns 0 (no seed)

### `sponsor_organizations`

- [ ] Table `sponsor_organizations` exists
- [ ] Columns `sponsor_id`, `organization_id` NOT NULL
- [ ] No `starts_at` or `ends_at` columns
- [ ] FK `sponsor_organizations.sponsor_id` → `sponsors.id` ON DELETE RESTRICT
- [ ] FK `sponsor_organizations.organization_id` → `organizations.id` ON DELETE RESTRICT
- [ ] Constraint `sponsor_organizations_unique_membership` on `(sponsor_id, organization_id)`
- [ ] Index `sponsor_organizations_sponsor_idx` exists
- [ ] Index `sponsor_organizations_organization_idx` exists
- [ ] `SELECT COUNT(*) FROM sponsor_organizations` returns 0 (no seed)

### General

- [ ] Migration is idempotent on re-run
- [ ] `sponsor_ads` and `campaign_ads` schema unchanged

---

## Post-execution — Data validation

### `sponsors`

- [ ] Valid insert with `name`, `slug` succeeds; `status = draft` by default
- [ ] Insert without `name` rejected (NOT NULL)
- [ ] Insert without `slug` rejected (NOT NULL)
- [ ] Duplicate `slug` rejected (exact match)
- [ ] Duplicate `slug` rejected case-insensitively (e.g. `coca-cola` vs `COCA-COLA`)
- [ ] Two sponsors with same `name`, different `slug` allowed
- [ ] Insert with each approved status value succeeds
- [ ] Insert with invalid status rejected (CHECK)

### `sponsor_organizations`

- [ ] Valid insert with `sponsor_id`, `organization_id` succeeds
- [ ] Duplicate `(sponsor_id, organization_id)` rejected (UNIQUE)
- [ ] Insert with invalid `sponsor_id` rejected (FK)
- [ ] Insert with invalid `organization_id` rejected (FK)
- [ ] `DELETE FROM sponsors WHERE id = …` blocked when junction rows exist (RESTRICT)
- [ ] `DELETE FROM organizations WHERE id = …` blocked when junction rows exist (RESTRICT)
- [ ] `updated_at` populated on insert (default NOW())

---

## Post-execution — Documentation updates

Per `AI_RULES.md` (after Neon validation):

```txt
docs/04-database/current-schema.md
docs/04-database/gap-analysis.md
docs/04-database/physical-model-v1.md
docs/04-database/foundation-db-backlog.md
docs/04-database/migration-plan-v1.md
PROJECT_STATE.md
```

---

## Post-execution — Session

- [ ] Update execution session document after Neon validation
- [ ] Suggest commit message for SQL file (human executes commit)

---

# 10. Rollback Plan

Rollback valid **only before any dependent migration or application code** references these tables.

Order matters — drop junction first:

```txt
DROP TABLE IF EXISTS sponsor_organizations;
DROP TABLE IF EXISTS sponsors;
```

### Rollback conditions

```txt
No dependent migrations executed that reference sponsors or sponsor_organizations
No application queries reference sponsors or sponsor_organizations
No production sponsor records that must be preserved
sponsor_ads reconciliation migration not yet applied
```

### Rollback does not

```txt
Modify organizations
Modify sponsor_ads or campaign_ads
Modify competitions or loyalty tables
Drop or alter any pre-Foundation tables
```

Re-running Migration 010 after rollback is safe (`CREATE TABLE IF NOT EXISTS`).

---

# 11. Remaining Open Questions

| # | Question | Owner | Blocking 010 SQL? |
|---|----------|-------|-------------------|
| 1 | When to add `sponsor_competitions` — 010b vs Migration 012 bundle? | Architecture | No |
| 2 | `sponsor_ads.sponsor_id` — separate migration number and backfill strategy? | Architecture + app | No |
| 3 | Partnership date windows — add `starts_at`/`ends_at` later if product requires? | Product | No |
| 4 | Dedicated Sponsor ADR for global vs org-scoped rules? | Architecture | No |
| 5 | Platform sponsor representation without junction table? | Product / ADR-006 | No |
| 6 | Sponsorship role/type on `sponsor_organizations` — when needed? | Product | No |
| 7 | Harmonize `sponsor_ads.organization_id` CASCADE → RESTRICT? | Contract phase | No |
| 8 | `sponsor_id` on benefits/rewards — product decision post-010? | Product | No |
| 9 | Admin-only vs org-self-service sponsor catalog creation? | Product / permissions | No |
| 10 | Slug collision policy for regional brands with same name? | Application | No — case-insensitive slug uniqueness enforced at DB via `lower(slug)` index |

---

# 12. Readiness Verdict

```txt
READY — SQL generation from this design brief

NOT READY — Neon execution without human approval of this brief

NOT BLOCKED — sponsor_competitions deferral does not affect 010 DDL
```

| Criterion | Status |
|-----------|--------|
| Architecture review complete | Yes |
| Scope decision approved | Yes |
| Entity definitions finalized | Yes |
| FK / index / status strategy defined | Yes |
| Validation and rollback plans defined | Yes |
| Prerequisites (001–009, organizations) | Met |
| Open questions documented | Yes — none block SQL generation |

---

# Migration Ownership

## SQL file

```txt
Owner:     Foundation DB v1 implementation agent
Reviewer:  Human developer
Executor:  Human developer (Neon)
Path:      database/migrations/foundation-v1/010_create_sponsors.sql
```

## Design brief

```txt
Owner:     Product / database architecture review
Status:    Approved — ready for SQL generation
Path:      docs/sessions/2026-06-08-migration-010-sponsors-design.md
```

## Approval gates

| Gate | Required before |
|------|-----------------|
| Design brief approval | SQL generation |
| SQL file review | Neon execution |
| Neon validation | Documentation updates |
| Documentation sync | Mark migration complete in PROJECT_STATE |

---

# Success Criteria

Migration 010 is complete when:

```txt
SQL file exists
SQL executed successfully in Neon
All validation checks pass
Documentation updated
Execution session document updated
Commit message suggested
```

Creating the SQL file alone does not mark the migration as completed.

---

# Next Steps

```txt
1. Human review and commit of 010_create_sponsors.sql
2. Execute against Neon
3. Run validation plan
4. Update current-schema.md, gap-analysis.md, physical-model-v1.md, PROJECT_STATE.md
5. Plan sponsor_ads.sponsor_id reconciliation brief (separate)
6. Plan sponsor_competitions for 010b or Migration 012
```

---

## Related Documents

- `docs/sessions/2026-06-08-foundation-v1-checkpoint.md`
- `docs/sessions/2026-06-08-migration-010-sponsors.md`
- `docs/sessions/2026-06-08-migration-009-redemptions-design.md`
- `docs/04-database/migration-plan-v1.md` → Migration 010

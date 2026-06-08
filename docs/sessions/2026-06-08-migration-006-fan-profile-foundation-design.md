# Migration 006 — Fan Profile Foundation Design Brief

Date:

2026-06-08

Status:

```txt
Approved — ready for SQL generation
```

---

## Goal

Define the approved scope for Foundation Database v1 Migration 006.

Evolve the existing `fans` table toward the Foundation v1 fan profile model without contract operations, without introducing `fan_profiles`, and without removing deprecated structures.

Target file (future):

```txt
database/migrations/foundation-v1/006_fan_profile_foundation.sql
```

---

## References

```txt
migration-plan-v1.md          → Migration 006

physical-model-v1.md          → fans domain

database-decisions-review.md  → Decision 001 (Global Fan Model)

ADR-001                       → Global Fan Model

ADR-002                       → Primary and Followed Organizations

docs/02-product/fan-journey.md → onboarding fields

src/db/schema/fans.ts         → current Neon/Drizzle baseline

003_create_competitions.sql   → country_code CHECK pattern precedent
```

Prior session:

```txt
docs/sessions/2026-06-08-fan-profile-foundation-review.md
```

---

# Final Design Decisions

## Fan Model

| Decision | Status |
|----------|--------|
| `fans` remains the canonical identity and declarative profile entity | Approved |
| No `fan_profiles` table | Approved |
| Organization relationships remain in `fan_organizations` (Migration 001) | Approved |
| `fans.organization_id` remains present and **DEPRECATED** | Approved |
| No DROP, RENAME, or contract operations in Migration 006 | Approved |

---

## Country Strategy

| Decision | Status |
|----------|--------|
| Add nullable `country_code` column to `fans` | Approved |
| `country_code` uses ISO 3166-1 alpha-2 (`^[A-Z]{2}$`), consistent with `competitions.country_code` | Approved |
| Backfill `country_code = 'AR'` where legacy `country` normalizes to Argentina | Approved |
| Legacy `country` column **retained** and marked deprecated | Approved |
| Do **not** drop `country` in Migration 006 | Approved |
| Unmapped or invalid legacy `country` values → `country_code` remains NULL | Approved |

### Backfill Rules

Apply backfill only where `country_code` IS NULL after column creation.

Normalize legacy `country` with `lower(trim(country))` before matching:

```txt
Match → country_code

argentina     → AR
Argentina     → AR
ARGENTINA     → AR
ar            → AR
AR            → AR
```

All other legacy `country` values:

```txt
country_code = NULL (no guess, no silent mapping)
```

Legacy `country` values are **not modified** during backfill.

---

## Email Strategy

| Decision | Status |
|----------|--------|
| Global platform-level email uniqueness among non-null emails | Approved |
| Case-insensitive normalization via `lower(trim(email))` | Approved |
| NULL emails remain allowed (multiple NULLs permitted) | Approved |
| Partial unique index — applies to all rows where `email IS NOT NULL` (includes archived) | Approved |

### Neon Baseline (Implemented)

Normalized email uniqueness is **already enforced in Neon**. This is not Migration 006 DDL work.

Index name:

```txt
fans_email_normalized_unique_idx
```

Validated definition:

```sql
CREATE UNIQUE INDEX fans_email_normalized_unique_idx
ON fans (lower(trim(email)))
WHERE email IS NOT NULL
```

Status:

```txt
Active in Neon — pre-Migration 006 baseline
```

Legacy indexes also present in Neon (unchanged by Migration 006):

```txt
idx_fans_email

idx_fans_org
```

### Pre-Migration Validation

Before executing Migration 006, confirm the baseline index exists and matches the approved definition.

Duplicate email audit is satisfied by index presence — re-verify only if data changed since index creation.

---

## Profile Columns

| Decision | Status |
|----------|--------|
| Add nullable `avatar_url TEXT` | Approved |
| Existing profile columns unchanged in DDL (`first_name`, `last_name`, `display_name`, `phone`, `birth_date`, `gender`, `city`) | Approved |
| Operational columns unchanged (`status`, EEP sync fields, `segment`, `tier`, `engagement_score`) | Approved |

---

## EEP Impact

```txt
None at DDL level
```

EEP sync may consume new profile fields (`country_code`, `avatar_url`) at the application layer after Drizzle and service updates.

No changes to `integration_jobs` or EEP sync lifecycle in this migration.

---

# Proposed Migration Scope

## In Scope

Migration 006 is **expand-only** against the existing `fans` table.

```txt
ADD COLUMN avatar_url TEXT

ADD COLUMN country_code TEXT

ADD CONSTRAINT fans_country_code_check
    country_code IS NULL OR country_code ~ '^[A-Z]{2}$'

BACKFILL country_code = 'AR'
    WHERE country_code IS NULL
    AND lower(trim(country)) IN ('argentina', 'ar')

Deprecation documentation (no DDL):
    fans.organization_id → DEPRECATED
    fans.country         → DEPRECATED
```

### Excluded from Migration 006 DDL

```txt
fans_email_normalized_unique_idx
    → already active in Neon (pre-006 baseline)
```

### Tables Affected

```txt
fans (ALTER only)
```

### Tables Not Affected

```txt
fan_organizations

fan_sports

fan_competitions

All other Foundation DB v1 tables
```

---

## Out of Scope

```txt
fan_profiles table

DROP COLUMN country

DROP COLUMN organization_id

RENAME country → country_code

ALTER organization_id nullability or FK behavior

benefits, rewards, redemptions (Migrations 007–009)

fan authentication / user_id linkage

relocation of segment, tier, engagement_score

EEP cache tables (audiences, segments)

email uniqueness index (already active in Neon)

application-layer Drizzle or query changes (parallel track)
```

---

## Deprecation Notes (Documentation Only)

The following remain deprecated but **unchanged in DDL**:

```txt
fans.organization_id   → use fan_organizations

fans.country           → use country_code
```

---

## Rollback Strategy

Rollback is valid **only before Migration 007** and only if no application code depends on new columns.

Migration 006 rollback covers **Migration 006-owned objects only**:

```txt
DROP CONSTRAINT fans_country_code_check

DROP COLUMN country_code

DROP COLUMN avatar_url
```

`fans_email_normalized_unique_idx` is **not owned by Migration 006** and must not be dropped as part of this rollback.

Rollback does not restore any data written to `country_code` after deployment if columns were already dropped — treat rollback as pre-adoption only.

---

## Application Follow-Up (Parallel Track)

Not part of Migration 006 SQL. Required after execution:

```txt
Update src/db/schema/fans.ts
    → add avatarUrl, countryCode
    → mark country as deprecated in comments

Update fan create/update services
    → write country_code
    → normalize email before insert

Update FanForm / display components
    → country selector or ISO input
    → localized country display from country_code

Update duplicate email handling
    → global lookup (not org-scoped) before fan creation

Plan cutover from fans.organization_id to fan_organizations
```

---

# Validation Plan

## Pre-Execution

- [ ] Index `fans_email_normalized_unique_idx` exists and matches approved definition
- [ ] Human approval of this design brief recorded
- [ ] Branch is not `main`
- [ ] Migrations 001–005 confirmed executed and validated in Neon

### Email Index Baseline (required)

Confirm in Neon:

```txt
fans_email_normalized_unique_idx
    UNIQUE
    ON lower(trim(email))
    WHERE email IS NOT NULL
```

If the index is missing or definition differs, resolve before executing Migration 006.

---

## Post-Execution — Schema Validation

- [ ] Column `avatar_url` exists on `fans` (nullable TEXT)
- [ ] Column `country_code` exists on `fans` (nullable TEXT)
- [ ] Constraint `fans_country_code_check` rejects invalid codes (e.g. `mx`, `ARG`)
- [ ] Constraint accepts valid codes (e.g. `AR`, `MX`) and NULL
- [ ] Index `fans_email_normalized_unique_idx` still active (pre-006 baseline, unchanged)
- [ ] Column `country` still exists (not dropped)
- [ ] Column `organization_id` still exists (not dropped)
- [ ] Migration is idempotent on re-run

---

## Post-Execution — Data Validation

- [ ] Backfill: rows with `country` matching Argentina variants have `country_code = 'AR'`
- [ ] Backfill: rows with unmapped `country` values have `country_code IS NULL`
- [ ] Legacy `country` values unchanged after backfill
- [ ] Inserting two fans with same email (different casing/whitespace) fails
- [ ] Inserting fans with `email IS NULL` succeeds (multiple rows allowed)
- [ ] Invalid `country_code` insert rejected by CHECK constraint

---

## Post-Execution — Documentation Updates

Per `AI_RULES.md` and `ai-development-workflow.md`:

```txt
docs/04-database/current-schema.md

docs/04-database/gap-analysis.md

docs/04-database/foundation-db-backlog.md

PROJECT_STATE.md
```

---

## Post-Execution — Session

- [ ] Create execution session document after Neon validation
- [ ] Suggest commit message for SQL file (human executes commit)

---

# Success Criteria

Migration 006 is complete when:

```txt
SQL file exists

SQL executed successfully in Neon

All validation checks pass

Documentation updated

Commit message suggested
```

---

# Next Steps

1. Generate `006_fan_profile_foundation.sql` from this brief
2. Human review and commit of SQL file
3. Execute against Neon
4. Run validation plan
5. Update documentation
6. Begin application-layer Drizzle and service updates

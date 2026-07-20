# Migration 011 — Content Design Brief

Date:

2026-06-08

Status:

```txt
Approved — ready for SQL generation
```

---

## 1. Objective

Define the approved scope for Foundation Database v1 Migration 011.

Introduce **Content Foundation** — the organization-owned `content` table as the first step of the Content Platform, without taxonomy tables, assignment pivots, media assets, scheduling, campaign/sponsor/match integration, or application-layer changes.

Target file:

```txt
database/migrations/foundation-v1/011_create_content.sql
```

Business outcome:

```txt
Organizations can store publishable content records natively in BigFana
Fan-facing content delivery remains application-layer (post-DDL)
```

---

## References

```txt
docs/04-database/migration-plan-v1.md          → Migration 011
docs/04-database/physical-model-v1.md        → Content Domain, Multi-Tenant Rules
docs/04-database/gap-analysis.md
docs/04-database/foundation-db-backlog.md    → Phase 7 — Content Platform
docs/04-database/database-decisions-review.md → Decision 002 — Organization ownership
docs/04-database/domain-model.md               → Content entity
docs/04-database/logical-model.md              → Content entities
007_create_benefits.sql                        → org-owned catalog precedent
010_create_sponsors.sql                        → lower(slug) unique index precedent
docs/sessions/2026-06-08-migration-010-sponsors-design.md
```

Prior reviews (2026-06-08):

```txt
Migration 011 Content Architecture Review (approved)
Content taxonomy scope evaluation (approved — defer taxonomy to 011b)
Migration 010 completed and validated in Neon
```

---

## 2. Scope

### Approved scope decision

| In scope (Migration 011) | Deferred |
|--------------------------|----------|
| `content` | `content_categories` |
| | `content_tags` |
| | `content_category_assignments` |
| | `content_tag_assignments` |

Rationale for deferring taxonomy (same Foundation principle as Migration 010):

```txt
Taxonomy without assignment relationships creates orphan catalogs
No operational value until pivots and/or category FK exist
Application content CRUD does not require taxonomy DDL
Taxonomy org scope and N:N vs 1:N decisions belong in 011b design brief
```

Interim product pattern until 011b:

```txt
Filter and organize content by content_type and status only
```

### In scope (DDL)

```txt
CREATE TABLE content (expand-only)
```

### Tables affected

```txt
content (CREATE)
```

### Tables not affected

```txt
organizations
campaigns
sponsors, sponsor_organizations
benefits, rewards, redemptions
competitions, matches (future)
fans, fan_events
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

### General conventions

```txt
BEGIN / COMMIT transaction wrapper
CREATE TABLE IF NOT EXISTS
CREATE INDEX IF NOT EXISTS
TIMESTAMP WITHOUT TIME ZONE
No DB triggers for updated_at
No seed data
No application logic in migration
```

---

## 3. Table specification

### Entity: `content`

**Purpose:** Organization-owned informational content delivered to fans.

**Entity class:** Organization-owned business data — requires `organization_id`.

**Examples:**

```txt
News article
Club announcement
Match update (type label only — no match FK in 011)
Video metadata record (body/url deferred to application)
```

**Ownership:**

```txt
Organization  1:N  Content
```

Per Decision 002 (`database-decisions-review.md`) and Multi-Tenant Rules (`physical-model-v1.md`).

---

### Columns

```txt
content
├── id              UUID        PK, DEFAULT gen_random_uuid()
├── organization_id UUID        NOT NULL, FK → organizations.id
├── title           TEXT        NOT NULL
├── slug            TEXT        NOT NULL
├── content_type    TEXT        NOT NULL
├── body            TEXT        NULL
├── status          TEXT        NOT NULL, DEFAULT 'draft'
├── published_at    TIMESTAMP   NULL
├── created_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
└── updated_at      TIMESTAMP   NOT NULL, DEFAULT NOW()
```

---

### Column semantics

| Column | Rules |
|--------|-------|
| `organization_id` | Tenant boundary; all queries must scope by organization |
| `title` | Display title; required |
| `slug` | URL-safe identifier; unique per organization (case-insensitive) |
| `content_type` | Closed set via CHECK — see §4 |
| `body` | Main text/HTML content; nullable (e.g. video may use title + type only in v1) |
| `status` | Publication lifecycle — see §4 |
| `published_at` | First publish timestamp; NULL while draft; set by application on publish |
| `created_at` / `updated_at` | Standard Foundation v1 timestamps; no DB trigger |

---

### `content_type` values

| Value | Meaning |
|-------|---------|
| `news` | News item |
| `article` | Long-form article |
| `announcement` | Official club/org announcement |
| `video` | Video content (metadata in 011; media library deferred) |
| `match_update` | Match-related update — semantic type only; no `match_id` FK until Migration 012 |

---

### `status` values (publication lifecycle)

| Value | Meaning |
|-------|---------|
| `draft` | Created in admin; not fan-visible |
| `published` | Live; fan-visible when application rules allow |
| `paused` | Temporarily hidden from fans |
| `archived` | Soft-retired; retained for history |

Default: `draft`

**Note:** Content uses **publication lifecycle** status (`published`), not catalog lifecycle (`active`) used by benefits/rewards/sponsors (007–010). Intentional domain distinction.

---

### `published_at` semantics

| Rule | Value |
|------|-------|
| Nullability | Nullable |
| While `draft` | Typically NULL |
| On publish | Application sets `published_at` (usually `NOW()`) |
| DB enforcement | No CHECK linking `status = published` to `published_at NOT NULL` in Migration 011 |
| After publish | Catalog may change; `published_at` is first-publish snapshot |

---

### Timestamps

| Decision | Status |
|----------|--------|
| `created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()` | Approved |
| `updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW()` | Approved |
| No DB trigger for `updated_at` — application layer on UPDATE | Approved |

Aligns with Migrations 007–010.

---

## 4. Constraints

### Foreign keys

```txt
content_organization_fk
    organization_id → organizations.id
    ON DELETE RESTRICT
```

### CHECK constraints

```txt
content_content_type_check
    content_type IN (
        'news',
        'article',
        'announcement',
        'video',
        'match_update'
    )

content_status_check
    status IN (
        'draft',
        'published',
        'paused',
        'archived'
    )
```

### Slug uniqueness

Do **not** use table-level `UNIQUE (slug)` or `UNIQUE (organization_id, slug)`.

Use unique index (Migration 010 strategy, org-scoped):

```txt
content_slug_unique
    UNIQUE INDEX ON (organization_id, lower(slug))
```

Case-insensitive slug uniqueness per organization. Same slug may exist across different organizations.

### Naming

| Decision | Status |
|----------|--------|
| No unique constraint on `title` per organization | Approved |
| Duplicate titles within an org permitted at DB level | Approved |

---

## 5. Index strategy

```txt
content_organization_idx
    ON (organization_id)

content_organization_status_idx
    ON (organization_id, status)

content_slug_unique
    UNIQUE ON (organization_id, lower(slug))

content_organization_content_type_idx
    ON (organization_id, content_type)
```

### Rationale

| Index | Purpose |
|-------|---------|
| `content_organization_idx` | Tenant-scoped listing |
| `content_organization_status_idx` | Admin filters (draft / published / etc.) |
| `content_slug_unique` | Canonical org-scoped slug; case-insensitive |
| `content_organization_content_type_idx` | Filter by type until taxonomy (011b) exists |

Precedent: `benefits_organization_id_idx`, `sponsors_slug_unique` (010), `rewards_organization_status_idx`.

---

## FK strategy

## `content.organization_id → organizations.id`

```txt
ON DELETE RESTRICT
```

### Rationale

| Factor | Decision |
|--------|----------|
| Organizations are long-lived tenant roots | Hard delete must not silently cascade content loss |
| Soft deletion preferred | `organizations.is_active` and `content.status = archived` |
| Entity class | Organization-owned business data — same class as `benefits`, `rewards` |
| Foundation v1 precedent | Migrations 004, 007–010 use RESTRICT on `organization_id` |

### Legacy note

Pre-Foundation tables (`campaigns`, `sponsor_ads`) use `ON DELETE CASCADE` on `organization_id`. Migration 011 follows the Foundation v1 RESTRICT norm.

---

## 6. Deferred items

Explicitly **out of Migration 011**:

```txt
content_categories
content_tags
content_category_assignments
content_tag_assignments

scheduled_at, expires_at
metadata JSONB
media library / asset tables
thumbnail_url, image_url, video_url columns

campaign_id FK
sponsor_id FK
match_id FK
category_id FK

audience targeting / segment_rules
scheduling workflow
fan_events content_view integration
EEP sync fields

DB trigger for updated_at
DB enforcement of published_at when status = published
seed data

application-layer Drizzle schema changes (parallel track)
```

### Future migrations

```txt
011b — Content Taxonomy Foundation
       categories, tags, assignment pivots, org-scoped taxonomy

012  — Match Center (match_id FK on content optional future decision)
```

---

## 7. Validation checklist

### Pre-execution

- [ ] Human approval of this design brief recorded
- [ ] Branch is not `main`
- [ ] Migrations 001–010 confirmed executed and validated in Neon
- [ ] `organizations` table exists with at least one row for FK test inserts

---

### Post-execution — Schema validation

- [ ] Table `content` exists
- [ ] Column `id` UUID PK with default
- [ ] Column `organization_id` NOT NULL
- [ ] Column `title` NOT NULL
- [ ] Column `slug` NOT NULL
- [ ] Column `content_type` NOT NULL
- [ ] Column `body` nullable
- [ ] Column `status` NOT NULL, default `draft`
- [ ] Column `published_at` nullable
- [ ] Columns `created_at`, `updated_at` NOT NULL with defaults
- [ ] Constraint `content_content_type_check` rejects invalid types
- [ ] Constraint `content_status_check` rejects invalid statuses (e.g. `active`, `PUBLISHED`)
- [ ] FK `content_organization_fk` references `organizations.id`
- [ ] FK uses ON DELETE RESTRICT
- [ ] Index `content_organization_idx` exists
- [ ] Index `content_organization_status_idx` exists
- [ ] Index `content_slug_unique` exists — UNIQUE on `(organization_id, lower(slug))`
- [ ] Index `content_organization_content_type_idx` exists
- [ ] No table-level `UNIQUE (slug)` constraint
- [ ] No taxonomy tables created
- [ ] No triggers or procedures created
- [ ] `SELECT COUNT(*) FROM content` returns 0 (no seed)
- [ ] Migration is idempotent on re-run

---

### Post-execution — Data validation

- [ ] Valid insert with `organization_id`, `title`, `slug`, `content_type = 'news'` succeeds
- [ ] Default `status = 'draft'` on insert without explicit status
- [ ] Insert with `body = NULL` succeeds
- [ ] Insert with each approved `content_type` value succeeds
- [ ] Insert with each approved `status` value succeeds
- [ ] Insert without `title` rejected (NOT NULL)
- [ ] Insert without `slug` rejected (NOT NULL)
- [ ] Insert without `content_type` rejected (NOT NULL)
- [ ] Insert with invalid `content_type` rejected (CHECK)
- [ ] Insert with invalid `status` rejected (CHECK)
- [ ] Insert with invalid `organization_id` rejected (FK)
- [ ] Duplicate `(organization_id, slug)` rejected (exact match)
- [ ] Duplicate `(organization_id, slug)` rejected case-insensitively (e.g. `my-post` vs `MY-POST`)
- [ ] Same `slug` allowed for different organizations
- [ ] Duplicate `title` within same organization allowed
- [ ] `DELETE FROM organizations WHERE id = …` blocked when content rows exist (RESTRICT)
- [ ] `updated_at` populated on insert (default NOW())

---

### Post-execution — Documentation updates

Per `AI_RULES.md` (after Neon validation):

```txt
docs/04-database/current-schema.md
docs/04-database/gap-analysis.md
docs/04-database/physical-model-v1.md
docs/04-database/foundation-db-backlog.md
docs/04-database/migration-plan-v1.md  → note taxonomy deferred to 011b
PROJECT_STATE.md
```

---

### Post-execution — Session

- [ ] Create execution session document after Neon validation
- [ ] Suggest commit message for SQL file (human executes commit)

---

## 8. Rollback strategy

Rollback valid **only before any dependent migration or application code** references `content`.

```txt
DROP TABLE IF EXISTS content;
```

### Rollback conditions

```txt
No dependent migrations executed that reference content
No application queries reference content
No production content records that must be preserved
Content taxonomy migration (011b) not yet applied
```

### Rollback does not

```txt
Modify organizations
Modify campaigns, sponsors, or loyalty tables
Drop or alter any pre-Foundation tables
```

Re-running Migration 011 after rollback is safe (`CREATE TABLE IF NOT EXISTS`).

---

## 9. Readiness verdict

```txt
READY — SQL generation from this design brief

NOT READY — Neon execution without human approval of this brief

NOT BLOCKED — taxonomy deferral does not affect 011 DDL
```

| Criterion | Status |
|-----------|--------|
| Architecture review approved | Yes |
| Scope decision approved (content only) | Yes |
| Table specification finalized | Yes |
| Constraints and index strategy defined | Yes |
| Validation and rollback plans defined | Yes |
| Prerequisites (001–010, organizations) | Met |
| Taxonomy explicitly deferred to 011b | Yes |

---

## Migration ownership

### SQL file

```txt
Owner:     Foundation DB v1 implementation agent
Reviewer:  Human developer
Executor:  Human developer (Neon)
Path:      database/migrations/foundation-v1/011_create_content.sql
```

### Design brief

```txt
Owner:     Product / database architecture review
Status:    Approved — ready for SQL generation
Path:      docs/sessions/2026-06-08-migration-011-content-design.md
```

### Approval gates

| Gate | Required before |
|------|-----------------|
| Design brief approval | SQL generation |
| SQL file review | Neon execution |
| Neon validation | Documentation updates |
| Documentation sync | Mark migration complete in PROJECT_STATE |

---

## Success criteria

Migration 011 is complete when:

```txt
SQL file exists
SQL executed successfully in Neon
All validation checks pass
Documentation updated
Execution session document created
Commit message suggested
```

Creating the SQL file alone does not mark the migration as completed.

---

## Next steps

```txt
1. Generate 011_create_content.sql from this brief
2. Human review and commit of SQL file
3. Execute against Neon
4. Run validation checklist
5. Update documentation per AI_RULES.md
6. Begin Content Taxonomy Foundation (011b) architecture review when product requires categorization
```

---

## Related documents

- `docs/sessions/2026-06-08-migration-010-sponsors-design.md`
- `docs/04-database/migration-plan-v1.md` → Migration 011
- `docs/04-database/foundation-db-backlog.md` → Phase 7

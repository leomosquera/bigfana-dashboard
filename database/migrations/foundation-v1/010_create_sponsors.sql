BEGIN;

-- =====================================================
-- sponsors, sponsor_organizations
-- Foundation DB v1 — Migration 010
-- migration-plan-v1.md → Migration 010
-- physical-model-v1.md → Sponsor Domain
-- docs/sessions/2026-06-08-migration-010-sponsors-design.md
-- =====================================================
--
-- Business reason:
--   Introduce the global sponsor catalog and organization
--   sponsorship relationships as Sponsors Foundation.
--   Sponsors are global entities; org context flows through
--   sponsor_organizations.
--
-- Scope:
--   sponsors and sponsor_organizations tables only.
--   No seed data, sponsor_competitions, starts_at/ends_at,
--   sponsor_ads reconciliation, or loyalty linkage.
--
-- Tables affected:
--   sponsors (CREATE)
--   sponsor_organizations (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   sponsor_organizations.sponsor_id      → RESTRICT
--   sponsor_organizations.organization_id → RESTRICT
--
-- Rollback (only before dependent migrations / application adoption):
--   DROP TABLE IF EXISTS sponsor_organizations;
--   DROP TABLE IF EXISTS sponsors;
-- =====================================================

CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    website_url TEXT,
    logo_url TEXT,

    status TEXT NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT sponsors_status_check
        CHECK (
            status IN (
                'draft',
                'active',
                'paused',
                'archived'
            )
        )
);

CREATE TABLE IF NOT EXISTS sponsor_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sponsor_id UUID NOT NULL,
    organization_id UUID NOT NULL,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT sponsor_organizations_sponsor_fk
        FOREIGN KEY (sponsor_id)
        REFERENCES sponsors(id)
        ON DELETE RESTRICT,

    CONSTRAINT sponsor_organizations_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT sponsor_organizations_unique_membership
        UNIQUE (sponsor_id, organization_id)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS sponsors_slug_unique
ON sponsors (lower(slug));

CREATE INDEX IF NOT EXISTS sponsor_organizations_sponsor_idx
ON sponsor_organizations(sponsor_id);

CREATE INDEX IF NOT EXISTS sponsor_organizations_organization_idx
ON sponsor_organizations(organization_id);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Schema
--   \d sponsors
--   \d sponsor_organizations
--   SELECT COUNT(*) FROM sponsors;                    -- expect 0 (no seed)
--   SELECT COUNT(*) FROM sponsor_organizations;       -- expect 0 (no seed)
--
-- sponsors — valid insert:
--   INSERT INTO sponsors (name, slug)
--   VALUES ('Coca-Cola', 'coca-cola');
--   -- expect status = 'draft', created_at and updated_at populated
--
-- sponsors — status check (each should succeed):
--   INSERT INTO sponsors (name, slug, status)
--   VALUES ('Nike', 'nike', 'active');
--   INSERT INTO sponsors (name, slug, status)
--   VALUES ('Adidas', 'adidas', 'paused');
--   INSERT INTO sponsors (name, slug, status)
--   VALUES ('Macro', 'macro', 'archived');
--
-- sponsors — reject: missing name
--   INSERT INTO sponsors (slug) VALUES ('no-name');
--
-- sponsors — reject: missing slug
--   INSERT INTO sponsors (name) VALUES ('No Slug');
--
-- sponsors — reject: duplicate slug (exact match)
--   INSERT INTO sponsors (name, slug) VALUES ('Coca Cola', 'coca-cola');
--
-- sponsors — reject: duplicate slug (case-insensitive via lower(slug) index)
--   INSERT INTO sponsors (name, slug) VALUES ('Coca Cola Alt', 'COCA-COLA');
--
-- sponsors — reject: invalid status
--   INSERT INTO sponsors (name, slug, status)
--   VALUES ('Bad Status', 'bad-status', 'inactive');
--
-- sponsor_organizations — valid insert (replace :sponsor_id, :org_id):
--   INSERT INTO sponsor_organizations (sponsor_id, organization_id)
--   VALUES (:sponsor_id, :org_id);
--
-- sponsor_organizations — reject: duplicate (sponsor_id, organization_id)
--   INSERT INTO sponsor_organizations (sponsor_id, organization_id)
--   VALUES (:sponsor_id, :org_id);
--
-- sponsor_organizations — reject: invalid sponsor_id
--   INSERT INTO sponsor_organizations (sponsor_id, organization_id)
--   VALUES ('00000000-0000-0000-0000-000000000000', :org_id);
--
-- sponsor_organizations — reject: invalid organization_id
--   INSERT INTO sponsor_organizations (sponsor_id, organization_id)
--   VALUES (:sponsor_id, '00000000-0000-0000-0000-000000000000');
--
-- sponsor_organizations — reject: DELETE sponsor with existing rows (RESTRICT)
--   DELETE FROM sponsors WHERE id = :sponsor_id;
--
-- sponsor_organizations — reject: DELETE organization with existing rows (RESTRICT)
--   DELETE FROM organizations WHERE id = :org_id;
--
-- Indexes (verify existence):
--   SELECT indexname FROM pg_indexes WHERE tablename = 'sponsors';
--   -- expect:
--   --   sponsors_slug_unique (UNIQUE on lower(slug))
--
--   SELECT indexname FROM pg_indexes WHERE tablename = 'sponsor_organizations';
--   -- expect:
--   --   sponsor_organizations_sponsor_idx
--   --   sponsor_organizations_organization_idx
--   --   sponsor_organizations_unique_membership (unique constraint index)
--
-- Confirm no sponsors_status_idx (intentionally omitted)
-- Confirm sponsor_ads and campaign_ads unchanged
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged
--
-- Cleanup test rows (optional):
--   DELETE FROM sponsor_organizations WHERE organization_id = :org_id;
--   DELETE FROM sponsors WHERE slug IN ('coca-cola', 'nike', 'adidas', 'macro', 'bad-status');

COMMIT;

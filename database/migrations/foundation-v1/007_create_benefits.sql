BEGIN;

-- =====================================================
-- benefits
-- Foundation DB v1 — Migration 007
-- migration-plan-v1.md → Migration 007
-- physical-model-v1.md → benefits domain
-- docs/sessions/2026-06-08-migration-007-benefits-design.md
-- =====================================================
--
-- Business reason:
--   Introduce the organization-owned benefits catalog as the
--   first step of Loyalty Foundation. Benefits are entitlements
--   (discounts, priority access, exclusive content) — not
--   point-priced redeemables (rewards belong to Migration 008).
--
-- Scope:
--   benefits table only.
--   No seed data, metadata, sponsor_id, campaign_id,
--   eligibility rules, or usage tracking.
--
-- Tables affected: benefits (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   organization_id → RESTRICT (organizations are long-lived;
--     soft deletion preferred over hard delete with cascade)
--
-- Rollback (only before Migration 008):
--   DROP TABLE IF EXISTS benefits;
-- =====================================================

CREATE TABLE IF NOT EXISTS benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    status TEXT NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT benefits_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT benefits_status_check
        CHECK (
            status IN (
                'draft',
                'active',
                'paused',
                'archived'
            )
        )
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS benefits_organization_id_idx
ON benefits(organization_id);

CREATE INDEX IF NOT EXISTS benefits_organization_status_idx
ON benefits(organization_id, status);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Schema
--   \d benefits
--   SELECT COUNT(*) FROM benefits;                    -- expect 0 (no seed)
--
-- Valid insert (replace :org_id with a real organizations.id):
--   INSERT INTO benefits (organization_id, name)
--   VALUES (:org_id, 'Test Benefit');
--   -- expect status = 'draft', created_at and updated_at populated
--
-- Status check — each should succeed:
--   INSERT INTO benefits (organization_id, name, status)
--   VALUES (:org_id, 'Active Benefit', 'active');
--   INSERT INTO benefits (organization_id, name, status)
--   VALUES (:org_id, 'Paused Benefit', 'paused');
--   INSERT INTO benefits (organization_id, name, status)
--   VALUES (:org_id, 'Archived Benefit', 'archived');
--
-- Reject: missing name
--   INSERT INTO benefits (organization_id) VALUES (:org_id);
--
-- Reject: invalid organization_id
--   INSERT INTO benefits (organization_id, name)
--   VALUES ('00000000-0000-0000-0000-000000000000', 'Orphan');
--
-- Reject: invalid status
--   INSERT INTO benefits (organization_id, name, status)
--   VALUES (:org_id, 'Bad Status', 'inactive');
--
-- Reject: DELETE organization with existing benefits rows (RESTRICT)
--   DELETE FROM organizations WHERE id = :org_id;
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged
--
-- Cleanup test rows (optional):
--   DELETE FROM benefits WHERE organization_id = :org_id;

COMMIT;

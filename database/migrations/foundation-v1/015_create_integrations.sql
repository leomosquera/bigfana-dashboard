BEGIN;

-- =====================================================
-- Integration Registry Foundation
-- Foundation DB v1 — Migration 015
-- migration-plan-v1.md → Migration 015
-- physical-model-v1.md → Integration Domain
-- docs/sessions/2026-07-17-migration-015-integration-registry-design.md
-- ADR-003
-- =====================================================
--
-- Business reason:
--   Introduce the organization-owned integrations registry
--   that records which external providers an organization
--   has enabled. Jobs remain the async execution plane.
--
-- Scope:
--   integrations table only (CREATE).
--   integration_jobs is NOT altered.
--   No integration_id FK on jobs.
--   No credentials, connections, workers, webhooks, or audit.
--   No platform-scoped EEP audience/segment sync job model.
--   Must not assign platform cache sync to an artificial
--   organization context.
--
-- Ownership / cardinality:
--   Organization-owned provider enablement registry.
--   Exactly one row per (organization_id, provider),
--   regardless of lifecycle state.
--   Lifecycle transitions UPDATE the existing registry row
--   and never create additional rows for the same
--   (organization_id, provider).
--   Historical lifecycle records belong to the future
--   audit layer (Migration 016).
--
-- Provider:
--   Stable platform vocabulary code.
--   Foundation v1 CHECK allows 'eep' only.
--
-- Jobs association (conceptual 1:N):
--   Logical join via (organization_id, provider).
--   Physical integration_id FK deferred.
--
-- Tables affected: integrations (CREATE)
-- EEP impact: registry surface only
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   organization_id → RESTRICT
--
-- Rollback (only before dependent migrations / application adoption):
--   DROP TABLE IF EXISTS integrations;
-- =====================================================

CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT integrations_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT integrations_provider_check
        CHECK (provider IN ('eep')),

    CONSTRAINT integrations_status_check
        CHECK (
            status IN (
                'draft',
                'active',
                'paused',
                'archived'
            )
        ),

    CONSTRAINT integrations_organization_provider_unique
        UNIQUE (organization_id, provider)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS integrations_organization_idx
ON integrations(organization_id);

CREATE INDEX IF NOT EXISTS integrations_organization_status_idx
ON integrations(organization_id, status);

CREATE INDEX IF NOT EXISTS integrations_provider_idx
ON integrations(provider);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Prerequisites:
--   :org_id from organizations
--   :org_id_2 from organizations (optional, distinct)
--
-- 1. Verify table
--   \d integrations
--   SELECT to_regclass('public.integrations');
--
-- 2. Confirm integration_jobs unchanged
--   -- compare column list to pre-migration baseline
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'integration_jobs'
--   ORDER BY ordinal_position;
--   -- expect no integration_id column
--
-- 3. Count (no seed)
--   SELECT COUNT(*) FROM integrations;  -- expect 0
--
-- 4. Valid insert
--   INSERT INTO integrations (organization_id, provider)
--   VALUES (:org_id, 'eep');
--   -- expect status = 'draft'
--
-- 5. Reject: duplicate (organization_id, provider)
--   INSERT INTO integrations (organization_id, provider, status)
--   VALUES (:org_id, 'eep', 'active');
--
-- 6. Reject: invalid provider
--   INSERT INTO integrations (organization_id, provider)
--   VALUES (:org_id, 'shopify');
--
-- 7. Reject: invalid status
--   INSERT INTO integrations (organization_id, provider, status)
--   VALUES (:org_id_2, 'eep', 'enabled');
--
-- 8. Accept all status values (on distinct orgs or after cleanup)
--   INSERT INTO integrations (organization_id, provider, status)
--   VALUES (:org_id_2, 'eep', 'active');
--
-- 9. RESTRICT: DELETE organization with integrations (expect failure)
--   DELETE FROM organizations WHERE id = :org_id;
--
-- 10. Cleanup validation rows
--   DELETE FROM integrations WHERE organization_id IN (:org_id, :org_id_2);
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged

-- =====================================================
-- Rollback (pre-adoption only)
-- =====================================================
-- DROP TABLE IF EXISTS integrations;

COMMIT;

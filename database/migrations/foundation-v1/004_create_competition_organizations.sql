BEGIN;

-- =====================================================
-- competition_organizations
-- Foundation DB v1 — Migration 004
-- ADR-004 Sports, Competitions and Organizations
-- ADR-005 Managed vs Integrated Competitions
-- Decision 004 — Competition Hierarchy
-- physical-model-v1.md
-- =====================================================
--
-- Business reason:
--   Link organizations to competitions they participate in,
--   completing Sport → Competition → Organization hierarchy.
--
-- Scope:
--   competition_organizations table only.
--   No metadata, roles, member types, or season support.
--
-- Tables affected: competition_organizations (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   competition_id → RESTRICT (catalog integrity)
--   organization_id → RESTRICT (organizations are long-lived;
--     soft deletion preferred over hard delete with cascade)
--
-- Rollback (only before Migration 005):
--   DROP TABLE IF EXISTS competition_organizations;
-- =====================================================

CREATE TABLE IF NOT EXISTS competition_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    competition_id UUID NOT NULL,
    organization_id UUID NOT NULL,

    joined_at TIMESTAMP WITHOUT TIME ZONE,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT competition_organizations_competition_fk
        FOREIGN KEY (competition_id)
        REFERENCES competitions(id)
        ON DELETE RESTRICT,

    CONSTRAINT competition_organizations_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT competition_organizations_unique_membership
        UNIQUE (competition_id, organization_id)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS competition_organizations_competition_idx
ON competition_organizations(competition_id);

CREATE INDEX IF NOT EXISTS competition_organizations_organization_idx
ON competition_organizations(organization_id);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- SELECT COUNT(*) FROM competition_organizations;      -- expect 0 (no seed)
-- \d competition_organizations
--
-- Valid insert:
--   competition_id from competitions
--   organization_id from organizations
--
-- Reject: duplicate (competition_id, organization_id)
-- Reject: invalid competition_id
-- Reject: invalid organization_id
-- Reject: DELETE competition with existing rows (RESTRICT)
-- Reject: DELETE organization with existing rows (RESTRICT)
--
-- Confirm re-run is idempotent

COMMIT;

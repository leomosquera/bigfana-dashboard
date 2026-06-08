BEGIN;

-- =====================================================
-- rewards
-- Foundation DB v1 — Migration 008
-- migration-plan-v1.md → Migration 008
-- physical-model-v1.md → rewards domain
-- docs/sessions/2026-06-08-migration-008-rewards-design.md
-- =====================================================
--
-- Business reason:
--   Introduce the organization-owned rewards catalog as the
--   second step of Loyalty Rewards Foundation. Rewards are
--   point-priced redeemables (merchandise, tickets, experiences)
--   — not entitlements (benefits belong to Migration 007).
--
-- Scope:
--   rewards table only.
--   No seed data, metadata, sponsor_id, campaign_id,
--   redemptions, ledger debits, or eligibility rules.
--
-- Stock semantics:
--   NULL  → unlimited availability
--   0     → out of stock (listed but not redeemable)
--   > 0   → available units remaining
--
-- Tables affected: rewards (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   organization_id → RESTRICT (organizations are long-lived;
--     soft deletion preferred over hard delete with cascade)
--
-- Rollback (only before Migration 009):
--   DROP TABLE IF EXISTS rewards;
-- =====================================================

CREATE TABLE IF NOT EXISTS rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    points_required INTEGER NOT NULL,
    stock INTEGER,

    status TEXT NOT NULL DEFAULT 'draft',

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT rewards_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT rewards_status_check
        CHECK (
            status IN (
                'draft',
                'active',
                'paused',
                'archived'
            )
        ),

    CONSTRAINT rewards_points_required_check
        CHECK (points_required >= 1),

    CONSTRAINT rewards_stock_check
        CHECK (stock IS NULL OR stock >= 0)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS rewards_organization_id_idx
ON rewards(organization_id);

CREATE INDEX IF NOT EXISTS rewards_organization_status_idx
ON rewards(organization_id, status);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Schema
--   \d rewards
--   SELECT COUNT(*) FROM rewards;                     -- expect 0 (no seed)
--
-- Valid insert (replace :org_id with a real organizations.id):
--   INSERT INTO rewards (organization_id, name, points_required)
--   VALUES (:org_id, 'Test Reward', 100);
--   -- expect status = 'draft', stock = NULL, timestamps populated
--
-- Points check — should succeed:
--   INSERT INTO rewards (organization_id, name, points_required)
--   VALUES (:org_id, 'Min Points Reward', 1);
--
-- Stock variants — each should succeed:
--   INSERT INTO rewards (organization_id, name, points_required, stock)
--   VALUES (:org_id, 'Unlimited Reward', 50, NULL);
--   INSERT INTO rewards (organization_id, name, points_required, stock)
--   VALUES (:org_id, 'Out of Stock Reward', 50, 0);
--   INSERT INTO rewards (organization_id, name, points_required, stock)
--   VALUES (:org_id, 'Limited Reward', 50, 10);
--
-- Status check — each should succeed:
--   INSERT INTO rewards (organization_id, name, points_required, status)
--   VALUES (:org_id, 'Active Reward', 100, 'active');
--   INSERT INTO rewards (organization_id, name, points_required, status)
--   VALUES (:org_id, 'Paused Reward', 100, 'paused');
--   INSERT INTO rewards (organization_id, name, points_required, status)
--   VALUES (:org_id, 'Archived Reward', 100, 'archived');
--
-- Reject: missing name
--   INSERT INTO rewards (organization_id, points_required)
--   VALUES (:org_id, 100);
--
-- Reject: missing points_required
--   INSERT INTO rewards (organization_id, name)
--   VALUES (:org_id, 'No Points');
--
-- Reject: points_required < 1
--   INSERT INTO rewards (organization_id, name, points_required)
--   VALUES (:org_id, 'Free Reward', 0);
--   INSERT INTO rewards (organization_id, name, points_required)
--   VALUES (:org_id, 'Negative Points', -1);
--
-- Reject: negative stock
--   INSERT INTO rewards (organization_id, name, points_required, stock)
--   VALUES (:org_id, 'Bad Stock', 100, -1);
--
-- Reject: invalid organization_id
--   INSERT INTO rewards (organization_id, name, points_required)
--   VALUES ('00000000-0000-0000-0000-000000000000', 'Orphan', 100);
--
-- Reject: invalid status
--   INSERT INTO rewards (organization_id, name, points_required, status)
--   VALUES (:org_id, 'Bad Status', 100, 'inactive');
--
-- Reject: DELETE organization with existing rewards rows (RESTRICT)
--   DELETE FROM organizations WHERE id = :org_id;
--
-- Duplicate name within org allowed (no unique constraint):
--   INSERT INTO rewards (organization_id, name, points_required)
--   VALUES (:org_id, 'Test Reward', 200);
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged
--
-- Cleanup test rows (optional):
--   DELETE FROM rewards WHERE organization_id = :org_id;

COMMIT;

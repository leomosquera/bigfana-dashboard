BEGIN;

-- =====================================================
-- redemptions
-- Foundation DB v1 — Migration 009
-- migration-plan-v1.md → Migration 009
-- physical-model-v1.md → redemptions domain
-- docs/sessions/2026-06-08-migration-009-redemptions-design.md
-- =====================================================
--
-- Business reason:
--   Introduce the organization-scoped redemptions transactional
--   table as the third step of Loyalty Rewards Foundation.
--   Redemptions are fan claim records against the rewards catalog
--   — not entitlements (benefits) and not catalog config (rewards).
--
-- Scope:
--   redemptions table only.
--   No seed data, ledger_entry_id, fan_event_id, stock decrement,
--   points debit, triggers, procedures, or EEP integration.
--
-- Status workflow (application-layer transitions):
--   pending, approved, fulfilled, rejected, cancelled
--
-- points_cost:
--   Snapshot of rewards.points_required at claim time.
--
-- Tables affected: redemptions (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   organization_id → RESTRICT
--   fan_id          → RESTRICT
--   reward_id       → RESTRICT
--
-- Rollback (only before dependent migrations / application adoption):
--   DROP TABLE IF EXISTS redemptions;
-- =====================================================

CREATE TABLE IF NOT EXISTS redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    fan_id UUID NOT NULL,
    reward_id UUID NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending',
    points_cost INTEGER NOT NULL,

    redeemed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT redemptions_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT redemptions_fan_fk
        FOREIGN KEY (fan_id)
        REFERENCES fans(id)
        ON DELETE RESTRICT,

    CONSTRAINT redemptions_reward_fk
        FOREIGN KEY (reward_id)
        REFERENCES rewards(id)
        ON DELETE RESTRICT,

    CONSTRAINT redemptions_status_check
        CHECK (
            status IN (
                'pending',
                'approved',
                'fulfilled',
                'rejected',
                'cancelled'
            )
        ),

    CONSTRAINT redemptions_points_cost_check
        CHECK (points_cost >= 1)
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS redemptions_organization_redeemed_at_idx
ON redemptions(organization_id, redeemed_at);

CREATE INDEX IF NOT EXISTS redemptions_organization_status_idx
ON redemptions(organization_id, status);

CREATE INDEX IF NOT EXISTS redemptions_fan_id_idx
ON redemptions(fan_id);

CREATE INDEX IF NOT EXISTS redemptions_reward_id_idx
ON redemptions(reward_id);

CREATE INDEX IF NOT EXISTS redemptions_organization_fan_idx
ON redemptions(organization_id, fan_id);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Schema
--   \d redemptions
--   SELECT COUNT(*) FROM redemptions;                 -- expect 0 (no seed)
--
-- Prerequisites (replace :org_id, :fan_id, :reward_id with real UUIDs):
--   organizations, fans, and rewards rows must exist.
--
-- Valid insert:
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost)
--   VALUES (:org_id, :fan_id, :reward_id, 100);
--   -- expect status = 'pending', redeemed_at and timestamps populated
--
-- Status check — each should succeed:
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost, status)
--   VALUES (:org_id, :fan_id, :reward_id, 100, 'approved');
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost, status)
--   VALUES (:org_id, :fan_id, :reward_id, 100, 'fulfilled');
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost, status)
--   VALUES (:org_id, :fan_id, :reward_id, 100, 'rejected');
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost, status)
--   VALUES (:org_id, :fan_id, :reward_id, 100, 'cancelled');
--
-- Reject: missing points_cost
--   INSERT INTO redemptions (organization_id, fan_id, reward_id)
--   VALUES (:org_id, :fan_id, :reward_id);
--
-- Reject: points_cost < 1
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost)
--   VALUES (:org_id, :fan_id, :reward_id, 0);
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost)
--   VALUES (:org_id, :fan_id, :reward_id, -1);
--
-- Reject: invalid FKs
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost)
--   VALUES ('00000000-0000-0000-0000-000000000000', :fan_id, :reward_id, 100);
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost)
--   VALUES (:org_id, '00000000-0000-0000-0000-000000000000', :reward_id, 100);
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost)
--   VALUES (:org_id, :fan_id, '00000000-0000-0000-0000-000000000000', 100);
--
-- Reject: invalid status
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost, status)
--   VALUES (:org_id, :fan_id, :reward_id, 100, 'delivered');
--   INSERT INTO redemptions (organization_id, fan_id, reward_id, points_cost, status)
--   VALUES (:org_id, :fan_id, :reward_id, 100, 'PENDING');
--
-- Reject: DELETE parent rows when redemptions reference them (RESTRICT)
--   DELETE FROM organizations WHERE id = :org_id;
--   DELETE FROM fans WHERE id = :fan_id;
--   DELETE FROM rewards WHERE id = :reward_id;
--
-- Indexes (verify existence):
--   SELECT indexname FROM pg_indexes WHERE tablename = 'redemptions';
--   -- expect:
--   --   redemptions_organization_redeemed_at_idx
--   --   redemptions_organization_status_idx
--   --   redemptions_fan_id_idx
--   --   redemptions_reward_id_idx
--   --   redemptions_organization_fan_idx
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged
--
-- Cleanup test rows (optional):
--   DELETE FROM redemptions WHERE organization_id = :org_id;

COMMIT;

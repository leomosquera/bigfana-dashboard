BEGIN;

-- =====================================================
-- Audit Layer Foundation
-- Foundation DB v1 — Migration 016
-- migration-plan-v1.md → Migration 016
-- docs/sessions/2026-07-17-migration-016-audit-layer-design.md
-- =====================================================
--
-- Business reason:
--   Introduce the append-only business audit trail for
--   security-significant governance decisions. Owns
--   integration registry lifecycle history deferred from
--   Migration 015. Current business state remains on
--   domain tables.
--
-- Scope:
--   audit_logs table only (CREATE).
--   No ALTER of integrations, redemptions, or other tables.
--   No coupling to integration_jobs.
--   No fan_events changes.
--   No retention / purge / SIEM / RLS.
--
-- Dual-scope ownership:
--   organization_id present → organization-scoped event
--   organization_id NULL    → platform-scoped event
--   Never invent artificial organization context for
--   platform events.
--
-- Actor vs Origin (distinct; never collapsed):
--   Actor  = who performed the business action
--   Origin = where the action originated
--   actor_id / origin_id are UUID soft references (NULLABLE).
--   No foreign keys on actor_id or origin_id.
--
-- Entity identity:
--   entity_type + entity_id reference the canonical
--   BigFana primary key UUID of the audited entity,
--   stable for the entity lifetime.
--   entity_type is open TEXT; every emitted value must
--   be documented in the platform canonical entity
--   vocabulary (no CHECK on entity_type).
--
-- Business decisions only:
--   Technical execution details belong to operational
--   systems (integration_jobs, observability) — not here.
--
-- metadata:
--   Supplements business context only.
--   Must never become the authoritative source of
--   current business state.
--
-- Append-only:
--   INSERT only in application paths.
--   No updated_at column.
--
-- Tables affected: audit_logs (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   organization_id → RESTRICT (nullable column)
--
-- Rollback (only before dependent migrations / application adoption):
--   DROP TABLE IF EXISTS audit_logs;
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NULL,

    actor_type TEXT NOT NULL,
    actor_id UUID NULL,

    origin_type TEXT NOT NULL,
    origin_id UUID NULL,

    action TEXT NOT NULL,

    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT audit_logs_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT audit_logs_actor_type_check
        CHECK (
            actor_type IN (
                'user',
                'system',
                'integration',
                'anonymous'
            )
        ),

    CONSTRAINT audit_logs_origin_type_check
        CHECK (
            origin_type IN (
                'dashboard',
                'api',
                'system',
                'integration'
            )
        ),

    CONSTRAINT audit_logs_action_check
        CHECK (
            action IN (
                'created',
                'updated',
                'status_changed',
                'linked',
                'unlinked',
                'published',
                'unpublished',
                'approved',
                'rejected',
                'cancelled',
                'fulfilled',
                'archived',
                'restored'
            )
        )
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS audit_logs_organization_idx
ON audit_logs(organization_id);

CREATE INDEX IF NOT EXISTS audit_logs_organization_created_idx
ON audit_logs(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_entity_idx
ON audit_logs(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS audit_logs_entity_created_idx
ON audit_logs(entity_type, entity_id, created_at DESC);

CREATE INDEX IF NOT EXISTS audit_logs_actor_idx
ON audit_logs(actor_type, actor_id);

CREATE INDEX IF NOT EXISTS audit_logs_created_idx
ON audit_logs(created_at DESC);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Prerequisites:
--   :org_id from organizations
--   :entity_id any UUID (canonical entity PK stand-in)
--
-- 1. Verify table
--   \d audit_logs
--   SELECT to_regclass('public.audit_logs');
--
-- 2. Confirm no updated_at
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'audit_logs'
--   ORDER BY ordinal_position;
--   -- expect: id, organization_id, actor_type, actor_id,
--   --         origin_type, origin_id, action, entity_type,
--   --         entity_id, metadata, created_at
--
-- 3. Confirm integrations / integration_jobs unchanged
--   SELECT to_regclass('public.integrations');
--   SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'integration_jobs'
--   ORDER BY ordinal_position;
--
-- 4. Count (no seed)
--   SELECT COUNT(*) FROM audit_logs;  -- expect 0
--
-- 5. Valid org-scoped insert
--   INSERT INTO audit_logs (
--     organization_id, actor_type, actor_id,
--     origin_type, origin_id, action,
--     entity_type, entity_id, metadata
--   ) VALUES (
--     :org_id, 'user', '00000000-0000-0000-0000-000000000001'::uuid,
--     'dashboard', '00000000-0000-0000-0000-0000000000aa'::uuid,
--     'status_changed',
--     'integrations', :entity_id,
--     '{"previous_status":"draft","new_status":"active"}'::jsonb
--   );
--
-- 6. Valid platform-scoped insert (organization_id NULL)
--   INSERT INTO audit_logs (
--     actor_type, origin_type, action,
--     entity_type, entity_id
--   ) VALUES (
--     'system', 'system', 'updated',
--     'organizations', :org_id
--   );
--
-- 7. Reject: invalid actor_type
--   INSERT INTO audit_logs (
--     actor_type, origin_type, action,
--     entity_type, entity_id
--   ) VALUES (
--     'admin', 'dashboard', 'created',
--     'integrations', :entity_id
--   );
--
-- 8. Reject: invalid origin_type
--   INSERT INTO audit_logs (
--     actor_type, origin_type, action,
--     entity_type, entity_id
--   ) VALUES (
--     'user', 'cli', 'created',
--     'integrations', :entity_id
--   );
--
-- 9. Reject: invalid action
--   INSERT INTO audit_logs (
--     actor_type, origin_type, action,
--     entity_type, entity_id
--   ) VALUES (
--     'user', 'dashboard', 'deleted',
--     'integrations', :entity_id
--   );
--
-- 10. Reject: invalid organization_id
--   INSERT INTO audit_logs (
--     organization_id, actor_type, origin_type, action,
--     entity_type, entity_id
--   ) VALUES (
--     '00000000-0000-0000-0000-ffffffffffff',
--     'user', 'dashboard', 'created',
--     'integrations', :entity_id
--   );
--
-- 11. RESTRICT: DELETE organization with org-scoped audit rows
--   DELETE FROM organizations WHERE id = :org_id;
--   -- expect failure when org-scoped audit_logs rows exist
--
-- 12. Cleanup validation rows
--   DELETE FROM audit_logs
--   WHERE organization_id = :org_id
--      OR (organization_id IS NULL AND entity_id = :org_id);
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged

-- =====================================================
-- Rollback (pre-adoption only)
-- =====================================================
-- DROP TABLE IF EXISTS audit_logs;

COMMIT;

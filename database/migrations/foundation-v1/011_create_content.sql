BEGIN;

-- =====================================================
-- content
-- Foundation DB v1 — Migration 011
-- migration-plan-v1.md → Migration 011
-- physical-model-v1.md → Content Domain
-- docs/sessions/2026-06-08-migration-011-content-design.md
-- =====================================================
--
-- Business reason:
--   Introduce the organization-owned content table as Content
--   Foundation. Content is publishable org material for fans
--   — news, articles, announcements, video metadata, match updates.
--
-- Scope:
--   content table only.
--   No seed data, taxonomy tables, assignment pivots, metadata,
--   scheduling, media columns, or campaign/sponsor/match FKs.
--
-- Status workflow (application-layer transitions):
--   draft, published, paused, archived
--
-- published_at:
--   First publish timestamp; NULL while draft; set by application.
--
-- Tables affected: content (CREATE)
-- EEP impact: none
-- Existing data impact: none (expand-only, no seed)
--
-- FK delete behavior:
--   organization_id → RESTRICT
--
-- Rollback (only before dependent migrations / application adoption):
--   DROP TABLE IF EXISTS content;
-- =====================================================

CREATE TABLE IF NOT EXISTS content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    organization_id UUID NOT NULL,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    content_type TEXT NOT NULL,
    body TEXT,

    status TEXT NOT NULL DEFAULT 'draft',
    published_at TIMESTAMP WITHOUT TIME ZONE,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT content_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE RESTRICT,

    CONSTRAINT content_content_type_check
        CHECK (
            content_type IN (
                'news',
                'article',
                'announcement',
                'video',
                'match_update'
            )
        ),

    CONSTRAINT content_status_check
        CHECK (
            status IN (
                'draft',
                'published',
                'paused',
                'archived'
            )
        )
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS content_organization_idx
ON content(organization_id);

CREATE INDEX IF NOT EXISTS content_organization_status_idx
ON content(organization_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS content_slug_unique
ON content(organization_id, lower(slug));

CREATE INDEX IF NOT EXISTS content_organization_content_type_idx
ON content(organization_id, content_type);

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Prerequisites: replace :org_id and :org_id_2 with real organizations.id values
--
-- 1. Verify table existence
--   \d content
--   SELECT to_regclass('public.content');             -- expect 'content'
--
-- 2. Verify columns and defaults
--   SELECT column_name, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_name = 'content'
--   ORDER BY ordinal_position;
--   -- expect status default 'draft'
--   -- expect created_at and updated_at defaults
--   -- expect published_at nullable
--
-- 3. Verify constraints
--   SELECT conname FROM pg_constraint
--   WHERE conrelid = 'content'::regclass;
--   -- expect: content_organization_fk, content_content_type_check, content_status_check
--
-- 4. Verify foreign key delete rule
--   SELECT confdeltype FROM pg_constraint
--   WHERE conname = 'content_organization_fk';
--   -- expect 'r' (RESTRICT)
--   -- DELETE FROM organizations WHERE id = :org_id;
--   --   → blocked when content rows reference that org
--
-- 5. Verify indexes
--   SELECT indexname FROM pg_indexes WHERE tablename = 'content';
--   -- expect:
--   --   content_organization_idx
--   --   content_organization_status_idx
--   --   content_slug_unique
--   --   content_organization_content_type_idx
--
-- 6. Verify COUNT(*) = 0
--   SELECT COUNT(*) FROM content;                     -- expect 0 (no seed)
--
-- 7. Test valid insert
--   INSERT INTO content (organization_id, title, slug, content_type)
--   VALUES (:org_id, 'Welcome News', 'welcome-news', 'news');
--   -- expect status = 'draft', published_at NULL, timestamps populated
--
-- 8. Test invalid content_type rejection
--   INSERT INTO content (organization_id, title, slug, content_type)
--   VALUES (:org_id, 'Bad Type', 'bad-type', 'blog');
--
-- 9. Test invalid status rejection
--   INSERT INTO content (organization_id, title, slug, content_type, status)
--   VALUES (:org_id, 'Bad Status', 'bad-status', 'news', 'active');
--
-- 10. Test exact duplicate slug rejection within the same organization
--   INSERT INTO content (organization_id, title, slug, content_type)
--   VALUES (:org_id, 'Duplicate Slug', 'welcome-news', 'article');
--
-- 11. Test case-insensitive duplicate slug rejection within the same organization
--   INSERT INTO content (organization_id, title, slug, content_type)
--   VALUES (:org_id, 'Duplicate Slug Case', 'WELCOME-NEWS', 'article');
--
-- 12. Confirm the same slug is allowed for a different organization
--   INSERT INTO content (organization_id, title, slug, content_type)
--   VALUES (:org_id_2, 'Other Org Same Slug', 'welcome-news', 'news');
--   -- expect success when :org_id_2 <> :org_id
--
-- 13. Cleanup validation rows
--   DELETE FROM content WHERE slug IN ('welcome-news', 'bad-type', 'bad-status');
--
-- Idempotency:
--   Re-run this migration file — no errors, schema unchanged

-- =====================================================
-- Rollback (pre-adoption only)
-- =====================================================
-- DROP TABLE IF EXISTS content;

COMMIT;

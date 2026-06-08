BEGIN;

-- =====================================================
-- fan_organizations
-- Foundation DB v1
-- ADR-001 Global Fan Model
-- ADR-002 Primary and Followed Organizations
-- =====================================================

CREATE TABLE IF NOT EXISTS fan_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    fan_id UUID NOT NULL,
    organization_id UUID NOT NULL,

    relationship_type VARCHAR(20) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    joined_at TIMESTAMP WITHOUT TIME ZONE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT fan_organizations_fan_fk
        FOREIGN KEY (fan_id)
        REFERENCES fans(id)
        ON DELETE CASCADE,

    CONSTRAINT fan_organizations_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON DELETE CASCADE,

    CONSTRAINT fan_organizations_relationship_type_check
        CHECK (
            relationship_type IN (
                'PRIMARY',
                'FOLLOWING'
            )
        )
);

-- =====================================================
-- Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS fan_organizations_fan_idx
ON fan_organizations(fan_id);

CREATE INDEX IF NOT EXISTS fan_organizations_org_idx
ON fan_organizations(organization_id);

CREATE INDEX IF NOT EXISTS fan_organizations_relationship_idx
ON fan_organizations(relationship_type);

-- =====================================================
-- One relation per fan + organization
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS fan_organizations_unique_relation_idx
ON fan_organizations(
    fan_id,
    organization_id
);

-- =====================================================
-- Only one PRIMARY organization per fan
-- =====================================================

CREATE UNIQUE INDEX IF NOT EXISTS fan_organizations_primary_idx
ON fan_organizations(fan_id)
WHERE is_primary = TRUE;

-- =====================================================
-- Backfill existing data
-- fans.organization_id
-- =====================================================

INSERT INTO fan_organizations (
    fan_id,
    organization_id,
    relationship_type,
    is_primary,
    joined_at,
    created_at,
    updated_at
)
SELECT
    f.id,
    f.organization_id,
    'PRIMARY',
    TRUE,
    COALESCE(f.created_at, NOW()),
    NOW(),
    NOW()
FROM fans f
WHERE f.organization_id IS NOT NULL
ON CONFLICT DO NOTHING;

COMMIT;
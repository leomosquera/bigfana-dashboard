BEGIN;

-- =====================================================
-- Remove Legacy Organization Sport
-- Foundation DB v1 — Migration 019b (Contract Phase)
-- migration-plan-v1.md → Migration 019b (staged)
-- docs/sessions/2026-07-19-migration-019b-remove-legacy-organization-sport-design.md
-- ADR-004 Sports, Competitions and Organizations
-- ADR-005 Managed vs Integrated Competitions
-- =====================================================
--
-- Business reason:
--   Complete physical removal of the deprecated legacy
--   organizations.sport free-text column after:
--     019a  = canonical competitions + memberships + COMMENT
--     App   = Drizzle / type cutover (mapping removed)
--     Gate  = post-cutover technical gates PASS
--
--   Canonical organization sport/competition context is
--   already derived via:
--     organization
--       → competition_organizations
--       → competitions
--       → sports
--
--   The application and Drizzle no longer read, write, or
--   map organizations.sport.
--
--   Residual Neon surface still present before this migration:
--     organizations.sport
--       type            = text
--       is_nullable     = NO
--       column_default  = 'football'::text
--       comment         = DEPRECATED (ADR-004 / Migration 019a)
--       values          = football × 3 (non-authoritative)
--
--   This migration removes that residual physical surface.
--
-- Scope (physical removal only):
--   1. DROP COLUMN organizations.sport
--
-- Explicit OUT OF SCOPE:
--   No companion FK / index drops (none exist for this column).
--   No CASCADE on DROP (unexpected dependents must fail loudly).
--   No sports / competitions / competition_organizations DDL.
--   No competition or membership data rewrite.
--   No organizations.sport_id.
--   No other organizations columns.
--   No application / Drizzle changes (already cut over).
--   No Migration 020 work.
--   No omit-safe / NULLABLE intermediate migration.
--
-- Contract (ADR-004 / ADR-005):
--   organizations.sport is DEPRECATED and non-authoritative.
--   Canonical path remains competition-based.
--   An organization may belong to multiple competitions.
--   Physical removal is the exclusive final Migration 019 step.
--
-- Data impact:
--   Discards residual non-authoritative legacy free-text values
--   currently known as: football × 3.
--   Does NOT delete organizations rows.
--   Does NOT delete or rewrite sports / competitions /
--     competition_organizations rows.
--   Not considered canonical business-data loss:
--     SoT sport context =
--       competition_organizations → competitions → sports.
--
-- Frozen sequence:
--   019a  = canonical data + COMMENT — COMPLETE
--   App   = remove organizations.sport from Drizzle / types — COMPLETE
--   Gate  = post-cutover technical gates — PASS
--   019b  = physical DROP (this migration)
--   020   = unchanged / out of scope / not started
--
-- Tables affected: organizations (column removal only)
-- EEP impact: none
--
-- Dependency strategy:
--   Gate Assessment found no indexes / FKs / views / triggers /
--   RLS / functions depending on organizations.sport.
--   Only pg_attrdef (column default) depends on the column;
--   PostgreSQL removes it automatically with DROP COLUMN.
--   Therefore no companion DROP INDEX / DROP CONSTRAINT.
--
-- Hard contract warning:
--   This migration is irreversible under normal contract
--   operations. Successful Neon adoption requires a dedicated
--   reverse migration if rollback is ever needed later.
--   Do NOT treat COMMIT success as a trivial undo target.
--   Do NOT include a simplistic automatic rollback that
--   pretends to restore the pre-019b business/schema state.
--
-- Idempotency:
--   DROP COLUMN IF EXISTS organizations.sport.
--   Safe to re-execute after a successful run (NOTICE + no-op).
--   Pre-check DO block:
--     - column absent → NOTICE + continue (idempotent re-run)
--     - column present → verify expected pre-019b state +
--       canonical replacement integrity, then proceed
--   Post-check DO block hard-fails if column still exists.
--
-- Execution gate (HUMAN — not granted by this file alone):
--   Before FIRST Neon execution, operator MUST confirm:
--     - Design Brief approved
--     - This SQL human-reviewed and approved
--     - Explicit approval for irreversible DROP
--     - organizations.sport exists in expected pre-019b state
--     - canonical competitions + memberships still valid
--     - post-cutover gates still considered valid
-- =====================================================

-- =====================================================
-- Pre-execution safety (manual checklist — run BEFORE first Neon apply)
-- =====================================================
-- A. Confirm expected legacy column exists (first execution)
--   SELECT
--     c.column_name,
--     c.data_type,
--     c.is_nullable,
--     c.column_default,
--     pgd.description AS column_comment
--   FROM information_schema.columns c
--   LEFT JOIN pg_catalog.pg_statio_all_tables st
--     ON st.schemaname = c.table_schema
--    AND st.relname = c.table_name
--   LEFT JOIN pg_catalog.pg_description pgd
--     ON pgd.objoid = st.relid
--    AND pgd.objsubid = c.ordinal_position
--   WHERE c.table_schema = 'public'
--     AND c.table_name = 'organizations'
--     AND c.column_name = 'sport';
--   -- expect: one row
--   --   data_type = text
--   --   is_nullable = NO
--   --   column_default ~ 'football'
--   --   comment contains DEPRECATED / Migration 019a
--
-- B. Confirm value distribution (informational)
--   SELECT sport, COUNT(*)::int AS count
--   FROM organizations
--   GROUP BY sport
--   ORDER BY sport;
--   -- expect: football × 3
--
-- C. Confirm canonical replacement baselines
--   SELECT COUNT(*) FROM sports;                    -- expect 11
--   SELECT COUNT(*) FROM competitions;              -- expect 2
--   SELECT COUNT(*) FROM competition_organizations; -- expect 3
--   SELECT COUNT(*) FROM organizations;             -- expect 3
--
--   SELECT COUNT(*) FROM sports WHERE slug = 'soccer';   -- expect 1
--   SELECT COUNT(*) FROM sports WHERE slug = 'football'; -- expect 0
--
-- D. Confirm required memberships / derivation
--   See post-migration validation queries below (same shape).
-- =====================================================

-- =====================================================
-- Pre-execution FAIL-FAST / already-applied detection
-- =====================================================
-- Behavior:
--   - required tables missing → EXCEPTION
--   - column absent → NOTICE + continue
--     (idempotent re-run after successful apply)
--     still verify canonical replacement integrity
--   - column present with unexpected type / nullability /
--     default / comment → EXCEPTION (drift)
--   - column present + expected state → verify canonical
--     replacement integrity, then proceed to DROP
--   - canonical soccer / competitions / memberships /
--     org coverage / derivation invalid → EXCEPTION
-- =====================================================

DO $$
DECLARE
  orgs_reg regclass;
  sports_reg regclass;
  comps_reg regclass;
  co_reg regclass;

  col_exists boolean;
  col_data_type text;
  col_nullable text;
  col_default text;
  col_comment text;

  soccer_count integer;
  comp_ar_count integer;
  comp_mx_count integer;
  m_river_count integer;
  m_boca_count integer;
  m_toluca_count integer;
  org_total integer;
  org_without_membership integer;
  org_without_derivation integer;
BEGIN
  orgs_reg := to_regclass('public.organizations');
  sports_reg := to_regclass('public.sports');
  comps_reg := to_regclass('public.competitions');
  co_reg := to_regclass('public.competition_organizations');

  IF orgs_reg IS NULL THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: public.organizations is missing. Aborting — wrong database or catastrophic schema drift.';
  END IF;

  IF sports_reg IS NULL THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: public.sports is missing. Aborting — canonical replacement table absent.';
  END IF;

  IF comps_reg IS NULL THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: public.competitions is missing. Aborting — canonical replacement table absent.';
  END IF;

  IF co_reg IS NULL THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: public.competition_organizations is missing. Aborting — canonical replacement table absent.';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'sport'
  ) INTO col_exists;

  -- -------------------------------------------------
  -- Canonical replacement integrity (always required)
  -- -------------------------------------------------
  SELECT COUNT(*) INTO soccer_count
  FROM sports
  WHERE slug = 'soccer';

  IF soccer_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: sports.slug = ''soccer'' must resolve to exactly one row (found %).',
      soccer_count;
  END IF;

  SELECT COUNT(*) INTO comp_ar_count
  FROM competitions
  WHERE slug = 'liga-profesional-argentina';

  IF comp_ar_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: competitions.slug = ''liga-profesional-argentina'' must resolve to exactly one row (found %).',
      comp_ar_count;
  END IF;

  SELECT COUNT(*) INTO comp_mx_count
  FROM competitions
  WHERE slug = 'liga-mx';

  IF comp_mx_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: competitions.slug = ''liga-mx'' must resolve to exactly one row (found %).',
      comp_mx_count;
  END IF;

  SELECT COUNT(*) INTO m_river_count
  FROM competition_organizations co
  INNER JOIN organizations o ON o.id = co.organization_id
  INNER JOIN competitions c ON c.id = co.competition_id
  WHERE o.slug = 'river-plate'
    AND c.slug = 'liga-profesional-argentina';

  IF m_river_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: membership river-plate → liga-profesional-argentina must exist exactly once (found %).',
      m_river_count;
  END IF;

  SELECT COUNT(*) INTO m_boca_count
  FROM competition_organizations co
  INNER JOIN organizations o ON o.id = co.organization_id
  INNER JOIN competitions c ON c.id = co.competition_id
  WHERE o.slug = 'boca-juniors'
    AND c.slug = 'liga-profesional-argentina';

  IF m_boca_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: membership boca-juniors → liga-profesional-argentina must exist exactly once (found %).',
      m_boca_count;
  END IF;

  SELECT COUNT(*) INTO m_toluca_count
  FROM competition_organizations co
  INNER JOIN organizations o ON o.id = co.organization_id
  INNER JOIN competitions c ON c.id = co.competition_id
  WHERE o.slug = 'toluca'
    AND c.slug = 'liga-mx';

  IF m_toluca_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: membership toluca → liga-mx must exist exactly once (found %).',
      m_toluca_count;
  END IF;

  SELECT COUNT(*) INTO org_total FROM organizations;

  SELECT COUNT(*) INTO org_without_membership
  FROM organizations o
  WHERE NOT EXISTS (
    SELECT 1
    FROM competition_organizations co
    WHERE co.organization_id = o.id
  );

  IF org_without_membership <> 0 THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: % of % organizations lack competition membership. Aborting DROP.',
      org_without_membership, org_total;
  END IF;

  SELECT COUNT(*) INTO org_without_derivation
  FROM organizations o
  WHERE NOT EXISTS (
    SELECT 1
    FROM competition_organizations co
    INNER JOIN competitions c ON c.id = co.competition_id
    INNER JOIN sports s ON s.id = c.sport_id
    WHERE co.organization_id = o.id
  );

  IF org_without_derivation <> 0 THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: % of % organizations cannot derive sport via competition_organizations → competitions → sports. Aborting DROP.',
      org_without_derivation, org_total;
  END IF;

  -- -------------------------------------------------
  -- Legacy column presence / expected pre-019b state
  -- -------------------------------------------------
  IF NOT col_exists THEN
    RAISE NOTICE
      'Migration 019b: organizations.sport already absent. Continuing with DROP COLUMN IF EXISTS no-op (idempotent re-run). Canonical replacement integrity checks passed.';
    RETURN;
  END IF;

  SELECT
    c.data_type,
    c.is_nullable,
    c.column_default,
    pgd.description
  INTO
    col_data_type,
    col_nullable,
    col_default,
    col_comment
  FROM information_schema.columns c
  LEFT JOIN pg_catalog.pg_statio_all_tables st
    ON st.schemaname = c.table_schema
   AND st.relname = c.table_name
  LEFT JOIN pg_catalog.pg_description pgd
    ON pgd.objoid = st.relid
   AND pgd.objsubid = c.ordinal_position
  WHERE c.table_schema = 'public'
    AND c.table_name = 'organizations'
    AND c.column_name = 'sport';

  IF col_data_type IS DISTINCT FROM 'text' THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: organizations.sport data_type is % (expected text). Unexpected drift — aborting.',
      col_data_type;
  END IF;

  IF col_nullable IS DISTINCT FROM 'NO' THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: organizations.sport is_nullable is % (expected NO). Unexpected drift — aborting.',
      col_nullable;
  END IF;

  IF col_default IS NULL OR col_default NOT ILIKE '%football%' THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: organizations.sport default is % (expected equivalent to ''football''). Unexpected drift — aborting.',
      col_default;
  END IF;

  IF col_comment IS NULL
     OR col_comment NOT ILIKE '%DEPRECATED%'
     OR col_comment NOT ILIKE '%019a%' THEN
    RAISE EXCEPTION
      'Migration 019b FAIL-FAST: organizations.sport COMMENT is missing DEPRECATED / Migration 019a marker. Unexpected drift — aborting. Comment=%',
      col_comment;
  END IF;

  RAISE NOTICE
    'Migration 019b: organizations.sport present in expected pre-019b state; canonical replacement integrity checks passed. Proceeding to DROP COLUMN.';
END $$;

-- =====================================================
-- Physical removal (no CASCADE; no companion FK/index drops)
-- =====================================================
-- Gate Assessment confirmed no indexes / FKs / views /
-- triggers / functions depend on organizations.sport.
-- Column default (pg_attrdef) is removed automatically.
-- Unexpected dependents must fail this statement loudly.
-- =====================================================

ALTER TABLE organizations
  DROP COLUMN IF EXISTS sport;

-- =====================================================
-- Hard post-condition (inside transaction)
-- =====================================================

DO $$
DECLARE
  col_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'sport'
  ) INTO col_exists;

  IF col_exists THEN
    RAISE EXCEPTION
      'Migration 019b POST-CHECK FAILED: organizations.sport still exists after DROP COLUMN. Aborting transaction.';
  END IF;

  RAISE NOTICE
    'Migration 019b POST-CHECK: organizations.sport confirmed absent.';
END $$;

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- Record / compare counts against the pre-execution snapshot.
-- Migration DDL must not delete organization / sports /
-- competition / competition_organizations rows.
--
-- 1. organizations.sport NO LONGER exists
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'organizations'
--     AND column_name = 'sport';
--   -- expect: 0 rows
--
-- 2. organizations table still exists
--   SELECT to_regclass('public.organizations');
--   -- expect: organizations
--
-- 3. organization count unchanged
--   SELECT COUNT(*) AS organizations_count FROM organizations;
--   -- expect: same as pre-check (baseline 3)
--
-- 4. all other organizations columns remain
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'organizations'
--   ORDER BY ordinal_position;
--   -- expect present (among others):
--   --   id, name, slug, brand_color, logo_url, favicon_url,
--   --   country, timezone, is_active, created_at, updated_at
--   -- expect ABSENT:
--   --   sport
--   --   sport_id
--
-- 5. sports table intact
--   SELECT to_regclass('public.sports');
--   -- expect: sports
--
-- 6. sports count unchanged
--   SELECT COUNT(*) AS sports_count FROM sports;
--   -- expect: same as pre-check (baseline 11)
--
-- 7. competitions table intact
--   SELECT to_regclass('public.competitions');
--   -- expect: competitions
--
-- 8. competition count unchanged
--   SELECT COUNT(*) AS competitions_count FROM competitions;
--   -- expect: same as pre-check (baseline 2)
--
-- 9. competition_organizations intact
--   SELECT to_regclass('public.competition_organizations');
--   -- expect: competition_organizations
--
-- 10. membership count unchanged
--   SELECT COUNT(*) AS competition_organizations_count
--   FROM competition_organizations;
--   -- expect: same as pre-check (baseline 3)
--
-- 11. sports.slug = soccer still exactly one
--   SELECT COUNT(*) AS soccer_count
--   FROM sports
--   WHERE slug = 'soccer';
--   -- expect: 1
--
-- 12. required competition rows still exactly one each
--   SELECT slug, COUNT(*)::int AS count
--   FROM competitions
--   WHERE slug IN ('liga-profesional-argentina', 'liga-mx')
--   GROUP BY slug
--   ORDER BY slug;
--   -- expect: each slug count = 1
--
-- 13. required memberships still exactly one each
--   SELECT o.slug AS organization_slug,
--          c.slug AS competition_slug,
--          COUNT(*)::int AS pair_count
--   FROM competition_organizations co
--   INNER JOIN organizations o ON o.id = co.organization_id
--   INNER JOIN competitions c ON c.id = co.competition_id
--   WHERE (o.slug, c.slug) IN (
--     ('river-plate', 'liga-profesional-argentina'),
--     ('boca-juniors', 'liga-profesional-argentina'),
--     ('toluca', 'liga-mx')
--   )
--   GROUP BY o.slug, c.slug
--   ORDER BY o.slug;
--   -- expect: pair_count = 1 for each required pair
--
-- 14. every organization still has >=1 competition membership
--   SELECT COUNT(*) AS organizations_without_membership
--   FROM organizations o
--   WHERE NOT EXISTS (
--     SELECT 1
--     FROM competition_organizations co
--     WHERE co.organization_id = o.id
--   );
--   -- expect: 0
--
-- 15. canonical sport derivation still succeeds for every org
--   SELECT
--     o.slug AS organization_slug,
--     c.slug AS competition_slug,
--     s.slug AS sport_slug
--   FROM organizations o
--   INNER JOIN competition_organizations co
--     ON co.organization_id = o.id
--   INNER JOIN competitions c
--     ON c.id = co.competition_id
--   INNER JOIN sports s
--     ON s.id = c.sport_id
--   ORDER BY o.slug, c.slug;
--   -- expect at minimum:
--   --   river-plate  → liga-profesional-argentina → soccer
--   --   boca-juniors → liga-profesional-argentina → soccer
--   --   toluca       → liga-mx → soccer
--
--   SELECT COUNT(*) AS organizations_without_derivation
--   FROM organizations o
--   WHERE NOT EXISTS (
--     SELECT 1
--     FROM competition_organizations co
--     INNER JOIN competitions c ON c.id = co.competition_id
--     INNER JOIN sports s ON s.id = c.sport_id
--     WHERE co.organization_id = o.id
--   );
--   -- expect: 0
--
-- 16. multi-competition UNIQUE remains
--   SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
--   FROM pg_constraint con
--   JOIN pg_class rel ON rel.oid = con.conrelid
--   JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
--   WHERE nsp.nspname = 'public'
--     AND rel.relname = 'competition_organizations'
--     AND con.conname = 'competition_organizations_unique_membership';
--   -- expect: UNIQUE (competition_id, organization_id)
--
-- 17. no unique constraint on organization_id alone
--   SELECT i.relname AS index_name,
--          array_agg(a.attname ORDER BY k.n) AS columns
--   FROM pg_class t
--   JOIN pg_index ix ON t.oid = ix.indrelid
--   JOIN pg_class i ON i.oid = ix.indexrelid
--   JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS k(attnum, n) ON true
--   JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = k.attnum
--   WHERE t.relname = 'competition_organizations'
--     AND t.relkind = 'r'
--     AND ix.indisunique = true
--   GROUP BY i.relname
--   HAVING array_agg(a.attname ORDER BY k.n) = ARRAY['organization_id']::name[];
--   -- expect: 0 rows
--
-- 18. no organizations.sport_id exists
--   SELECT column_name
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'organizations'
--     AND column_name = 'sport_id';
--   -- expect: 0 rows
--
-- 19. Migration 020 objects untouched
--   -- Informational: no Migration 020 DDL exists in this file.
--   -- Confirm no unexpected new Foundation objects were introduced
--   -- by this migration (019b touches organizations.sport only).
--
-- 20. Idempotent re-run behavior
--   Re-executing this migration file after successful apply must:
--     - pass canonical replacement integrity checks
--     - RAISE NOTICE that organizations.sport is already absent
--     - no-op DROP COLUMN IF EXISTS
--     - pass hard post-check (column still absent)
-- =====================================================

-- =====================================================
-- Application validation AFTER Neon apply (not executed here)
-- =====================================================
-- Do not modify application / Drizzle as part of 019b.
-- After Neon DROP, confirm app still matches post-cutover mapping:
--
--   npx tsc --noEmit
--   npm run build
--   scoped/relevant eslint on organization consumers
--
-- Relevant existing tests (if still applicable):
--   npx tsx --test src/server/queries/fan-organizations.test.ts
--
-- Final repository search (expect zero runtime legacy usage):
--   - organizations.sport / organization.sport / org.sport
--   - zero runtime reads
--   - zero runtime writes
--   - zero Drizzle mapping of organizations.sport
--   - zero DTO / type exposure of organization.sport
-- =====================================================

-- =====================================================
-- Rollback (HARD CONTRACT — dedicated reverse migration only)
-- =====================================================
-- Migration 019b is a hard contract migration.
--
-- There is NO simplistic automatic rollback in this file.
-- Transaction failure mid-apply: stop; inspect catalog;
-- re-run with IF EXISTS + validation. Do not invent ad-hoc fixes.
-- Unexpected dependents must fail loudly (no CASCADE).
--
-- If reverse is ever required AFTER successful Neon adoption,
-- authorize and write a SEPARATE reverse migration that explicitly
-- decides whether to recreate:
--   organizations.sport TEXT
-- historically NOT NULL with default 'football',
-- and whether any legacy free-text values should be reconstructed.
--
-- Canonical competition relationships remain authoritative
-- regardless of any reverse recreation of organizations.sport.
-- Do NOT restore organizations.sport as canonical sport ownership.
-- Do NOT introduce organizations.sport_id as a shortcut.
--
-- That reverse migration is NOT generated and NOT executed here.
-- =====================================================

COMMIT;

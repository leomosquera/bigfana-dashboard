BEGIN;

-- =====================================================
-- Canonical Competition Data + Legacy Organization Sport
-- Deprecation
-- Foundation DB v1 — Migration 019a (Contract Phase)
-- migration-plan-v1.md → Migration 019 (staged as 019a)
-- docs/sessions/2026-07-19-migration-019a-canonical-competition-data-design.md
-- ADR-004 Sports, Competitions and Organizations
-- ADR-005 Managed vs Integrated Competitions
-- =====================================================
--
-- Business reason:
--   Establish the approved minimum ADR-004 canonical
--   competition catalog + organization memberships so
--   organization sport context can be derived via:
--     organization
--       → competition_organizations
--       → competitions
--       → sports
--   Mark organizations.sport DEPRECATED (non-authoritative).
--   Physical DROP remains Migration 019b only.
--
-- Scope:
--   1. Fail-fast verify sports.slug = 'soccer' (exactly one)
--   2. Fail-fast verify organizations.slug IN
--        ('river-plate', 'boca-juniors', 'toluca')
--        each exactly once
--   3. Create/reuse competitions:
--        liga-profesional-argentina
--        liga-mx
--   4. Create/reuse memberships:
--        river-plate  → liga-profesional-argentina
--        boca-juniors → liga-profesional-argentina
--        toluca       → liga-mx
--        (joined_at = NULL)
--   5. COMMENT ON COLUMN organizations.sport
--
-- Explicitly NOT in scope:
--   DROP / RENAME / ALTER organizations.sport
--   organizations.sport_id
--   sports catalog mutation (no football row; no soccer rename)
--   UPDATE organizations.sport values
--   cup / international competitions
--   external provider identifiers
--   application / Drizzle cutover
--   Migration 019b physical DROP
--
-- Normalization (documentation only — no sports mutation):
--   legacy organizations.sport = 'football'
--     → canonical sports.slug = 'soccer'
--
-- Frozen sequence:
--   019a = canonical data + COMMENT (this migration)
--   App  = remove organizations.sport from Drizzle / types
--   Gate = memberships + derivation + zero consumers
--   019b = physical DROP — BLOCKED until gates PASS
--
-- Tables affected:
--   competitions (INSERT if absent / compatible reuse)
--   competition_organizations (INSERT if absent / reuse)
--   organizations (COMMENT ON COLUMN sport only)
--
-- Tables NOT mutated:
--   sports (read-only verify)
--
-- EEP impact: none
-- Existing organizations.sport data impact: none (values unchanged)
--
-- Idempotency (safe re-run):
--   - soccer / org validations pass again
--   - compatible competitions reused (no duplicate / no UPDATE)
--   - memberships reused via UNIQUE (competition_id, organization_id)
--   - COMMENT safely reapplied
--   - final canonical state unchanged
--
-- Conflict handling:
--   If competitions.slug exists with incompatible
--   name / sport_id / competition_type / country_code / is_active
--   → RAISE EXCEPTION (no silent overwrite)
--
-- Rollback philosophy (comments only — no destructive SQL):
--   - COMMENT removal is soft/reversible
--   - canonical competitions/memberships must NOT be
--     automatically deleted after application/product adoption
--   - any future data rollback requires explicit dependency
--     verification (seasons, matches, fan_competitions, etc.)
--   - physical removal of organizations.sport is Migration 019b only
-- =====================================================

-- =====================================================
-- Fail-fast + create/reuse competitions + memberships
-- =====================================================

DO $$
DECLARE
  soccer_count integer;
  soccer_id uuid;

  org_count integer;
  org_river_id uuid;
  org_boca_id uuid;
  org_toluca_id uuid;

  comp_ar_id uuid;
  comp_mx_id uuid;

  existing_name text;
  existing_sport_id uuid;
  existing_type text;
  existing_country text;
  existing_active boolean;
BEGIN
  -- -------------------------------------------------
  -- 1. Canonical soccer sport (exactly one)
  -- -------------------------------------------------
  SELECT COUNT(*) INTO soccer_count
  FROM sports
  WHERE slug = 'soccer';

  IF soccer_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019a FAIL-FAST: sports.slug = ''soccer'' must resolve to exactly one row (found %). Do not create football; do not rename soccer.',
      soccer_count;
  END IF;

  SELECT id INTO soccer_id
  FROM sports
  WHERE slug = 'soccer';

  -- -------------------------------------------------
  -- 2. Required organizations by slug (exactly one each)
  -- -------------------------------------------------
  SELECT COUNT(*) INTO org_count
  FROM organizations
  WHERE slug = 'river-plate';

  IF org_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019a FAIL-FAST: organizations.slug = ''river-plate'' must resolve to exactly one row (found %).',
      org_count;
  END IF;

  SELECT id INTO org_river_id
  FROM organizations
  WHERE slug = 'river-plate';

  SELECT COUNT(*) INTO org_count
  FROM organizations
  WHERE slug = 'boca-juniors';

  IF org_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019a FAIL-FAST: organizations.slug = ''boca-juniors'' must resolve to exactly one row (found %).',
      org_count;
  END IF;

  SELECT id INTO org_boca_id
  FROM organizations
  WHERE slug = 'boca-juniors';

  SELECT COUNT(*) INTO org_count
  FROM organizations
  WHERE slug = 'toluca';

  IF org_count <> 1 THEN
    RAISE EXCEPTION
      'Migration 019a FAIL-FAST: organizations.slug = ''toluca'' must resolve to exactly one row (found %).',
      org_count;
  END IF;

  SELECT id INTO org_toluca_id
  FROM organizations
  WHERE slug = 'toluca';

  -- -------------------------------------------------
  -- 3a. Competition: liga-profesional-argentina
  -- -------------------------------------------------
  SELECT c.id, c.name, c.sport_id, c.competition_type, c.country_code, c.is_active
  INTO comp_ar_id, existing_name, existing_sport_id, existing_type, existing_country, existing_active
  FROM competitions c
  WHERE c.slug = 'liga-profesional-argentina';

  IF FOUND THEN
    IF existing_name IS DISTINCT FROM 'Liga Profesional Argentina'
       OR existing_sport_id IS DISTINCT FROM soccer_id
       OR existing_type IS DISTINCT FROM 'INTEGRATED'
       OR existing_country IS DISTINCT FROM 'AR'
       OR existing_active IS DISTINCT FROM TRUE
    THEN
      RAISE EXCEPTION
        'Migration 019a FAIL-FAST: competitions.slug = ''liga-profesional-argentina'' exists with conflicting canonical semantics (name=%, sport_id=%, competition_type=%, country_code=%, is_active=%). Expected name=''Liga Profesional Argentina'', sport_id=soccer(%), competition_type=''INTEGRATED'', country_code=''AR'', is_active=TRUE. Refusing to overwrite.',
        existing_name, existing_sport_id, existing_type, existing_country, existing_active, soccer_id;
    END IF;
    -- compatible → reuse (no UPDATE)
  ELSE
    INSERT INTO competitions (
      sport_id,
      name,
      slug,
      competition_type,
      country_code,
      is_active
    )
    VALUES (
      soccer_id,
      'Liga Profesional Argentina',
      'liga-profesional-argentina',
      'INTEGRATED',
      'AR',
      TRUE
    )
    RETURNING id INTO comp_ar_id;
  END IF;

  -- -------------------------------------------------
  -- 3b. Competition: liga-mx
  -- -------------------------------------------------
  SELECT c.id, c.name, c.sport_id, c.competition_type, c.country_code, c.is_active
  INTO comp_mx_id, existing_name, existing_sport_id, existing_type, existing_country, existing_active
  FROM competitions c
  WHERE c.slug = 'liga-mx';

  IF FOUND THEN
    IF existing_name IS DISTINCT FROM 'Liga MX'
       OR existing_sport_id IS DISTINCT FROM soccer_id
       OR existing_type IS DISTINCT FROM 'INTEGRATED'
       OR existing_country IS DISTINCT FROM 'MX'
       OR existing_active IS DISTINCT FROM TRUE
    THEN
      RAISE EXCEPTION
        'Migration 019a FAIL-FAST: competitions.slug = ''liga-mx'' exists with conflicting canonical semantics (name=%, sport_id=%, competition_type=%, country_code=%, is_active=%). Expected name=''Liga MX'', sport_id=soccer(%), competition_type=''INTEGRATED'', country_code=''MX'', is_active=TRUE. Refusing to overwrite.',
        existing_name, existing_sport_id, existing_type, existing_country, existing_active, soccer_id;
    END IF;
    -- compatible → reuse (no UPDATE)
  ELSE
    INSERT INTO competitions (
      sport_id,
      name,
      slug,
      competition_type,
      country_code,
      is_active
    )
    VALUES (
      soccer_id,
      'Liga MX',
      'liga-mx',
      'INTEGRATED',
      'MX',
      TRUE
    )
    RETURNING id INTO comp_mx_id;
  END IF;

  -- -------------------------------------------------
  -- 4. Memberships (create if absent; reuse if present)
  --    UNIQUE (competition_id, organization_id)
  --    joined_at = NULL for new Foundation rows
  -- -------------------------------------------------
  INSERT INTO competition_organizations (
    competition_id,
    organization_id,
    joined_at
  )
  VALUES
    (comp_ar_id, org_river_id, NULL),
    (comp_ar_id, org_boca_id, NULL),
    (comp_mx_id, org_toluca_id, NULL)
  ON CONFLICT ON CONSTRAINT competition_organizations_unique_membership
  DO NOTHING;
END $$;

-- =====================================================
-- 5. Deprecate organizations.sport (COMMENT only)
-- =====================================================
-- Column remains physically present.
-- Type / nullability / default unchanged.
-- Row values unchanged.
-- Physical DROP is Migration 019b only.
-- =====================================================

COMMENT ON COLUMN organizations.sport IS
'DEPRECATED (ADR-004 / Migration 019a). Non-authoritative. Canonical organization competition and sport context is derived via competition_organizations → competitions → sports. Must not be used as canonical sport ownership. Physical removal is Migration 019b only.';

-- =====================================================
-- Post-migration validation (manual)
-- =====================================================
-- The two competitions and three memberships are durable
-- Foundation canonical data. Do NOT delete them as cleanup.
--
-- Record baselines BEFORE execution where noted
-- (sports count, organizations count, organizations.sport
--  value distribution, unrelated competition/membership counts).
--
-- 1. sports.slug = soccer still exactly one row
--   SELECT COUNT(*) AS soccer_count
--   FROM sports WHERE slug = 'soccer';
--   -- expect: 1
--
-- 2. no sports.slug = football created
--   SELECT COUNT(*) AS football_count
--   FROM sports WHERE slug = 'football';
--   -- expect: 0
--
-- 3. sport catalog count unchanged vs pre-019a baseline
--   SELECT COUNT(*) AS sports_total FROM sports;
--   -- expect: same as pre-019a (typically 11)
--
-- 4–10. Approved competitions
--   SELECT c.slug, c.name, c.competition_type, c.country_code,
--          c.is_active, s.slug AS sport_slug
--   FROM competitions c
--   JOIN sports s ON s.id = c.sport_id
--   WHERE c.slug IN ('liga-profesional-argentina', 'liga-mx')
--   ORDER BY c.slug;
--   -- expect exactly 2 rows:
--   --   liga-mx | Liga MX | INTEGRATED | MX | true | soccer
--   --   liga-profesional-argentina | Liga Profesional Argentina
--   --     | INTEGRATED | AR | true | soccer
--
--   SELECT slug, COUNT(*) FROM competitions
--   WHERE slug IN ('liga-profesional-argentina', 'liga-mx')
--   GROUP BY slug;
--   -- expect: one row per slug with count = 1
--
-- 11–14. Approved memberships (no duplicates)
--   SELECT o.slug AS org_slug, c.slug AS competition_slug, m.joined_at
--   FROM competition_organizations m
--   JOIN organizations o ON o.id = m.organization_id
--   JOIN competitions c ON c.id = m.competition_id
--   WHERE o.slug IN ('river-plate', 'boca-juniors', 'toluca')
--     AND c.slug IN ('liga-profesional-argentina', 'liga-mx')
--   ORDER BY o.slug;
--   -- expect exactly 3 rows:
--   --   boca-juniors | liga-profesional-argentina | NULL
--   --   river-plate  | liga-profesional-argentina | NULL
--   --   toluca       | liga-mx                     | NULL
--
--   SELECT o.slug, c.slug, COUNT(*) AS n
--   FROM competition_organizations m
--   JOIN organizations o ON o.id = m.organization_id
--   JOIN competitions c ON c.id = m.competition_id
--   WHERE (o.slug, c.slug) IN (
--     ('river-plate', 'liga-profesional-argentina'),
--     ('boca-juniors', 'liga-profesional-argentina'),
--     ('toluca', 'liga-mx')
--   )
--   GROUP BY o.slug, c.slug;
--   -- expect: each pair count = 1
--
-- 15. Unrelated competitions/memberships untouched
--   Compare pre/post counts excluding the two approved slugs /
--   three approved membership pairs. Deltas must be zero for
--   unrelated rows (019a must not delete or rewrite them).
--
-- 16–18. organizations.sport still present / unchanged structurally
--        and data unchanged
--   SELECT column_name, data_type, is_nullable, column_default
--   FROM information_schema.columns
--   WHERE table_schema = 'public'
--     AND table_name = 'organizations'
--     AND column_name = 'sport';
--   -- expect: text, NOT NULL (is_nullable = 'NO'),
--   --         default '''football''::text' (or equivalent)
--
--   SELECT sport, COUNT(*)::int AS n
--   FROM organizations
--   GROUP BY sport
--   ORDER BY sport;
--   -- expect: unchanged vs pre-019a baseline
--   --         (current tenants: football × 3)
--
-- 19. DEPRECATED comment present
--   SELECT col_description('public.organizations'::regclass,
--     (SELECT attnum FROM pg_attribute
--      WHERE attrelid = 'public.organizations'::regclass
--        AND attname = 'sport'
--        AND NOT attisdropped));
--   -- expect text containing:
--   --   DEPRECATED, ADR-004, Migration 019a,
--   --   competition_organizations, competitions, sports, 019b
--
-- 20. Organization count unchanged
--   SELECT COUNT(*) AS organizations_total FROM organizations;
--   -- expect: same as pre-019a baseline (typically 3)
--
-- 21. Canonical sport derivation for River / Boca / Toluca
--   SELECT o.slug AS org_slug,
--          c.slug AS competition_slug,
--          s.slug AS sport_slug
--   FROM organizations o
--   JOIN competition_organizations m ON m.organization_id = o.id
--   JOIN competitions c ON c.id = m.competition_id
--   JOIN sports s ON s.id = c.sport_id
--   WHERE o.slug IN ('river-plate', 'boca-juniors', 'toluca')
--   ORDER BY o.slug, c.slug;
--   -- expect each org derives sport_slug = 'soccer' via membership
--   -- River/Boca → liga-profesional-argentina → soccer
--   -- Toluca → liga-mx → soccer
--
-- Idempotency re-run check:
--   Re-execute this migration file.
--   Expect: success; no duplicate competitions/memberships;
--   COMMENT still present; counts unchanged.
-- =====================================================

COMMIT;

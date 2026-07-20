# Session Summary

Date:

2026-07-17

---

## Goal

Complete Foundation Database v1 Migration 012 — Match Center Foundation (`seasons`, `matches`, `standings`).

---

## Completed Work

- Architecture Review approved (seasons + matches + standings; divisions deferred)
- Venues evaluation — Option C (defer entirely)
- Competition Structure deferred to a future ADR
- Normalization decision — Option B: no denormalized `competition_id` on `matches` / `standings`
- Design Brief approved and consistency-verified
  - `docs/sessions/2026-07-17-migration-012-match-center-design.md`
- SQL generated, human-reviewed, executed and validated in Neon
  - `database/migrations/foundation-v1/012_create_match_center.sql`
- Validation: 93/93 checks passed
- Documentation updated to mark Migration 012 complete

### `seasons`

- Columns: `id`, `competition_id`, `name`, `starts_at`, `ends_at`, `created_at`, `updated_at`
- FK `competition_id` → `competitions.id` ON DELETE RESTRICT
- CHECK `seasons_dates_check`
- UNIQUE INDEX `seasons_competition_name_unique` ON `(competition_id, lower(name))`
- Index `seasons_competition_idx`

### `matches`

- Columns: `id`, `season_id`, home/away org, `starts_at`, `status`, scores, timestamps
- **No `competition_id`**
- Status default `scheduled`; CHECK for five lowercase values
- FKs RESTRICT to `seasons` and `organizations`
- Indexes: season, season+starts_at, status, home org, away org

### `standings`

- Columns: `id`, `season_id`, `organization_id`, W/D/L/played/points, timestamps
- **No `competition_id`**
- UNIQUE `(season_id, organization_id)`
- Persisted snapshots only — no SQL calculation
- Indexes: season, organization, season+points DESC

---

## Decisions

- Match Center is competition-scoped (not org-tenant-rooted)
- `season_id` is the single source of truth for competition ownership on children
- Fixtures = `matches` table (no separate fixtures entity)
- Managed and Integrated share the same schema
- Deferred: divisions, venues, competition structure, `content.match_id`, provider metadata, match events/stats
- Future ADR required: Competition Structure

---

## Files

```txt
docs/sessions/2026-07-17-migration-012-match-center-design.md
docs/sessions/2026-07-17-migration-012-match-center.md
database/migrations/foundation-v1/012_create_match_center.sql
```

Documentation updated:

```txt
docs/04-database/current-schema.md
docs/04-database/physical-model-v1.md
docs/04-database/gap-analysis.md
docs/04-database/migration-plan-v1.md
docs/04-database/foundation-db-backlog.md
PROJECT_STATE.md
```

---

## Validation

Executed and validated in Neon. Highlights:

- Tables exist; no `competition_id` on `matches` / `standings`
- All RESTRICT FKs and CHECKs present
- All approved indexes present
- Valid path: competition → season → match → standing
- Competition readable only via `JOIN seasons`
- Rejects: bad dates, duplicate season name, home=away, invalid status, negative scores/points, duplicate standing
- RESTRICT blocks delete of season / org / competition when children exist
- No seed data; validation rows cleaned up

---

## Next Steps

1. Human review and commit documentation + SQL
2. **Migration 013 — EEP Audiences: Architecture Review only**
   - ADR-003
   - Planned tables: `audiences`, `fan_audiences`
   - Do not generate Design Brief or SQL until Architecture Review is approved
3. Keep Competition Structure ADR on the backlog (post–Match Center)
4. Keep `sponsor_competitions` on 010b backlog

# Session Summary

Date:

2026-06-08

---

## Goal

Implement Foundation Database v1 Migration 009 — organization-scoped redemptions transactional table (`redemptions`).

---

## Completed Work

- Generated `009_create_redemptions.sql` per approved design brief:
  - Columns: `id`, `organization_id`, `fan_id`, `reward_id`, `status`, `points_cost`, `redeemed_at`, `created_at`, `updated_at`
  - FK `organization_id` → `organizations.id` ON DELETE RESTRICT
  - FK `fan_id` → `fans.id` ON DELETE RESTRICT
  - FK `reward_id` → `rewards.id` ON DELETE RESTRICT
  - CHECK `redemptions_status_check` — `pending`, `approved`, `fulfilled`, `rejected`, `cancelled`
  - CHECK `redemptions_points_cost_check` — `points_cost >= 1`
  - Default status: `pending`
  - Default `redeemed_at`: `NOW()`
  - Indexes:
    - `redemptions_organization_redeemed_at_idx` ON `(organization_id, redeemed_at)`
    - `redemptions_organization_status_idx` ON `(organization_id, status)`
    - `redemptions_fan_id_idx` ON `(fan_id)`
    - `redemptions_reward_id_idx` ON `(reward_id)`
    - `redemptions_organization_fan_idx` ON `(organization_id, fan_id)`
- No seed data, ledger_entry_id, fan_event_id, stock decrement, points debit, triggers, or procedures
- Updated `foundation-db-backlog.md` — Phase 5 redemptions execution status

---

## Decisions

- Expand-only migration: `redemptions` table only
- All FKs use RESTRICT — preserve transactional history
- `points_cost` is a required snapshot at claim time
- Lowercase workflow statuses; terminal status is `fulfilled` (not `delivered`)
- Points debit timing, stock decrement timing, and redemption workflow deferred to application layer
- SQL not executed in this session — pending human approval and Neon execution

---

## Files Modified

- `database/migrations/foundation-v1/009_create_redemptions.sql`
- `docs/04-database/foundation-db-backlog.md`
- `docs/sessions/2026-06-08-migration-009-redemptions.md`

---

## Validation Plan (post-execution)

### Schema

- [ ] Table `redemptions` exists (`\d redemptions`)
- [ ] `SELECT COUNT(*) FROM redemptions` returns 0 (no seed)
- [ ] Columns `organization_id`, `fan_id`, `reward_id` NOT NULL
- [ ] Column `status` NOT NULL, default `pending`
- [ ] Column `points_cost` NOT NULL
- [ ] Column `redeemed_at` NOT NULL with default
- [ ] Columns `created_at`, `updated_at` NOT NULL with defaults
- [ ] Constraint `redemptions_status_check` rejects invalid values (e.g. `delivered`, `PENDING`)
- [ ] Constraint `redemptions_status_check` accepts all five approved values
- [ ] Constraint `redemptions_points_cost_check` rejects `points_cost < 1`
- [ ] FK `redemptions_organization_fk` uses ON DELETE RESTRICT
- [ ] FK `redemptions_fan_fk` uses ON DELETE RESTRICT
- [ ] FK `redemptions_reward_fk` uses ON DELETE RESTRICT
- [ ] Index `redemptions_organization_redeemed_at_idx` exists
- [ ] Index `redemptions_organization_status_idx` exists
- [ ] Index `redemptions_fan_id_idx` exists
- [ ] Index `redemptions_reward_id_idx` exists
- [ ] Index `redemptions_organization_fan_idx` exists
- [ ] No standalone `redemptions_organization_id_idx` (intentionally omitted)
- [ ] No triggers or procedures created
- [ ] Re-run is idempotent

### Data

- [ ] Valid insert with `organization_id`, `fan_id`, `reward_id`, `points_cost = 100` succeeds
- [ ] Default `status = 'pending'` on insert without explicit status
- [ ] Default `redeemed_at` populated on insert
- [ ] Insert with each approved status value succeeds
- [ ] Insert without `points_cost` rejected
- [ ] Insert with `points_cost = 0` rejected
- [ ] Insert with `points_cost = -1` rejected
- [ ] Insert with invalid `organization_id` rejected
- [ ] Insert with invalid `fan_id` rejected
- [ ] Insert with invalid `reward_id` rejected
- [ ] `DELETE FROM organizations` blocked when redemptions rows exist (RESTRICT)
- [ ] `DELETE FROM fans` blocked when redemptions rows exist (RESTRICT)
- [ ] `DELETE FROM rewards` blocked when redemptions rows exist (RESTRICT)

---

## Next Steps

1. Human review and commit
2. Execute `009_create_redemptions.sql` against Neon
3. Run validation plan
4. Update `current-schema.md`, `gap-analysis.md`, `physical-model-v1.md`, `PROJECT_STATE.md`
5. Begin redemption service design (application layer — parallel track)

# Session Summary

Date:

2026-06-08

---

## Goal

Review Foundation DB v1 migration numbering and fan identity strategy after completion of Migrations 001–005.

Align documentation with the approved decision that Fan Profile Foundation must precede Benefits / Rewards, and that `fans` remains the canonical identity and declarative profile entity.

---

## Findings

- `migration-plan-v1.md` assigned Migration 006 to `benefits`, while `PROJECT_STATE.md` referenced `006_fan_profiles` and Fan Profile Foundation as the current phase.
- Domain, logical, and physical models define a single Fan entity. No `fan_profiles` table exists in the target architecture.
- Migrations 001–005 established `fan_organizations`, sports/competition hierarchy, and fan interests, but the `fans` table itself is not yet aligned with the physical model or onboarding requirements.
- Neon/Drizzle `fans` includes operational columns (`status`, `display_name`, EEP sync fields, segmentation caches) not previously documented in `physical-model-v1.md`.
- Neon/Drizzle is missing target profile columns: `avatar_url`, `country_code` (legacy `country` exists instead).
- `fans.organization_id` remains in use by the application layer and is deprecated per Migration 001; removal belongs to a future contract phase.
- Documentation lag exists for Migration 005 in `current-schema.md` and `gap-analysis.md` (out of scope for this session).

---

## Decisions

Approved:

```txt
fans remains the canonical identity and declarative profile entity

No fan_profiles table will be introduced

organization_id on fans is DEPRECATED

Removal of organization_id belongs to future contract migrations after fan_organizations adoption

Fan Profile Foundation (Migration 006) must occur before Benefits / Rewards / Redemptions

Benefits shifts to Migration 007

Rewards shifts to Migration 008

Redemptions shifts to Migration 009

Subsequent migrations renumbered consistently through contract phase (017–019)
```

---

## Documentation Updates

- `docs/04-database/migration-plan-v1.md` — inserted Migration 006 Fan Profile Foundation; renumbered 007–016 and contract phase 017–019; added numbering rationale
- `docs/04-database/physical-model-v1.md` — aligned `fans` with core identity, profile, lifecycle, deprecated `organization_id`, and operational column notes
- `docs/04-database/foundation-db-backlog.md` — added Phase 4 Fan Profile Foundation; shifted loyalty and subsequent phases; added migration references
- `PROJECT_STATE.md` — corrected current and next migration numbering

---

## Next Steps

1. Resolve open design questions before SQL generation (see Migration 006 readiness checklist)
2. Update `current-schema.md` and `gap-analysis.md` for fan profile and Migration 005 completion
3. Draft Migration 006 design brief and request human approval per `AI_RULES.md`
4. Generate `006_fan_profile_foundation.sql` after approval
5. Execute against Neon, validate, and update documentation post-migration

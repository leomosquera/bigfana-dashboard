# Session Summary

Date:

2026-07-19

---

## Goal

Controlled Drizzle / TypeScript representation cleanup after Migration 019 and the F05–F09 Drizzle ↔ Neon Representation Review.

Align application representation with the existing live Neon schema where the correct contract is already known.

---

## Scope

```txt
F05      — false pgEnum → TEXT (+ TS unions)
F06      — MembershipRole → Neon CHECK (owner/admin/tenant/analyst)
F07a     — map fans.avatar_url
F07b     — map fans.country_code (no functional cutover)
F09      — align Drizzle indexes with Neon physical indexes
NEW-F15  — timestamp without time zone representation (fans / fan_events / integration_jobs)
NEW-F16  — fans.display_name nullability
```

Explicitly deferred:

```txt
F08 — sports / competitions / competition_organizations Drizzle schemas
```

---

## Critical invariants preserved

```txt
Neon physical schema: UNCHANGED
No SQL / DDL / DML generated or executed
No Migration 020 started / frozen / reserved
fans.organization_id: ABSENT
organizations.sport: ABSENT
organizations.sport_id: ABSENT
fan_organizations = sole fan ↔ organization relationship SoT
organization sport path: competition_organizations → competitions → sports
```

---

## Completed work

### F05

- Removed false `pgEnum` column mappings from `fans` and `integration_jobs`
- Replaced with `text().$type<...>()` plus exported value constants / unions
- Preserved CHECK-aligned values for status domains
- Documented provider/operation as application-supported unions (Neon TEXT, no CHECK)
- Unused Neon PG type `fan_status` left untouched (optional DB hygiene debt)

### F06

- Canonical `MembershipRole` aligned to Neon CHECK: `owner | admin | tenant | analyst`
- Removed stale `manager` / `member` from the TypeScript contract
- Pre-change audit: no runtime RBAC branches depended on `manager` / `member`

### F07a / F07b

- Mapped `avatarUrl: text("avatar_url")` (nullable)
- Mapped `countryCode: text("country_code")` (nullable)
- Kept legacy `country` mapped and in use
- No FanForm / create-update country cutover

### NEW-F15

Aligned Drizzle timestamps (removed `withTimezone: true`) for:

```txt
fans.eep_last_sync_at
fans.created_at
fans.updated_at
fan_events.occurred_at
fan_events.created_at
integration_jobs.next_retry_at
integration_jobs.processed_at
integration_jobs.created_at
integration_jobs.updated_at
```

Out of scope (remaining optional debt): `withTimezone` still present in auth / gamification / campaigns / segments schemas.

### NEW-F16

- Removed false `.notNull()` on `fans.displayName`
- Minimal null-safe UI/API type fallout only (no global display-name product rule)

### F09

- Removed false composite index declarations from Drizzle
- Declared physical Neon indexes:
  - `idx_fan_events_fan` / `idx_fan_events_org` / `idx_fan_events_type`
  - `idx_integration_jobs_status` / `idx_integration_jobs_org`
- Preserved `idempotency_key` unique constraint mapping
- No indexes created in Neon

---

## Validation

```txt
npx tsc --noEmit                                              PASS
npm run build                                                 PASS
scoped eslint on modified TS/TSX                              PASS (0 errors; 1 pre-existing unused import warning in FanProfileDrawer)
npx tsx --test src/server/queries/fan-organizations.test.ts   PASS (8/8)
```

No membership/session unit tests exist for F06.

---

## Contract impact notes

```txt
Full-row fans selects (e.g. getFanById / listFansForOrganization → FanView)
now include avatarUrl and countryCode on the inferred type.

APIs / forms that intentionally omit those fields were not changed to write them.
country functional cutover remains a separate future phase.
```

---

## Migration 020

```txt
NOT STARTED
NO FROZEN / RESERVED SCOPE
```

Possible future DDL remains separate optional debt and is NOT assigned to Migration 020:

```txt
unused fan_status PG type cleanup
membership role CHECK expansion (only if product requires it)
performance composite indexes (only with evidence)
fans.country retirement
display_name NOT NULL (only with explicit contract decision)
```

---

## Final status by finding

```txt
F05      COMPLETE
F06      COMPLETE
F07a     COMPLETE
F07b     COMPLETE (mapping only; cutover NOT started)
F08      DEFERRED intentionally
F09      COMPLETE
NEW-F15  COMPLETE (in-scope tables)
NEW-F16  COMPLETE
```

---

## Related documents

- PROJECT_STATE.md
- docs/04-database/current-schema.md
- docs/04-database/gap-analysis.md
- docs/04-database/foundation-db-backlog.md
- ADR-001 / ADR-002 / ADR-004 / ADR-005 / ADR-009

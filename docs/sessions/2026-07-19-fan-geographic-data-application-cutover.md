# Session Summary — Block D

Date:

2026-07-19

---

## Goal

Application cutover from legacy `fans.country` to canonical `fans.country_code`
(ISO-3166-1 alpha-2), per Architecture Review:

```txt
docs/sessions/2026-07-19-fan-geographic-data-contract-architecture-review.md
```

---

## Scope completed

```txt
WRITE cutover  — create/update write country_code only
READ cutover   — UI/table/drawer use country_code + derived labels
FanForm        — ISO-aware Select (labels via Intl.DisplayNames es)
Drizzle unmap  — fans.country removed from schema mapping
Docs           — SoT status aligned
```

Explicitly out of scope / not done:

```txt
Neon DDL / DML
DROP fans.country
Migration 020
EEP payload expansion
organizations.country changes
competitions.countryCode changes
```

---

## Contract final

### Create / update

```txt
Input: countryCode?: string  (ISO-2 or empty)
Persist: fans.country_code = normalize(ISO-2) | NULL
Never write: fans.country
```

### Read / display

```txt
Storage: fan.countryCode
Label:   getCountryLabel(countryCode) via Intl.DisplayNames('es')
Surfaces: FanForm, FanProfileDrawer, FansClient location column
```

### Drizzle

```txt
Mapped:   countryCode → country_code
Unmapped: country (physical column remains in Neon)
```

---

## ISO selector strategy

```txt
src/lib/country-codes.ts
  - curated ISO alpha-2 catalog
  - normalizeCountryCode / isInvalidCountryCodeInput
  - getCountryLabel(code, locale='es') via Intl.DisplayNames
  - getCountrySelectOptions() sorted by Spanish label
FanForm Select shows country names; persists code only
  - includes "Sin país" empty option → NULL
```

---

## Files created / modified

Created:

```txt
src/lib/country-codes.ts
docs/sessions/2026-07-19-fan-geographic-data-application-cutover.md
```

Modified:

```txt
src/db/schema/fans.ts
src/server/services/fans.ts
src/server/actions/fans.ts
src/components/fans/FanForm.tsx
src/components/fans/FanProfileDrawer.tsx
src/app/dashboard/fans/FansClient.tsx
docs/04-database/current-schema.md
docs/04-database/gap-analysis.md
docs/04-database/foundation-db-backlog.md
PROJECT_STATE.md
```

---

## Validation

```txt
npx tsc --noEmit                                              PASS
npm run build                                                 PASS
scoped eslint                                                 PASS (0 errors; 1 pre-existing Gift unused warning in FanProfileDrawer)
npx tsx --test src/server/queries/fan-organizations.test.ts   PASS (8/8)
```

---

## Neon / Migration 020

```txt
Neon DDL at Block D time: NONE
Neon DML at Block D time: NONE
fans.country physical column at Block D time: STILL PRESENT
Later: physical DROP COMPLETE — see 2026-07-20-legacy-fan-country-physical-removal.md
Migration 020: NOT STARTED / NO FROZEN SCOPE
```

---

## Remaining debt (not this block)

```txt
Physical DROP fans.country — COMPLETE (2026-07-20 completion session)
fan_status PG type hygiene
evidence-based indexes
NEW-F18 broader feature-driven Drizzle mapping
```

---

## Related

- Block C architecture review session
- Migration 006 fan profile foundation

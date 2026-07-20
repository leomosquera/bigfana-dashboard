# Fan Intelligence F3A — Activity Intelligence

Date:

2026-07-20

Status:

```txt
IMPLEMENTED
F3A Activity Intelligence COMPLETE
NO SCHEMA CHANGES
NO DRIZZLE / NEON DDL
NO UNIFIED TIMELINE
MIGRATION 020: NOT STARTED / NO FROZEN SCOPE
```

Branch:

```txt
feature/foundation-db-v1
```

Based on audit:

```txt
docs/sessions/2026-07-20-fan-intelligence-f3-audit.md
```

---

## Executive summary

Implemented Fan 360 Activity Intelligence on real `fan_events` only:

1. **Fixed** `Interacciones 30d` — no longer uses `fan_points_ledger` row counts.
2. Added honest **Activity Summary** (totals, 30d, active days 30d, most frequent type, last activity).
3. Added **30d trend** (zero-filled daily interactions) with compact Recharts chart.
4. Added **breakdown by real `event_type`** (label + count + % of events).
5. Added factual **recency** copy from `lastActivityAt`.
6. Kept Activity / Gamification / Campaigns as separate surfaces.
7. PRIMARY: points obtained 30d under Gamification; FOLLOWING: activity yes, loyalty no; timeline hides `+pts`.

No mock data, no AI/engagement scores, no Migration 020.

---

## Critical KPI bug — previous vs corrected

| | Previous (F2) | Corrected (F3A) |
|---|---|---|
| KPI | Interacciones 30d | Interacciones 30d |
| Formula | `getEngagementVelocity().events30d` = `COUNT(fan_points_ledger rows in window)` | `COUNT(fan_events) WHERE organization_id + fan_id AND occurred_at >= windowStart` |
| FOLLOWING impact | Almost always 0 (no ledger) | Real org activity counts |
| PRIMARY impact | Inflated by manual awards / missed non-point events | True behavioral interactions |

`getEngagementVelocity` left intact for legitimate ledger consumers (demo API, drawer intelligence, Gamification `points30d`).

---

## Final Activity Intelligence data contract

Query: `getFanActivityIntelligence(organizationId, fanId, windowDays?)`

Scope: always `fan_events.organization_id` + `fan_events.fan_id`.

| Field | Source |
|---|---|
| `summary.totalInteractions` | `COUNT(*)` fan_events |
| `summary.interactionsLast30d` | `COUNT(*)` in window |
| `summary.activeDaysLast30d` | Distinct day keys with ≥1 event in window (same bucket as trend) |
| `summary.mostFrequentEventType` | Mode of `event_type` (lifetime) |
| `summary.lastActivityAt` | `MAX(occurred_at)` |
| `summary.daysSinceLast` | Derived from lastActivityAt |
| `trend[]` | Daily counts + zero-fill via `buildFanActivityTrendSeries` / `buildDateKeys` |
| `breakdown[]` | Group by `event_type`, top 5 + Otros, % of total events |
| `recencyLabel` | `formatActivityRecency(...)` |
| `events` | Existing `getFanEventsByFan` (timeline, limit 50) |

Day bucketing: `to_char(date_trunc('day', occurred_at), 'YYYY-MM-DD')` — same approach as Dashboard Home (TIMESTAMP WITHOUT TZ).

---

## Activity Summary implementation

Pure helper: `buildFanActivitySummary` now accepts **only** fan_events aggregates (no velocity/ledger).

UI: compact 4-cell strip inside Actividad (Totales / Últimos 30d / Días activos / Tipo frecuente).

Empty: most frequent → “Sin actividad”; totals stay 0.

---

## Recency implementation

`formatActivityRecency` — factual phrases only:

- Sin actividad registrada
- Activo hoy
- Última actividad hace N días
- Sin actividad reciente (7–29)
- Sin actividad hace N días (≥30)

Shown under summary + as KPI strip `period` on Última actividad. Not a score.

---

## Activity Trend implementation

- Single series `{ date, interactions }`
- Zero-filled 30 days
- Component: `FanActivityTrendChart` (crimson accent, dark mode)
- Empty: “No hay actividad registrada en los últimos 30 días.”
- No points series mixed in

---

## Activity Breakdown implementation

- Component: `FanActivityBreakdown`
- Horizontal progress rows: label, count, % of total events
- Lifetime grouping (audit recommendation)
- No invented categories

---

## Event type label strategy

Central helper: `formatFanEventTypeLabel`

| event_type | Label |
|---|---|
| `campaign_engagement` | Participación en campañas |
| unknown | `formatEventTypeLabel` fallback (underscores → spaces) |

Does **not** map NFC / RFID / Check-in / Purchase / Trivia fiction unless those strings appear as real `event_type` values (then fallback applies).

Timeline colors: only `campaign_engagement` accented; others neutral.

---

## Timeline behavior

Unchanged source: `fan_events` only.

No unified merge with `campaign_responses` or ledger.

`showPoints={gamification.eligible}` — FOLLOWING never shows `+pts` from `fan_events.points`.

---

## Gamification separation

PRIMARY only:

- Balance / level / ledger history
- **Puntos obtenidos · 30d** from `velocity.points30d` (ledger sum)

FOLLOWING: existing ADR-002 neutral message; `velocity = null`.

---

## PRIMARY vs FOLLOWING

| Surface | PRIMARY | FOLLOWING |
|---|---|---|
| Summary / trend / breakdown / timeline | Yes | Yes |
| Campaigns | Yes | Yes |
| Loyalty / points 30d / +pts badges | Yes | No |

---

## Fan 360 final layout

```txt
LEFT
  Actividad (summary → trend → breakdown → timeline)
  Campañas

RIGHT
  Gamificación (+ puntos 30d PRIMARY)
  Segmento
  EEP
  Identidad
```

`items-start` on main content grid, browser page scroll only, timeline capped scroll when long.

### KPI strip equal-height polish (approved)

Cause: `StatCard` only rendered the secondary `period` line when text was present, so “Última actividad” (recency) grew taller than cards without `period`.

Fix (opt-in, Fan 360 only):

- `StatCard` prop `reservePeriodSlot` — always reserves one secondary line
- Fan 360 KPI strip: all five cards use `reservePeriodSlot` + `className="h-full"`
- Grid: `items-stretch`
- Dashboard Home does **not** pass `reservePeriodSlot` — no visual change there

---

## Query architecture

- `getFanActivityIntelligence` — 3 parallel SQL aggregations (totals, breakdown, daily)
- `getFan360Profile` — `Promise.all` events + activity intel + loyalty (conditional) + campaigns + …
- Removed Fan 360 dependency on `getFanBehavioralProfile` for activity KPIs
- Velocity fetched **only** when PRIMARY

---

## Performance

Single-fan aggregations; no new indexes; no cache/materialized views.

---

## Empty states

- Trend empty copy
- Breakdown “Sin tipos…”
- Timeline existing empty
- Summary zeros + “Sin actividad” for type

Honest sparse `campaign_engagement`-only data supported.

---

## Test coverage

`src/lib/fan-intelligence.test.ts`:

- Interactions from fan_events aggregates (not ledger)
- FOLLOWING activity valid without loyalty
- Trend zero-fill + empty
- Breakdown % denominator + Otros
- Unknown label fallback
- Recency formatting
- Org isolation / no legacy columns
- Query source must not compose summary from velocity

Also ran Dashboard Home series/format tests (helpers reused).

---

## Validation results

```txt
npx tsc --noEmit                     PASS
npm run build                        PASS (/dashboard/fans/[id] present)
eslint (F3A modified sources)        PASS
npx tsx --test fan-intelligence +
  dashboard-home series/format       PASS (40)
```

---

## Data limitations observed

- Real writer volume still sparse; often only `campaign_engagement`
- Flat/empty 30d charts are valid
- No seed data added

---

## Remaining F3 / F4 debt

**F3B** — safer event→points correlation via `fan_event_id` (still no unified timeline)

**F3C** — exact org rank (deferred; product tie policy)

**F4** — segment / campaign polish / EEP membership UI after Drizzle+data

---

## Foundation invariant verification

```txt
fans.organization_id          ABSENT
fan_organizations             SoT ownership
PRIMARY / FOLLOWING           ADR-002 unchanged
organizations.sport/sport_id  ABSENT
Canonical sport path          competition_organizations → competitions → sports
fans.country                  ABSENT
fans.country_code             geography SoT
Migration 020                 NOT STARTED / NO FROZEN SCOPE
```

---

## Migration 020 status

```txt
NOT STARTED
NO FROZEN SCOPE
NOT STARTED IN THIS BLOCK
```

---

## Files created

```txt
src/components/fans/FanActivityTrendChart.tsx
src/components/fans/FanActivityBreakdown.tsx
docs/sessions/2026-07-20-fan-intelligence-f3a-activity-intelligence.md
```

## Files modified

```txt
src/lib/fan-intelligence.ts
src/lib/fan-intelligence.test.ts
src/server/queries/fan-intelligence.ts
src/components/fans/FanActivityTimeline.tsx
src/app/dashboard/fans/[id]/Fan360Client.tsx
PROJECT_STATE.md
```

---

## Recommended next step

```txt
Human visual + functional review of Fan 360:
  1) fan with campaign activity
  2) fan with empty activity
Then authorize commit, or proceed to F3B / F4.
```

---

## FINAL STOP CONDITION

```txt
F3A IMPLEMENTATION COMPLETE
NO COMMIT
NO PUSH
NO NEON CHANGES
NO SCHEMA MIGRATION
NO MIGRATION 020 WORK

Await human review before commit authorization.
```

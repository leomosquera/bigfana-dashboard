# Dashboard Home — Phase 1A + 1B Implementation

Date:

2026-07-20

Status:

```txt
IMPLEMENTED AND VALIDATED
NO NEON / SQL / FOUNDATION CHANGES
MIGRATION 020: NOT STARTED / NO FROZEN SCOPE
```

Preceded by:

```txt
docs/sessions/2026-07-20-dashboard-home-command-center-audit.md
```

---

## Scope delivered

```txt
A. Dashboard Home data contract
B. Organization-scoped server queries
C. Real Executive KPI cards (6)
D. Real Recent Activity (fan_events)
E. Mock-only executive widgets removed from Home
```

---

## KPI contracts implemented

| KPI | Source | Formula | Org scope | Window |
|---|---|---|---|---|
| Fans totales | `fan_organizations` ⋈ `fans` | `COUNT(*)` PRIMARY + not archived | `organization_id` | snapshot |
| Nuevos fans | `fan_organizations` ⋈ `fans` | `COUNT(*)` where `COALESCE(joined_at, created_at) ≥ windowStart` | same + PRIMARY | 30d |
| Fans con actividad | `fan_events` ∩ PRIMARY cohort | `COUNT(DISTINCT fan_id)` | event org + PRIMARY | 30d |
| Interacciones | `fan_events` ∩ PRIMARY cohort | `COUNT(*)` | event org + PRIMARY | 30d |
| Campañas activas | `campaigns` | `COUNT(*)` where `status = 'active'` | `organization_id` | snapshot |
| Puntos otorgados | `fan_points_ledger` ∩ PRIMARY cohort | `SUM(points) FILTER (points > 0)` | ledger org + PRIMARY | 30d |

Ownership SoT: `fan_organizations` (ADR-009). Never `fans.organization_id`.

---

## Query module

```txt
src/server/queries/dashboard-home.ts
  getDashboardHomeSnapshot(organizationId, windowDays = 30)
```

Returns typed snapshot:

```txt
{
  organizationId,
  windowDays,
  windowStart,
  kpis: { totalFans, newFans, engagedFans, interactions, activeCampaigns, pointsIssued },
  recentActivity: [{ id, eventType, occurredAt, fanId, fanDisplayName, points, source }]
}
```

Presentation helpers (client-safe):

```txt
src/lib/dashboard-home-format.ts
  resolveFanDisplayName
  formatEventTypeLabel
  formatRelativeTimeEs
```

---

## Organization scoping

```txt
getDashboardContext() → org.id
→ getDashboardHomeSnapshot(org.id)
```

All aggregates filter by organization. Fan metrics require PRIMARY membership + non-archived status.

---

## Recent Activity

- Source: `fan_events`
- Cohort: PRIMARY + non-archived
- Order: `occurred_at DESC`
- Limit: 10
- Display: `{fanDisplayName} — {eventType with underscores → spaces}`
- Empty: "No hay actividad reciente para esta organización."

---

## UI architecture

```txt
src/app/dashboard/page.tsx              — server component
src/components/dashboard/DashboardHomeClient.tsx — client presentational
```

Preserved: `PageShell`, `StatCard`, `Card`, Framer Motion stagger, Spanish labels.

Removed from Home (components kept in repo):

- mock KPI revenue/tickets/spend/sponsors
- CommunityPulse
- LastMatch / TopFans
- RevenueChart / FanSegmentsChart
- TopSponsorsROI / SmartAlerts / RecentTimeline
- ActivityFeed / EngagementHeatmap
- inert time-range Select + Export button

Replaced window control with non-interactive "Últimos 30 días" label.
No fake trend percentages.

---

## Validation

```txt
npx tsc --noEmit                          PASS
npm run build                             PASS (/dashboard dynamic)
npx eslint (modified sources)             PASS
npx tsx --test fan-organizations.test.ts  PASS
npx tsx --test dashboard-home.test.ts     PASS (5)
```

Home mock-data imports: **ZERO** (`page.tsx` + `DashboardHomeClient.tsx`).

---

## Remaining Dashboard Home phases

```txt
Phase 1C — Fan Growth + Activity visualization
Phase 1D — Segments + Campaigns + Gamification summaries
Phase 1E — Integration Health + Geographic Intelligence
```

---

## Risks / technical debt

1. `getUserActiveMembership` still `.limit(1)` without stable order (pre-existing).
2. Optional future index evidence (not created): `(organization_id, occurred_at DESC)` on `fan_events` if Home volume grows.
3. Mock widgets remain in `src/components/dashboard/*` for other pages / future reuse — not rendered on Home.

---

## Migration 020 status

```txt
NOT STARTED
NO FROZEN SCOPE
```

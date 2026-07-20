# Dashboard Home — Phase 1C + 1D + 1E Implementation

Date:

2026-07-20

Status:

```txt
IMPLEMENTED AND VALIDATED
DASHBOARD HOME V1 FUNCTIONALLY COMPLETE WITH NON-BLOCKING DEBT
NO NEON / SQL / FOUNDATION CHANGES
MIGRATION 020: NOT STARTED / NO FROZEN SCOPE
```

Preceded by:

```txt
docs/sessions/2026-07-20-dashboard-home-command-center-audit.md
docs/sessions/2026-07-20-dashboard-home-phase-1a-1b.md
```

---

## Final Dashboard Home V1 structure

```txt
1. Executive KPIs (1A+1B preserved)
2. Fan Growth + Activity charts (1C)
3. Segments + Campaign performance (1D)
4. Gamification snapshot + Integration health (1D/1E)
5. Geographic intelligence — top countries (1E)
6. Recent Activity (1A+1B preserved)
```

---

## Architecture

```txt
page.tsx (server)
  → getDashboardContext()
  → Promise.all(
      getDashboardHomeSnapshot(org.id)   // KPIs, series, geo, integrations, activity
      getSegmentDistribution(org.id)     // reuse
      listCampaignsWithStats(org.id)     // reuse
      getOrgEngagementKPIs(org.id)       // reuse
      getOrgLeaderboard(org.id, 5)       // reuse
    )
  → DashboardHomeClient
```

Ownership SoT for all fan metrics: `fan_organizations` PRIMARY + non-archived.

---

## Chart contracts

### Fan Growth

```txt
Source: fan_organizations ⋈ fans
Date:   COALESCE(joined_at, created_at)
Series: daily newFans + cumulativeFans over 30 UTC/calendar days
Base:   COUNT(*) with membership date < windowStart (included in cumulative)
Fill:   missing days → newFans = 0
```

### Activity

```txt
Source: fan_events ∩ PRIMARY cohort
Series: daily interactions (COUNT *) + engagedFans (COUNT DISTINCT fan_id)
Fill:   missing days → zeros
```

Pure transforms: `src/lib/dashboard-home-series.ts`

---

## Domain reuse

| Section | Query |
|---|---|
| Segments | `getSegmentDistribution` — top 5 |
| Campaigns | `listCampaignsWithStats` — top 5 by active then responses |
| Gamification | `getOrgEngagementKPIs` + `getOrgLeaderboard(5)` |
| Integrations | new org-scoped aggregate on `integration_jobs` |
| Geography | new PRIMARY cohort group by `fans.country_code` |

---

## Integration health

```txt
Statuses (Neon CHECK): pending | processing | synced | failed | retrying
Scope: integration_jobs.organization_id = current org
Rules:
  total = 0              → Sin trabajos
  failed > 0 | retrying > 0 → Requiere atención
  else                   → Operativo
```

No retry controls on Home.

---

## Geographic intelligence

```txt
Top 5 countries by fanCount
knownGeographyCount / unknownGeographyCount / totalFans
percentage = fanCount / knownGeographyCount  (explicitly “de conocidos”)
Labels via getCountryLabel(code, "es")
No map / heatmap
```

---

## Validation

```txt
npx tsc --noEmit                         PASS
npm run build                            PASS
eslint (modified sources)                PASS
fan-organizations + dashboard-home +
  dashboard-home-series tests            PASS (20)
Home mock-data imports                   ZERO
```

---

## Deferred (out of Home V1)

```txt
Commerce / Revenue / Ticketing / Avg spend
Sponsor ROI
Match operations
Geo map / heatmap
EEP sync worker
Org switcher
Header notifications
```

---

## Technical debt (non-blocking)

1. Multi-membership `.limit(1)` without stable order (pre-existing).
2. Optional future indexes (not created): `fan_events(organization_id, occurred_at)`, membership day aggregates.
3. Legacy mock widgets remain in repo unused by Home.

---

## Migration 020 status

```txt
NOT STARTED
NO FROZEN SCOPE
```

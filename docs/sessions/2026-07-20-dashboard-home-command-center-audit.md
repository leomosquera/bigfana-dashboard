# Dashboard Home / Command Center — Functional Audit + Implementation Plan

Date:

2026-07-20

Status:

```txt
AUDIT + IMPLEMENTATION PLAN ONLY
NO APPLICATION CODE CHANGES
NO DRIZZLE / NEON / SQL CHANGES
MIGRATION 020: NOT STARTED / NO FROZEN SCOPE
```

---

## Executive verdict

```txt
A. READY TO IMPLEMENT DASHBOARD HOME V1
```

Foundation contracts are frozen and usable. Dashboard Home is currently a **mock Command Center shell**. Real org-scoped queries already power Fans / Campaigns / Segments / Gamification modules and can be reused or extended for Home.

No Foundation / Migration 020 blocker.

---

## Frozen Foundation contracts (respected)

```txt
fans.organization_id:           ABSENT
Fan ownership SoT:              fan_organizations
organizations.sport:            ABSENT
organizations.sport_id:         ABSENT
Canonical org sport path:       org → competition_organizations → competitions → sports
Fan geography SoT:              fans.country_code
Legacy fans.country:            REMOVED
Catalog Drizzle schemas:        PRESENT (sports / competitions / competition_organizations)
Migration 020:                  NOT STARTED / NO FROZEN SCOPE
```

---

## Current Dashboard Home inventory

Route: `/dashboard` → `src/app/dashboard/page.tsx` (client component)

Shell: `layout.tsx` (auth + membership) → `OrgProvider` → `DashboardShell` (Sidebar + Header)

Home widgets (all driven by `@/lib/mock-data` unless noted):

| Element | Classification | Evidence |
|---|---|---|
| KPI grid (Revenue, Fans Activos, Sponsors, Tickets, Engagement, Gasto) | MOCK | `kpiData` import |
| CommunityPulse | MOCK | `communityPulse` |
| LastMatch | MOCK | `lastMatch` |
| TopFans | MOCK | `topFans` |
| RevenueChart | MOCK | `revenueData` + Recharts |
| FanSegmentsChart | MOCK | `fanSegments` / `engagementFunnel` |
| TopSponsorsROI | MOCK | `sponsors` |
| SmartAlerts | MOCK | `smartAlerts` |
| RecentTimeline | MOCK | `recentTimeline` |
| ActivityFeed | MOCK | `realtimeActivity` |
| EngagementHeatmap | MOCK | `heatmapData` |
| Time-range Select + Export button | PLACEHOLDER | UI only, no wiring |
| Header notifications | MOCK | hardcoded in `Header.tsx` |

Sibling modules with **real Neon data** (pattern to reuse):

- `/dashboard/fans` — `getFansByOrg` via `fan_organizations`
- `/dashboard/campaigns` — `listCampaignsWithStats`
- `/dashboard/segments` — `getSegmentDistribution` + rules
- `/dashboard/gamification` — `getOrgEngagementKPIs`, leaderboard, breakdown

---

## Primary user (V1 default)

**Organization administrator / fan-engagement operator** (membership roles: `owner` | `admin` | `tenant` | `analyst`).

Default Command Center answers (supported now or near-term):

1. How large is my fan base?
2. Is it growing?
3. How engaged are fans? (points / events — defined formulas)
4. What is happening right now? (recent `fan_events`)
5. Which segments matter?
6. How are campaigns performing?
7. Are integrations healthy? (job status aggregates)

Deferred for later product cycles: commerce revenue, ticket sales, sponsor ROI, match ops center, geo heatmap.

---

## Dashboard Home V1 proposed structure

```txt
A. Executive KPIs          — Total Fans, New Fans (30d), Engaged Fans (30d), Interactions (30d), Active Campaigns, Points Issued (30d)
B. Fan Growth              — daily/weekly series from fan_organizations join timestamps
C. Activity volume         — fan_events counts over time (simple area chart)
D. Geographic summary      — country_code top-N table (NOT a map in V1)
E. Segments                — reuse getSegmentDistribution
F. Campaigns               — active/recent + responseCount
G. Gamification snapshot   — reuse getOrgEngagementKPIs + compact leaderboard
H. Integration health      — integration_jobs status counts (admin-relevant)
I. Recent activity         — latest fan_events feed
```

Remove from Home V1 (mock-only / no model): Revenue, Tickets, Avg Spend, Sponsor ROI, Last Match, Heatmap-as-primary, fake realtime pulse.

---

## KPI contract (V1)

### Total Fans

- Meaning: Unique non-archived PRIMARY fans for current org
- Source: `fan_organizations` ⋈ `fans`
- Formula: `COUNT(*)` where `organization_id = :org` AND `is_primary = true` AND `fans.status <> 'archived'`
- Window: current snapshot
- Available now: YES (same cohort as `getFansByOrg` / `getOrgEngagementKPIs.totalActiveFans`)
- New query: thin wrapper / shared helper
- New DB: NO

### New Fans (30d)

- Meaning: Fans that joined the org (PRIMARY) in the last 30 days
- Source: `fan_organizations` (+ `fans` for archive filter)
- Formula: `COUNT(*)` where org + primary + not archived AND `COALESCE(joined_at, created_at) >= now() - 30d`
- Window: rolling 30 days
- Available now: YES (query work)
- Note: prefer membership timestamp over `fans.created_at` (global identity may pre-exist)

### Engaged Fans (30d)

- Meaning: Distinct PRIMARY cohort fans with ≥1 `fan_events` row in window
- Source: `fan_events` ⋈ PRIMARY cohort
- Formula: `COUNT(DISTINCT fan_id)` events in org + occurred_at ≥ now()-30d ∩ primary non-archived fans
- Window: rolling 30 days
- Available now: READY WITH QUERY WORK
- New DB: NO

### Interactions (30d)

- Meaning: Total behavioral events recorded for the org
- Source: `fan_events`
- Formula: `COUNT(*)` where `organization_id = :org` AND `occurred_at >= now()-30d`
- Window: rolling 30 days
- Available now: READY WITH QUERY WORK
- New DB: NO

### Active Campaigns

- Meaning: Campaigns currently in `active` status
- Source: `campaigns`
- Formula: `COUNT(*)` where org AND `status = 'active'`
- Window: snapshot
- Available now: YES (`listCampaignsWithStats` can be filtered)
- New DB: NO

### Points Issued (30d)

- Meaning: Sum of positive ledger deltas
- Source: `fan_points_ledger`
- Formula: `COALESCE(SUM(points) FILTER (WHERE points > 0), 0)` where org AND `created_at >= now()-30d`
- Window: rolling 30 days
- Available now: READY WITH QUERY WORK (lifetime sum exists in `getOrgEngagementKPIs`)
- New DB: NO

---

## Readiness matrix

| Section | Status |
|---|---|
| Executive KPIs | READY WITH QUERY WORK |
| Fan Growth chart | READY WITH QUERY WORK |
| Activity volume chart | READY WITH QUERY WORK |
| Geographic top countries | READY WITH QUERY WORK (tiny data → table, not map) |
| Segments summary | READY NOW (`getSegmentDistribution`) |
| Campaign summary | READY NOW (`listCampaignsWithStats`) |
| Gamification snapshot | READY NOW (`getOrgEngagementKPIs`, `getOrgLeaderboard`) |
| Integration health | READY WITH QUERY WORK (schema + enqueue exist; no home query) |
| Recent activity feed | READY WITH QUERY WORK (per-fan query exists; need org-wide) |
| Revenue / tickets / spend | DEFERRED (no commerce SoT) |
| Sponsor ROI | DEFERRED / BLOCKED BY FEATURE DATA (+ no sponsors Drizzle catalog yet) |
| Last Match ops widget | DEFERRED (match center features NOT IMPLEMENTED) |
| Engagement heatmap | DEFERRED (needs sustained event volume) |

---

## Tenant scoping

Resolved today:

```txt
auth.api.getSession → getUserActiveMembership(userId) → OrgProvider + getDashboardContext()
```

All real module queries take `organizationId` and filter accordingly.

Risks (do not redesign now; document for implementers):

1. `getUserActiveMembership` uses `.limit(1)` with no stable order — multi-membership users get an arbitrary org.
2. No org switcher UI yet.
3. Home page currently ignores org for data (mock). Implementation must use `getDashboardContext().org.id` server-side.
4. Fan cohort convention for loyalty dashboards: **PRIMARY + non-archived** (`primaryFanOrgCohort`). Keep Home KPIs consistent with Fans/Gamification unless product explicitly wants ANY membership.

---

## Performance strategy (greenfield)

Prefer:

```txt
Direct SQL aggregation via Drizzle in src/server/queries/dashboard-home.ts
Parallel Promise.all in a server page
Reuse existing engagement-intelligence / campaigns helpers
```

Do **not** introduce materialized views, caches, or background rollups for V1.

Indexes: existing org indexes on `fan_organizations`, `fan_events`, `campaigns`, `integration_jobs`, ledger are sufficient at current scale. No new indexes in this phase.

---

## Recommended implementation phases

### Phase 1A — Dashboard data contract + server queries

Create `src/server/queries/dashboard-home.ts` with typed DTO:

- `getDashboardHomeSnapshot(organizationId, windowDays = 30)`
- KPIs + growth series + activity series + geo top-N + recent events + integration status counts
- Reuse segment / campaign / gamification helpers

### Phase 1B — Convert Home to server-driven UI

- Make `/dashboard` a server component (or server wrapper + client presentational widgets)
- Replace KPI grid with real StatCards
- Wire empty / loading / error states using existing PageShell / Card patterns

### Phase 1C — Growth + activity charts

- Replace RevenueChart with Fan Growth (Recharts Area)
- Add Interactions volume chart
- Remove commerce series from Home

### Phase 1D — Recent activity + operational strips

- Real Recent Activity from `fan_events`
- Campaign strip + Segment distribution (existing queries)
- Compact gamification KPIs / top fans from leaderboard

### Phase 1E — Integration health + geo summary

- Job status chips/counts
- Country top-N table (architecture-ready for future map)

Out of V1 Home: mock revenue, tickets, sponsor ROI, last match, heatmap, fake “tiempo real” pulse, export.

---

## Exact first implementation block

```txt
Phase 1A + Phase 1B (minimal vertical slice):

1. Add dashboard-home query module (org-scoped KPIs + recent events)
2. Convert dashboard/page to server component using getDashboardContext()
3. Render 4–6 real StatCards + Recent Activity list
4. Keep unused mock widgets removed or behind clear empty states
5. Preserve visual system (PageShell, StatCard, Card, Recharts, motion)
```

Success criteria for first block:

- Home numbers change when Neon fan/event/campaign data changes for the active org
- No cross-tenant aggregation
- No Migration 020 / schema changes
- Spanish UI labels preserved

---

## Final verdict

```txt
READY TO IMPLEMENT DASHBOARD HOME V1
```

Migration 020 status (unchanged):

```txt
NOT STARTED
NO FROZEN SCOPE
```

---

## Files / documents inspected (selected)

- `PROJECT_STATE.md`, `AI_RULES.md`, `AGENTS.md`
- `docs/04-database/current-schema.md` (+ gap/physical/backlog/migration-plan as context)
- `docs/07-dashboard/*`, `docs/09-roadmap/product-roadmap-v1.md`
- ADRs 001–009 (tenant/fan/EEP/sports contracts)
- `src/app/dashboard/**`, `src/components/dashboard/**`, `src/lib/mock-data.ts`
- `src/providers/org-provider.tsx`, `src/server/queries/*`
- `src/db/schema/*` (fans, fan-organizations, events, campaigns, gamification, segments, integrations, sports/competitions)

## Files modified

```txt
docs/sessions/2026-07-20-dashboard-home-command-center-audit.md  (this document)
```

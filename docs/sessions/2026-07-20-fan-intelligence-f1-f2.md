# Fan Intelligence V1 — Block F1 + F2

Date:

2026-07-20

Status:

```txt
IMPLEMENTED
F1 Fans List Intelligence COMPLETE
F2 Fan 360 Core COMPLETE
NO SCHEMA CHANGES
NO DRIZZLE / NEON DDL
MIGRATION 020: NOT STARTED / NO FROZEN SCOPE
```

---

## Executive summary

Implemented the first Fan Intelligence vertical slice on top of the existing Fans CRM:

1. **F1** — `/dashboard/fans` enriched PRIMARY list (segment, nivel/puntos, país, última actividad, Sync EEP, estado) with client filters.
2. **F2** — dedicated `/dashboard/fans/[id]` Fan 360 Core with relationship-aware access, real activity/gamification/campaigns/EEP/identity sections.
3. **Drawer** — quick summary + CTA “Ver perfil completo”.

No mock data. No invented AI scores. Foundation ownership/geography contracts unchanged.

---

## Final Fans list contract

Route: `/dashboard/fans`

Data: `getFansIntelligenceList(organizationId)`

Cohort: **PRIMARY**, non-archived (`getFansByOrg` → `listFansForOrganization(..., "primary")`).

Default columns:

| Column | Source |
|---|---|
| Fan | displayName + email |
| Segmento | `fans.segment` → “Sin clasificar” when null |
| Nivel / Puntos | `engagement_score` + `FanLevelBadge` (loyalty semantics, not AI) |
| País | `countryCode` → `getCountryLabel()` |
| Última actividad | `MAX(fan_events.occurred_at)` org-scoped, batched |
| Sync EEP | `eep_sync_status` |
| Estado | `fans.status` |

Alta (`createdAt`) remains available via column visibility; **hidden by default**.

---

## Filters implemented

Client-side (current scale; full org PRIMARY list already loaded):

- Text search (existing DataTable global filter)
- Estado
- Segmento (includes “Sin clasificar”)
- País
- Sync EEP
- Reset (“Limpiar”)

Filters combine with AND semantics and preserve empty/null handling.

---

## Fan 360 route and structure

Route: `/dashboard/fans/[id]`

Loader: `getFan360Profile(organizationId, fanId)` → `notFound()` when no relationship.

Sections:

A. Fan Identity Header (status, PRIMARY/FOLLOWING, contact, geography)  
B. Intelligence KPIs (puntos/nivel for PRIMARY, interacciones 30d, última actividad, segmento)  
C. Activity timeline + summary  
D. Gamification (PRIMARY) / neutral FOLLOWING message  
E. Segmento BigFana (+ eligible experiences when present)  
F. Campaign participation (`campaign_responses` → `campaigns`)  
G. EEP sync state (status, contact id, last sync, error when failed/retrying)  
H. Identity / contact details  

Archived fans: accessible if FO row exists; banner “Archivado”; operational read-oriented.

---

## PRIMARY vs FOLLOWING

| Surface | PRIMARY | FOLLOWING | No relationship |
|---|---|---|---|
| Fans CRM list | Included | Excluded | N/A |
| Fan 360 | Full + loyalty | Access + explicit FOLLOWING banner; loyalty N/A | `notFound()` |
| Drawer (list) | Quick summary | N/A (list is PRIMARY-only) | N/A |

Loyalty/gamification UI uses `isLoyaltyEligible(relationship)` — PRIMARY only (ADR-002).

---

## Organization isolation

- List: FO PRIMARY + org id.
- Fan 360: `hasFanOrgMembership(..., "any")` then all child queries pass `organizationId` + `fanId`.
- Campaigns: `campaign_responses.organization_id` + `fan_id`, join `campaigns` also org-scoped.
- Events / ledger / velocity / behavioral: existing org-scoped queries reused.
- No global fan-by-id access without FO validation.

---

## Queries created / reused

### Created

| Module | Contract |
|---|---|
| `src/server/queries/fan-intelligence.ts` | `getFansIntelligenceList`, `getLastActivityByFanIds`, `getFanOrgRelationship`, `getFan360Profile` |
| `src/server/queries/fan-campaigns.ts` | `getFanCampaignHistory` |
| `src/lib/fan-intelligence.ts` | Pure labels, filters, loyalty/access helpers, activity summary |

### Reused

- `getFansByOrg` / `getFanById`
- `hasFanOrgMembership`
- `getFanEventsByFan`
- `getFanLedger` / `getOrgLevels` / `computeLevelForScore`
- `getFanBehavioralProfile` / `getEngagementVelocity` / `getFanEligibleExperiences`
- `getFanProfile` (drawer quick load)

---

## FanProfileDrawer changes

- Remains as quick peek (not deleted).
- Shows identity, status, relationship badge, segment, EEP, loyalty KPIs (PRIMARY), activity summary.
- CTA: **Ver perfil completo** → `/dashboard/fans/[id]`.
- Heavy tabs removed from drawer (timeline/ledger/intelligence now live on Fan 360).

Row UX:

- Row click → drawer
- Row menu: Vista rápida / Ver perfil completo / lifecycle

---

## Empty states

| Context | Copy |
|---|---|
| List no fans | Sin fans registrados |
| List filters empty | Sin fans con estos filtros |
| No activity (list/360) | Sin actividad / honest “—” |
| No campaigns | Este fan todavía no registra participación en campañas. |
| FOLLOWING loyalty | Explicit neutral ADR-002 message |
| No FO relationship | `notFound()` + explanation |

---

## Responsive behavior

- Fans list: DataTable horizontal scroll + column visibility; Alta hidden by default.
- Fan 360: KPI grid 2→5 cols; main/secondary `xl` split; stacks on smaller widths; browser page scroll only.

---

## Validation

```txt
npx tsc --noEmit                     PASS
npm run build                        PASS (/dashboard/fans/[id] registered)
eslint (modified sources)            PASS
npx tsx --test fan-intelligence      PASS (14)
npx tsx --test fan-organizations     PASS
npx tsx --test dashboard-home        PASS
```

---

## Risks / technical debt (non-blocking)

- Full PRIMARY list load (no server pagination) — acceptable at current scale.
- Optional future index: `(organization_id, fan_id, occurred_at DESC)` on `fan_events` for last-activity aggregation — **not** added in this block.
- `engagement_score` naming vs “Puntos” product language remains.
- FanForm edit-state remount issue unchanged (pre-existing).
- `updateFan` still skips segment recompute (pre-existing).
- Per-fan organization rank deferred (no fake top-5 rank).
- EEP audiences/segments UI deferred (no Drizzle mapping / no data).

---

## Remaining F3 / F4 scope (not implemented)

**F3 — Activity + Engagement depth**

- Richer timeline/ledger polish
- Optional exact org rank query
- Lifetime points aggregate presentation
- Clearer Spanish event-type vocabulary consistency

**F4 — Segmentation + Campaigns + EEP detail**

- Richer local segment panel / history (history may need schema later)
- Campaign participation analytics depth (no ROI invention)
- EEP audience/segment cache UI only after Drizzle + sync data

---

## Foundation invariant verification

```txt
fans.organization_id          ABSENT
fan_organizations             SoT ownership
organizations.sport           ABSENT
organizations.sport_id        ABSENT
Canonical org sport           competition_organizations → competitions → sports
fans.country                  REMOVED / unused
fans.country_code             geography SoT
Application country contract  countryCode
No dual-write
Migration 020                 NOT STARTED / NO FROZEN SCOPE
```

---

## Recommended next implementation block

```txt
Block F3 — Activity + Engagement depth
```

or, if product prioritizes campaign/segment operator value:

```txt
Block F4 — Campaign participation depth + local segment polish
```

Do not start Migration 020.

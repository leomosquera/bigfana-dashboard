# Fan Intelligence / Fans — Functional Audit + Architecture + Implementation Plan

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
A. READY TO IMPLEMENT FAN INTELLIGENCE V1
```

The Fans module is already a **real org-scoped CRM** with create/update/lifecycle, PRIMARY listing via `fan_organizations`, a working profile drawer (`getFanProfile`), activity timeline, points ledger, and local segmentation. Fan Intelligence V1 is primarily **composition + query enrichment + UX elevation** — not greenfield CRUD and not a Foundation blocker.

No Migration 020 / schema change required for V1.

---

## Frozen Foundation contracts (respected)

```txt
fans:                           global fan identity (ADR-001)
fan_organizations:              sole authoritative fan ↔ organization SoT
fans.organization_id:           ABSENT (018b COMPLETE)
Membership:                     PRIMARY | FOLLOWING
organizations.sport / sport_id: ABSENT
Canonical org sport path:       org → competition_organizations → competitions → sports
Fan geography SoT:              fans.country_code
Legacy fans.country:            REMOVED
Country contract:               uppercase ISO-3166-1 alpha-2 or NULL
Migration 020:                  NOT STARTED / NO FROZEN SCOPE
```

---

## 1. Current Fans module inventory

Route: `/dashboard/fans`

| Layer | Path |
|---|---|
| Page (RSC) | `src/app/dashboard/fans/page.tsx` |
| Client table | `src/app/dashboard/fans/FansClient.tsx` |
| Form modal | `src/components/fans/FanForm.tsx` |
| Profile drawer | `src/components/fans/FanProfileDrawer.tsx` |
| Row actions | `src/components/fans/FanRowActions.tsx` |
| Activity UI | `src/components/fans/FanActivityTimeline.tsx` |
| Intelligence UI | `src/components/fans/FanIntelligencePanel.tsx` |
| Actions | `src/server/actions/fans.ts`, `fan-profile.ts` |
| Service | `src/server/services/fans.ts` |
| Queries | `src/server/queries/fans.ts`, `fan-organizations.ts`, `fan-events.ts`, `gamification.ts`, `engagement-intelligence.ts` |
| Segmentation | `src/server/services/segmentation.ts` |
| Schema | `src/db/schema/fans.ts`, `fan-organizations.ts`, `events.ts` |

No dedicated route `/dashboard/fans/[id]` today.

---

## 2. Real / partial / mock / placeholder matrix

| Capability | Class | Evidence |
|---|---|---|
| Fans list (PRIMARY, non-archived) | REAL / COMPLETE | `getFansByOrg` → `listFansForOrganization(..., "primary")` |
| Client text search | REAL / COMPLETE | DataTable `searchable` globalFilter |
| Server-side filters | NOT IMPLEMENTED | No status/segment/EEP/country filter UI |
| Create fan | REAL / COMPLETE | FanForm → `createFan` → `createOrganizationFan` |
| Edit fan | REAL / PARTIAL | Works; FanForm state init only on first mount; no segment recompute on update |
| Suspend / reactivate / archive | REAL / COMPLETE | `FanRowActions` + actions |
| Profile drawer open | REAL / COMPLETE | Row click / Ver perfil |
| Identity hero in drawer | REAL / COMPLETE | From list `FanView` |
| Activity timeline | REAL / COMPLETE | `getFanEventsByFan` |
| Points ledger tab | REAL / COMPLETE | `getFanLedger` |
| Intelligence tab (behavioral + velocity + experiences) | REAL / PARTIAL | Real queries; `activityScore` is local heuristic; experiences depend on segment rules data |
| Level badge from `engagement_score` | REAL / COMPLETE | `FanLevelBadge` + `fan_levels` |
| `fans.segment` display | REAL / PARTIAL | Shown in drawer if set; not in list |
| `fans.tier` column | REAL / PARTIAL | Written by segmentation; not shown distinctly (level derived from score) |
| Relationship PRIMARY/FOLLOWING in UI | NOT IMPLEMENTED | List is PRIMARY-only; FO row not surfaced |
| Campaign participation in profile | NOT IMPLEMENTED | `campaign_responses.fan_id` exists; no Fan 360 query |
| EEP sync status in list | REAL / COMPLETE | Column + badges |
| EEP contact / last sync / error in profile | PLACEHOLDER / PARTIAL | Fields on `FanView` exist; drawer does not show them |
| EEP audiences / EEP segments membership | BLOCKED BY FEATURE DATA / APP | Neon tables exist (013/014); **no Drizzle mappings** in `src/db` |
| Dedicated Fan 360 page | NOT IMPLEMENTED | Drawer only |
| AI / predictive scores | NOT IMPLEMENTED | Correctly absent |
| Ranking position for one fan | NOT IMPLEMENTED | `getOrgLeaderboard` is top-N only |

---

## 3. Current Fans list audit

**Data load:** all PRIMARY non-archived fans for current org (no server pagination).

**Columns today:**

| Column | Source | Notes |
|---|---|---|
| Fan | `displayName` + email + initials avatar | |
| Teléfono | `phone` | |
| Ubicación | `city` + `countryCode` label | |
| Puntos | `engagementScore` + level badge | **Semantic note:** field is points balance, not a separate “engagement intensity” |
| Sync EEP | `eepSyncStatus` | pending/synced/failed/retrying |
| Estado | `status` | |
| Alta | `createdAt` | |

**Missing from list (candidates):** segment, tier/level name column, last activity, relationship (N/A while PRIMARY-only), EEP detail.

**Behaviors:**

- Search: client global string filter — READY NOW
- Sorting: DataTable column sort (client) — READY NOW
- Pagination: client, page size 25 — READY NOW
- Filters (status/segment/etc.): none — READY WITH QUERY/UI WORK
- Create: toolbar “Nuevo fan” — REAL
- Row click → profile drawer — REAL
- Row actions: Ver perfil, Editar, Suspender, Reactivar, Archivar — REAL
- Empty: “Sin fans registrados” — REAL
- Loading: RSC wait (no client skeleton for table) — PARTIAL
- Error: no dedicated list error boundary — PARTIAL
- Responsive: DataTable patterns — inherits system

---

## 4. Create / update lifecycle

### Create

```txt
FanForm → createFan (action)
  → createOrganizationFan (service)
    1. validate name + countryCode
    2. global email uniqueness (findFanByNormalizedEmail, includes archived)
    3. INSERT fans (identity; status=active; eep_sync_status=pending)
    4. INSERT fan_organizations PRIMARY
    5. enqueueFanEepJob(create)
    6. recomputeFanSegment (best-effort)
```

Editable fields: firstName*, lastName*, email, phone, birthDate, gender, city, countryCode.

### Update

```txt
FanForm → updateFan
  → assert ANY membership
  → UPDATE fans identity fields + eep_sync_status=pending
  → enqueueFanEepJob(update)
  → NO recomputeFanSegment
```

### Lifecycle

- Suspend → `suspended` + EEP update job
- Reactivate → `active` + EEP update job
- Archive → `archived` + EEP **delete** job; disappears from PRIMARY list

### UX issues (do not fix in this session)

1. FanForm `useState` initializer does not remount/reset when switching edit targets without unmount.
2. Duplicate email is platform-global — correct per ADR-001, but message may surprise org admins.
3. Update does not refresh segment/tier.
4. List column “Puntos” maps `engagementScore` — correct product meaning (loyalty balance), naming debt vs “engagement”.

---

## 5. Ownership / relationship semantics

| Scope | Meaning | Used by |
|---|---|---|
| `primary` | `fan_organizations.is_primary = true` | Fans CRM list, points, segment recompute, leaderboard, Home KPIs |
| `any` | PRIMARY or FOLLOWING | `getFanById`, `getFanProfile`, mutations (`assertFanOwnership`) |
| FOLLOWING-only | content/community interest, no loyalty | Campaign submit allowed; `awardPoints` skipped |

**ADR-002:** loyalty (points, levels, rewards) belongs to PRIMARY org. FOLLOWING does not grant loyalty.

### Product recommendation for Fans module

```txt
C. PRIMARY by default, with explicit relationship awareness
```

- **Fans administration list V1:** keep **PRIMARY** cohort (loyalty CRM). Matches ADR-002 and current `getFansByOrg`.
- **Fan 360 access:** **ANY** membership (already implemented). Show relationship badge PRIMARY | FOLLOWING.
- **Optional later filter:** “Incluir seguidores (FOLLOWING)” — query work only; do not change ownership SoT.
- **No relationship:** deny (already).
- **Archived:** excluded from list; profile access for archived FOLLOWING/PRIMARY is currently possible via ID if membership exists — decide in F2 (recommend deny or read-only banner).

Do **not** change Foundation ownership contracts.

---

## 6. Fan 360 data availability

| Section | Status | Notes |
|---|---|---|
| A. Identity | READY NOW | All identity fields on `fans` / `FanView` |
| B. Relationship | READY WITH QUERY WORK | Need FO row (`relationshipType`, `joinedAt`) in profile contract |
| C. Engagement | READY NOW | Events, behavioral profile, velocity; clarify `engagement_score` = points balance |
| D. Gamification | READY NOW | Score, levels, ledger; ranking = READY WITH QUERY WORK |
| E. Segmentation (local) | READY NOW | `fans.segment` + rules; history = DEFERRED |
| E2. EEP segments/audiences | BLOCKED BY FEATURE DATA / APP | Neon present; no Drizzle; 0 seed rows historically |
| F. Campaigns | READY WITH QUERY WORK | `campaign_responses` fan-linked; no Fan 360 aggregator yet |
| G. EEP sync | READY NOW (fields) / READY WITH UI | Show status, last sync, contact id, last error admin-friendly |
| H. Geography | READY NOW | `country_code` + city |
| I. Timeline | READY NOW | `fan_events` (limit 50); unified campaign+points merge = READY WITH QUERY WORK / DEFERRED |

---

## 7. Fan events

Table: `fan_events` — org + fan scoped; flexible `event_type` TEXT; `source`, `source_id`, `payload`, `metadata`, `points`, `occurred_at`.

UI vocabulary (labels, not DB enum): match_attended, purchase, trivia_*, prediction_*, raffle_joined, daily_checkin, content_shared, badge_earned, login, manual_award, admin_deduction.

Can power: recent activity, timeline, type breakdown, engagement summary — **yes**, given data volume.

No invented categories beyond stored `event_type` strings.

---

## 8. Gamification

| Metric | Reality |
|---|---|
| Current points | `fans.engagement_score` (= ledger balance) — REAL |
| Lifetime points | Derivable from ledger sum — READY WITH QUERY WORK |
| Tier / level | Computed from `fan_levels` + score; `fans.tier` denormalized on segment recompute |
| Ranking | Top-N exists; per-fan rank query missing |
| Recent transactions | `getFanLedger` — REAL |
| awardPoints / rebuildFanBalance | PRIMARY-only — REAL |

Do not redefine formulas.

---

## 9. Segmentation (three concepts — keep separate)

| Concept | SoT | Fan 360 V1 |
|---|---|---|
| **BigFana local segment** | `fans.segment` via `fan_segment_rules` + `recomputeFanSegment` | Show now |
| **EEP segment** | Neon `segments` / `fan_segments` (014) | DEFERRED until Drizzle + sync data |
| **EEP audience** | Neon `audiences` / `fan_audiences` (013) | DEFERRED until Drizzle + sync data |

A fan has **one** local `fans.segment` (first matching rule by priority). Multiple EEP memberships are many-to-many when sync exists.

---

## 10. Campaign participation

`campaign_responses` has `fan_id` + `organization_id` + `campaign_id` + `points_awarded`. Directly fan-linked.

Fan-facing eligibility already uses responses (`fanRespondedCampaignIds`). Admin Fan 360 needs a new aggregator query (counts, recent campaigns, types).

---

## 11. EEP presentation (admin-friendly)

Fields: `eep_contact_id`, `eep_sync_status`, `eep_last_sync_at`, `eep_last_error`.

Recommend UI:

```txt
Estado: Sincronizado | Pendiente | Error | Reintentando
Última sync: <locale date>
ID EEP: <contact id or —>
Detalle: last error only when failed/retrying
```

Do not expose `integration_jobs` internals in Fan 360 V1 (optional “ver cola” later).

Enqueue is best-effort; worker processing may leave status pending — truthful.

---

## 12. Recommended Fans List V1

**Default columns:**

1. Fan (name + email)
2. Segment
3. Nivel / Puntos (`engagement_score` + level badge)
4. País (or compact ubicación)
5. Última actividad
6. Sync EEP
7. Estado

**Optional / filterable:** phone, city, alta date, tier text.

**Profile-only:** birth date, gender, EEP contact id / error detail, full ledger, campaign history, behavioral fingerprint.

Avoid overcrowding; ~7 operational columns.

---

## 13. Recommended filters

| Filter | Readiness |
|---|---|
| Text search | READY NOW |
| Status | READY WITH QUERY WORK (client filter possible immediately) |
| Relationship PRIMARY/FOLLOWING | READY WITH QUERY WORK (if list expands beyond PRIMARY) |
| Segment | READY WITH QUERY WORK (client filter on loaded rows OK for small N) |
| Tier / level | READY WITH QUERY WORK |
| Country | READY WITH QUERY WORK |
| Engagement / points range | DEFERRED (keep list operational) |
| EEP sync status | READY WITH QUERY WORK |

Keep advanced segmentation out of the list (use Segments module).

---

## 14. Recommended Fan 360 UX

```txt
C. Drawer summary + dedicated profile page `/dashboard/fans/[id]`
```

Rationale: current drawer already carries 3 tabs of intelligence; campaign history + timeline + EEP will exceed 520px drawer comfort. Deep linking and future modules need a route. Keep drawer as **quick peek** (identity + KPIs + link “Ver Fan 360”).

---

## 15. Fan Intelligence V1 structure

1. Fans List (intelligence columns + operational filters)
2. Fan 360 Profile page (identity → relationship → intelligence hierarchy)
3. Activity Timeline (existing events)
4. Engagement / Gamification snapshot (points, level, velocity, ledger)
5. Segmentation snapshot (local segment + eligible experiences)
6. Campaign participation (new query)
7. EEP sync status (surface existing fields)

No predictive AI. No fake AI scores. Treat `activityScore` as secondary heuristic or rename to “intensidad de actividad” with clear derivation — do not market as EEP score.

---

## 16. Multi-tenant access rules

| Case | Access |
|---|---|
| PRIMARY | Full Fan 360 + loyalty metrics |
| FOLLOWING | View Fan 360 for org activity/campaigns; show non-loyalty banner; points may be 0 / N/A for this org |
| No FO row | Deny |
| Archived | Exclude from list; profile read-only or deny (decide in F2 — recommend read-only with banner) |

All queries must filter by current `organization_id` via FO and/or event/ledger org columns. Mutations already use `assertFanOrgMembership(..., "any")`.

---

## 17. Data / query gaps

| Gap | Class |
|---|---|
| Last activity per fan (list) | QUERY ONLY |
| Campaign history per fan | QUERY ONLY |
| Per-fan rank | QUERY ONLY |
| Relationship row in list/profile | QUERY ONLY |
| Event aggregation helpers (reuse engagement-intelligence) | QUERY ONLY |
| EEP audiences/segments in Fan 360 | APPLICATION FEATURE (Drizzle mapping + sync data) |
| Segment history | SCHEMA REQUIRED / DEFERRED |
| Avatar upload | APPLICATION FEATURE / DEFERRED |
| Migration 020 | NOT STARTED — do not invent scope |

---

## 18. Server query architecture

Prefer **composition**, not a god-module:

```txt
src/server/queries/fans.ts              — list / identity (extend)
src/server/queries/fan-organizations.ts — relationship
src/server/queries/fan-events.ts        — activity
src/server/queries/gamification.ts      — ledger / levels / rank
src/server/queries/engagement-intelligence.ts — behavioral / velocity
src/server/queries/fan-campaigns.ts     — NEW thin aggregator (optional name)
```

Optional façade for Fan 360:

```txt
src/server/queries/fan-profile.ts  OR  extend getFanProfile action
```

**Recommended Fan 360 contract (conceptual):**

```ts
{
  fan: FanView;
  relationship: { type: "PRIMARY" | "FOLLOWING"; joinedAt: Date | null };
  activity: { events: FanEvent[]; behavioral: BehavioralProfile };
  gamification: { score: number; level: FanLevel | null; ledger: FanPointsLedger[]; velocity: EngagementVelocity; rank?: number | null };
  segmentation: { localSegment: string | null; experiences: EligibleExperience[] };
  campaigns: { totalCampaigns: number; responseCount: number; recent: [...] };
  eep: { syncStatus; contactId; lastSyncAt; lastError };
}
```

---

## 19. Implementation readiness matrix

| Feature | Status | Data source | Work required |
|---|---|---|---|
| Fans List | READY WITH QUERY WORK | fans + FO | Columns + filters |
| Search | READY NOW | client | Optional server later |
| Filters | READY WITH QUERY WORK | FanView fields | toolbar filters |
| Create | READY NOW | service | UX polish only |
| Edit | READY WITH QUERY WORK | actions | form reset; optional segment recompute |
| Archive | READY NOW | actions | — |
| Fan 360 Identity | READY NOW | FanView | page layout |
| Relationship | READY WITH QUERY WORK | fan_organizations | join in profile |
| Activity | READY NOW | fan_events | reuse |
| Gamification | READY NOW | score + ledger + levels | rank optional |
| Segmentation (local) | READY NOW | fans.segment | list column |
| Campaigns | READY WITH QUERY WORK | campaign_responses | new query + UI |
| Geography | READY NOW | country_code | — |
| EEP sync | READY WITH QUERY WORK | fan EEP fields | surface in 360 |
| Timeline | READY NOW | fan_events | page section |
| EEP audiences/segments | DEFERRED | Neon 013/014 | Drizzle + data |

---

## 20. Accelerated implementation blocks

### Block F1 — Fans List / Intelligence table

- **Scope:** upgrade `/dashboard/fans` list columns + operational filters; keep PRIMARY default; clarify Puntos/Nivel semantics
- **Files:** `FansClient.tsx`, `page.tsx`, possibly `fans.ts` query for last-activity map
- **Query:** last activity aggregation; optional list DTO with segment
- **UI:** columns + toolbar filters (status, segment, EEP, country)
- **Schema / Neon:** none
- **Deps:** none
- **Tests:** query unit tests for last-activity helper

### Block F2 — Fan 360 Profile core

- **Scope:** `/dashboard/fans/[id]` page; identity + relationship + EEP + geography + KPI strip; drawer becomes summary + link
- **Files:** new page/client, `FanProfileDrawer.tsx`, `fan-profile.ts` / new `fan-profile` query façade
- **Query:** FO relationship; compose existing profile fetches
- **UI:** intelligence-first hierarchy (not CRUD form)
- **Schema / Neon:** none
- **Deps:** F1 helpful but not hard-blocked
- **Tests:** access control ANY membership; deny no-relationship

### Block F3 — Activity + Engagement depth

- **Scope:** harden timeline, ledger, velocity, optional rank; Spanish event labels consistency
- **Files:** `FanActivityTimeline`, `FanIntelligencePanel`, gamification queries
- **Query:** optional lifetime points + rank
- **Schema / Neon:** none
- **Deps:** F2
- **Tests:** behavioral/velocity edge cases (empty)

### Block F4 — Segmentation + Campaigns + EEP detail

- **Scope:** campaign participation section; richer local segment panel; EEP status detail; **not** EEP audience cache UI unless Drizzle added
- **Files:** new `fan-campaigns` query, Fan 360 sections
- **Query:** campaign aggregates by fan
- **Schema / Neon:** none for campaigns; EEP cache UI deferred
- **Deps:** F2
- **Tests:** campaign aggregate org-scoping

---

## 21. Exact first implementation block

```txt
Block F1+F2 combined: Fans List Intelligence + Fan 360 Core
```

**Why:** maximum visible product value; infrastructure already exists (`getFansByOrg`, `getFanProfile`, drawer tabs). Elevates CRM → Fan Intelligence without Foundation work.

**Out of scope for first block:** EEP audience/segment cache, AI scores, Commerce, Migration 020, ownership semantic changes, Dashboard Home changes.

---

## 22. Risks / technical debt

- `engagement_score` naming vs “Puntos” / “engagement” product language
- Hardcoded hex colors in FansClient (prefer tokens over time)
- FanForm edit state reset
- `updateFan` skips segment recompute
- Full list load (no server pagination) — OK for current scale; watch growth
- `activityScore` heuristic could be misread as EEP intelligence
- EEP sync enqueue ≠ confirmed sync
- FOLLOWING fans invisible in CRM list (by design today)

---

## 23. Migration 020 status

```txt
NOT STARTED
NO FROZEN SCOPE
```

Do not invent Migration 020 for Fan Intelligence V1.

---

## 24. Final verdict

```txt
A. READY TO IMPLEMENT FAN INTELLIGENCE V1
```

Next authorized prompt should implement **Block F1+F2** (Fans List Intelligence + Fan 360 Core).

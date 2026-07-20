# Fan Intelligence F3 — Activity + Engagement Depth Audit

Date:

2026-07-20

Status:

```txt
AUDIT + FUNCTIONAL DEFINITION ONLY
NO APPLICATION CODE CHANGES
NO DRIZZLE / NEON / SQL CHANGES
NO IMPLEMENTATION
MIGRATION 020: NOT STARTED / NO FROZEN SCOPE
```

Branch context at audit:

```txt
feature/foundation-db-v1
Last closed commit (stated): 9c1019a7ad30c9d1827aae919b7de67aaa4fb095
F1 + F2 COMPLETE
Dashboard Home V1 COMPLETE
```

---

## 1. Executive verdict

```txt
F3 IS READY TO DEFINE AND IMPLEMENT — WITH CONTRACT FIXES FIRST
```

Fan Intelligence F3 can deliver real operator value from existing tables (`fan_events`, `campaign_responses`, `fan_points_ledger`) without Migration 020 and without inventing scores.

However, F3 must **not** polish the current Activity summary as-is. One F2 KPI is semantically wrong today:

| KPI shown | Claimed meaning | Actual source today |
|---|---|---|
| Interacciones 30d | Fan interactions last 30d | `getEngagementVelocity().events30d` = **count of `fan_points_ledger` rows**, not `fan_events` |

Impact:

- PRIMARY fans: under/over-count vs real behavioral events (manual awards inflate; non-point events missing).
- FOLLOWING fans: almost always show **0** interacciones 30d even when `fan_events` exist (no loyalty ledger).

F3 first block should **correct activity metrics to `fan_events`**, then deepen Activity with summary + 30d trend + type breakdown. Keep Gamification and Campaigns as separate surfaces. Do **not** ship a unified timeline until correlation is product-safe.

---

## 2. Current F3-ready inventory

| Capability | Status | Evidence |
|---|---|---|
| Fan 360 route `/dashboard/fans/[id]` | COMPLETE (F2) | `page.tsx` + `Fan360Client.tsx` |
| Org-scoped activity timeline | COMPLETE | `getFanEventsByFan` → `FanActivityTimeline` |
| Activity summary (partial) | PARTIAL / BUGGY | `buildFanActivitySummary` mixes `fan_events` totals with ledger velocity |
| Behavioral type breakdown (top 5) | EXISTS (server) | `getFanBehavioralProfile.topEventTypes` — lightly used in Fan 360 |
| `daysSinceLast` | EXISTS (server) | Returned by behavioral profile; not surfaced as F3 signal in Fan 360 |
| `activityScore` heuristic | EXISTS — DO NOT PROMOTE | Local diversity+frequency 0–100; not product engagement score |
| Campaign participation card | COMPLETE (F2) | `getFanCampaignHistory` |
| Points ledger UI | COMPLETE (PRIMARY) | `PointsTimeline` |
| Engagement velocity trend labels | EXISTS — DO NOT PROMOTE AS ACTIVITY | Ledger-based accelerating/stable/dormant |
| Org activity 30d series pattern | REUSABLE | Dashboard Home `buildActivitySeries` + Recharts `ActivityVolumeChart` |
| Exact org rank for one fan | NOT IMPLEMENTED | `getOrgLeaderboard` is top-N only |
| Unified activity+points+campaigns timeline | NOT SAFE YET | Same action can create 3 record types |
| Migration 020 / new event types pipeline | NOT STARTED | Out of scope |

---

## 3. `fan_events` contract (real)

Source of truth: `src/db/schema/events.ts` (Drizzle ↔ Neon).

| Column | Type / notes |
|---|---|
| `id` | uuid PK |
| `organization_id` | uuid NOT NULL → organizations (CASCADE) |
| `fan_id` | uuid NOT NULL → fans (CASCADE) |
| `event_type` | text NOT NULL — **not an enum**; snake_case convention |
| `source` | text NOT NULL — origin system |
| `source_id` | text NULL — external dedupe id |
| `payload` | jsonb NULL — business payload |
| `metadata` | jsonb NULL — debug/provider context |
| `points` | integer NOT NULL default 0 — points claimed on the event row |
| `occurred_at` | timestamp **WITHOUT** time zone NOT NULL — business time |
| `created_at` | timestamp **WITHOUT** time zone NOT NULL default now — ingest time |

Indexes declared:

- `idx_fan_events_fan` (`fan_id`)
- `idx_fan_events_org` (`organization_id`)
- `idx_fan_events_type` (`event_type`)

No composite `(organization_id, fan_id, occurred_at)` today.

Scope rules:

- Every read used by Fan Intelligence filters by **both** `organization_id` and `fan_id`.
- Events are organization-owned behavioral facts, not global fan history.

Relationships:

- Referenced optionally by `fan_points_ledger.fan_event_id` (SET NULL on delete).
- No FK from `campaign_responses` to `fan_events`.
- Campaign link (when present) lives in `payload.campaignId` for `campaign_engagement`.

---

## 4. Real event types inventory

Classification keys:

- **IMPLEMENTED** — application write path exists
- **DATA EXISTS** — may exist in Neon if previously written (not verified in this audit; no safe read-only DB probe performed)
- **DOCUMENTED ONLY** — comments, UI color/label maps, docs, examples
- **NOT IMPLEMENTED** — product vision / no writer

### A. Defined / written explicitly in code

| event_type | Layer | Classification |
|---|---|---|
| `campaign_engagement` | `submitCampaignAnswers` inserts `fan_events` | **IMPLEMENTED** |
| `campaign_trivia` | ledger `eventType` only (via awardPoints) | **IMPLEMENTED** (ledger taxonomy) |
| `campaign_participation` | ledger `eventType` only | **IMPLEMENTED** (ledger taxonomy) |
| `manual_award` / `admin_deduction` | ledger via gamification action | **IMPLEMENTED** (ledger only; no `fan_event`) |

### B. Seeds / migrations

| Artifact | Creates `fan_events`? |
|---|---|
| Foundation migrations 001–019 | No fan_events seed rows found |
| `scripts/migrate-campaign-engine-v1.ts` | Seeds campaigns/questions only — **no fan_events** |
| `scripts/migrate-gamification-v1.ts` | Levels + ledger table — **no fan_events seed** |

### C. Development data

Not queried in this audit (no Neon probe). Expect sparse volume: events appear only after campaign demo responses / manual paths.

### D. Documented / UI vocabulary but not produced by writers

From `FanActivityTimeline`, `FanIntelligencePanel`, schema comments, docs:

| event_type | Classification |
|---|---|
| `match_attended` | DOCUMENTED ONLY |
| `purchase` | DOCUMENTED ONLY |
| `trivia_correct` / `trivia_answered` | DOCUMENTED ONLY (ledger examples; campaign uses `campaign_engagement` + ledger `campaign_trivia`) |
| `prediction_submitted` / `prediction_won` | DOCUMENTED ONLY |
| `raffle_joined` | DOCUMENTED ONLY |
| `daily_checkin` | DOCUMENTED ONLY |
| `content_shared` | DOCUMENTED ONLY |
| `badge_earned` | DOCUMENTED ONLY |
| `login` | DOCUMENTED ONLY (demo fan login API ≠ `fan_events` writer) |

### Vision categories vs reality

| Category | Status |
|---|---|
| Campaign engagement | **IMPLEMENTED** (`campaign_engagement`) |
| Purchases | NOT IMPLEMENTED |
| Check-ins | NOT IMPLEMENTED |
| Ticket interactions | NOT IMPLEMENTED |
| Trivia / prediction / raffle / reward / poll / survey | Campaign **types** exist; behavioral event collapses to **`campaign_engagement`** (+ response rows) |
| Rewards (standalone) | NOT IMPLEMENTED as fan_event |
| NFC / RFID | NOT IMPLEMENTED |
| Cashless | NOT IMPLEMENTED |
| App interactions (generic) | NOT IMPLEMENTED |

**F3 rule:** breakdown and labels must be driven by **observed `event_type` values**, with friendly maps only for known strings and a honest fallback for unknowns. Do not invent missing types in the UI.

---

## 5. Activity ↔ Gamification relationship

### Contract

| Path | Direct link? |
|---|---|
| `fan_points_ledger.fan_event_id` → `fan_events.id` | **Optional FK** — direct when set |
| `fan_events.points` | Denormalized claim on the event; not the loyalty SoT |
| Loyalty SoT | `fan_points_ledger` + `fans.engagement_score` (PRIMARY) |

### Campaign happy path (PRIMARY)

```txt
1. INSERT N × campaign_responses (question-level)
2. INSERT 1 × fan_events (event_type = campaign_engagement, points = total, payload.campaignId)
3. awardPoints(... fanEventId = that event, eventType = campaign_trivia | campaign_participation)
```

For this path: **yes**, it is safe to show “esta interacción generó +N puntos” using:

- `fan_events.points` on that event, and/or
- ledger row where `fan_event_id` matches

### Campaign path (FOLLOWING)

```txt
1. campaign_responses created
2. fan_event created (points may be > 0 on the event row)
3. awardPoints SKIPPED (ADR-002 / PRIMARY-only)
```

Showing “+N puntos” from `fan_events.points` for FOLLOWING would be **misleading**. F3 must hide loyalty deltas for FOLLOWING.

### Manual awards

```txt
ledger only — fan_event_id NULL — no fan_events row
```

Activity and points are **independent** here.

### Verdict

| Question | Answer |
|---|---|
| Same behavior always creates both? | **No** |
| Correlation key? | Optional `fan_event_id`; campaign also has `payload.campaignId` / ledger `metadata.campaignId` |
| Safe unified “event generated points” claim? | **Only when** PRIMARY and (`fan_event_id` set **or** explicit product rule using event.points for campaign_engagement) |
| Infer by timestamp proximity? | **Forbidden** |

---

## 6. Campaign engagement flow

Campaign types in schema: `survey | poll | trivia | prediction | raffle | reward`.

No `challenge` type in `CAMPAIGN_TYPES`.

| Step | poll/survey/prediction/raffle/reward | trivia |
|---|---|---|
| `campaign_response` created? | Yes (1 per question) | Yes |
| `fan_event` created? | Yes — always `campaign_engagement` | Yes — same |
| Points on responses? | Split of `campaign.points_reward` | Only correct answers |
| Ledger points? | PRIMARY only | PRIMARY only |
| Link IDs | `campaign_id` on responses; `payload.campaignId` on event; `metadata.campaignId` + `fan_event_id` on ledger | same |

Unified timeline?

```txt
NOT RECOMMENDED for F3A
```

Risk of visual duplication of one participation:

1. Campaign card (aggregated responses)
2. Activity row (`campaign_engagement`)
3. Ledger row (`campaign_participation` / `campaign_trivia`)

Keep three surfaces; optionally deep-link later via campaign id / fan_event id.

---

## 7. Activity Summary readiness matrix

All metrics: org-scoped (`organization_id` + `fan_id`). Relationship semantics noted.

| Metric | Exact definition | Source | Formula | PRIMARY | FOLLOWING | Availability |
|---|---|---|---|---|---|---|
| Interacciones totales | Count of org fan_events | `fan_events` | `COUNT(*)` | Yes | Yes | **READY NOW** (already via behavioral; keep) |
| Interacciones últimos 30d | Count of org fan_events with `occurred_at >= now-30d` | `fan_events` | `COUNT(*)` filter window | Yes | Yes | **QUERY WORK** — replace ledger-based KPI |
| Última actividad | Max `occurred_at` | `fan_events` | `MAX(occurred_at)` | Yes | Yes | **READY NOW** |
| Días desde última actividad | Calendar/floor days since last activity | derived | already in behavioral `daysSinceLast` | Yes | Yes | **READY NOW** (surface carefully) |
| Tipo más frecuente | Mode of `event_type` | `fan_events` | top of group-by count | Yes | Yes | **READY NOW** |
| Tipos distintos | Distinct `event_type` count | `fan_events` | `COUNT(DISTINCT event_type)` | Yes | Yes | **QUERY WORK** (trivial) |
| Días activos últimos 30d | Distinct calendar days with ≥1 event in window | `fan_events` | `COUNT(DISTINCT date_trunc('day', occurred_at))` | Yes | Yes | **QUERY WORK** |
| Campañas participadas | Distinct campaigns with responses | `campaign_responses` | already `totalCampaigns` | Yes | Yes | **READY NOW** (campaigns card; optional KPI mirror) |
| Puntos obtenidos últimos 30d | Sum of positive ledger deltas in window | `fan_points_ledger` | `SUM(points) FILTER (points > 0)` or sum all deltas | **PRIMARY only** | **N/A** | **READY NOW** via velocity.points30d (relabel; do not call “engagement score”) |

Hard bans for F3:

- Do not expose `activityScore` as product metric.
- Do not invent “engagement rate”.
- Do not reuse velocity `trend` as activity growth without redefining it on `fan_events`.

---

## 8. Activity Trend recommendation

**Minimum valuable chart:** daily interaction counts for last 30 days (single series).

| Topic | Recommendation |
|---|---|
| Series | `interactions` per day from `fan_events.occurred_at` |
| Optional second series | **Defer** points earned — different unit/scale; show as separate PRIMARY number, not dual-axis |
| Active-day marker | Optional later (binary day with >0); not required if zero-filled line already shows sparsity |
| Recharts | Reuse pattern from `ActivityVolumeChart` / Home series helpers; fan-scoped slim variant |
| Zero-fill | Yes — reuse `buildDateKeys` + map counts (same idea as `buildActivitySeries`) |
| Timezone | `fan_events.occurred_at` is TIMESTAMP WITHOUT TZ; Home uses `date_trunc('day', occurred_at)` + UTC key helpers — **document as DB/calendar-day bucketing**, same as Dashboard Home; no new TZ product claim |
| Empty state | Flat zeros or empty chart + copy “Sin actividad en los últimos 30 días” |

Do not clone Dashboard Home dual series (interactions + engagedFans) — engagedFans is org-cohort metric, meaningless for one fan.

---

## 9. Activity Breakdown recommendation

Source: group `fan_events` by `event_type` for the fan+org (lifetime or 30d — prefer **lifetime with 30d toggle later**; F3A: lifetime or last 90d — recommend **lifetime** to match current top types, plus 30d in summary).

| Topic | Recommendation |
|---|---|
| Grouping | Raw `event_type` string |
| Labels | Small map for known types (`campaign_engagement` → “Participación en campaña”); fallback: `formatEventTypeLabel` |
| Unknown types | Show fallback label; never drop rows |
| Top-N | Top 5 + “Otros” if >5 (matches existing behavioral slice) |
| Visualization | **Horizontal list with count + %** — best dark-mode readability; avoid donut for sparse single-type data |

Today most real rows will be `campaign_engagement` — UI must still look honest with one dominant bar/row.

---

## 10. Recency / Frequency recommendation

Derive only from `lastActivityAt` / `daysSinceLast` (fan_events). **Not a score.**

Proposed vocabulary (Spanish UI):

| Signal | Condition | Notes |
|---|---|---|
| Activo hoy | `daysSinceLast === 0` | Safe |
| Activo esta semana | `daysSinceLast` in 1..6 | Safe |
| Sin actividad reciente | `daysSinceLast` in 7..29 | Safe descriptive |
| Sin actividad hace 30+ días | `daysSinceLast >= 30` | Safe |
| Sin actividad registrada | `lastActivityAt === null` | Safe |

```txt
PRODUCT DECISION REQUIRED
```

if product wants branded tiers (“Hincha frío/caliente”) or numeric frequency scores. F3 should ship **plain recency phrases** only, or omit chips if copy is undecided.

Do **not** reuse ledger `trend: accelerating|stable|dormant` as activity frequency.

---

## 11. Exact Rank assessment

| Topic | Finding |
|---|---|
| Source | `fans.engagement_score` among PRIMARY non-archived FO members |
| Org scope | Current organization |
| Relationship | **PRIMARY-only** (FOLLOWING: N/A) |
| Existing API | `getOrgLeaderboard(org, limit)` — top-N ranks only |
| Exact rank | Needs `COUNT(*)` of peers with score **strictly greater** (+ tie policy) |
| Ties | Undefined today — **PRODUCT DECISION REQUIRED** (competition rank vs dense rank) |
| Query cost | One cheap COUNT for single Fan 360 — acceptable |
| UX utility | Nice-to-have; Home/Gamification already show top list |

Classification:

```txt
QUERY WORK — DEFER OUT OF F3A
NOT RECOMMENDED as F3 blocker
```

Optional F3B/F3C if product insists; never invent rank from top-5 presence.

---

## 12. PRIMARY vs FOLLOWING behavior

| F3 surface | PRIMARY | FOLLOWING |
|---|---|---|
| Activity summary (fan_events) | Yes | Yes |
| 30d activity trend | Yes | Yes |
| Activity breakdown | Yes | Yes |
| Recency phrases | Yes | Yes |
| Timeline (`fan_events`) | Yes | Yes |
| Campaign participation | Yes | Yes |
| Points 30d / ledger / level / rank | Yes | **No** (ADR-002) |
| “+pts” on activity rows | Only if loyalty-eligible | **No** (hide even if `fan_events.points > 0`) |
| Velocity/ledger trend | Optional in Gamification | Null / hidden |

FOLLOWING copy already correct in F2; F3 must not imply org loyalty via activity points badges.

---

## 13. Proposed Fan 360 F3 UX

Do **not** redesign the page. Enrich the **Actividad** card and fix KPI honesty.

### Keep

- Identity header
- KPI strip structure (with corrected metrics)
- Campaigns card (separate)
- Gamification card (PRIMARY ledger)
- Segment / EEP / Identity sections

### Activity card — proposed anatomy

```txt
Actividad
├── Summary strip (compact): totales · 30d · última · (recency phrase)
├── Trend spark/area: interacciones 30d (zero-filled)
├── Breakdown: top event types (list + %)
└── Timeline: existing FanActivityTimeline (compact, scroll)
```

### KPI strip adjustments

| KPI | Action |
|---|---|
| Puntos / Nivel | Keep (PRIMARY); N/A FOLLOWING |
| Interacciones 30d | **Fix source** → fan_events |
| Última actividad | Keep |
| Segmento | Keep |
| Optional later | Campañas participadas — only if strip not crowded |

### Compact / move / replace

| Current | F3 action |
|---|---|
| “Tipo más frecuente” one-liner | Fold into Breakdown |
| Full behavioral `activityScore` | Do not surface |
| Ledger velocity in Activity | Keep out of Activity; optional under Gamification as “puntos 30d” |
| Timeline | Keep; do not merge ledger/campaigns into it |

Avoid turning Fan 360 into Dashboard Home (no org-wide engagedFans, no integration health).

---

## 14. Query work required

For one Fan 360 load (beyond F2):

| Query | Purpose |
|---|---|
| Fix interactions 30d | `COUNT` fan_events in window (or derive from loaded events if limit lifted carefully — prefer SQL) |
| Active days 30d | Distinct day count |
| Daily series 30d | `GROUP BY date_trunc('day', occurred_at)` |
| Breakdown | Group by `event_type` (may reuse/extend behavioral; avoid loading unbounded rows twice) |
| Points 30d | Already in velocity — expose under Gamification, not as “interacciones” |
| Exact rank | Deferred |

Loading strategy:

- Keep `Promise.all` fan-scoped fetches.
- Prefer **one aggregation query** returning summary+breakdown+series over N scans of full event history.
- Timeline can remain `LIMIT 50` newest events.

---

## 15. Performance assessment

| Concern | Assessment |
|---|---|
| Single-fan aggregations | Cheap at current scale |
| `getFanBehavioralProfile` loads all event rows for fan+org | Acceptable now; F3 should not worsen (aggregate in SQL if expanding) |
| Missing composite index `(organization_id, fan_id, occurred_at)` | Noted since F1/F2; **recommend only if** EXPLAIN shows seq scans under real load — **do not add preemptively** |
| Exact rank full sort | Avoid; use COUNT window |
| Extra Recharts client bundle | Already in dashboard; Fan 360 can reuse |

No index creation in F3 unless measured.

---

## 16. Data quality limitations

| Issue | Class |
|---|---|
| Few / sparse `fan_events` until campaign participation | DATA LIMITATION |
| Almost all real events collapse to `campaign_engagement` | DATA + PRODUCT LIMITATION |
| UI maps advertise event types never written | TECHNICAL DEBT |
| `interactionsLast30d` sourced from ledger | TECHNICAL DEBT / BUG |
| `activityScore` heuristic exists in API/demo surfaces | TECHNICAL DEBT (do not expand) |
| FOLLOWING: event.points without ledger | PRODUCT LIMITATION (correct loyalty) — UI must not mislabel |
| Manual awards without fan_event | PRODUCT/TECH — expected |
| No correlation id on campaign_responses → fan_events | TECHNICAL DEBT (payload only) |
| `occurred_at` WITHOUT TZ vs ledger `created_at` WITH TZ | TECHNICAL DEBT — document bucketing consistency with Home |
| Timestamps only as real participation occurs | DATA LIMITATION |

---

## 17. F3 implementation readiness matrix

| Workstream | Readiness |
|---|---|
| Fix interactions 30d → fan_events | READY / MUST |
| Activity summary honesty | READY |
| 30d trend series + chart | QUERY WORK + UI |
| Breakdown list | QUERY WORK + UI (partial data already) |
| Recency phrases | READY (product copy optional) |
| Points 30d under Gamification | READY NOW |
| Unified timeline | DEFERRED / NOT SAFE |
| Exact rank | DEFERRED |
| New event types / ingestion | OUT OF SCOPE |
| Migration 020 | NOT STARTED — do not start |

---

## 18. Recommended F3 scope

### F3A — Activity Intelligence (recommended first implementation)

```txt
1. Correct Interacciones 30d (+ any summary helpers) to fan_events
2. Activity summary: totals, 30d, last activity, days since, most frequent, distinct types, active days 30d
3. 30d interactions trend (zero-filled)
4. Event-type breakdown (real types only)
5. Optional recency phrase from lastActivityAt
6. PRIMARY: show puntos 30d inside Gamification (existing velocity.points30d)
7. FOLLOWING: activity yes; loyalty no; hide +pts on activity
```

### F3B — Correlation polish (later)

```txt
- Safer “esta interacción → puntos” only via fan_event_id / PRIMARY
- Campaign deep links from activity payload
- Still NOT a merged triple timeline
```

### F3C — Exact rank (optional)

```txt
- PRIMARY-only rank query + tie policy after product decision
```

**Unified Timeline:** not recommended until product accepts duplication rules or adds stronger correlation.

---

## 19. Exact first implementation block

```txt
Block F3A — Activity Intelligence
```

Ordered steps:

1. Redefine `buildFanActivitySummary` / Fan 360 KPI to use **fan_events** for `interactionsLast30d` (and active days if included).
2. Stop using `EngagementVelocity.events30d` as “interacciones”.
3. Add fan-scoped 30d daily series query + compact chart in Actividad.
4. Surface breakdown from real `event_type` aggregates.
5. Keep timeline; keep campaigns/gamification separate.
6. Tests for summary purity + series zero-fill.
7. No schema / Neon / Migration 020.

Wait for explicit authorization before coding.

---

## 20. Risks / technical debt

1. **Silent metric lie** on Interacciones 30d (ledger vs events) — highest priority.
2. `activityScore` / velocity trend may leak into F3 if reused casually — ban in Activity.
3. Sparse demo data makes charts look “empty” — empty states must stay honest.
4. Label map drift vs writers (`trivia_correct` vs `campaign_engagement`).
5. Dual timestamps (events without TZ, ledger with TZ) can confuse day buckets if mixed.
6. Loading all events for behavioral profile may need SQL aggregation as volume grows.
7. Temptation to invent engagement scores to fill the card — reject.

---

## 21. Foundation invariant verification

```txt
fans.organization_id                 ABSENT
fan_organizations                    SoT ownership
PRIMARY / FOLLOWING                  ADR-002 loyalty rules unchanged
organizations.sport / sport_id       ABSENT
Canonical org sport path             competition_organizations → competitions → sports
fans.country                         REMOVED
fans.country_code                    geography SoT
No dual-write ownership
No AI / predictive / fake engagement scores
Migration 020                        NOT STARTED / NO FROZEN SCOPE
```

This audit proposes **no** Foundation, schema, Neon, or Drizzle contract changes.

---

## 22. Migration 020 status

```txt
NOT STARTED
NO FROZEN SCOPE
DO NOT START
DO NOT DESIGN SQL IN THIS BLOCK
```

---

## 23. Files inspected

```txt
AGENTS.md
AI_RULES.md
PROJECT_STATE.md
docs/decisions/ADR-002-primary-and-followed-organizations.md
docs/decisions/ADR-009-legacy-fan-ownership-deprecation.md (context via PROJECT_STATE / prior audits)
docs/sessions/2026-07-20-fan-intelligence-audit.md
docs/sessions/2026-07-20-fan-intelligence-f1-f2.md

src/app/dashboard/fans/[id]/Fan360Client.tsx
src/app/dashboard/fans/[id]/page.tsx (referenced via F2 contracts)
src/server/queries/fan-intelligence.ts
src/server/queries/fan-campaigns.ts
src/server/queries/fan-events.ts
src/server/queries/engagement-intelligence.ts
src/server/queries/gamification.ts
src/server/queries/dashboard-home.ts
src/lib/fan-intelligence.ts
src/lib/dashboard-home-series.ts
src/lib/dashboard-home-format.ts
src/components/fans/FanActivityTimeline.tsx
src/components/gamification/PointsTimeline.tsx
src/components/dashboard/ActivityVolumeChart.tsx
src/server/services/campaign-submissions.ts
src/server/services/points.ts
src/db/schema/events.ts
src/db/schema/gamification.ts
src/db/schema/campaigns.ts
scripts/migrate-campaign-engine-v1.ts (seed scope check)
```

---

## 24. Files modified

```txt
docs/sessions/2026-07-20-fan-intelligence-f3-audit.md  (this document only)
```

`PROJECT_STATE.md` — **not modified** (implementation has not begun).

---

## Stop condition

```txt
AUDIT COMPLETE
NO IMPLEMENTATION
NO COMMIT
NO PUSH
NO NEON CHANGES
NO SCHEMA CHANGES
NO MIGRATIONS

Await explicit authorization before F3A implementation.
```

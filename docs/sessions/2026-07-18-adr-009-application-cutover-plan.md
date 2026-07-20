# ADR-009 Application Cutover Plan

Date:

2026-07-18

Status:

```txt
Phase A — DONE (Drizzle representation)
Phase B — DONE (shared membership primitives)
Phase C — DONE (read-path cutover C1–C6; R03/R05 frozen)
Phase D — DONE (createOrganizationFan write cutover; R04 Option A)
Phase E — DONE (contract/type cleanup; FanView omits ownership projection)
Phase F2 — DONE (stop legacy projection write + remove Drizzle fans.organizationId mapping)
Phase G — DONE (ADR-009 Migration 018b Gate Assessment PASS)
Migration 018a COMPLETE
Migration 018b COMPLETE (physical DROP executed and validated in Neon)
ADR-009 contract phase COMPLETE

Phase D technical debt (recorded; unchanged by 018b):
  neon-http has no interactive transactions;
  create uses INSERT fans → INSERT fan_organizations →
  best-effort DELETE fan on relationship failure.
  Create path is NOT fully transactional.
```

---

## Goal

Migrate application runtime from `fans.organization_id` to `fan_organizations` as the sole authoritative fan↔organization relationship, per ADR-001, ADR-002, and ADR-009.

Out of scope for this plan execution (until later):

```txt
Migration 018 Design Brief / SQL
Neon DROP / structural ALTER of fans.organization_id
Removal of idx_fans_org
```

---

## Invariants

```txt
fan_organizations = sole authoritative relationship
fans.organization_id = DEPRECATED / non-authoritative
No peer dual-write
Temporary legacy writes = PRIMARY compatibility projection only
Loyalty ownership = PRIMARY organization (ADR-002)
```

---

## 1. Recommended decisions for R01–R05

### R01 — Demo API `organizationId` request context

**Recommendation: KEEP as tenant/command context (not a fan column).**

Demo login/register may continue to require `organizationId` in the request body as the organization the caller is acting within.

After cutover, membership is verified via `fan_organizations`, not `fans.organization_id`.

**Approval:** Not required (aligns with ADR-009 / readiness REVIEW note).

---

### R02 — JWT `organizationId` tenancy claim

**Recommendation: KEEP as session tenancy claim.**

Token claim remains organization context for the session. Authorization checks must use `fan_organizations` membership for that `(fanId, organizationId)`.

**Approval:** Not required.

---

### R03 — `getFansByOrg`: PRIMARY-only vs ANY relationship

**Recommendation: PRIMARY-only for the current dashboard Fans list / `getFansByOrg`.**

Rationale:

- Dashboard “Fans” is a loyalty/community membership surface today.
- ADR-002: primary = loyalty / community identity.
- FOLLOWING is interest/content (future “Followers” / community views can use ANY or FOLLOWING-only).

Provide a separate helper later if product needs “all related fans” (PRIMARY + FOLLOWING).

**Approval: REQUIRED before Phase C** — product contract for admin fan listing.

---

### R04 — Duplicate email under Global Fan Model

**Recommendation: Global fan identity; email uniqueness is platform-global (already DB-enforced).**

On create in org O:

```txt
If no fan with that email → create fan + fan_organizations PRIMARY for O
If fan exists and already related to O → reject (already member)
If fan exists and has no relation to O → do NOT create a second fan;
  establish relationship (default FOLLOWING, or product-defined) —
  OR reject with “fan exists globally; link flow required”
```

Foundation cutover minimum (safe default for current single-PRIMARY clubs):

```txt
If email exists globally → reject create (duplicate identity)
Do not invent a second fan row
Multi-org link/follow flows remain a later product feature
```

**Approval: REQUIRED before Phase D** — changes create semantics vs today’s per-org duplicate check.

---

### R05 — Loyalty / `engagement_score` organization semantics

**Recommendation (cutover scope):**

```txt
Loyalty mutations / leaderboards / points award authorization
  → require PRIMARY membership in the acting organization

engagement_score remains on fans for now (single running score)
  → org scoping of who may mutate/read for loyalty uses PRIMARY check
  → redesign of org-scoped balances (if needed) is OUT OF SCOPE for this cutover
```

Ledger rows remain `fan_points_ledger.organization_id` (org-owned ledger), authorized only when fan’s PRIMARY is that org (or product later allows FOLLOWING — not recommended for points).

**Approval: REQUIRED before Phase C loyalty paths** — confirms PRIMARY-only loyalty authorization.

---

## 2. Semantic matrix (ANY vs PRIMARY)

| Runtime path | Blocker | Semantic | Rationale |
|--------------|---------|----------|-----------|
| `getFansByOrg` (dashboard fans) | B04 | **PRIMARY** (pending R03) | Admin membership list |
| `getFanById` | B05 | **ANY** | Access if related to org (PRIMARY or FOLLOWING) |
| `getFanByEmail` | B06 | **ANY** | Demo/login in org context if related |
| `assertFanOwnership` / fan actions WHERE | B07–B08 | **ANY** | Mutate profile/status if related |
| `fan-profile` ownership | B09 | **ANY** | Same |
| `awardPoints` / `rebuildFanBalance` | B10 | **PRIMARY** | Loyalty ownership (ADR-002 / R05) |
| `recomputeFanSegment` + org batch | B11 | **PRIMARY** | Org-owned segment rules / loyalty-adjacent |
| Campaign submit fan check | B12 | **ANY** | Fan may engage if related (content/community) |
| `getOrgLeaderboard` | B13 | **PRIMARY** | Loyalty ranking |
| Engagement intelligence fan sets | B14 | **PRIMARY** | Org loyalty/analytics cohort |
| `createOrganizationFan` | B15 | Creates **PRIMARY** | Onboarding into org as primary (ADR-002) |

**ANY** = exists row in `fan_organizations` for `(fan_id, organization_id)` regardless of `is_primary`.  
**PRIMARY** = that row has `is_primary = TRUE` (and typically `relationship_type = 'PRIMARY'`).

---

## 3. Phased implementation plan

### Phase A — Drizzle representation

**Goal:** Represent existing Neon `fan_organizations` in Drizzle without DB DDL.

**Files expected:**

```txt
src/db/schema/fan-organizations.ts   (new)
src/db/schema/index.ts               (export)
```

**Blockers resolved:** B02 (partial — mapping exists), B01 remains until Phase F.

**Before:** No Drizzle model; app cannot query SoT.  
**After:** Typed table + inferred types; `fans.organizationId` still mapped.

**Risks:** Low. Schema drift if columns misnamed — validate against Neon.  
**Validation:** Typecheck; optional smoke select count.  
**Independently deployable:** Yes (no behavior change).

---

### Phase B — Shared membership primitives

**Goal:** Minimum reusable helpers; no call-site cutover yet (or thin wrappers only).

**Proposed module:** `src/server/queries/fan-organizations.ts` (and/or small service helpers)

Primitives:

```txt
assertFanOrgMembership(fanId, organizationId, mode: 'any' | 'primary')
getPrimaryOrganizationId(fanId) → string | null
listFanIdsForOrganization(organizationId, mode: 'any' | 'primary')
fanHasOrgRelationship(fanId, organizationId, mode) → boolean
```

Optional later:

```txt
listFansForOrganization(...) // joins fans
ensurePrimaryProjection(fanId) // writes fans.organization_id from PRIMARY
```

**Blockers resolved:** B03 (partial — primitives exist), enables B04–B15.  
**Before:** Ad-hoc `fans.organizationId` filters.  
**After:** Canonical membership API available.  
**Risks:** Low if unused by prod paths yet.  
**Validation:** Unit/integration tests for PRIMARY / FOLLOWING / deny cross-org.  
**Independently deployable:** Yes.

---

### Phase C — READ cutover (B04–B14)

**Goal:** All authorization/listing/loyalty reads use `fan_organizations` semantics from the matrix.

**Files expected (primary):**

```txt
src/server/queries/fans.ts
src/server/actions/fans.ts
src/server/actions/fan-profile.ts
src/server/services/points.ts
src/server/services/segmentation.ts
src/server/services/campaign-submissions.ts
src/server/queries/gamification.ts
src/server/queries/engagement-intelligence.ts
```

**Blockers resolved:** B04–B14, B18 (query dependency on idx_fans_org reduced as filters move).  
**Before:** Tenancy via `fans.organization_id`.  
**After:** Tenancy via `fan_organizations`; legacy column unread by these paths.  
**Risks:** Medium — wrong ANY vs PRIMARY breaks loyalty or hides fans.  
**Validation:** Matrix cases + regression on dashboard fans, demo login, points, campaigns, EI.  
**Independently deployable:** Yes, if Phase A+B done and R03/R05 approved.  
**Depends on:** Human approval of R03, R05.

During Phase C, if approved consumers still need the column populated, projection maintenance remains a Phase D concern for creates; existing rows should already match PRIMARY from Migration 001 backfill (validate divergent=0).

---

### Phase D — WRITE cutover (B15)

**Goal:** `createOrganizationFan` becomes ADR-009 compliant.

**Behavior after:**

```txt
1. Resolve/create global fan identity (email rules per approved R04)
2. INSERT fan_organizations PRIMARY for organizationId
3. Optionally set fans.organization_id = PRIMARY org as compatibility projection only
4. Never write organization_id without a corresponding PRIMARY row
5. Do not peer dual-write independent values
```

**Files expected:**

```txt
src/server/services/fans.ts
(possibly) src/server/actions/fans.ts
```

**Blockers resolved:** B15, B20 (PRIMARY on create), B10 gate-10 writer class.  
**Before:** Independent write to `fans.organization_id`; no `fan_organizations` insert.  
**After:** Authoritative relationship write; projection optional/derived.  
**Risks:** High — identity/email semantics; transactionality (fan + relationship).  
**Validation:** Create fan → PRIMARY row exists; projection matches PRIMARY if enabled; no orphan fans without PRIMARY.  
**Independently deployable:** Yes after A+B; preferably after C so readers already trust `fan_organizations`.  
**Depends on:** Human approval of R04.

---

### Phase E — Contract / type cleanup (B16–B17)

**Goal:** Distinguish command/session org context from fan entity ownership.

**Actions:**

```txt
Stop selecting organizationId in app-facing fan DTOs where possible
Narrow NewFan inserts to omit organizationId once projection retired
Keep CreateOrganizationFanInput.organizationId as command context
Avoid treating Fan.organizationId as business ownership in UI/API responses
```

**Files expected:**

```txt
src/db/schema/fans.ts          (mapping may remain until Phase F)
src/server/queries/fans.ts     (explicit column selects)
src/server/services/fans.ts
demo response mappers if they leak fan.organizationId
```

**Blockers resolved:** B16–B17 (behavioral), B01 remains until mapping removed.  
**Independently deployable:** Yes, incrementally.  
**Risks:** Medium — anything spreading full `Fan` rows.

---

### Phase F / F2 — Legacy projection retirement — DONE (2026-07-18)

**Goal:** Zero readers/writers of `fans.organization_id` in runtime; remove Drizzle mapping.

**Actions completed:**

```txt
Stop projection write in createOrganizationFan (omit fans.organization_id)
Remove Drizzle organizationId from fans schema (B01)
FanView ≡ Fan (structural); toFanView retained as identity mapper
Confirm idx_fans_org unused by app (later removed by 018b)
```

**Blockers resolved:** B01, B16 residual, B18 app dependency, Gate 10 (app writers).  
**Independently deployable:** Yes — column remained in Neon until 018b.  
**Validation:** tsc / build / scoped eslint / Phase B semantic tests; runtime grep = zero `fans.organizationId` mapping/reads/writes.  
**Authorized next:** Phase G gate assessment (completed PASS) → Migration 018b.

---

### Phase G — Re-run Migration 018 Gate Assessment — DONE (PASS)

**Goal:** Prove ADR-009 hard gates.

**Output:** READY FOR 018b — PASS (2026-07-18).

Migration 018b Design Brief / SQL / Neon DROP subsequently completed.

---

## 4. Blocker-to-phase mapping

| Blocker | Phase |
|---------|-------|
| B01 Drizzle fans.organizationId mapping | F (remove); retained A–E |
| B02 Missing fan_organizations schema | A |
| B03 No is_primary runtime | B (+ D create) |
| B04 getFansByOrg | C |
| B05 getFanById | C |
| B06 getFanByEmail | C |
| B07 assertFanOwnership | C |
| B08 fan actions WHERE | C |
| B09 fan-profile WHERE | C |
| B10 points loyalty scope | C |
| B11 segmentation | C |
| B12 campaign-submissions | C |
| B13 leaderboard | C |
| B14 engagement-intelligence | C |
| B15 createOrganizationFan write | D |
| B16 Fan/NewFan exposure | E (complete in F) |
| B17 CreateOrganizationFanInput | E (keep as context; stop persisting as ownership) |
| B18 idx_fans_org app dependency | C–F (cleared when filters gone) |
| B19 Zero fan_organizations usage | A–D |
| B20 PRIMARY semantics absent | B + D |

---

## 5. Compatibility projection lifecycle

| Stage | `fans.organization_id` |
|-------|------------------------|
| After 017 / today | Populated historically; app still authoritative writer (non-compliant) |
| After Phase D | Written **only** as `PRIMARY.organization_id` projection when creating/updating PRIMARY |
| After Phase C | Must not be read by cut-over paths |
| After Phase F | No reads, no writes |
| Before 018b | Gate assessment proves zero approved consumers |
| After 018b | Column + FK + idx_fans_org PHYSICALLY REMOVED |

Projection algorithm:

```txt
On PRIMARY create/change:
  fans.organization_id := fan_organizations.organization_id
    WHERE fan_id = :id AND is_primary = TRUE

Never set organization_id from request without PRIMARY row
Never set organization_id for FOLLOWING-only relationships
```

Proof before 018:

```txt
1. ripgrep: zero fans.organizationId in src/ (except maybe removed)
2. Drizzle schema: column unmapped
3. Runtime/integration tests green without column reads
4. SQL divergent check still 0 (or column unused)
5. Re-run formal 018 gate assessment → READY
```

---

## 6. Test / validation strategy

| Area | Cases |
|------|-------|
| PRIMARY membership | Fan with PRIMARY in A passes primary checks in A; fails in B |
| FOLLOWING membership | FOLLOWING in A passes ANY in A; fails PRIMARY checks in A |
| Cross-org auth | Fan PRIMARY A cannot pass membership for B |
| Fan creation | Creates fan + exactly one PRIMARY; projection matches PRIMARY |
| Loyalty | awardPoints only if PRIMARY; ledger org = acting org |
| Segmentation | recompute only for PRIMARY org cohort |
| Campaigns | ANY membership can submit (per matrix) |
| Leaderboards | PRIMARY-only cohort |
| EI | PRIMARY-only fan sets |
| Projection | After create, `fans.organization_id = PRIMARY.organization_id` |
| Negative | No peer dual-write of different orgs |

Prefer integration tests against Neon/dev DB with fixtures: two orgs, one PRIMARY, one FOLLOWING.

---

## 7. Recommended first implementation phase

```txt
Phase A — Drizzle representation of fan_organizations
```

Then immediately Phase B (helpers + tests) before any production read cutover.

**Do not start Phase C/D until R03, R04, R05 are human-approved.**

---

## 8. Migration 018 / 018b status

```txt
Migration 018a COMPLETE (omit-safe / NULLABLE).
Migration 018b COMPLETE (physical DROP executed and validated in Neon).

Removed:
  fans.organization_id
  fans_organization_id_fkey
  idx_fans_org

ADR-009 contract phase COMPLETE.
fan_organizations = sole authoritative fan↔organization relationship.
```

---

## Human approval gates before implementation

| Decision | Required before |
|----------|-----------------|
| R03 PRIMARY-only `getFansByOrg` | Phase C |
| R04 Global email create reject (safe default) | Phase D |
| R05 PRIMARY-only loyalty authorization | Phase C (points/leaderboard/EI/segmentation) |

R01/R02 recommended as KEEP — no approval blocker.

---

## Related

```txt
ADR-001, ADR-002, ADR-009
Migration 017 session / SQL
Migration 018a session / SQL
Migration 018b session / SQL — COMPLETE
Post-F2 ADR-009 Gate Assessment (2026-07-18) — PASS
```

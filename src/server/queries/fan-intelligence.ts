/**
 * Fan Intelligence V1 query contracts (F1 list + F2 Fan 360 + F3A Activity).
 *
 * Ownership SoT: fan_organizations (ADR-009).
 * Geography SoT: fans.country_code.
 * List default cohort: PRIMARY, non-archived.
 * Fan 360 access: ANY membership (PRIMARY | FOLLOWING).
 * Activity metrics: fan_events only (never ledger as interaction proxy).
 */

import { db } from "@/db";
import { fanEvents, fanOrganizations } from "@/db/schema";
import type {
  EepSyncStatus,
  FanEvent,
  FanLevel,
  FanPointsLedger,
  FanView,
} from "@/db/schema";
import { and, desc, eq, gte, inArray, max, sql } from "drizzle-orm";
import { getFansByOrg, getFanById } from "./fans";
import { hasFanOrgMembership } from "./fan-organizations";
import { getFanEventsByFan } from "./fan-events";
import {
  computeLevelForScore,
  getFanLedger,
  getOrgLevels,
} from "./gamification";
import {
  getEngagementVelocity,
  getFanEligibleExperiences,
  type EligibleExperience,
  type EngagementVelocity,
} from "./engagement-intelligence";
import {
  getFanCampaignHistory,
  type FanCampaignHistory,
} from "./fan-campaigns";
import {
  ACTIVITY_WINDOW_DAYS,
  buildFanActivityBreakdown,
  buildFanActivitySummary,
  buildFanActivityTrendSeries,
  formatActivityRecency,
  isLoyaltyEligible,
  mergeLastActivityAt,
  normalizeRelationshipType,
  type FanActivityBreakdownRow,
  type FanActivitySummaryView,
  type FanActivityTrendPoint,
  type FanRelationshipType,
} from "@/lib/fan-intelligence";

export type { FanCampaignHistory };
export {
  buildFanActivitySummary,
  normalizeRelationshipType,
  ACTIVITY_WINDOW_DAYS,
};

// ─── List types ───────────────────────────────────────────────────────────────

export type FanIntelligenceListRow = FanView & {
  lastActivityAt: Date | null;
};

// ─── Fan 360 types ────────────────────────────────────────────────────────────

export interface FanOrgRelationshipView {
  type: FanRelationshipType;
  joinedAt: Date | null;
  isPrimary: boolean;
}

export type FanActivitySummary = FanActivitySummaryView;

export interface Fan360ActivityIntelligence {
  events: FanEvent[];
  summary: FanActivitySummary;
  trend: FanActivityTrendPoint[];
  breakdown: FanActivityBreakdownRow[];
  /** Factual recency phrase from lastActivityAt — not a score. */
  recencyLabel: string;
  windowDays: number;
}

export interface Fan360Gamification {
  eligible: boolean;
  score: number | null;
  level: FanLevel | null;
  ledger: FanPointsLedger[];
  /** Ledger velocity — points economy only; never used as interaction counts. */
  velocity: EngagementVelocity | null;
}

export interface Fan360EepState {
  syncStatus: EepSyncStatus;
  contactId: string | null;
  lastSyncAt: Date | null;
  lastError: string | null;
}

export interface Fan360Profile {
  fan: FanView;
  relationship: FanOrgRelationshipView;
  activity: Fan360ActivityIntelligence;
  gamification: Fan360Gamification;
  segmentation: {
    localSegment: string | null;
    experiences: EligibleExperience[];
  };
  campaigns: FanCampaignHistory;
  eep: Fan360EepState;
  orgLevels: FanLevel[];
}

// ─── Last activity (org-scoped, batched) ──────────────────────────────────────

/**
 * MAX(occurred_at) per fan for the organization.
 * Single grouped query — avoids N+1 on the Fans list.
 */
export async function getLastActivityByFanIds(
  organizationId: string,
  fanIds: string[],
): Promise<Map<string, Date>> {
  const map = new Map<string, Date>();
  if (fanIds.length === 0) return map;

  const rows = await db
    .select({
      fanId: fanEvents.fanId,
      lastActivityAt: max(fanEvents.occurredAt).as("last_activity_at"),
    })
    .from(fanEvents)
    .where(
      and(
        eq(fanEvents.organizationId, organizationId),
        inArray(fanEvents.fanId, fanIds),
      ),
    )
    .groupBy(fanEvents.fanId);

  for (const row of rows) {
    if (row.lastActivityAt) {
      map.set(row.fanId, new Date(row.lastActivityAt));
    }
  }

  return map;
}

// ─── F1 — Fans Intelligence List ──────────────────────────────────────────────

/**
 * PRIMARY non-archived fans for the CRM list, enriched with last activity.
 * FOLLOWING fans are intentionally excluded (default CRM cohort).
 */
export async function getFansIntelligenceList(
  organizationId: string,
): Promise<FanIntelligenceListRow[]> {
  const fansList = await getFansByOrg(organizationId);
  const lastActivity = await getLastActivityByFanIds(
    organizationId,
    fansList.map((f) => f.id),
  );
  return mergeLastActivityAt(fansList, lastActivity);
}

// ─── Relationship ─────────────────────────────────────────────────────────────

/**
 * fan_organizations row for (fan, org). Null when no relationship.
 */
export async function getFanOrgRelationship(
  organizationId: string,
  fanId: string,
): Promise<FanOrgRelationshipView | null> {
  const [row] = await db
    .select({
      relationshipType: fanOrganizations.relationshipType,
      isPrimary: fanOrganizations.isPrimary,
      joinedAt: fanOrganizations.joinedAt,
    })
    .from(fanOrganizations)
    .where(
      and(
        eq(fanOrganizations.organizationId, organizationId),
        eq(fanOrganizations.fanId, fanId),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    type: normalizeRelationshipType(row.relationshipType, row.isPrimary),
    isPrimary: row.isPrimary,
    joinedAt: row.joinedAt ? new Date(row.joinedAt) : null,
  };
}

// ─── F3A — Activity Intelligence (fan_events) ─────────────────────────────────

const eventDaySql = sql<string>`to_char(date_trunc('day', ${fanEvents.occurredAt}), 'YYYY-MM-DD')`;

function activityWindowStart(windowDays: number, now = new Date()): Date {
  return new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
}

/**
 * Org + fan scoped activity aggregates from fan_events only.
 * Interactions ≠ ledger rows.
 */
export async function getFanActivityIntelligence(
  organizationId: string,
  fanId: string,
  windowDays: number = ACTIVITY_WINDOW_DAYS,
  now: Date = new Date(),
): Promise<Omit<Fan360ActivityIntelligence, "events">> {
  const days =
    Number.isFinite(windowDays) && windowDays > 0
      ? Math.floor(windowDays)
      : ACTIVITY_WINDOW_DAYS;
  const windowStart = activityWindowStart(days, now);

  const fanScope = and(
    eq(fanEvents.organizationId, organizationId),
    eq(fanEvents.fanId, fanId),
  );

  const [totalsRow, breakdownRows, dailyRows] = await Promise.all([
    db
      .select({
        totalInteractions: sql<number>`count(*)::int`,
        interactionsLast30d: sql<number>`count(*) FILTER (WHERE ${fanEvents.occurredAt} >= ${windowStart})::int`,
        lastActivityAt: max(fanEvents.occurredAt),
      })
      .from(fanEvents)
      .where(fanScope),

    db
      .select({
        eventType: fanEvents.eventType,
        count: sql<number>`count(*)::int`,
      })
      .from(fanEvents)
      .where(fanScope)
      .groupBy(fanEvents.eventType)
      .orderBy(desc(sql`count(*)`)),

    db
      .select({
        date: eventDaySql.as("date"),
        count: sql<number>`count(*)::int`,
      })
      .from(fanEvents)
      .where(and(fanScope, gte(fanEvents.occurredAt, windowStart)))
      .groupBy(eventDaySql)
      .orderBy(eventDaySql),
  ]);

  const totals = totalsRow[0];
  const totalInteractions = Number(totals?.totalInteractions ?? 0);
  const interactionsLast30d = Number(totals?.interactionsLast30d ?? 0);
  // Distinct calendar days with ≥1 event in window (same day bucket as trend).
  const activeDaysLast30d = dailyRows.length;
  const lastActivityAt = totals?.lastActivityAt
    ? new Date(totals.lastActivityAt)
    : null;

  const typeCounts = breakdownRows.map((row) => ({
    eventType: row.eventType,
    count: Number(row.count ?? 0),
  }));

  const mostFrequentEventType =
    typeCounts.length > 0 ? typeCounts[0].eventType : null;

  const summary = buildFanActivitySummary({
    totalInteractions,
    interactionsLast30d,
    activeDaysLast30d,
    mostFrequentEventType,
    lastActivityAt,
    now,
  });

  const trend = buildFanActivityTrendSeries(
    dailyRows.map((row) => ({
      date: String(row.date),
      count: Number(row.count ?? 0),
    })),
    days,
    now,
  );

  return {
    summary,
    trend,
    breakdown: buildFanActivityBreakdown(typeCounts),
    recencyLabel: formatActivityRecency({
      lastActivityAt: summary.lastActivityAt,
      daysSinceLast: summary.daysSinceLast,
    }),
    windowDays: days,
  };
}

// ─── F2 — Fan 360 Profile ─────────────────────────────────────────────────────

/**
 * Full Fan 360 payload for the active organization.
 * Returns null when the fan has no fan_organizations relationship with the org.
 * Allows PRIMARY and FOLLOWING; denies no-relationship.
 */
export async function getFan360Profile(
  organizationId: string,
  fanId: string,
): Promise<Fan360Profile | null> {
  const related = await hasFanOrgMembership(fanId, organizationId, "any");
  if (!related) return null;

  const [fan, relationship] = await Promise.all([
    getFanById(organizationId, fanId),
    getFanOrgRelationship(organizationId, fanId),
  ]);

  if (!fan || !relationship) return null;

  const loyaltyEligible = isLoyaltyEligible(relationship.type);

  const [events, ledger, activityIntel, velocity, experiences, orgLevels, campaigns] =
    await Promise.all([
      getFanEventsByFan(organizationId, fanId),
      loyaltyEligible
        ? getFanLedger(organizationId, fanId)
        : Promise.resolve([] as FanPointsLedger[]),
      getFanActivityIntelligence(organizationId, fanId),
      loyaltyEligible
        ? getEngagementVelocity(organizationId, fanId)
        : Promise.resolve(null as EngagementVelocity | null),
      getFanEligibleExperiences(organizationId, fan.segment),
      getOrgLevels(organizationId),
      getFanCampaignHistory(organizationId, fanId),
    ]);

  const score = fan.engagementScore ?? 0;

  return {
    fan,
    relationship,
    activity: {
      events,
      ...activityIntel,
    },
    gamification: loyaltyEligible
      ? {
          eligible: true,
          score,
          level: computeLevelForScore(score, orgLevels),
          ledger,
          velocity,
        }
      : {
          eligible: false,
          score: null,
          level: null,
          ledger: [],
          velocity: null,
        },
    segmentation: {
      localSegment: fan.segment,
      experiences,
    },
    campaigns,
    eep: {
      syncStatus: fan.eepSyncStatus,
      contactId: fan.eepContactId,
      lastSyncAt: fan.eepLastSyncAt ? new Date(fan.eepLastSyncAt) : null,
      lastError: fan.eepLastError,
    },
    orgLevels,
  };
}

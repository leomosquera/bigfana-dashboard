/**
 * Dashboard Home / Command Center — org-scoped snapshot (Phases 1A–1E).
 *
 * Fan ownership SoT: fan_organizations (ADR-009).
 * Cohort: PRIMARY + non-archived (aligned with Fans / Gamification).
 *
 * Domain reuse (page orchestration):
 *   getSegmentDistribution, listCampaignsWithStats,
 *   getOrgEngagementKPIs, getOrgLeaderboard
 *
 * Never import from client components.
 */

import { db } from "@/db";
import {
  campaigns,
  fanEvents,
  fanOrganizations,
  fanPointsLedger,
  fans,
  integrationJobs,
} from "@/db/schema";
import { getCountryLabel } from "@/lib/country-codes";
import { resolveFanDisplayName } from "@/lib/dashboard-home-format";
import {
  buildActivitySeries,
  buildFanGrowthSeries,
  buildGeographySummary,
  buildIntegrationHealth,
  type ActivitySeriesPoint,
  type FanGrowthPoint,
  type GeographySummary,
  type IntegrationHealthSummary,
} from "@/lib/dashboard-home-series";
import { and, count, desc, eq, gte, ne, sql } from "drizzle-orm";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardHomeKpis {
  totalFans: number;
  newFans: number;
  engagedFans: number;
  interactions: number;
  activeCampaigns: number;
  pointsIssued: number;
}

export interface DashboardHomeActivityItem {
  id: string;
  eventType: string;
  /** ISO-8601 timestamp for RSC → client serialization. */
  occurredAt: string;
  fanId: string;
  fanDisplayName: string | null;
  points: number;
  source: string;
}

export interface DashboardHomeSnapshot {
  organizationId: string;
  windowDays: number;
  /** ISO-8601 window start (inclusive). */
  windowStart: string;
  kpis: DashboardHomeKpis;
  recentActivity: DashboardHomeActivityItem[];
  fanGrowth: FanGrowthPoint[];
  activitySeries: ActivitySeriesPoint[];
  geography: GeographySummary;
  integrationHealth: IntegrationHealthSummary;
}

const DEFAULT_WINDOW_DAYS = 30;
const RECENT_ACTIVITY_LIMIT = 10;

/** PRIMARY + non-archived cohort (ADR-009 / R05). */
function primaryFanOrgCohort(organizationId: string) {
  return and(
    eq(fanOrganizations.organizationId, organizationId),
    eq(fanOrganizations.isPrimary, true),
    ne(fans.status, "archived"),
  );
}

function windowStartDate(windowDays: number, now = new Date()): Date {
  return new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
}

/** Calendar day key (YYYY-MM-DD) from TIMESTAMP WITHOUT TIME ZONE columns. */
const membershipDaySql = sql<string>`to_char(date_trunc('day', COALESCE(${fanOrganizations.joinedAt}, ${fanOrganizations.createdAt})), 'YYYY-MM-DD')`;

const eventDaySql = sql<string>`to_char(date_trunc('day', ${fanEvents.occurredAt}), 'YYYY-MM-DD')`;

// ─── Snapshot ─────────────────────────────────────────────────────────────────

/**
 * Organization-scoped Dashboard Home snapshot.
 * All fan metrics use fan_organizations PRIMARY membership (not fans.organization_id).
 */
export async function getDashboardHomeSnapshot(
  organizationId: string,
  windowDays: number = DEFAULT_WINDOW_DAYS,
): Promise<DashboardHomeSnapshot> {
  const days =
    Number.isFinite(windowDays) && windowDays > 0
      ? Math.floor(windowDays)
      : DEFAULT_WINDOW_DAYS;

  const now = new Date();
  const windowStart = windowStartDate(days, now);
  const cohort = primaryFanOrgCohort(organizationId);

  const [
    totalFansRow,
    newFansRow,
    engagedFansRow,
    interactionsRow,
    activeCampaignsRow,
    pointsIssuedRow,
    activityRows,
    baseBeforeRow,
    growthDailyRows,
    activityDailyRows,
    geographyRows,
    integrationStatusRows,
  ] = await Promise.all([
    // Total Fans — PRIMARY + non-archived
    db
      .select({ n: count() })
      .from(fanOrganizations)
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(cohort),

    // New Fans — relationship began in window
    db
      .select({ n: count() })
      .from(fanOrganizations)
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(
        and(
          cohort,
          sql`COALESCE(${fanOrganizations.joinedAt}, ${fanOrganizations.createdAt}) >= ${windowStart}`,
        ),
      ),

    // Engaged Fans — distinct PRIMARY cohort fans with ≥1 event in window
    db
      .select({
        n: sql<number>`COUNT(DISTINCT ${fanEvents.fanId})::int`,
      })
      .from(fanEvents)
      .innerJoin(fanOrganizations, eq(fanEvents.fanId, fanOrganizations.fanId))
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(
        and(
          cohort,
          eq(fanEvents.organizationId, organizationId),
          gte(fanEvents.occurredAt, windowStart),
        ),
      ),

    // Interactions — event count for PRIMARY cohort in window
    db
      .select({ n: count() })
      .from(fanEvents)
      .innerJoin(fanOrganizations, eq(fanEvents.fanId, fanOrganizations.fanId))
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(
        and(
          cohort,
          eq(fanEvents.organizationId, organizationId),
          gte(fanEvents.occurredAt, windowStart),
        ),
      ),

    // Active Campaigns — status vocabulary from schema (active)
    db
      .select({ n: count() })
      .from(campaigns)
      .where(
        and(
          eq(campaigns.organizationId, organizationId),
          eq(campaigns.status, "active"),
        ),
      ),

    // Points Issued — positive ledger deltas for PRIMARY cohort in window
    db
      .select({
        n: sql<number>`COALESCE(SUM(${fanPointsLedger.points}) FILTER (WHERE ${fanPointsLedger.points} > 0), 0)`,
      })
      .from(fanPointsLedger)
      .innerJoin(
        fanOrganizations,
        eq(fanPointsLedger.fanId, fanOrganizations.fanId),
      )
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(
        and(
          cohort,
          eq(fanPointsLedger.organizationId, organizationId),
          gte(fanPointsLedger.createdAt, windowStart),
          sql`${fanPointsLedger.points} > 0`,
        ),
      ),

    // Recent Activity — newest first, PRIMARY cohort
    db
      .select({
        id: fanEvents.id,
        eventType: fanEvents.eventType,
        occurredAt: fanEvents.occurredAt,
        fanId: fanEvents.fanId,
        displayName: fans.displayName,
        firstName: fans.firstName,
        lastName: fans.lastName,
        points: fanEvents.points,
        source: fanEvents.source,
      })
      .from(fanEvents)
      .innerJoin(fanOrganizations, eq(fanEvents.fanId, fanOrganizations.fanId))
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(
        and(cohort, eq(fanEvents.organizationId, organizationId)),
      )
      .orderBy(desc(fanEvents.occurredAt))
      .limit(RECENT_ACTIVITY_LIMIT),

    // Fan base before window (for cumulative growth)
    db
      .select({ n: count() })
      .from(fanOrganizations)
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(
        and(
          cohort,
          sql`COALESCE(${fanOrganizations.joinedAt}, ${fanOrganizations.createdAt}) < ${windowStart}`,
        ),
      ),

    // Daily new fans in window
    db
      .select({
        date: membershipDaySql,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(fanOrganizations)
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(
        and(
          cohort,
          sql`COALESCE(${fanOrganizations.joinedAt}, ${fanOrganizations.createdAt}) >= ${windowStart}`,
        ),
      )
      .groupBy(membershipDaySql),

    // Daily interactions + engaged fans in window
    db
      .select({
        date: eventDaySql,
        interactions: sql<number>`COUNT(*)::int`,
        engagedFans: sql<number>`COUNT(DISTINCT ${fanEvents.fanId})::int`,
      })
      .from(fanEvents)
      .innerJoin(fanOrganizations, eq(fanEvents.fanId, fanOrganizations.fanId))
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(
        and(
          cohort,
          eq(fanEvents.organizationId, organizationId),
          gte(fanEvents.occurredAt, windowStart),
        ),
      )
      .groupBy(eventDaySql),

    // Geography by country_code (PRIMARY cohort)
    db
      .select({
        countryCode: fans.countryCode,
        fanCount: sql<number>`COUNT(*)::int`,
      })
      .from(fanOrganizations)
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(cohort)
      .groupBy(fans.countryCode),

    // Integration jobs by status (org-scoped — column exists)
    db
      .select({
        status: integrationJobs.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(integrationJobs)
      .where(eq(integrationJobs.organizationId, organizationId))
      .groupBy(integrationJobs.status),
  ]);

  const fanGrowth = buildFanGrowthSeries(
    growthDailyRows.map((r) => ({
      date: String(r.date),
      count: Number(r.count ?? 0),
    })),
    Number(baseBeforeRow[0]?.n ?? 0),
    days,
    now,
  );

  const activitySeries = buildActivitySeries(
    activityDailyRows.map((r) => ({
      date: String(r.date),
      interactions: Number(r.interactions ?? 0),
      engagedFans: Number(r.engagedFans ?? 0),
    })),
    days,
    now,
  );

  const geography = buildGeographySummary(
    geographyRows.map((r) => ({
      countryCode: r.countryCode,
      fanCount: Number(r.fanCount ?? 0),
    })),
    (code) => getCountryLabel(code, "es"),
    5,
  );

  const integrationHealth = buildIntegrationHealth(
    integrationStatusRows.map((r) => ({
      status: String(r.status),
      count: Number(r.count ?? 0),
    })),
  );

  return {
    organizationId,
    windowDays: days,
    windowStart: windowStart.toISOString(),
    kpis: {
      totalFans: Number(totalFansRow[0]?.n ?? 0),
      newFans: Number(newFansRow[0]?.n ?? 0),
      engagedFans: Number(engagedFansRow[0]?.n ?? 0),
      interactions: Number(interactionsRow[0]?.n ?? 0),
      activeCampaigns: Number(activeCampaignsRow[0]?.n ?? 0),
      pointsIssued: Number(pointsIssuedRow[0]?.n ?? 0),
    },
    recentActivity: activityRows.map((row) => ({
      id: row.id,
      eventType: row.eventType,
      occurredAt:
        row.occurredAt instanceof Date
          ? row.occurredAt.toISOString()
          : new Date(row.occurredAt).toISOString(),
      fanId: row.fanId,
      fanDisplayName: resolveFanDisplayName({
        displayName: row.displayName,
        firstName: row.firstName,
        lastName: row.lastName,
      }),
      points: row.points,
      source: row.source,
    })),
    fanGrowth,
    activitySeries,
    geography,
    integrationHealth,
  };
}

// Re-export series types for consumers
export type {
  ActivitySeriesPoint,
  FanGrowthPoint,
  GeographySummary,
  IntegrationHealthSummary,
};

/**
 * Engagement Intelligence Layer — server-side aggregation queries.
 *
 * All functions are org-scoped and safe to call from server components
 * or server actions. Never import from client components.
 *
 * Performance notes:
 *   - getEngagementBreakdown and getUpgradeOpportunities scan the fans table
 *     once each; suitable for dashboard usage (not per-row).
 *   - getFanBehavioralProfile and getEngagementVelocity are per-fan queries
 *     called on demand (FanProfileDrawer open).
 *   - getFanEligibleExperiences does a single join on segment rule.
 */

import { db } from "@/db";
import {
  fans,
  fanEvents,
  fanPointsLedger,
  fanLevels,
  fanSegmentRules,
  fanExperiences,
  fanOrganizations,
} from "@/db/schema";
import {
  eq,
  and,
  ne,
  desc,
  asc,
  sql,
  gte,
  lte,
  count,
  sum,
  max,
  isNull,
  isNotNull,
} from "drizzle-orm";
import type { FanLevel, FanSegmentRule, FanExperience } from "@/db/schema";

/** PRIMARY + non-archived cohort join (R05 / ADR-009 Phase C). */
function primaryFanOrgCohort(organizationId: string) {
  return and(
    eq(fanOrganizations.organizationId, organizationId),
    eq(fanOrganizations.isPrimary, true),
    ne(fans.status, "archived"),
  );
}

// ─── Engagement Breakdown ─────────────────────────────────────────────────────

export interface LevelTierStat {
  levelId:   string;
  levelName: string;
  color:     string | null;
  minPoints: number;
  sortOrder: number;
  fanCount:  number;
  pct:       number;
}

export interface EngagementBreakdown {
  tiers:          LevelTierStat[];
  totalFans:      number;
  fansWithPoints: number;
  fansNoPoints:   number;
}

/**
 * Returns how many fans fall into each fan_level tier, plus fans below
 * the lowest tier threshold (no level yet).
 *
 * Algorithm: for each fan, their tier = highest tier whose minPoints ≤ score.
 * We compute this in JS after a single fans query + levels query,
 * which is simpler than a lateral join and correct for the tier model.
 */
export async function getEngagementBreakdown(
  organizationId: string,
): Promise<EngagementBreakdown> {
  const [levelRows, fanRows] = await Promise.all([
    db
      .select()
      .from(fanLevels)
      .where(eq(fanLevels.organizationId, organizationId))
      .orderBy(asc(fanLevels.minPoints)),

    db
      .select({ engagementScore: fans.engagementScore })
      .from(fanOrganizations)
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(primaryFanOrgCohort(organizationId)),
  ]);

  const totalFans      = fanRows.length;
  const fansWithPoints = fanRows.filter((f) => f.engagementScore > 0).length;
  const fansNoPoints   = totalFans - fansWithPoints;

  // Count fans per tier using the level computation model
  const tierCounts = new Map<string, number>(
    levelRows.map((l) => [l.id, 0]),
  );
  let unleveled = 0;

  for (const fan of fanRows) {
    const score = fan.engagementScore ?? 0;
    let matched: FanLevel | null = null;
    for (const level of levelRows) {
      if (score >= level.minPoints) matched = level;
    }
    if (matched) {
      tierCounts.set(matched.id, (tierCounts.get(matched.id) ?? 0) + 1);
    } else {
      unleveled++;
    }
  }

  const tiers: LevelTierStat[] = levelRows.map((level) => {
    const fanCount = tierCounts.get(level.id) ?? 0;
    return {
      levelId:   level.id,
      levelName: level.name,
      color:     level.color,
      minPoints: level.minPoints,
      sortOrder: level.sortOrder,
      fanCount,
      pct:       totalFans > 0 ? Math.round((fanCount / totalFans) * 100 * 10) / 10 : 0,
    };
  });

  // Add an "unleveled" entry if there are fans below the lowest threshold
  if (unleveled > 0) {
    tiers.unshift({
      levelId:   "__unleveled__",
      levelName: "Sin nivel",
      color:     "#333344",
      minPoints: 0,
      sortOrder: 0,
      fanCount:  unleveled,
      pct:       totalFans > 0 ? Math.round((unleveled / totalFans) * 100 * 10) / 10 : 0,
    });
  }

  return { tiers, totalFans, fansWithPoints, fansNoPoints };
}

// ─── Upgrade Opportunities ────────────────────────────────────────────────────

export interface UpgradeOpportunity {
  fromLevelName: string | null;
  toLevelName:   string;
  toColor:       string | null;
  pointsNeeded:  number;
  fanCount:      number;
}

/**
 * Finds fans who are within `threshold` points of the next level tier.
 * These are the fans most likely to upgrade with a targeted nudge.
 */
export async function getUpgradeOpportunities(
  organizationId: string,
  threshold = 150,
): Promise<UpgradeOpportunity[]> {
  const [levelRows, fanRows] = await Promise.all([
    db
      .select()
      .from(fanLevels)
      .where(eq(fanLevels.organizationId, organizationId))
      .orderBy(asc(fanLevels.minPoints)),

    db
      .select({ engagementScore: fans.engagementScore })
      .from(fanOrganizations)
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(primaryFanOrgCohort(organizationId)),
  ]);

  if (levelRows.length < 2) return [];

  const opportunities: UpgradeOpportunity[] = [];

  // For each tier transition (level[i-1] → level[i]), count fans in range
  for (let i = 1; i < levelRows.length; i++) {
    const nextLevel = levelRows[i];
    const prevLevel = levelRows[i - 1];
    const gateScore = nextLevel.minPoints;

    const nearFans = fanRows.filter((f) => {
      const score = f.engagementScore ?? 0;
      return score >= gateScore - threshold && score < gateScore;
    });

    if (nearFans.length > 0) {
      opportunities.push({
        fromLevelName: prevLevel.name,
        toLevelName:   nextLevel.name,
        toColor:       nextLevel.color,
        pointsNeeded:  threshold,
        fanCount:      nearFans.length,
      });
    }
  }

  return opportunities;
}

// ─── Fan Behavioral Profile ───────────────────────────────────────────────────

export interface EventTypeStat {
  eventType: string;
  count:     number;
  points:    number;
}

export interface BehavioralProfile {
  totalEvents:    number;
  topEventTypes:  EventTypeStat[];
  lastEventAt:    Date | null;
  daysSinceLast:  number | null;
  /** 0-100 engagement intensity score derived from event diversity + frequency */
  activityScore:  number;
}

/**
 * Returns the behavioral fingerprint for a single fan:
 * event type breakdown, last activity, and derived activity score.
 * Scoped to org for tenant safety.
 */
export async function getFanBehavioralProfile(
  organizationId: string,
  fanId:          string,
): Promise<BehavioralProfile> {
  const events = await db
    .select({
      eventType:  fanEvents.eventType,
      points:     fanEvents.points,
      occurredAt: fanEvents.occurredAt,
    })
    .from(fanEvents)
    .where(
      and(
        eq(fanEvents.organizationId, organizationId),
        eq(fanEvents.fanId, fanId),
      ),
    )
    .orderBy(desc(fanEvents.occurredAt));

  if (!events.length) {
    return {
      totalEvents:   0,
      topEventTypes: [],
      lastEventAt:   null,
      daysSinceLast: null,
      activityScore: 0,
    };
  }

  // Aggregate by event type
  const typeCounts = new Map<string, { count: number; points: number }>();
  for (const e of events) {
    const existing = typeCounts.get(e.eventType) ?? { count: 0, points: 0 };
    typeCounts.set(e.eventType, {
      count:  existing.count + 1,
      points: existing.points + (e.points ?? 0),
    });
  }

  const topEventTypes: EventTypeStat[] = Array.from(typeCounts.entries())
    .map(([eventType, stats]) => ({ eventType, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const lastEventAt = new Date(events[0].occurredAt);
  const now         = new Date();
  const daysSinceLast = Math.floor(
    (now.getTime() - lastEventAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  // Activity score: combine event diversity (0-40) + frequency (0-60)
  const diversityScore = Math.min(typeCounts.size * 8, 40);
  const frequencyScore = Math.min(events.length * 3, 60);
  const activityScore  = Math.min(diversityScore + frequencyScore, 100);

  return {
    totalEvents: events.length,
    topEventTypes,
    lastEventAt,
    daysSinceLast,
    activityScore,
  };
}

// ─── Engagement Velocity ──────────────────────────────────────────────────────

export interface EngagementVelocity {
  points30d:  number;
  events30d:  number;
  points7d:   number;
  events7d:   number;
  trend:      "accelerating" | "stable" | "dormant";
}

/**
 * Returns the fan's short-term engagement velocity from the points ledger.
 * Used to surface "accelerating / stable / dormant" indicators in the UI.
 */
export async function getEngagementVelocity(
  organizationId: string,
  fanId:          string,
): Promise<EngagementVelocity> {
  const now      = new Date();
  const ago30d   = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ago7d    = new Date(now.getTime() -  7 * 24 * 60 * 60 * 1000);

  const [ledger30, ledger7] = await Promise.all([
    db
      .select({ points: fanPointsLedger.points })
      .from(fanPointsLedger)
      .where(
        and(
          eq(fanPointsLedger.organizationId, organizationId),
          eq(fanPointsLedger.fanId, fanId),
          gte(fanPointsLedger.createdAt, ago30d),
        ),
      ),

    db
      .select({ points: fanPointsLedger.points })
      .from(fanPointsLedger)
      .where(
        and(
          eq(fanPointsLedger.organizationId, organizationId),
          eq(fanPointsLedger.fanId, fanId),
          gte(fanPointsLedger.createdAt, ago7d),
        ),
      ),
  ]);

  const points30d = ledger30.reduce((s, e) => s + e.points, 0);
  const events30d = ledger30.length;
  const points7d  = ledger7.reduce((s, e) => s + e.points, 0);
  const events7d  = ledger7.length;

  // Trend: compare last-7d activity rate vs 30d average daily rate
  const dailyAvg30d = points30d / 30;
  const dailyAvg7d  = points7d / 7;

  let trend: EngagementVelocity["trend"] = "stable";
  if (points30d === 0 && points7d === 0) {
    trend = "dormant";
  } else if (dailyAvg7d > dailyAvg30d * 1.3) {
    trend = "accelerating";
  } else if (dailyAvg7d === 0) {
    trend = "dormant";
  }

  return { points30d, events30d, points7d, events7d, trend };
}

// ─── Fan Eligible Experiences ─────────────────────────────────────────────────

export interface EligibleExperience {
  id:              string;
  type:            string;
  title:           string;
  description:     string | null;
  sponsorAffinity: string[];
  segmentName:     string | null;
  segmentColor:    string | null;
}

/**
 * Returns experiences the fan is eligible for based on their current segment.
 * Also includes org-wide experiences (segmentRuleId = null).
 *
 * fanSegment: the value currently stored in fans.segment (set by segmentation service).
 */
export async function getFanEligibleExperiences(
  organizationId: string,
  fanSegment:     string | null,
): Promise<EligibleExperience[]> {
  // First get the segment rule ID for this fan's segment name
  let segmentRuleId: string | null = null;

  if (fanSegment) {
    const [rule] = await db
      .select({ id: fanSegmentRules.id })
      .from(fanSegmentRules)
      .where(
        and(
          eq(fanSegmentRules.organizationId, organizationId),
          eq(fanSegmentRules.name, fanSegment),
          eq(fanSegmentRules.isActive, true),
        ),
      )
      .limit(1);

    segmentRuleId = rule?.id ?? null;
  }

  // Fetch experiences: fan's segment OR org-wide (null segment)
  const rows = await db
    .select({
      id:              fanExperiences.id,
      type:            fanExperiences.type,
      title:           fanExperiences.title,
      description:     fanExperiences.description,
      sponsorAffinity: fanExperiences.sponsorAffinity,
      segmentRuleId:   fanExperiences.segmentRuleId,
      segmentName:     fanSegmentRules.name,
      segmentColor:    fanSegmentRules.color,
    })
    .from(fanExperiences)
    .leftJoin(
      fanSegmentRules,
      eq(fanExperiences.segmentRuleId, fanSegmentRules.id),
    )
    .where(
      and(
        eq(fanExperiences.organizationId, organizationId),
        eq(fanExperiences.isActive, true),
        segmentRuleId
          ? sql`(${fanExperiences.segmentRuleId} = ${segmentRuleId} OR ${fanExperiences.segmentRuleId} IS NULL)`
          : isNull(fanExperiences.segmentRuleId),
      ),
    )
    .orderBy(asc(fanExperiences.type));

  return rows.map((r) => ({
    id:              r.id,
    type:            r.type,
    title:           r.title,
    description:     r.description,
    sponsorAffinity: (r.sponsorAffinity as string[]) ?? [],
    segmentName:     r.segmentName ?? null,
    segmentColor:    r.segmentColor ?? null,
  }));
}

// ─── Org Engagement KPIs ──────────────────────────────────────────────────────

export interface OrgEngagementKPIs {
  totalActiveFans:    number;
  fansWithPoints:     number;
  totalPointsEmitted: number;
  avgScore:           number;
}

/**
 * Aggregate KPIs for the gamification dashboard.
 * Single-pass aggregation over fans + ledger tables.
 */
export async function getOrgEngagementKPIs(
  organizationId: string,
): Promise<OrgEngagementKPIs> {
  const [fanAgg, ledgerAgg] = await Promise.all([
    db
      .select({
        total:    count(),
        withPts:  sql<number>`COUNT(*) FILTER (WHERE ${fans.engagementScore} > 0)`,
        avgScore: sql<number>`COALESCE(AVG(${fans.engagementScore}), 0)`,
      })
      .from(fanOrganizations)
      .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
      .where(primaryFanOrgCohort(organizationId)),

    db
      .select({
        total: sql<number>`COALESCE(SUM(${fanPointsLedger.points}) FILTER (WHERE ${fanPointsLedger.points} > 0), 0)`,
      })
      .from(fanPointsLedger)
      .where(eq(fanPointsLedger.organizationId, organizationId)),
  ]);

  const agg = fanAgg[0];
  return {
    totalActiveFans:    Number(agg?.total    ?? 0),
    fansWithPoints:     Number(agg?.withPts  ?? 0),
    avgScore:           Math.round(Number(agg?.avgScore ?? 0)),
    totalPointsEmitted: Number(ledgerAgg[0]?.total ?? 0),
  };
}

// ─── Segment Distribution ─────────────────────────────────────────────────────

export interface SegmentStat {
  segmentName: string | null;
  color:       string | null;
  fanCount:    number;
  pct:         number;
}

/**
 * Returns actual segment distribution from fans.segment field.
 * Reflects what the segmentation service has written.
 */
export async function getSegmentDistribution(
  organizationId: string,
): Promise<SegmentStat[]> {
  const rows = await db
    .select({
      segment:  fans.segment,
      fanCount: sql<number>`COUNT(*)`,
    })
    .from(fanOrganizations)
    .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
    .where(primaryFanOrgCohort(organizationId))
    .groupBy(fans.segment)
    .orderBy(sql`COUNT(*) DESC`);

  const total = rows.reduce((s, r) => s + Number(r.fanCount), 0);

  // Get segment colors from rules
  const ruleRows = await db
    .select({ name: fanSegmentRules.name, color: fanSegmentRules.color })
    .from(fanSegmentRules)
    .where(eq(fanSegmentRules.organizationId, organizationId));

  const colorMap = new Map(ruleRows.map((r) => [r.name, r.color]));

  return rows.map((r) => ({
    segmentName: r.segment,
    color:       r.segment ? (colorMap.get(r.segment) ?? null) : null,
    fanCount:    Number(r.fanCount),
    pct:         total > 0 ? Math.round((Number(r.fanCount) / total) * 100 * 10) / 10 : 0,
  }));
}

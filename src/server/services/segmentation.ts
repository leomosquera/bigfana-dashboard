/**
 * Segmentation service — computes and writes fans.segment.
 *
 * This module is intentionally NOT a server action file (no "use server")
 * so it can be imported by any server-side code freely.
 *
 * Segment computation algorithm:
 *   1. Load all active fan_segment_rules for the org, ordered by priority DESC.
 *   2. Load the fan's current data: engagementScore, status.
 *   3. Load the fan's event data from fan_events (counts, last date, types).
 *   4. Compute the fan's current level name from fan_levels.
 *   5. Evaluate each rule's conditions in priority order.
 *      First rule that passes wins — fan.segment = rule.name.
 *   6. If no rule matches, set fan.segment = null.
 *   7. UPDATE fans.segment (and fans.tier = level.name) if changed.
 *
 * Called by:
 *   - awardPoints (after each point write)
 *   - createFan (after creation)
 *   - batch recomputeAllSegments (admin utility)
 */

import { db } from "@/db";
import { fans, fanEvents, fanLevels, fanSegmentRules } from "@/db/schema";
import { eq, and, ne, gte, desc, asc } from "drizzle-orm";
import type { SegmentConditions } from "@/db/schema";

// ─── Level name computation ───────────────────────────────────────────────────

async function getFanLevelName(
  organizationId: string,
  engagementScore: number,
): Promise<string | null> {
  const levels = await db
    .select({ name: fanLevels.name, minPoints: fanLevels.minPoints })
    .from(fanLevels)
    .where(eq(fanLevels.organizationId, organizationId))
    .orderBy(asc(fanLevels.minPoints));

  let matched: string | null = null;
  for (const level of levels) {
    if (engagementScore >= level.minPoints) matched = level.name;
  }
  return matched;
}

// ─── Condition evaluator ──────────────────────────────────────────────────────

interface FanSnapshot {
  engagementScore: number;
  status:          string;
  levelName:       string | null;
  totalEvents:     number;
  events30d:       number;
  events90d:       number;
  eventTypes:      Set<string>;
  lastEventAt:     Date | null;
}

function evaluateConditions(
  conditions: SegmentConditions,
  fan: FanSnapshot,
): boolean {
  // Score range
  if (conditions.minScore !== undefined && fan.engagementScore < conditions.minScore) return false;
  if (conditions.maxScore !== undefined && fan.engagementScore > conditions.maxScore) return false;

  // Level names must include the fan's current level
  if (conditions.levelNames?.length) {
    if (!fan.levelName || !conditions.levelNames.includes(fan.levelName)) return false;
  }

  // Event counts
  if (conditions.minEventsTotal  !== undefined && fan.totalEvents < conditions.minEventsTotal)  return false;
  if (conditions.minEventsLast30d !== undefined && fan.events30d   < conditions.minEventsLast30d) return false;
  if (conditions.minEventsLast90d !== undefined && fan.events90d   < conditions.minEventsLast90d) return false;

  // Required event types — fan must have at least 1 event of each type
  if (conditions.requiredEventTypes?.length) {
    for (const type of conditions.requiredEventTypes) {
      if (!fan.eventTypes.has(type)) return false;
    }
  }

  // Inactivity gate — last event must be within N days
  if (conditions.maxDaysSinceLastEvent !== undefined) {
    if (!fan.lastEventAt) return false; // never active → treated as infinite days ago
    const daysSince = Math.floor(
      (Date.now() - fan.lastEventAt.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSince > conditions.maxDaysSinceLastEvent) return false;
  }

  // Fan lifecycle status filter
  if (conditions.fanStatuses?.length) {
    if (!conditions.fanStatuses.includes(fan.status)) return false;
  }

  return true;
}

// ─── Core function ────────────────────────────────────────────────────────────

export interface RecomputeSegmentResult {
  previousSegment: string | null;
  newSegment:      string | null;
  changed:         boolean;
}

/**
 * Recomputes and persists the segment (and tier) for a single fan.
 * Safe to call after every point award or fan event creation.
 * Returns whether the segment actually changed.
 *
 * Throws if the fan does not exist or belongs to a different org.
 */
export async function recomputeFanSegment(
  organizationId: string,
  fanId:          string,
): Promise<RecomputeSegmentResult> {
  // ── 1. Load fan state ────────────────────────────────────────────────────
  const [fanRow] = await db
    .select({
      engagementScore: fans.engagementScore,
      status:          fans.status,
      segment:         fans.segment,
    })
    .from(fans)
    .where(and(eq(fans.id, fanId), eq(fans.organizationId, organizationId)))
    .limit(1);

  if (!fanRow) {
    throw new Error(`recomputeFanSegment: fan ${fanId} not found in org ${organizationId}`);
  }

  // ── 2. Load event data ───────────────────────────────────────────────────
  const now    = new Date();
  const ago30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ago90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  const eventRows = await db
    .select({
      eventType:  fanEvents.eventType,
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

  const totalEvents = eventRows.length;
  const events30d   = eventRows.filter((e) => new Date(e.occurredAt) >= ago30d).length;
  const events90d   = eventRows.filter((e) => new Date(e.occurredAt) >= ago90d).length;
  const eventTypes  = new Set(eventRows.map((e) => e.eventType));
  const lastEventAt = eventRows[0] ? new Date(eventRows[0].occurredAt) : null;

  // ── 3. Compute level name ────────────────────────────────────────────────
  const levelName = await getFanLevelName(organizationId, fanRow.engagementScore);

  const snapshot: FanSnapshot = {
    engagementScore: fanRow.engagementScore,
    status:          fanRow.status,
    levelName,
    totalEvents,
    events30d,
    events90d,
    eventTypes,
    lastEventAt,
  };

  // ── 4. Evaluate rules in priority order ──────────────────────────────────
  const rules = await db
    .select({
      name:       fanSegmentRules.name,
      conditions: fanSegmentRules.conditions,
    })
    .from(fanSegmentRules)
    .where(
      and(
        eq(fanSegmentRules.organizationId, organizationId),
        eq(fanSegmentRules.isActive, true),
      ),
    )
    // Higher priority evaluated first
    .orderBy(desc(fanSegmentRules.priority));

  let matchedSegment: string | null = null;
  for (const rule of rules) {
    const conditions = rule.conditions as SegmentConditions;
    if (evaluateConditions(conditions, snapshot)) {
      matchedSegment = rule.name;
      break;
    }
  }

  const previousSegment = fanRow.segment;
  const changed = matchedSegment !== previousSegment;

  // ── 5. Persist if changed ────────────────────────────────────────────────
  if (changed) {
    await db
      .update(fans)
      .set({
        segment:   matchedSegment,
        tier:      levelName,        // Keep fans.tier in sync with computed level
        updatedAt: new Date(),
      })
      .where(and(eq(fans.id, fanId), eq(fans.organizationId, organizationId)));
  }

  return { previousSegment, newSegment: matchedSegment, changed };
}

// ─── Batch recomputation ──────────────────────────────────────────────────────

export interface BatchRecomputeResult {
  processed: number;
  changed:   number;
  errors:    number;
}

/**
 * Recomputes segments for all non-archived fans in an org.
 * Use after changing segment rules or for initial data population.
 * Processes fans sequentially to avoid overwhelming the DB.
 */
export async function recomputeAllSegments(
  organizationId: string,
): Promise<BatchRecomputeResult> {
  const fanRows = await db
    .select({ id: fans.id })
    .from(fans)
    .where(
      and(
        eq(fans.organizationId, organizationId),
        ne(fans.status, "archived"),
      ),
    );

  let processed = 0;
  let changed   = 0;
  let errors    = 0;

  for (const fan of fanRows) {
    try {
      const result = await recomputeFanSegment(organizationId, fan.id);
      processed++;
      if (result.changed) changed++;
    } catch {
      errors++;
    }
  }

  return { processed, changed, errors };
}

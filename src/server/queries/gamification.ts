import { db } from "@/db";
import { fanPointsLedger, fanLevels, fans } from "@/db/schema";
import { eq, and, ne, desc, asc } from "drizzle-orm";
import type { FanPointsLedger, FanLevel } from "@/db/schema";

export type { FanPointsLedger, FanLevel };

// ─── Ledger ───────────────────────────────────────────────────────────────────

/**
 * Returns the most recent ledger entries for a fan, newest first.
 * Scoped to org to prevent cross-tenant reads.
 */
export async function getFanLedger(
  organizationId: string,
  fanId: string,
  limit = 50,
): Promise<FanPointsLedger[]> {
  return db
    .select()
    .from(fanPointsLedger)
    .where(
      and(
        eq(fanPointsLedger.organizationId, organizationId),
        eq(fanPointsLedger.fanId, fanId),
      ),
    )
    .orderBy(desc(fanPointsLedger.createdAt))
    .limit(limit);
}

// ─── Levels ───────────────────────────────────────────────────────────────────

/**
 * Returns all level tiers for an org, ordered by minPoints ascending.
 * Callers should cache this per request — it rarely changes.
 */
export async function getOrgLevels(organizationId: string): Promise<FanLevel[]> {
  return db
    .select()
    .from(fanLevels)
    .where(eq(fanLevels.organizationId, organizationId))
    .orderBy(asc(fanLevels.minPoints));
}

/**
 * Computes the level for a given score against a sorted level array.
 * Levels must be sorted by minPoints ascending (as returned by getOrgLevels).
 * Returns the highest tier whose minPoints ≤ score, or null if none qualifies.
 */
export function computeLevelForScore(
  score: number,
  levels: FanLevel[],
): FanLevel | null {
  if (!levels.length) return null;
  let matched: FanLevel | null = null;
  for (const level of levels) {
    if (score >= level.minPoints) matched = level;
  }
  return matched;
}

// ─── Leaderboard ─────────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  id:              string;
  displayName:     string;
  firstName:       string | null;
  lastName:        string | null;
  engagementScore: number;
  status:          string;
  rank:            number;
}

/**
 * Returns the top fans for an org ranked by engagement_score descending.
 * Excludes archived fans. Includes rank position.
 */
export async function getOrgLeaderboard(
  organizationId: string,
  limit = 10,
): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select({
      id:              fans.id,
      displayName:     fans.displayName,
      firstName:       fans.firstName,
      lastName:        fans.lastName,
      engagementScore: fans.engagementScore,
      status:          fans.status,
    })
    .from(fans)
    .where(
      and(
        eq(fans.organizationId, organizationId),
        ne(fans.status, "archived"),
      ),
    )
    .orderBy(desc(fans.engagementScore))
    .limit(limit);

  return rows.map((row, i) => ({ ...row, rank: i + 1 }));
}

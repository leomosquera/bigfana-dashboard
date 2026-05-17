/**
 * Points service — reusable, non-server-action helpers for the points economy.
 *
 * Import this from other server code (server actions, route handlers, future
 * webhooks, cron jobs). Do NOT import from client components.
 *
 * This module is intentionally NOT a server action file — it has no "use server"
 * directive so it can be imported freely by any server-side code without
 * triggering Next.js action boundaries.
 *
 * Transaction note: neon-http does not support interactive transactions.
 * awardPoints executes two sequential writes:
 *   1. INSERT into fan_points_ledger (returns the new entry + id)
 *   2. UPDATE fans.engagement_score
 * These are not atomic. In the unlikely event of a crash between the two,
 * engagement_score can be rebuilt from the ledger (rebuildable invariant).
 * For high-concurrency scenarios, migrate to neon-ws + db.transaction().
 */

import { db } from "@/db";
import { fans, fanPointsLedger } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { recomputeFanSegment } from "./segmentation";

// ─── Input / output types ─────────────────────────────────────────────────────

export interface AwardPointsInput {
  organizationId: string;
  fanId:          string;
  /** Positive = award, negative = deduction. Zero is valid (audit-only entry). */
  points:         number;
  /**
   * Classification key for analytics. Free-form snake_case string.
   * Examples: 'manual_award', 'admin_deduction', 'trivia_correct', 'checkin'
   */
  eventType:      string;
  /** Human-readable reason shown in admin UIs and future fan history. */
  reason:         string;
  /** Origin system. Defaults to 'system'. */
  source?:        string;
  /** Link to the fan_event that triggered this entry. Optional. */
  fanEventId?:    string;
  /** Admin user ID if this is a manual award/deduction. */
  awardedBy?:     string;
  /** Arbitrary event-specific data for future analytics. */
  metadata?:      Record<string, unknown>;
}

export interface AwardPointsResult {
  /** Updated cumulative balance for the fan. */
  newBalance:    number;
  /** ID of the created fan_points_ledger row. */
  ledgerEntryId: string;
  /** Points delta that was applied. */
  points:        number;
}

// ─── Core function ────────────────────────────────────────────────────────────

/**
 * Awards or deducts points for a fan and records the ledger entry.
 *
 * Steps:
 *   1. Read the fan's current engagement_score (verified org-scoped).
 *   2. Compute new balance = current + points.
 *   3. INSERT a fan_points_ledger row with the new balance_after.
 *   4. UPDATE fans.engagement_score to the new balance.
 *
 * Throws if the fan does not exist or belongs to a different org.
 */
export async function awardPoints(input: AwardPointsInput): Promise<AwardPointsResult> {
  const {
    organizationId,
    fanId,
    points,
    eventType,
    reason,
    source     = "system",
    fanEventId,
    awardedBy,
    metadata,
  } = input;

  // 1. Read current balance (org-scoped for tenant safety)
  const [fan] = await db
    .select({ engagementScore: fans.engagementScore })
    .from(fans)
    .where(and(eq(fans.id, fanId), eq(fans.organizationId, organizationId)))
    .limit(1);

  if (!fan) {
    throw new Error(
      `awardPoints: fan ${fanId} not found in organization ${organizationId}`,
    );
  }

  const newBalance = fan.engagementScore + points;

  // 2. Insert ledger entry
  const [entry] = await db
    .insert(fanPointsLedger)
    .values({
      organizationId,
      fanId,
      fanEventId:  fanEventId  ?? null,
      points,
      balanceAfter: newBalance,
      eventType,
      source,
      reason,
      metadata:   metadata   ?? null,
      awardedBy:  awardedBy  ?? null,
    })
    .returning({ id: fanPointsLedger.id });

  // 3. Update fan's running balance
  await db
    .update(fans)
    .set({ engagementScore: newBalance, updatedAt: new Date() })
    .where(and(eq(fans.id, fanId), eq(fans.organizationId, organizationId)));

  // 4. Recompute segment (fire-and-forget — never blocks point write)
  recomputeFanSegment(organizationId, fanId).catch((err) => {
    console.error("[awardPoints] segment recompute failed silently:", err);
  });

  return { newBalance, ledgerEntryId: entry.id, points };
}

// ─── Rebuild helper ───────────────────────────────────────────────────────────

/**
 * Rebuilds engagement_score for a fan by summing all their ledger entries.
 * Use this if engagement_score drifts out of sync with the ledger (e.g. after
 * a partial write failure).
 *
 * Returns the corrected balance.
 */
export async function rebuildFanBalance(
  organizationId: string,
  fanId:          string,
): Promise<number> {
  const entries = await db
    .select({ points: fanPointsLedger.points })
    .from(fanPointsLedger)
    .where(
      and(
        eq(fanPointsLedger.organizationId, organizationId),
        eq(fanPointsLedger.fanId, fanId),
      ),
    );

  const total = entries.reduce((sum, e) => sum + e.points, 0);

  await db
    .update(fans)
    .set({ engagementScore: total, updatedAt: new Date() })
    .where(and(eq(fans.id, fanId), eq(fans.organizationId, organizationId)));

  return total;
}

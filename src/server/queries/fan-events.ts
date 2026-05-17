import { db } from "@/db";
import { fanEvents } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import type { FanEvent } from "@/db/schema";

export type { FanEvent };

/**
 * Returns fan behavioral events for a specific fan, newest-first.
 * Scoped to org to prevent cross-tenant reads.
 */
export async function getFanEventsByFan(
  organizationId: string,
  fanId: string,
  limit = 50,
): Promise<FanEvent[]> {
  return db
    .select()
    .from(fanEvents)
    .where(
      and(
        eq(fanEvents.organizationId, organizationId),
        eq(fanEvents.fanId, fanId),
      ),
    )
    .orderBy(desc(fanEvents.occurredAt))
    .limit(limit);
}

import { db } from "@/db";
import { fanSegmentRules } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export interface SegmentRulePickOption {
  id:   string;
  name: string;
}

/** Compact list for targeting pickers — active rules sorted by descending priority. */
export async function getSegmentRulesPickList(
  organizationId: string,
): Promise<SegmentRulePickOption[]> {
  return db
    .select({ id: fanSegmentRules.id, name: fanSegmentRules.name })
    .from(fanSegmentRules)
    .where(
      and(
        eq(fanSegmentRules.organizationId, organizationId),
        eq(fanSegmentRules.isActive, true),
      ),
    )
    .orderBy(desc(fanSegmentRules.priority));
}

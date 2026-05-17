import { getDashboardContext } from "@/server/queries/session";
import { db } from "@/db";
import { fanSegmentRules } from "@/db/schema";
import { eq } from "drizzle-orm";
import { asc } from "drizzle-orm";
import {
  getSegmentDistribution,
  getUpgradeOpportunities,
  getOrgEngagementKPIs,
} from "@/server/queries/engagement-intelligence";
import { SegmentsClient } from "./SegmentsClient";

export default async function SegmentsPage() {
  const { org } = await getDashboardContext();

  const [distribution, kpis, rules] = await Promise.all([
    getSegmentDistribution(org.id),
    getOrgEngagementKPIs(org.id),
    db
      .select()
      .from(fanSegmentRules)
      .where(eq(fanSegmentRules.organizationId, org.id))
      .orderBy(asc(fanSegmentRules.priority)),
  ]);

  // getUpgradeOpportunities needs org levels but fetches them internally
  const opportunities = await getUpgradeOpportunities(org.id);

  return (
    <SegmentsClient
      distribution={distribution}
      opportunities={opportunities}
      segmentRules={rules}
      kpis={kpis}
    />
  );
}

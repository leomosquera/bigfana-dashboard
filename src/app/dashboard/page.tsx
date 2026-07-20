import { getDashboardContext } from "@/server/queries/session";
import { getDashboardHomeSnapshot } from "@/server/queries/dashboard-home";
import {
  getSegmentDistribution,
  getOrgEngagementKPIs,
} from "@/server/queries/engagement-intelligence";
import { listCampaignsWithStats } from "@/server/queries/campaigns";
import { getOrgLeaderboard } from "@/server/queries/gamification";
import { DashboardHomeClient } from "@/components/dashboard/DashboardHomeClient";

/**
 * Dashboard Home / Command Center V1 — Phases 1A–1E.
 *
 * Architecture:
 *   getDashboardContext()
 *   → Promise.all(
 *       getDashboardHomeSnapshot  (KPIs, series, geo, integrations, activity)
 *       getSegmentDistribution    (reuse)
 *       listCampaignsWithStats    (reuse)
 *       getOrgEngagementKPIs      (reuse)
 *       getOrgLeaderboard         (reuse)
 *     )
 *   → DashboardHomeClient
 */
export default async function DashboardPage() {
  const { org } = await getDashboardContext();

  const [snapshot, segments, campaigns, gamificationKpis, leaderboard] =
    await Promise.all([
      getDashboardHomeSnapshot(org.id),
      getSegmentDistribution(org.id),
      listCampaignsWithStats(org.id),
      getOrgEngagementKPIs(org.id),
      getOrgLeaderboard(org.id, 5),
    ]);

  return (
    <DashboardHomeClient
      orgName={org.name}
      snapshot={snapshot}
      segments={segments}
      campaigns={campaigns}
      gamificationKpis={gamificationKpis}
      leaderboard={leaderboard}
    />
  );
}

import { getDashboardContext } from "@/server/queries/session";
import { getOrgLeaderboard, getOrgLevels } from "@/server/queries/gamification";
import {
  getOrgEngagementKPIs,
  getEngagementBreakdown,
} from "@/server/queries/engagement-intelligence";
import { GamificationClient } from "./GamificationClient";

export default async function GamificationPage() {
  const { org } = await getDashboardContext();

  const [leaderboard, orgLevels, kpis, breakdown] = await Promise.all([
    getOrgLeaderboard(org.id, 10),
    getOrgLevels(org.id),
    getOrgEngagementKPIs(org.id),
    getEngagementBreakdown(org.id),
  ]);

  return (
    <GamificationClient
      leaderboard={leaderboard}
      orgLevels={orgLevels}
      kpis={kpis}
      breakdown={breakdown.tiers}
    />
  );
}

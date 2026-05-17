import { getDashboardContext } from "@/server/queries/session";
import { listCampaignsWithStats } from "@/server/queries/campaigns";
import { getSegmentRulesPickList } from "@/server/queries/org-segments";
import { PageShell } from "@/components/ui/PageShell";
import { CampaignsClient } from "./CampaignsClient";

export default async function CampaignsPage() {
  const { org } = await getDashboardContext();

  const [campaignRows, segments] = await Promise.all([
    listCampaignsWithStats(org.id),
    getSegmentRulesPickList(org.id),
  ]);

  return (
    <PageShell
      title="Campañas"
      subtitle={`${org.name} · Motor de engagement (demo Neon + Better Auth)`}
    >
      <CampaignsClient campaigns={campaignRows} segments={segments} />
    </PageShell>
  );
}

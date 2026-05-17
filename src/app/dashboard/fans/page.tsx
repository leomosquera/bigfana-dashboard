import { getDashboardContext } from "@/server/queries/session";
import { getFansByOrg } from "@/server/queries/fans";
import { getOrgLevels } from "@/server/queries/gamification";
import { PageShell } from "@/components/ui/PageShell";
import { FansClient } from "./FansClient";

export default async function FansPage() {
  const { org } = await getDashboardContext();

  const [fans, orgLevels] = await Promise.all([
    getFansByOrg(org.id),
    getOrgLevels(org.id),
  ]);

  return (
    <PageShell
      title="Fans"
      subtitle={`${org.name} · ${fans.length.toLocaleString("es")} fans activos`}
    >
      <FansClient
        initialFans={fans}
        totalCount={fans.length}
        orgLevels={orgLevels}
      />
    </PageShell>
  );
}

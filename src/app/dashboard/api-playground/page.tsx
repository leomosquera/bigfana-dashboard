import { getDashboardContext } from "@/server/queries/session";
import { PageShell } from "@/components/ui/PageShell";
import { ApiPlaygroundClient } from "@/components/api-playground/ApiPlaygroundClient";

export default async function ApiPlaygroundPage() {
  const { org } = await getDashboardContext();

  return (
    <PageShell
      title="Playground API Fan"
      subtitle={`${org.name} · Demo curada Fan Experience (interno)`}
    >
      <ApiPlaygroundClient defaultOrganizationId={org.id} />
    </PageShell>
  );
}

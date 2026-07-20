import { notFound } from "next/navigation";
import { getDashboardContext } from "@/server/queries/session";
import { getFan360Profile } from "@/server/queries/fan-intelligence";
import { Fan360Client } from "./Fan360Client";

interface Fan360PageProps {
  params: Promise<{ id: string }>;
}

export default async function Fan360Page({ params }: Fan360PageProps) {
  const { id } = await params;
  const { org } = await getDashboardContext();

  const profile = await getFan360Profile(org.id, id);
  if (!profile) {
    notFound();
  }

  return (
    <Fan360Client
      profile={profile}
      orgName={org.name}
    />
  );
}

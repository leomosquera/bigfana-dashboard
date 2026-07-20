import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";

export default function Fan360NotFound() {
  return (
    <PageShell
      title="Fan no encontrado"
      subtitle="No hay una relación válida con este fan en la organización activa."
    >
      <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-8 max-w-lg space-y-4">
        <p className="text-sm text-[#8888AA] leading-relaxed">
          El acceso a Fan 360 requiere una relación PRIMARY o FOLLOWING en
          fan_organizations. Los fans sin vínculo con esta organización no son
          visibles.
        </p>
        <Link
          href="/dashboard/fans"
          className="inline-flex items-center h-8 px-3 text-xs font-semibold rounded-xl bg-white/[0.06] text-[#F0F0F8] border border-white/[0.08] hover:bg-white/[0.10]"
        >
          Volver a Fans
        </Link>
      </div>
    </PageShell>
  );
}

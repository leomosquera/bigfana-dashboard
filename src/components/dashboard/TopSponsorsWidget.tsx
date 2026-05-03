import { Card } from "@/components/ui/Card";
import { sponsors } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/Badge";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

export function TopSponsorsWidget() {
  const top = sponsors.slice(0, 4);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#F0F0F8]">Top Sponsors</h3>
          <p className="text-xs text-[#55556A] mt-0.5">Por inversión · temporada activa</p>
        </div>
        <Link href="/dashboard/sponsors" className="text-xs text-[#FF2D55] hover:text-[#FF6B6B] transition-colors">
          Ver todos →
        </Link>
      </div>

      <div className="space-y-3">
        {top.map((sponsor) => (
          <div
            key={sponsor.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1C1C2A] border border-white/[0.06] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[#8888AA]">{sponsor.logo}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#F0F0F8]">{sponsor.name}</p>
              <p className="text-[10px] text-[#55556A]">{sponsor.category}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-bold text-[#F0F0F8]">{formatCurrency(sponsor.investment)}</p>
              <div className="flex items-center gap-1 justify-end mt-0.5">
                <TrendingUp size={10} className="text-[#00D4A8]" />
                <span className="text-[10px] text-[#00D4A8]">ROI {sponsor.roi}x</span>
              </div>
            </div>
            <StatusBadge status={sponsor.status} />
          </div>
        ))}
      </div>
    </Card>
  );
}

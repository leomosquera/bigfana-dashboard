"use client";

import { motion } from "framer-motion";
import { TrendingUp, ArrowRight } from "lucide-react";
import { sponsors } from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import Link from "next/link";

const MAX_ROI = 5;

function ROIBar({ roi, delay }: { roi: number; delay: number }) {
  const pct = (roi / MAX_ROI) * 100;
  const color = roi >= 4 ? "#FF2D55" : roi >= 3 ? "#00D4A8" : "#3B82F6";

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay }}
        />
      </div>
      <span className="text-[10px] font-bold w-8 text-right" style={{ color }}>
        {roi}x
      </span>
    </div>
  );
}

export function TopSponsorsROI() {
  const sorted = [...sponsors].sort((a, b) => b.roi - a.roi).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.35 }}
      className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <TrendingUp size={13} className="text-[#00D4A8]" />
          <div>
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Top Sponsors · ROI</h3>
            <p className="text-[10px] text-[#55556A]">Retorno sobre inversión · activos</p>
          </div>
        </div>
        <Link href="/dashboard/sponsors" className="text-[10px] text-[#FF2D55] hover:text-[#FF6B6B] transition-colors">
          Ver todos →
        </Link>
      </div>

      {/* List */}
      <div className="flex-1 divide-y divide-white/[0.04] px-5">
        {sorted.map((sponsor, i) => (
          <motion.div
            key={sponsor.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.4 + i * 0.07 }}
            className="py-3.5 group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              {/* Logo */}
              <div className="w-8 h-8 rounded-xl bg-[#1C1C2A] border border-white/[0.06] flex items-center justify-center shrink-0">
                <span className="text-[10px] font-black text-[#8888AA]">{sponsor.logo}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-[#F0F0F8] truncate">{sponsor.name}</p>
                  <StatusBadge status={sponsor.status} />
                </div>
                <p className="text-[10px] text-[#55556A]">
                  {formatCurrency(sponsor.investment)} · {formatNumber(sponsor.impressions)} imp.
                </p>
                <ROIBar roi={sponsor.roi} delay={0.45 + i * 0.07} />
              </div>

              <ArrowRight
                size={12}
                className="text-[#55556A] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Footer total */}
      <div className="px-5 py-3.5 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-between">
        <span className="text-[10px] text-[#55556A]">ROI promedio del portfolio</span>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={11} className="text-[#00D4A8]" />
          <span className="text-sm font-black text-[#00D4A8]">3.3x</span>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Crown, TrendingUp } from "lucide-react";
import { topFans } from "@/lib/mock-data";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";

const rankConfig = [
  { glow: "shadow-[0_0_20px_rgba(255,45,85,0.25)]", ring: "ring-[#FF2D55]/40", size: "w-10 h-10" as const, label: "text-[#FF2D55]" },
  { glow: "shadow-[0_0_12px_rgba(255,255,255,0.06)]", ring: "ring-white/10", size: "w-9 h-9" as const, label: "text-[#8888AA]" },
  { glow: "", ring: "ring-white/[0.06]", size: "w-8 h-8" as const, label: "text-[#55556A]" },
];

export function TopFans() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.3 }}
      className="relative rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Crown size={13} className="text-[#FF2D55]" />
          <div>
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Top Hinchas</h3>
            <p className="text-[10px] text-[#55556A]">Por XP acumulado · temporada</p>
          </div>
        </div>
        <Link href="/dashboard/fans" className="text-[10px] text-[#FF2D55] hover:text-[#FF6B6B] transition-colors">
          Ver ranking →
        </Link>
      </div>

      {/* Podium (top 3) */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-end justify-center gap-3 mb-4">
          {[topFans[1], topFans[0], topFans[2]].map((fan, idx) => {
            const displayRank = idx === 0 ? 2 : idx === 1 ? 1 : 3;
            const cfg = rankConfig[displayRank - 1];
            const heights = ["h-14", "h-20", "h-10"];

            return (
              <motion.div
                key={fan.rank}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.35 + idx * 0.08 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="flex flex-col items-center gap-1">
                  {displayRank === 1 && (
                    <span className="text-base animate-bounce">👑</span>
                  )}
                  <div className={cn("ring-2", cfg.ring, cfg.glow, "rounded-full")}>
                    <Avatar initials={fan.initials} size={displayRank === 1 ? "lg" : "md"} />
                  </div>
                  <p className="text-[10px] font-semibold text-[#F0F0F8] text-center leading-none max-w-[60px] truncate">
                    {fan.name.split(" ")[0]}
                  </p>
                  <p className={cn("text-[10px] font-black", cfg.label)}>
                    {(fan.points / 1000).toFixed(1)}K
                  </p>
                </div>
                {/* Podium block */}
                <div className={cn(
                  "w-16 rounded-t-lg flex items-start justify-center pt-1.5",
                  heights[idx],
                  displayRank === 1
                    ? "bg-gradient-to-b from-[#FF2D55]/20 to-[#FF2D55]/5 border-t border-x border-[#FF2D55]/25"
                    : "bg-white/[0.03] border-t border-x border-white/[0.06]"
                )}>
                  <span className={cn("text-xs font-black", cfg.label)}>#{displayRank}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Remaining fans (4-5) */}
      <div className="flex-1 divide-y divide-white/[0.04] border-t border-white/[0.05]">
        {topFans.slice(3).map((fan, i) => (
          <motion.div
            key={fan.rank}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.55 + i * 0.06 }}
            className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors group"
          >
            <span className="text-xs font-black text-[#55556A] w-4">#{fan.rank}</span>
            <Avatar initials={fan.initials} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#F0F0F8] truncate">{fan.name}</p>
              <p className="text-[10px] text-[#55556A]">{fan.location} · 🔥 {fan.streak}</p>
            </div>
            <div className="flex items-center gap-1 text-[#55556A]">
              <TrendingUp size={10} className="text-[#00D4A8] opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="text-xs font-bold text-[#F0F0F8]">
                {(fan.points / 1000).toFixed(1)}K
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

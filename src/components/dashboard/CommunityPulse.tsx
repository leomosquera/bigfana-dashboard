"use client";

import { motion } from "framer-motion";
import { Users, UserPlus, ShieldCheck, UserMinus, Zap, TrendingUp, TrendingDown } from "lucide-react";
import { communityPulse } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const iconMap = {
  Users,
  UserPlus,
  ShieldCheck,
  UserMinus,
  Zap,
};

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardAnim = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function CommunityPulse() {
  return (
    <div className="space-y-3">
      {/* Section label */}
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#55556A]">
          Pulso de la Comunidad
        </span>
        <div className="flex-1 h-px bg-white/[0.04]" />
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4A8] animate-pulse" />
          <span className="text-[10px] font-semibold text-[#00D4A8]">Tiempo real</span>
        </div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3"
      >
        {communityPulse.map((item) => {
          const Icon = iconMap[item.icon as keyof typeof iconMap];
          const isPositive = item.trend > 0;
          const isWarning = "warning" in item && item.warning;

          return (
            <motion.div
              key={item.id}
              variants={cardAnim}
              whileHover={{ y: -2, scale: 1.02 }}
              transition={{ duration: 0.18 }}
              className={cn(
                "relative rounded-2xl border p-4 overflow-hidden cursor-pointer group",
                item.accent
                  ? "bg-gradient-to-br from-[#FF2D55]/10 to-[#FF2D55]/[0.02] border-[#FF2D55]/25 glow-brand-sm"
                  : isWarning
                  ? "bg-[#F59E0B]/[0.04] border-[#F59E0B]/15"
                  : "bg-[#0D0D14] border-white/[0.06]"
              )}
            >
              {/* Subtle inner glow top-right */}
              <div className={cn(
                "absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl pointer-events-none",
                item.accent ? "bg-[#FF2D55]/20" : isWarning ? "bg-[#F59E0B]/10" : "bg-white/[0.02]"
              )} />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center",
                    item.accent ? "bg-[#FF2D55]/20 text-[#FF2D55]"
                    : isWarning ? "bg-[#F59E0B]/15 text-[#F59E0B]"
                    : "bg-white/[0.05] text-[#8888AA]"
                  )}>
                    <Icon size={15} />
                  </div>
                  <div className={cn(
                    "flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full",
                    isPositive
                      ? "bg-[#00D4A8]/10 text-[#00D4A8]"
                      : "bg-[#FF2D55]/10 text-[#FF2D55]"
                  )}>
                    {isPositive
                      ? <TrendingUp size={9} />
                      : <TrendingDown size={9} />
                    }
                    <span>{Math.abs(item.trend)}%</span>
                  </div>
                </div>

                <p className={cn(
                  "text-xl font-black tracking-tight leading-none mb-1",
                  item.accent ? "text-[#FF2D55]" : "text-[#F0F0F8]"
                )}>
                  {item.value}
                </p>
                <p className="text-[11px] font-medium text-[#8888AA] leading-snug">{item.label}</p>
                <p className="text-[10px] text-[#55556A] mt-0.5">{item.trendLabel}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

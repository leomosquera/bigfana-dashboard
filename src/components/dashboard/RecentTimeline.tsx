"use client";

import { motion } from "framer-motion";
import { UserPlus, Handshake, Gift, Megaphone, Gamepad2, Clock } from "lucide-react";
import { recentTimeline, type TimelineEventType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

const eventConfig: Record<TimelineEventType, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  dot: string;
  label: string;
}> = {
  fan:      { icon: UserPlus,   color: "text-blue-400",   dot: "bg-blue-500",     label: "Fans" },
  sponsor:  { icon: Handshake,  color: "text-[#FF2D55]",  dot: "bg-[#FF2D55]",   label: "Sponsors" },
  reward:   { icon: Gift,       color: "text-[#F59E0B]",  dot: "bg-[#F59E0B]",   label: "Rewards" },
  campaign: { icon: Megaphone,  color: "text-[#00D4A8]",  dot: "bg-[#00D4A8]",  label: "Campañas" },
  game:     { icon: Gamepad2,   color: "text-purple-400", dot: "bg-purple-500",   label: "Gamif." },
};

export function RecentTimeline() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.45 }}
      className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-[#8888AA]" />
          <div>
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Actividad Reciente</h3>
            <p className="text-[10px] text-[#55556A]">Últimas 24 horas del club</p>
          </div>
        </div>
        <Link href="/dashboard/analytics" className="text-[10px] text-[#FF2D55] hover:text-[#FF6B6B] transition-colors">
          Ver todo →
        </Link>
      </div>

      {/* Timeline */}
      <div className="flex-1 px-5 py-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[13px] top-2 bottom-2 w-px bg-white/[0.06]" />

          <div className="space-y-0">
            {recentTimeline.map((event, i) => {
              const cfg = eventConfig[event.type];
              const Icon = cfg.icon;
              const isLast = i === recentTimeline.length - 1;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.5 + i * 0.07 }}
                  className={cn(
                    "relative flex gap-4 group cursor-pointer",
                    isLast ? "pb-0" : "pb-4"
                  )}
                >
                  {/* Dot */}
                  <div className="relative z-10 flex flex-col items-center shrink-0">
                    <div className={cn(
                      "w-7 h-7 rounded-xl flex items-center justify-center border border-white/[0.08] transition-all group-hover:scale-110",
                      "bg-[#141420]"
                    )}>
                      <Icon size={12} className={cfg.color} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5 pb-3 border-b border-white/[0.04] group-hover:border-white/[0.08] transition-colors last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-[#F0F0F8] leading-snug">{event.title}</p>
                      {event.amount && (
                        <span className={cn("shrink-0 text-[10px] font-bold", cfg.color)}>
                          {event.amount}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#55556A] mt-0.5 leading-snug">{event.description}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06]", cfg.color)}>
                        {cfg.label}
                      </span>
                      <span className="text-[10px] text-[#55556A]">{event.time}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

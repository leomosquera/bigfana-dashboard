"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, Info, Zap, ArrowRight, BrainCircuit } from "lucide-react";
import { smartAlerts, type AlertType } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import Link from "next/link";

const alertConfig: Record<AlertType, {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
  border: string;
  pill: string;
}> = {
  danger: {
    icon: AlertCircle,
    color: "text-[#FF2D55]",
    bg: "bg-[#FF2D55]/[0.06]",
    border: "border-[#FF2D55]/15",
    pill: "bg-[#FF2D55]/15 text-[#FF2D55] border-[#FF2D55]/25",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-[#F59E0B]",
    bg: "bg-[#F59E0B]/[0.05]",
    border: "border-[#F59E0B]/12",
    pill: "bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/25",
  },
  action: {
    icon: Zap,
    color: "text-[#00D4A8]",
    bg: "bg-[#00D4A8]/[0.05]",
    border: "border-[#00D4A8]/12",
    pill: "bg-[#00D4A8]/15 text-[#00D4A8] border-[#00D4A8]/25",
  },
  info: {
    icon: Info,
    color: "text-[#3B82F6]",
    bg: "bg-blue-500/[0.05]",
    border: "border-blue-500/12",
    pill: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  },
};

export function SmartAlerts() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.4 }}
      className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <BrainCircuit size={13} className="text-[#FF2D55]" />
          <div>
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Alertas Inteligentes</h3>
            <p className="text-[10px] text-[#55556A]">Monitoreo IA · detección automática</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#FF2D55] bg-[#FF2D55]/10 border border-[#FF2D55]/20 px-2 py-0.5 rounded-full">
            {smartAlerts.filter(a => a.type === "danger" || a.type === "warning").length} activas
          </span>
          <Link href="/dashboard/alerts" className="text-[10px] text-[#55556A] hover:text-[#F0F0F8] transition-colors">
            Ver todas →
          </Link>
        </div>
      </div>

      {/* Alerts */}
      <div className="flex-1 divide-y divide-white/[0.04]">
        <AnimatePresence>
          {smartAlerts.map((alert, i) => {
            const cfg = alertConfig[alert.type];
            const Icon = cfg.icon;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.45 + i * 0.07 }}
                className={cn(
                  "group px-5 py-3.5 hover:brightness-110 transition-all cursor-pointer",
                  alert.type === "danger" && i === 0 ? "bg-[#FF2D55]/[0.03]" : ""
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={cn("mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border", cfg.bg, cfg.border)}>
                    <Icon size={13} className={cfg.color} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-[#F0F0F8] leading-snug">{alert.title}</p>
                      {alert.metric && (
                        <span className={cn("shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full border", cfg.pill)}>
                          {alert.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#55556A] leading-snug">{alert.description}</p>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-[#55556A]">{alert.time}</span>
                      <button className={cn(
                        "flex items-center gap-1 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity",
                        cfg.color
                      )}>
                        {alert.cta}
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

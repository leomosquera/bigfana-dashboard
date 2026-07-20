"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── PageShell ────────────────────────────────────────────────────────────────

interface PageShellProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageShell({
  title,
  subtitle,
  actions,
  children,
  className,
}: PageShellProps) {
  return (
    <div className={cn("p-6 space-y-6 w-full", className)}>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#F0F0F8]">{title}</h1>
          <p className="text-sm text-[#8888AA] mt-0.5 truncate">{subtitle}</p>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </motion.div>
      {children}
    </div>
  );
}

// ─── PlaceholderCard ──────────────────────────────────────────────────────────

interface PlaceholderCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  metric?: string;
  metricLabel?: string;
  accent?: boolean;
  badge?: string;
  delay?: number;
  className?: string;
  children?: React.ReactNode;
}

export function PlaceholderCard({
  icon,
  title,
  description,
  metric,
  metricLabel,
  accent = false,
  badge,
  delay = 0,
  className,
  children,
}: PlaceholderCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "relative rounded-2xl border bg-[#0D0D14] overflow-hidden p-6",
        accent
          ? "border-[#FF2D55]/20 bg-gradient-to-br from-[#FF2D55]/[0.05] to-transparent"
          : "border-white/[0.06]",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              accent ? "bg-[#FF2D55]/15 text-[#FF2D55]" : "bg-white/[0.05] text-[#8888AA]"
            )}
          >
            {icon}
          </div>
          {badge && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.06] text-[#55556A]">
              {badge}
            </span>
          )}
        </div>

        {metric && (
          <div className="mb-3">
            <p className={cn("text-3xl font-black tracking-tight", accent ? "text-[#FF2D55]" : "text-[#F0F0F8]")}>
              {metric}
            </p>
            {metricLabel && <p className="text-xs text-[#55556A] mt-0.5">{metricLabel}</p>}
          </div>
        )}

        <h3 className="text-sm font-semibold text-[#F0F0F8] mb-1">{title}</h3>
        <p className="text-xs text-[#55556A] leading-relaxed">{description}</p>

        {children}
      </div>
    </motion.div>
  );
}

// ─── ComingSoonBanner ─────────────────────────────────────────────────────────

interface ComingSoonBannerProps {
  label?: string;
  delay?: number;
}

export function ComingSoonBanner({ label = "Próximamente", delay = 0.3 }: ComingSoonBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#FF2D55]/[0.04] border border-[#FF2D55]/10 mt-4"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#FF2D55] animate-pulse" />
      <span className="text-xs font-semibold text-[#FF2D55]/70">{label}</span>
    </motion.div>
  );
}

// ─── MiniStat ─────────────────────────────────────────────────────────────────

interface MiniStatProps {
  label: string;
  value: string;
  positive?: boolean;
}

export function MiniStat({ label, value, positive }: MiniStatProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
      <span className="text-xs text-[#55556A]">{label}</span>
      <span className={cn("text-xs font-bold", positive === undefined ? "text-[#F0F0F8]" : positive ? "text-[#00D4A8]" : "text-[#FF2D55]")}>
        {value}
      </span>
    </div>
  );
}

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, glow = false, hover = false, onClick }: CardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden",
        glow && "glow-brand-sm",
        hover && "cursor-pointer",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  period?: string;
  icon: React.ReactNode;
  accent?: boolean;
}

export function StatCard({ label, value, change, period, icon, accent = false }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card hover className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            accent
              ? "bg-[#FF2D55]/15 text-[#FF2D55]"
              : "bg-white/[0.05] text-[#8888AA]"
          )}
        >
          {icon}
        </div>
        {change !== undefined && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              isPositive
                ? "bg-[#00D4A8]/10 text-[#00D4A8]"
                : "bg-red-500/10 text-red-400"
            )}
          >
            {isPositive ? "+" : ""}
            {change}%
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-[#F0F0F8] tracking-tight">{value}</p>
        <p className="text-sm font-medium text-[#8888AA]">{label}</p>
        {period && <p className="text-xs text-[#55556A]">{period}</p>}
      </div>
    </Card>
  );
}

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface EngagementBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
}

function getColor(value: number) {
  if (value >= 85) return "from-[#FF2D55] to-[#FF6B6B]";
  if (value >= 65) return "from-blue-500 to-blue-400";
  if (value >= 45) return "from-amber-500 to-yellow-400";
  return "from-[#55556A] to-[#8888AA]";
}

export function EngagementBar({ value, max = 100, showLabel = true, className }: EngagementBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full bg-gradient-to-r", getColor(value))}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-semibold text-[#8888AA] w-8 text-right">
          {value}%
        </span>
      )}
    </div>
  );
}

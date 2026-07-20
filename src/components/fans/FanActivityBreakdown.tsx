"use client";

import type { FanActivityBreakdownRow } from "@/lib/fan-intelligence";

interface FanActivityBreakdownProps {
  rows: FanActivityBreakdownRow[];
}

export function FanActivityBreakdown({ rows }: FanActivityBreakdownProps) {
  if (rows.length === 0) {
    return (
      <p className="text-xs text-[#8888AA] py-0.5">
        Sin tipos de actividad registrados.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.eventType} className="min-w-0">
          <div className="flex items-baseline justify-between gap-3 mb-1">
            <span className="text-xs text-[#C8C8E0] font-medium truncate">
              {row.label}
            </span>
            <span className="text-[10px] text-[#55556A] tabular-nums shrink-0">
              {row.count.toLocaleString("es")} · {row.percentage.toLocaleString("es")}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#FF2D55]/70"
              style={{ width: `${Math.min(100, Math.max(0, row.percentage))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

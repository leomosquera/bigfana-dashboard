"use client";

import { Activity } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FanActivityTrendPoint } from "@/lib/fan-intelligence";

interface FanActivityTrendChartProps {
  data: FanActivityTrendPoint[];
  windowDays: number;
}

function formatDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(d);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string; value?: number }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const interactions = payload.find((p) => p.dataKey === "interactions");
  return (
    <div className="bg-[#141420] border border-white/[0.08] rounded-xl px-3 py-2 shadow-2xl">
      <p className="text-[#55556A] text-[10px] mb-1">{formatDayLabel(label)}</p>
      <p className="text-xs text-[#F0F0F8]">
        Interacciones:{" "}
        <span className="font-semibold tabular-nums">
          {(interactions?.value ?? 0).toLocaleString("es")}
        </span>
      </p>
    </div>
  );
}

export function FanActivityTrendChart({
  data,
  windowDays,
}: FanActivityTrendChartProps) {
  const hasAny = data.some((d) => d.interactions > 0);

  if (!hasAny) {
    return (
      <div className="h-[140px] flex flex-col items-center justify-center text-center gap-1.5 px-4">
        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
          <Activity size={14} className="text-[#55556A]" />
        </div>
        <p className="text-xs text-[#8888AA]">
          No hay actividad registrada en los últimos {windowDays} días.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[140px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="grad-fan-activity" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#FF2D55" stopOpacity={0.28} />
              <stop offset="95%" stopColor="#FF2D55" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDayLabel}
            tick={{ fill: "#55556A", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
          />
          <YAxis
            tick={{ fill: "#55556A", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={28}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="interactions"
            name="Interacciones"
            stroke="#FF2D55"
            strokeWidth={2}
            fill="url(#grad-fan-activity)"
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

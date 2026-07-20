"use client";

import {
  Activity,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { ActivitySeriesPoint } from "@/lib/dashboard-home-series";

interface ActivityVolumeChartProps {
  data: ActivitySeriesPoint[];
  windowDays: number;
}

function formatDayLabel(dateKey: string): string {
  const d = new Date(`${dateKey}T00:00:00.000Z`);
  return new Intl.DateTimeFormat("es-AR", {
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
  const engaged = payload.find((p) => p.dataKey === "engagedFans");
  return (
    <div className="bg-[#141420] border border-white/[0.08] rounded-xl p-3 shadow-2xl">
      <p className="text-[#55556A] text-xs mb-2">{formatDayLabel(label)}</p>
      {interactions && (
        <p className="text-xs text-[#F0F0F8]">
          Interacciones:{" "}
          <span className="font-semibold">
            {(interactions.value ?? 0).toLocaleString("es-AR")}
          </span>
        </p>
      )}
      {engaged && (
        <p className="text-xs text-[#8888AA] mt-1">
          Fans con actividad: {(engaged.value ?? 0).toLocaleString("es-AR")}
        </p>
      )}
    </div>
  );
}

export function ActivityVolumeChart({
  data,
  windowDays,
}: ActivityVolumeChartProps) {
  const hasAny = data.some((d) => d.interactions > 0 || d.engagedFans > 0);

  return (
    <Card className="p-5 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-[#F0F0F8]">Actividad</h3>
        <p className="text-xs text-[#55556A] mt-0.5">
          Eventos diarios · últimos {windowDays} días
        </p>
      </div>

      {!hasAny ? (
        <div className="h-52 flex flex-col items-center justify-center text-center px-6 gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-1">
            <Activity size={16} className="text-[#55556A]" />
          </div>
          <p className="text-sm text-[#8888AA]">No hay actividad registrada</p>
          <p className="text-xs text-[#55556A] max-w-[220px]">
            Las interacciones de los fans aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="grad-interactions" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4A8" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#00D4A8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDayLabel}
                tick={{ fill: "#55556A", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                minTickGap={24}
              />
              <YAxis
                tick={{ fill: "#55556A", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={36}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="interactions"
                name="Interacciones"
                stroke="#00D4A8"
                strokeWidth={2}
                fill="url(#grad-interactions)"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
              <Area
                type="monotone"
                dataKey="engagedFans"
                name="Fans con actividad"
                stroke="#F59E0B"
                strokeWidth={1.5}
                fill="transparent"
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

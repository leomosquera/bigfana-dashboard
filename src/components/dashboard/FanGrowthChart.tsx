"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/Card";
import type { FanGrowthPoint } from "@/lib/dashboard-home-series";

interface FanGrowthChartProps {
  data: FanGrowthPoint[];
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
  payload?: Array<{ dataKey?: string; value?: number; color?: string }>;
  label?: string;
}) {
  if (!active || !payload?.length || !label) return null;
  const cumulative = payload.find((p) => p.dataKey === "cumulativeFans");
  const neu = payload.find((p) => p.dataKey === "newFans");
  return (
    <div className="bg-[#141420] border border-white/[0.08] rounded-xl p-3 shadow-2xl">
      <p className="text-[#55556A] text-xs mb-2">{formatDayLabel(label)}</p>
      {cumulative && (
        <p className="text-xs text-[#F0F0F8]">
          Base acumulada:{" "}
          <span className="font-semibold">
            {(cumulative.value ?? 0).toLocaleString("es-AR")}
          </span>
        </p>
      )}
      {neu && (
        <p className="text-xs text-[#8888AA] mt-1">
          Nuevos: {(neu.value ?? 0).toLocaleString("es-AR")}
        </p>
      )}
    </div>
  );
}

export function FanGrowthChart({ data, windowDays }: FanGrowthChartProps) {
  const hasAny = data.some((d) => d.cumulativeFans > 0 || d.newFans > 0);

  return (
    <Card className="p-5 h-full">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#F0F0F8]">
            Crecimiento de fans
          </h3>
          <p className="text-xs text-[#55556A] mt-0.5">
            Base PRIMARY acumulada · últimos {windowDays} días
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FF2D55]" />
            <span className="text-[10px] text-[#55556A]">Acumulados</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span className="text-[10px] text-[#55556A]">Nuevos</span>
          </div>
        </div>
      </div>

      {!hasAny ? (
        <div className="h-52 flex flex-col items-center justify-center text-center px-4 gap-1.5">
          <p className="text-sm text-[#8888AA]">Sin base de fans para graficar</p>
          <p className="text-xs text-[#55556A]">
            El crecimiento PRIMARY aparecerá cuando existan membresías.
          </p>
        </div>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
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
              <Line
                type="monotone"
                dataKey="cumulativeFans"
                name="Base acumulada"
                stroke="#FF2D55"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "#FF2D55" }}
              />
              <Line
                type="monotone"
                dataKey="newFans"
                name="Nuevos"
                stroke="#3B82F6"
                strokeWidth={1.5}
                strokeOpacity={0.85}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0, fill: "#3B82F6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

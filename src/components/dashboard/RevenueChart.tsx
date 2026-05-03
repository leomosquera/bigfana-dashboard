"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { revenueData } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

const series = [
  { key: "tickets", label: "Tickets", color: "#FF2D55" },
  { key: "sponsors", label: "Sponsors", color: "#3B82F6" },
  { key: "merch", label: "Merch", color: "#00D4A8" },
  { key: "digital", label: "Digital", color: "#F59E0B" },
];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="bg-[#141420] border border-white/[0.08] rounded-xl p-3 shadow-2xl">
      <p className="text-[#55556A] text-xs mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-8 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-[#8888AA]">{p.name}</span>
          </div>
          <span className="text-[#F0F0F8] font-semibold">{formatCurrency(p.value)}</span>
        </div>
      ))}
      <div className="border-t border-white/[0.06] mt-2 pt-2 flex justify-between text-xs">
        <span className="text-[#55556A]">Total</span>
        <span className="text-[#F0F0F8] font-bold">{formatCurrency(total)}</span>
      </div>
    </div>
  );
}

export function RevenueChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-[#F0F0F8]">Revenue por Canal</h3>
          <p className="text-xs text-[#55556A] mt-0.5">Últimos 12 meses · temporada 2025/26</p>
        </div>
        <div className="flex items-center gap-4">
          {series.map((s) => (
            <div key={s.key} className="hidden sm:flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
              <span className="text-xs text-[#55556A]">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={revenueData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="month"
              tick={{ fill: "#55556A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => formatCurrency(v)}
              tick={{ fill: "#55556A", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            {series.map((s) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

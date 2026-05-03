"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import { fanSegments, engagementFunnel } from "@/lib/mock-data";
import { formatNumber } from "@/lib/utils";
import { motion } from "framer-motion";

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number; payload: { color: string } }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#141420] border border-white/[0.08] rounded-xl px-3 py-2">
      <p className="text-xs text-[#8888AA]">{payload[0].name}</p>
      <p className="text-sm font-bold text-[#F0F0F8]">{formatNumber(payload[0].value)}</p>
    </div>
  );
}

export function FanSegmentsChart() {
  const total = fanSegments.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[#F0F0F8]">Segmentos de Fans</h3>
        <p className="text-xs text-[#55556A] mt-0.5">Distribución por nivel</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-36 h-36 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fanSegments}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={66}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {fanSegments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2.5">
          {fanSegments.map((seg) => (
            <div key={seg.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: seg.color }} />
                  <span className="text-xs text-[#8888AA]">{seg.name}</span>
                </div>
                <span className="text-xs font-semibold text-[#F0F0F8]">
                  {formatNumber(seg.value)}
                </span>
              </div>
              <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: seg.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(seg.value / total) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funnel mini */}
      <div className="mt-5 pt-5 border-t border-white/[0.05]">
        <p className="text-xs text-[#55556A] mb-3">Funnel de conversión</p>
        <div className="space-y-1.5">
          {engagementFunnel.map((step) => (
            <div key={step.stage} className="flex items-center gap-3">
              <span className="text-[10px] text-[#55556A] w-20 shrink-0">{step.stage}</span>
              <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B6B]"
                  style={{ opacity: 0.3 + step.pct / 150 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${step.pct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                />
              </div>
              <span className="text-[10px] font-semibold text-[#55556A] w-10 text-right">
                {step.pct.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

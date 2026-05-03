"use client";

import { motion } from "framer-motion";
import { heatmapData, heatmapDays, heatmapHours } from "@/lib/mock-data";
import { Card } from "@/components/ui/Card";

function getCellStyle(value: number) {
  const opacity = value / 100;
  if (value >= 80) return `rgba(255, 45, 85, ${0.3 + opacity * 0.7})`;
  if (value >= 50) return `rgba(255, 45, 85, ${0.1 + opacity * 0.4})`;
  if (value >= 20) return `rgba(255, 45, 85, ${0.04 + opacity * 0.15})`;
  return `rgba(255, 255, 255, 0.02)`;
}

export function EngagementHeatmap() {
  const max = Math.max(...heatmapData.flat());

  return (
    <Card className="p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-[#F0F0F8]">Heatmap de Actividad</h3>
        <p className="text-xs text-[#55556A] mt-0.5">Engagement por día y hora</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[360px]">
          {/* Hour labels */}
          <div className="flex mb-1 ml-8">
            {heatmapHours.map((h) => (
              <div key={h} className="flex-1 text-center text-[9px] text-[#55556A]">
                {h}h
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="space-y-1">
            {heatmapData.map((row, di) => (
              <div key={di} className="flex items-center gap-1">
                <span className="text-[10px] text-[#55556A] w-7 shrink-0">{heatmapDays[di]}</span>
                <div className="flex flex-1 gap-1">
                  {row.map((value, hi) => (
                    <motion.div
                      key={hi}
                      className="flex-1 h-7 rounded-md cursor-pointer relative group"
                      style={{ background: getCellStyle(value) }}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: (di * heatmapHours.length + hi) * 0.008,
                      }}
                      whileHover={{ scale: 1.1 }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-[#141420] border border-white/[0.08] rounded-lg text-[10px] text-[#F0F0F8] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        {heatmapDays[di]} {heatmapHours[hi]}h · {value}%
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-3">
            <span className="text-[10px] text-[#55556A]">Menos</span>
            {[5, 20, 40, 65, 90].map((v) => (
              <div
                key={v}
                className="w-4 h-4 rounded-sm"
                style={{ background: getCellStyle(v) }}
              />
            ))}
            <span className="text-[10px] text-[#55556A]">Más</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

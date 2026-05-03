"use client";

import { motion } from "framer-motion";
import { ShoppingCart, Zap, Package, TrendingUp } from "lucide-react";
import { realtimeActivity } from "@/lib/mock-data";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";

const icons = {
  purchase: { icon: ShoppingCart, color: "text-[#00D4A8]", bg: "bg-[#00D4A8]/10" },
  sponsor: { icon: Zap, color: "text-[#FF2D55]", bg: "bg-[#FF2D55]/10" },
  merch: { icon: Package, color: "text-amber-400", bg: "bg-amber-500/10" },
  upgrade: { icon: TrendingUp, color: "text-blue-400", bg: "bg-blue-500/10" },
};

export function ActivityFeed() {
  return (
    <Card className="p-6 flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-[#F0F0F8]">Actividad en Tiempo Real</h3>
          <p className="text-xs text-[#55556A] mt-0.5">Transacciones recientes</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00D4A8]/10 border border-[#00D4A8]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00D4A8] animate-pulse" />
          <span className="text-[10px] font-semibold text-[#00D4A8]">Live</span>
        </div>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto">
        {realtimeActivity.map((item, i) => {
          const { icon: Icon, color, bg } = icons[item.type as keyof typeof icons];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
            >
              <Avatar initials={item.avatar} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#F0F0F8] truncate">{item.user}</p>
                <p className="text-[11px] text-[#55556A] truncate">{item.action}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold text-[#00D4A8]">{item.amount}</p>
                <p className="text-[10px] text-[#55556A]">{item.time}</p>
              </div>
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={13} className={color} />
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

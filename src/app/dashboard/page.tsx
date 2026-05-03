"use client";

import { motion } from "framer-motion";
import {
  DollarSign,
  Users,
  Handshake,
  Ticket,
  Activity,
  TrendingUp,
} from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { FanSegmentsChart } from "@/components/dashboard/FanSegmentsChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EngagementHeatmap } from "@/components/dashboard/EngagementHeatmap";
import { TopSponsorsWidget } from "@/components/dashboard/TopSponsorsWidget";
import { kpiData } from "@/lib/mock-data";

const kpis = [
  {
    key: "revenue",
    label: "Revenue Total",
    icon: <DollarSign size={18} />,
    accent: true,
    data: kpiData.revenue,
  },
  {
    key: "fans",
    label: "Fans Activos",
    icon: <Users size={18} />,
    accent: false,
    data: kpiData.activeFans,
  },
  {
    key: "sponsors",
    label: "Sponsors",
    icon: <Handshake size={18} />,
    accent: false,
    data: { ...kpiData.sponsors, change: undefined },
  },
  {
    key: "tickets",
    label: "Tickets Vendidos",
    icon: <Ticket size={18} />,
    accent: false,
    data: kpiData.ticketsSold,
  },
  {
    key: "engagement",
    label: "Engagement Rate",
    icon: <Activity size={18} />,
    accent: false,
    data: kpiData.engagement,
  },
  {
    key: "avgspend",
    label: "Gasto Promedio",
    icon: <TrendingUp size={18} />,
    accent: false,
    data: kpiData.avgSpend,
  },
];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function DashboardPage() {
  return (
    <div className="w-full p-6 space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-[#F0F0F8]">Overview</h1>
          <p className="text-sm text-[#55556A] mt-0.5">
            Temporada 2025/26 · Actualizado hace 2 minutos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-8 px-3 rounded-lg bg-[#141420] border border-white/[0.06] text-xs text-[#8888AA] outline-none cursor-pointer">
            <option>Últimos 12 meses</option>
            <option>Últimos 6 meses</option>
            <option>Últimos 30 días</option>
          </select>
          <button className="h-8 px-4 rounded-lg bg-[#FF2D55] text-white text-xs font-semibold hover:bg-[#CC1F3F] transition-colors">
            Exportar
          </button>
        </div>
      </motion.div>

      {/* KPI Grid */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {kpis.map((kpi) => (
          <motion.div key={kpi.key} variants={item}>
            <StatCard
              label={kpi.label}
              value={kpi.data.formatted}
              change={"change" in kpi.data && kpi.data.change !== undefined ? kpi.data.change as number : undefined}
              period={"period" in kpi.data ? kpi.data.period as string : undefined}
              icon={kpi.icon}
              accent={kpi.accent}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Revenue Chart + Segments */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-4"
      >
        <div className="xl:col-span-2">
          <RevenueChart />
        </div>
        <FanSegmentsChart />
      </motion.div>

      {/* Activity + Sponsors + Heatmap */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        <ActivityFeed />
        <TopSponsorsWidget />
        <EngagementHeatmap />
      </motion.div>
    </div>
  );
}

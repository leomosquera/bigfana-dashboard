"use client";

import { motion } from "framer-motion";
import { DollarSign, Users, Handshake, Ticket, Activity, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { FanSegmentsChart } from "@/components/dashboard/FanSegmentsChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { EngagementHeatmap } from "@/components/dashboard/EngagementHeatmap";
import { CommunityPulse } from "@/components/dashboard/CommunityPulse";
import { LastMatch } from "@/components/dashboard/LastMatch";
import { TopFans } from "@/components/dashboard/TopFans";
import { TopSponsorsROI } from "@/components/dashboard/TopSponsorsROI";
import { SmartAlerts } from "@/components/dashboard/SmartAlerts";
import { RecentTimeline } from "@/components/dashboard/RecentTimeline";
import { kpiData } from "@/lib/mock-data";

const kpis = [
  { key: "revenue",    label: "Revenue Total",    icon: <DollarSign size={18} />, accent: true,  data: kpiData.revenue },
  { key: "fans",       label: "Fans Activos",      icon: <Users size={18} />,      accent: false, data: kpiData.activeFans },
  { key: "sponsors",   label: "Sponsors",          icon: <Handshake size={18} />,  accent: false, data: { ...kpiData.sponsors, change: undefined } },
  { key: "tickets",    label: "Tickets Vendidos",  icon: <Ticket size={18} />,     accent: false, data: kpiData.ticketsSold },
  { key: "engagement", label: "Engagement Rate",   icon: <Activity size={18} />,   accent: false, data: kpiData.engagement },
  { key: "avgspend",   label: "Gasto Promedio",    icon: <TrendingUp size={18} />, accent: false, data: kpiData.avgSpend },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#55556A]">{label}</span>
      <div className="flex-1 h-px bg-white/[0.04]" />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="w-full p-6 space-y-6">

      {/* ── Page header ── */}
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

      {/* ── KPI Grid ── */}
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

      {/* ── Pulso de la Comunidad ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CommunityPulse />
      </motion.div>

      {/* ── Último Partido + Top Hinchas ── */}
      <SectionDivider label="Centro de Operaciones" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.25 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <div className="lg:col-span-2">
          <LastMatch />
        </div>
        <TopFans />
      </motion.div>

      {/* ── Revenue + Segmentos ── */}
      <SectionDivider label="Revenue & Audiencias" />
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

      {/* ── Top Sponsors ROI + Alertas + Timeline ── */}
      <SectionDivider label="Sponsors · Alertas · Actividad" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.35 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        <TopSponsorsROI />
        <SmartAlerts />
        <RecentTimeline />
      </motion.div>

      {/* ── Activity Feed + Heatmap ── */}
      <SectionDivider label="Engagement" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <ActivityFeed />
        <EngagementHeatmap />
      </motion.div>

    </div>
  );
}

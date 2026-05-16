"use client";

import { motion } from "framer-motion";
import { DollarSign, Users, Handshake, Ticket, Activity, TrendingUp, Download } from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/forms/Select";
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
  { key: "revenue",    label: "Revenue Total",   icon: <DollarSign size={18} />, accent: true,  data: kpiData.revenue },
  { key: "fans",       label: "Fans Activos",     icon: <Users size={18} />,      accent: false, data: kpiData.activeFans },
  { key: "sponsors",   label: "Sponsors",         icon: <Handshake size={18} />,  accent: false, data: { ...kpiData.sponsors, change: undefined } },
  { key: "tickets",    label: "Tickets Vendidos", icon: <Ticket size={18} />,     accent: false, data: kpiData.ticketsSold },
  { key: "engagement", label: "Engagement Rate",  icon: <Activity size={18} />,   accent: false, data: kpiData.engagement },
  { key: "avgspend",   label: "Gasto Promedio",   icon: <TrendingUp size={18} />, accent: false, data: kpiData.avgSpend },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.4 } },
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
    <PageShell
      title="Overview"
      subtitle="Temporada 2025/26 · Actualizado hace 2 minutos"
      actions={
        <>
          <Select
            size="sm"
            options={[
              { value: "12m", label: "Últimos 12 meses" },
              { value: "6m",  label: "Últimos 6 meses"  },
              { value: "30d", label: "Últimos 30 días"  },
            ]}
            defaultValue="12m"
            wrapperClassName="w-40"
          />
          <Button intent="primary" size="sm" leftIcon={<Download size={13} />}>
            Exportar
          </Button>
        </>
      }
    >

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
        <div className="lg:col-span-2"><LastMatch /></div>
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
        <div className="xl:col-span-2"><RevenueChart /></div>
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

    </PageShell>
  );
}

"use client";

import { motion } from "framer-motion";
import { Zap, Target, TrendingUp, Clock, CheckCircle, Play, Pause, BarChart2 } from "lucide-react";
import { PageShell, PlaceholderCard } from "@/components/ui/PageShell";

type CampaignStatus = "active" | "paused" | "scheduled" | "completed";

const campaigns: { id: string; name: string; status: CampaignStatus; type: string; reach: string; conversion: string; budget: string; start: string; end: string; progress: number }[] = [
  {
    id: "C001",
    name: "Champions League Q3 · Nike",
    status: "active",
    type: "Sponsor + Digital",
    reach: "48.5M",
    conversion: "4.8%",
    budget: "$120K",
    start: "01 May 2026",
    end: "30 Jun 2026",
    progress: 62,
  },
  {
    id: "C002",
    name: "Upgrade VIP Elite · Temporada",
    status: "active",
    type: "Fan Upgrade",
    reach: "33,350",
    conversion: "12.4%",
    budget: "$18K",
    start: "15 Abr 2026",
    end: "31 May 2026",
    progress: 78,
  },
  {
    id: "C003",
    name: "Reactivación fans inactivos",
    status: "paused",
    type: "Retención",
    reach: "9,400",
    conversion: "6.1%",
    budget: "$8K",
    start: "10 Abr 2026",
    end: "10 May 2026",
    progress: 45,
  },
  {
    id: "C004",
    name: "Pack Familia · Día del Padre",
    status: "scheduled",
    type: "Merch + Tickets",
    reach: "24,000",
    conversion: "—",
    budget: "$22K",
    start: "15 Jun 2026",
    end: "25 Jun 2026",
    progress: 0,
  },
  {
    id: "C005",
    name: "Pepsi x Gol del Mes",
    status: "completed",
    type: "Sponsor Live",
    reach: "28.5M",
    conversion: "5.2%",
    budget: "$45K",
    start: "01 Mar 2026",
    end: "30 Abr 2026",
    progress: 100,
  },
];

const statusConfig = {
  active:    { label: "Activa",       color: "#00D4A8", bg: "bg-[#00D4A8]/10 border-[#00D4A8]/20",    icon: Play },
  paused:    { label: "Pausada",      color: "#F59E0B", bg: "bg-amber-500/10 border-amber-500/20",    icon: Pause },
  scheduled: { label: "Programada",   color: "#3B82F6", bg: "bg-blue-500/10 border-blue-500/20",      icon: Clock },
  completed: { label: "Completada",   color: "#8888AA", bg: "bg-white/[0.05] border-white/[0.06]",    icon: CheckCircle },
} as const;

export default function CampaignsPage() {
  const active = campaigns.filter((c) => c.status === "active").length;

  return (
    <PageShell
      title="Campañas"
      subtitle="Gestión de activaciones, campañas de marketing y comunicaciones segmentadas"
      actions={
        <>
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[#8888AA] hover:text-[#F0F0F8] transition-colors">
            Plantillas
          </button>
          <button className="h-8 px-4 rounded-lg bg-[#FF2D55] text-white text-xs font-semibold hover:bg-[#CC1F3F] transition-colors">
            + Nueva campaña
          </button>
        </>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          icon={<Zap size={18} />}
          title="Campañas activas"
          description="Activaciones en ejecución con tracking en tiempo real."
          metric={`${active}`}
          metricLabel="corriendo ahora"
          accent
          badge="Live"
          delay={0.05}
        />
        <PlaceholderCard
          icon={<Target size={18} />}
          title="Alcance total"
          description="Fans e impresiones alcanzadas en todas las campañas activas del mes."
          metric="82.3M"
          metricLabel="impresiones este mes"
          delay={0.1}
        />
        <PlaceholderCard
          icon={<TrendingUp size={18} />}
          title="Conversión promedio"
          description="Tasa promedio de conversión en campañas activas vs. benchmark de industria."
          metric="8.7%"
          metricLabel="+3.2% vs benchmark"
          delay={0.15}
        />
      </div>

      {/* Campaigns table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Todas las campañas</h3>
            <p className="text-xs text-[#55556A] mt-0.5">{campaigns.length} campañas · temporada 2025/26</p>
          </div>
          <div className="flex items-center gap-2">
            {(["active", "paused", "scheduled", "completed"] as const).map((s) => {
              const cfg = statusConfig[s];
              return (
                <button
                  key={s}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${cfg.bg}`}
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="divide-y divide-white/[0.03]">
          {campaigns.map((camp, i) => {
            const cfg = statusConfig[camp.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.25 + i * 0.06 }}
                className="px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: `${cfg.color}15` }}
                  >
                    <StatusIcon size={15} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-[#F0F0F8] truncate">{camp.name}</p>
                      <span
                        className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.bg}`}
                        style={{ color: cfg.color }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#55556A]">{camp.type} · {camp.start} → {camp.end}</p>
                    {camp.progress > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden max-w-[200px]">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B6B]"
                            style={{ width: `${camp.progress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#55556A]">{camp.progress}%</span>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-6 shrink-0 text-right">
                    <div>
                      <p className="text-[10px] text-[#55556A] mb-0.5">Alcance</p>
                      <p className="text-xs font-bold text-[#F0F0F8]">{camp.reach}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#55556A] mb-0.5">Conv.</p>
                      <p className="text-xs font-bold text-[#00D4A8]">{camp.conversion}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#55556A] mb-0.5">Budget</p>
                      <p className="text-xs font-bold text-[#F0F0F8]">{camp.budget}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Bottom row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <PlaceholderCard
          icon={<BarChart2 size={18} />}
          title="Performance histórico"
          description="Comparativa de conversión, ROI y alcance entre campañas. Identifica qué tipo de activación genera más valor para el club."
          badge="Próximamente"
          delay={0.4}
        />
        <PlaceholderCard
          icon={<Zap size={18} />}
          title="Automatización inteligente"
          description="Disparadores automáticos basados en comportamiento del fan: upgrade, cumpleaños, aniversario, streak de asistencia."
          badge="Beta"
          delay={0.45}
        />
      </motion.div>
    </PageShell>
  );
}

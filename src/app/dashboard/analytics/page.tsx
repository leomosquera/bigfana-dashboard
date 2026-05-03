"use client";

import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Download, Eye, ArrowUpRight } from "lucide-react";
import { PageShell, PlaceholderCard, MiniStat } from "@/components/ui/PageShell";

const reports = [
  {
    title: "Revenue Breakdown Q2 2026",
    type: "Financiero",
    updated: "hace 2h",
    views: 248,
    status: "ready",
    color: "#FF2D55",
  },
  {
    title: "Fan Engagement Report — Mayo",
    type: "Engagement",
    updated: "hace 5h",
    views: 182,
    status: "ready",
    color: "#3B82F6",
  },
  {
    title: "Sponsor ROI Comparativo",
    type: "Sponsors",
    updated: "hace 1d",
    views: 94,
    status: "ready",
    color: "#00D4A8",
  },
  {
    title: "Churn Predictivo · Modelo ML",
    type: "Predictivo",
    updated: "hace 3d",
    views: 67,
    status: "processing",
    color: "#F59E0B",
  },
  {
    title: "Temporada 2024/25 · Cierre anual",
    type: "Histórico",
    updated: "hace 1 sem",
    views: 512,
    status: "ready",
    color: "#8888AA",
  },
];

const metrics = [
  { label: "Revenue acumulado", value: "$2.84M", positive: true },
  { label: "Crecimiento YoY", value: "+34.8%", positive: true },
  { label: "Costo por fan adquirido", value: "$12.40" },
  { label: "LTV promedio (Fan Core)", value: "$580" },
  { label: "LTV promedio (Fan VIP)", value: "$4,850" },
  { label: "NPS del hincha", value: "74" },
  { label: "Churn rate mensual", value: "2.1%", positive: false },
  { label: "Ticket promedio", value: "$85" },
];

export default function AnalyticsPage() {
  return (
    <PageShell
      title="Analytics"
      subtitle="Reportes avanzados, métricas de negocio y predicciones basadas en datos reales del club"
      actions={
        <>
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[#8888AA] hover:text-[#F0F0F8] flex items-center gap-1.5 transition-colors">
            <Calendar size={12} />
            Período
          </button>
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[#8888AA] hover:text-[#F0F0F8] flex items-center gap-1.5 transition-colors">
            <Download size={12} />
            Exportar
          </button>
          <button className="h-8 px-4 rounded-lg bg-[#FF2D55] text-white text-xs font-semibold hover:bg-[#CC1F3F] transition-colors">
            + Nuevo reporte
          </button>
        </>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          icon={<BarChart3 size={18} />}
          title="Reportes disponibles"
          description="Informes generados y listos para exportar en PDF, Excel o API."
          metric="38"
          metricLabel="reportes activos"
          accent
          delay={0.05}
        />
        <PlaceholderCard
          icon={<TrendingUp size={18} />}
          title="Crecimiento de revenue"
          description="Variación porcentual del revenue total vs. mismo período del año anterior."
          metric="+34.8%"
          metricLabel="vs temporada 24/25"
          delay={0.1}
        />
        <PlaceholderCard
          icon={<Users size={18} />}
          title="Modelos predictivos"
          description="Algoritmos activos analizando churn, upgrade y comportamiento de compra."
          metric="5"
          metricLabel="modelos en producción"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Reports list */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-white/[0.05]">
              <h3 className="text-sm font-semibold text-[#F0F0F8]">Reportes recientes</h3>
              <p className="text-xs text-[#55556A] mt-0.5">Generados automáticamente · actualizados en tiempo real</p>
            </div>
            <div className="divide-y divide-white/[0.03]">
              {reports.map((r, i) => (
                <motion.div
                  key={r.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.25, delay: 0.25 + i * 0.07 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                >
                  <div
                    className="w-1 h-10 rounded-full shrink-0"
                    style={{ background: r.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#F0F0F8] truncate">{r.title}</p>
                      {r.status === "processing" && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          Procesando
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-[#55556A]">{r.type}</span>
                      <span className="text-[10px] text-[#55556A]">·</span>
                      <span className="text-[10px] text-[#55556A]">Actualizado {r.updated}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-1 text-[#55556A]">
                      <Eye size={11} />
                      <span className="text-[10px]">{r.views}</span>
                    </div>
                    <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[10px] text-[#8888AA] hover:text-[#F0F0F8] opacity-0 group-hover:opacity-100 transition-all">
                      <Download size={10} />
                      Exportar
                    </button>
                    <ArrowUpRight size={13} className="text-[#55556A] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Key metrics panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={14} className="text-[#FF2D55]" />
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Métricas clave</h3>
          </div>
          <div className="space-y-0.5">
            {metrics.map((m) => (
              <MiniStat key={m.label} label={m.label} value={m.value} positive={m.positive} />
            ))}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-[#FF2D55]/[0.05] border border-[#FF2D55]/10">
            <p className="text-xs font-semibold text-[#FF2D55] mb-1">Predicción Q3 2026</p>
            <p className="text-2xl font-black text-[#F0F0F8]">$3.2M</p>
            <p className="text-[10px] text-[#55556A] mt-0.5">+12.5% vs Q2 · Modelo ML v2.4</p>
          </div>
        </motion.div>
      </div>

      {/* Bottom row */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <PlaceholderCard
          icon={<BarChart3 size={18} />}
          title="Análisis de cohortes"
          description="Evolución de fans agrupados por fecha de ingreso. Identifica qué cohortes tienen mayor retención y LTV."
          badge="Próximamente"
          delay={0.4}
        />
        <PlaceholderCard
          icon={<TrendingUp size={18} />}
          title="Forecasting de revenue"
          description="Proyección automática a 90 días basada en histórico de ventas, calendario de partidos y tendencias de mercado."
          badge="Beta"
          delay={0.45}
        />
        <PlaceholderCard
          icon={<Users size={18} />}
          title="Mapa de calor geográfico"
          description="Distribución geográfica de fans activos, clusters de engagement por región y potencial de expansión."
          badge="Próximamente"
          delay={0.5}
        />
      </motion.div>
    </PageShell>
  );
}

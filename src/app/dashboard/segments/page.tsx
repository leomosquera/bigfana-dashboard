"use client";

import { motion } from "framer-motion";
import { PieChart, Users, Target, Sparkles, ArrowRight, TrendingUp, Plus } from "lucide-react";
import { PageShell, PlaceholderCard } from "@/components/ui/PageShell";
import { Button } from "@/components/ui/Button";

const segments = [
  {
    name: "Ultra VIP Elite",
    count: "8,750",
    pct: 5.9,
    color: "#FF2D55",
    bar: 6,
    desc: "Abonados de temporada completa, gasto > $3K/año",
  },
  {
    name: "Premium Activos",
    count: "33,350",
    pct: 22.6,
    color: "#3B82F6",
    bar: 23,
    desc: "Compradores frecuentes, engagement > 75%",
  },
  {
    name: "Core Fan",
    count: "65,000",
    pct: 44.0,
    color: "#8888AA",
    bar: 44,
    desc: "Hincha regular, asistencia > 10 partidos/año",
  },
  {
    name: "Casual",
    count: "40,732",
    pct: 27.5,
    color: "#242436",
    bar: 28,
    desc: "Interacción esporádica, potencial de upgrade",
  },
];

export default function SegmentsPage() {
  return (
    <PageShell
      title="Segmentos"
      subtitle="Audiencias inteligentes basadas en comportamiento, consumo y engagement"
      actions={
        <>
          <Button intent="secondary" size="sm">Importar segmento</Button>
          <Button intent="primary"   size="sm" leftIcon={<Plus size={12} />}>Nuevo segmento</Button>
        </>
      }
    >
      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          icon={<PieChart size={18} />}
          title="Segmentos activos"
          description="Audiencias configuradas con reglas dinámicas y actualización automática."
          metric="12"
          metricLabel="segmentos en uso"
          accent
          badge="Live"
          delay={0.05}
        />
        <PlaceholderCard
          icon={<Users size={18} />}
          title="Cobertura total"
          description="Porcentaje de fans incluidos en al menos un segmento activo."
          metric="94.2%"
          metricLabel="de 147.8K fans"
          delay={0.1}
        />
        <PlaceholderCard
          icon={<Target size={18} />}
          title="Precisión de targeting"
          description="Score promedio de conversión en campañas segmentadas vs. masivas."
          metric="3.7x"
          metricLabel="mayor conversión"
          delay={0.15}
        />
      </div>

      {/* Segments breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Segment list */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F0F0F8]">Distribución de audiencias</h3>
              <p className="text-xs text-[#55556A] mt-0.5">147,832 fans totales segmentados</p>
            </div>
            <Sparkles size={14} className="text-[#FF2D55]" />
          </div>
          <div className="p-6 space-y-5">
            {segments.map((seg, i) => (
              <motion.div
                key={seg.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + i * 0.07 }}
                className="group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-sm font-semibold text-[#F0F0F8]">{seg.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#55556A]">{seg.count} fans</span>
                    <span className="text-xs font-bold text-[#F0F0F8]">{seg.pct}%</span>
                    <ArrowRight size={12} className="text-[#55556A] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: seg.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${seg.bar}%` }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 + i * 0.07 }}
                  />
                </div>
                <p className="text-[11px] text-[#55556A] mt-1">{seg.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Smart rules */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6">
          <h3 className="text-sm font-semibold text-[#F0F0F8] mb-1">Reglas inteligentes</h3>
          <p className="text-xs text-[#55556A] mb-5">Condiciones activas de segmentación dinámica</p>
          <div className="space-y-3">
            {[
              { rule: "Gasto anual > $3,000", fans: "8,750", color: "#FF2D55" },
              { rule: "Engagement ≥ 85%", fans: "14,200", color: "#3B82F6" },
              { rule: "Asistencia > 20 partidos", fans: "22,100", color: "#00D4A8" },
              { rule: "Sin actividad > 90 días", fans: "9,400", color: "#F59E0B" },
              { rule: "Merch compras > 5", fans: "11,800", color: "#8888AA" },
            ].map((r, i) => (
              <motion.div
                key={r.rule}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.06 }}
                className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: r.color }} />
                  <span className="text-xs text-[#8888AA]">{r.rule}</span>
                </div>
                <span className="text-xs font-bold text-[#F0F0F8]">{r.fans}</span>
              </motion.div>
            ))}
          </div>
          <Button intent="outline" size="sm" className="mt-4 w-full">
            + Crear nueva regla
          </Button>
        </div>
      </motion.div>

      {/* Opportunities */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={14} className="text-[#00D4A8]" />
          <h3 className="text-sm font-semibold text-[#F0F0F8]">Oportunidades de upgrade detectadas</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Casual → Core", count: "4,200", revenue: "+$180K est." },
            { label: "Core → Premium", count: "2,800", revenue: "+$420K est." },
            { label: "Premium → VIP", count: "890", revenue: "+$310K est." },
            { label: "Churn en riesgo", count: "1,150", revenue: "Retener $95K" },
          ].map((opp, i) => (
            <motion.div
              key={opp.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.06 }}
              className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-[#FF2D55]/20 transition-colors cursor-pointer group"
            >
              <p className="text-xs text-[#55556A] mb-2">{opp.label}</p>
              <p className="text-xl font-black text-[#F0F0F8]">{opp.count}</p>
              <p className="text-[10px] text-[#00D4A8] mt-1">{opp.revenue}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </PageShell>
  );
}

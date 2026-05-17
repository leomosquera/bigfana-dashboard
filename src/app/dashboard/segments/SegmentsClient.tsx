"use client";

import { motion } from "framer-motion";
import { PieChart, Users, Target, Sparkles, ArrowRight, TrendingUp, Plus } from "lucide-react";
import { PageShell, PlaceholderCard } from "@/components/ui/PageShell";
import { Button } from "@/components/ui/Button";
import type {
  SegmentStat,
  UpgradeOpportunity,
  OrgEngagementKPIs,
} from "@/server/queries/engagement-intelligence";
import type { FanSegmentRule } from "@/db/schema";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SegmentsClientProps {
  distribution:  SegmentStat[];
  opportunities: UpgradeOpportunity[];
  segmentRules:  FanSegmentRule[];
  kpis:          OrgEngagementKPIs;
}

// ─── Segment bar ──────────────────────────────────────────────────────────────

function SegmentBar({
  stat,
  index,
}: {
  stat:  SegmentStat;
  index: number;
}) {
  const color    = stat.color ?? "#8888AA";
  const name     = stat.segmentName ?? "Sin segmento";
  const barWidth = Math.max(stat.pct, 0.5);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.25 + index * 0.07 }}
      className="group cursor-pointer"
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
          <span className="text-sm font-semibold text-[#F0F0F8]">{name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#55556A]">{stat.fanCount.toLocaleString("es")} fans</span>
          <span className="text-xs font-bold text-[#F0F0F8]">{stat.pct}%</span>
          <ArrowRight size={12} className="text-[#55556A] opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${barWidth}%` }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.3 + index * 0.07 }}
        />
      </div>
    </motion.div>
  );
}

// ─── Client component ─────────────────────────────────────────────────────────

export function SegmentsClient({
  distribution,
  opportunities,
  segmentRules,
  kpis,
}: SegmentsClientProps) {
  const totalSegmented = distribution
    .filter((s) => s.segmentName !== null)
    .reduce((sum, s) => sum + s.fanCount, 0);

  const coveragePct = kpis.totalActiveFans > 0
    ? Math.round((totalSegmented / kpis.totalActiveFans) * 100 * 10) / 10
    : 0;

  const sortedDist = [...distribution].sort((a, b) => b.fanCount - a.fanCount);

  return (
    <PageShell
      title="Segmentos"
      subtitle="Audiencias basadas en comportamiento, nivel y actividad real del hincha"
      actions={
        <>
          <Button intent="secondary" size="sm">Importar segmento</Button>
          <Button intent="primary"   size="sm" leftIcon={<Plus size={12} />}>Nueva regla</Button>
        </>
      }
    >
      {/* Top cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          icon={<PieChart size={18} />}
          title="Reglas de segmentación"
          description="Reglas activas con condiciones dinámicas que clasifican fans automáticamente."
          metric={String(segmentRules.filter((r) => r.isActive).length)}
          metricLabel="reglas activas"
          accent
          badge="Live"
          delay={0.05}
        />
        <PlaceholderCard
          icon={<Users size={18} />}
          title="Fans segmentados"
          description="Fans con un segmento asignado actualmente según las reglas configuradas."
          metric={`${coveragePct}%`}
          metricLabel={`de ${kpis.totalActiveFans.toLocaleString("es")} fans activos`}
          delay={0.1}
        />
        <PlaceholderCard
          icon={<Target size={18} />}
          title="Oportunidades de upgrade"
          description="Fans cerca del umbral del siguiente nivel de engagement."
          metric={String(opportunities.reduce((s, o) => s + o.fanCount, 0))}
          metricLabel="fans cerca del próximo nivel"
          delay={0.15}
        />
      </div>

      {/* Distribution + rules */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-4"
      >
        {/* Segment distribution */}
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden">
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F0F0F8]">Distribución de audiencias</h3>
              <p className="text-xs text-[#55556A] mt-0.5">
                {kpis.totalActiveFans.toLocaleString("es")} fans activos · clasificados por reglas del EIL
              </p>
            </div>
            <Sparkles size={14} className="text-[#FF2D55]" />
          </div>

          <div className="p-6 space-y-5">
            {sortedDist.length === 0 ? (
              <p className="text-sm text-[#55556A] text-center py-6">
                Sin datos de segmentación aún. Ejecutá el proceso de recomputación.
              </p>
            ) : (
              sortedDist.map((stat, i) => (
                <SegmentBar key={stat.segmentName ?? "__null__"} stat={stat} index={i} />
              ))
            )}
          </div>
        </div>

        {/* Active rules panel */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6">
          <h3 className="text-sm font-semibold text-[#F0F0F8] mb-1">Reglas activas</h3>
          <p className="text-xs text-[#55556A] mb-5">
            Segmentos definidos por condiciones de comportamiento y puntos
          </p>
          <div className="space-y-2">
            {[...segmentRules]
              .filter((r) => r.isActive)
              .sort((a, b) => b.priority - a.priority)
              .map((rule, i) => {
                const fanStat = distribution.find((s) => s.segmentName === rule.name);
                return (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: rule.color ?? "#8888AA" }}
                      />
                      <span className="text-xs text-[#8888AA] truncate">{rule.name}</span>
                    </div>
                    <span className="text-xs font-bold text-[#F0F0F8] shrink-0 ml-2">
                      {(fanStat?.fanCount ?? 0).toLocaleString("es")}
                    </span>
                  </motion.div>
                );
              })}
          </div>
          <Button intent="outline" size="sm" className="mt-4 w-full">
            + Crear nueva regla
          </Button>
        </div>
      </motion.div>

      {/* Upgrade opportunities */}
      {opportunities.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-[#00D4A8]" />
            <h3 className="text-sm font-semibold text-[#F0F0F8]">
              Oportunidades de upgrade detectadas
            </h3>
            <span className="text-xs text-[#55556A]">
              — fans dentro de 150 pts del siguiente nivel
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {opportunities.map((opp, i) => (
              <motion.div
                key={`${opp.fromLevelName}-${opp.toLevelName}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.06 }}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-[#FF2D55]/20 transition-colors cursor-pointer group"
              >
                <p className="text-xs text-[#55556A] mb-2">
                  {opp.fromLevelName ?? "Sin nivel"} → {opp.toLevelName}
                </p>
                <p className="text-xl font-black text-[#F0F0F8]">
                  {opp.fanCount.toLocaleString("es")}
                </p>
                <p
                  className="text-[10px] mt-1 font-semibold"
                  style={{ color: opp.toColor ?? "#00D4A8" }}
                >
                  ≤{opp.pointsNeeded} pts para subir
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Future capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          icon={<PieChart size={18} />}
          title="Constructor de segmentos"
          description="Creá segmentos con condiciones combinadas: nivel, puntos, tipos de evento, inactividad y datos demográficos."
          badge="Próximamente"
          delay={0.4}
        />
        <PlaceholderCard
          icon={<Target size={18} />}
          title="Audiencias predictivas"
          description="Segmentos calculados por modelos de churn, upgrade y probabilidad de compra basados en comportamiento histórico."
          badge="Próximamente"
          delay={0.45}
        />
        <PlaceholderCard
          icon={<TrendingUp size={18} />}
          title="Targeting de sponsors"
          description="Asigná sponsors a segmentos por afinidad de marca: bebidas, indumentaria, familia, premium, youth."
          badge="Próximamente"
          delay={0.5}
        />
      </div>
    </PageShell>
  );
}

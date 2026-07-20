"use client";

import { motion } from "framer-motion";
import { Trophy, Flame, Zap, Gift, Target, Plus } from "lucide-react";
import { PageShell, PlaceholderCard } from "@/components/ui/PageShell";
import { Button } from "@/components/ui/Button";
import { FanLevelBadge } from "@/components/gamification/FanLevelBadge";
import type { FanLevel } from "@/db/schema";
import type {
  LeaderboardEntry,
} from "@/server/queries/gamification";
import type {
  OrgEngagementKPIs,
  LevelTierStat,
} from "@/server/queries/engagement-intelligence";

// ─── Props ────────────────────────────────────────────────────────────────────

interface GamificationClientProps {
  leaderboard: LeaderboardEntry[];
  kpis:        OrgEngagementKPIs;
  breakdown:   LevelTierStat[];
  orgLevels:   FanLevel[];
}

// ─── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderboardRow({
  entry,
  orgLevels,
  index,
}: {
  entry:     LeaderboardEntry;
  orgLevels: FanLevel[];
  index:     number;
}) {
  const rankColors = [
    { bg: "bg-[#F59E0B]/20", text: "text-[#F59E0B]" },
    { bg: "bg-[#8888AA]/20", text: "text-[#8888AA]" },
    { bg: "bg-amber-800/20", text: "text-amber-600" },
  ];
  const rankStyle = rankColors[index] ?? { bg: "bg-white/[0.04]", text: "text-[#55556A]" };

  const initials = [entry.firstName, entry.lastName]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join("") || entry.displayName?.[0]?.toUpperCase() || "?";

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: 0.25 + index * 0.06 }}
      className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
    >
      {/* Rank */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-black ${rankStyle.bg} ${rankStyle.text}`}
      >
        {entry.rank}
      </div>

      {/* Avatar */}
      <div className="w-7 h-7 rounded-lg bg-[#FF2D55]/10 border border-[#FF2D55]/20 flex items-center justify-center shrink-0">
        <span className="text-[9px] font-bold text-[#FF2D55]">{initials}</span>
      </div>

      {/* Name + level */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F0F0F8] truncate">{entry.displayName}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <FanLevelBadge score={entry.engagementScore} levels={orgLevels} size="xs" />
        </div>
      </div>

      {/* Score */}
      <div className="text-right shrink-0">
        <p className="text-sm font-black text-[#FF2D55] tabular-nums">
          {entry.engagementScore.toLocaleString("es")}
        </p>
        <p className="text-[10px] text-[#55556A]">pts</p>
      </div>
    </motion.div>
  );
}

// ─── Level distribution ───────────────────────────────────────────────────────

function LevelDistribution({ breakdown }: { breakdown: LevelTierStat[] }) {
  // Show real tiers (exclude __unleveled__ sentinel)
  const tiers = breakdown.filter((t) => t.levelId !== "__unleveled__");
  const sorted = [...tiers].sort((a, b) => b.sortOrder - a.sortOrder);

  return (
    <div className="space-y-3">
      {sorted.map((tier, i) => (
        <motion.div
          key={tier.levelId}
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.3 + i * 0.06 }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold" style={{ color: tier.color ?? "#8888AA" }}>
              {tier.levelName}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#55556A]">{tier.fanCount.toLocaleString("es")} fans</span>
              <span className="text-xs font-bold text-[#F0F0F8]">{tier.pct}%</span>
            </div>
          </div>
          <div className="h-2 bg-white/[0.04] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: tier.color ?? "#8888AA" }}
              initial={{ width: 0 }}
              animate={{ width: `${tier.pct}%` }}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 + i * 0.06 }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Client component ─────────────────────────────────────────────────────────

export function GamificationClient({
  leaderboard,
  kpis,
  breakdown,
  orgLevels,
}: GamificationClientProps) {
  const pct = kpis.totalActiveFans > 0
    ? Math.round((kpis.fansWithPoints / kpis.totalActiveFans) * 100 * 10) / 10
    : 0;

  return (
    <PageShell
      title="Gamificación"
      subtitle="Sistema de puntos, niveles y ranking de engagement del hincha"
      actions={
        <>
          <Button intent="secondary" size="sm">Configurar niveles</Button>
          <Button intent="primary"   size="sm" leftIcon={<Plus size={12} />}>Nuevo desafío</Button>
        </>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          icon={<Zap size={18} />}
          title="Fans con puntos"
          description="Fans que acumularon al menos 1 punto en el sistema de engagement."
          metric={kpis.fansWithPoints.toLocaleString("es")}
          metricLabel={`${pct}% del total`}
          accent
          delay={0.05}
        />
        <PlaceholderCard
          icon={<Flame size={18} />}
          title="Puntos emitidos"
          description="Total de puntos distribuidos desde el inicio del programa."
          metric={kpis.totalPointsEmitted >= 1000
            ? `${(kpis.totalPointsEmitted / 1000).toFixed(1)}K`
            : kpis.totalPointsEmitted.toLocaleString("es")}
          metricLabel="puntos acumulados"
          delay={0.1}
        />
        <PlaceholderCard
          icon={<Gift size={18} />}
          title="Score promedio"
          description="Puntos de engagement promedio por fan activo en la organización."
          metric={kpis.avgScore.toLocaleString("es")}
          metricLabel="pts promedio por fan"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Real leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F0F0F8]">Ranking de fans</h3>
              <p className="text-xs text-[#55556A] mt-0.5">Top {leaderboard.length} por puntos acumulados</p>
            </div>
            <Trophy size={14} className="text-[#F59E0B]" />
          </div>

          {leaderboard.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-sm font-semibold text-[#8888AA]">Sin fans con puntos aún</p>
              <p className="text-xs text-[#55556A] mt-1">
                Asigná puntos a los fans para ver el ranking.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {leaderboard.map((entry, i) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  orgLevels={orgLevels}
                  index={i}
                />
              ))}
            </div>
          )}

          <div className="px-6 py-3 border-t border-white/[0.04]">
            <Button intent="ghost" size="xs" className="text-[#FF2D55] hover:text-[#FF6B6B]">
              Ver ranking completo →
            </Button>
          </div>
        </motion.div>

        {/* Level distribution */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F0F0F8]">Distribución por nivel</h3>
              <p className="text-xs text-[#55556A] mt-0.5">
                {kpis.totalActiveFans.toLocaleString("es")} fans activos · niveles configurados
              </p>
            </div>
            <Target size={14} className="text-[#FF2D55]" />
          </div>
          <div className="p-6">
            {breakdown.length === 0 ? (
              <p className="text-sm text-[#55556A] text-center py-6">
                Sin niveles configurados para esta organización.
              </p>
            ) : (
              <LevelDistribution breakdown={breakdown} />
            )}
          </div>

          {/* Level tier legend */}
          {orgLevels.length > 0 && (
            <div className="px-6 pb-5 pt-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-[#55556A] mb-2.5">
                Niveles del programa
              </p>
              <div className="flex flex-wrap gap-2">
                {[...orgLevels].sort((a, b) => b.minPoints - a.minPoints).map((level) => (
                  <div
                    key={level.id}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-semibold"
                    style={{
                      color:       level.color ?? "#8888AA",
                      background:  `${level.color ?? "#8888AA"}10`,
                      borderColor: `${level.color ?? "#8888AA"}25`,
                    }}
                  >
                    <span>{level.name}</span>
                    <span className="text-[#55556A] font-normal">
                      {level.minPoints.toLocaleString("es")}+
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Challenges placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          icon={<Zap size={18} />}
          title="Desafíos y misiones"
          description="Crea desafíos configurables que otorgan puntos al completarse: asistencia a partidos, compras, trivia, predicciones."
          badge="Próximamente"
          delay={0.4}
        />
        <PlaceholderCard
          icon={<Gift size={18} />}
          title="Tienda de recompensas"
          description="Los fans canjean puntos por entradas, merchandising, experiencias VIP y ofertas de sponsors."
          badge="Próximamente"
          delay={0.45}
        />
        <PlaceholderCard
          icon={<Trophy size={18} />}
          title="Logros y badges"
          description="Sistema de insignias desbloqueables por hitos: primera asistencia, racha de partidos, comprador frecuente, embajador digital."
          badge="Próximamente"
          delay={0.5}
        />
      </div>
    </PageShell>
  );
}

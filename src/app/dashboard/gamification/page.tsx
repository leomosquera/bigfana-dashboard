"use client";

import { motion } from "framer-motion";
import { Gamepad2, Trophy, Star, Flame, Crown, Zap, Gift, Medal } from "lucide-react";
import { PageShell, PlaceholderCard } from "@/components/ui/PageShell";

const leaderboard = [
  { rank: 1, name: "Carlos Mendoza", points: 48200, level: "Leyenda", streak: 42, badge: "👑" },
  { rank: 2, name: "Valentina Ríos", points: 41800, level: "Elite", streak: 38, badge: "🔥" },
  { rank: 3, name: "Diego Torres", points: 38500, level: "Elite", streak: 28, badge: "⚡" },
  { rank: 4, name: "Ana García", points: 29100, level: "Gold", streak: 22, badge: "⭐" },
  { rank: 5, name: "Facundo López", points: 22400, level: "Gold", streak: 18, badge: "🎯" },
  { rank: 6, name: "Sofía Méndez", points: 17800, level: "Silver", streak: 12, badge: "🏅" },
];

const challenges = [
  { title: "Hat-trick de asistencias", desc: "Asistí a 3 partidos seguidos", points: "+500 XP", progress: 66, icon: "🎫" },
  { title: "Embajador Digital", desc: "Compartí 10 posts del club", points: "+200 XP", progress: 80, icon: "📱" },
  { title: "Comprador VIP", desc: "Compra en la tienda oficial", points: "+150 XP", progress: 100, icon: "🛒" },
  { title: "Predictor Experto", desc: "Acertá 5 resultados seguidos", points: "+300 XP", progress: 40, icon: "🎯" },
];

const badges = [
  { name: "Fundador", desc: "Fan desde el inicio", color: "#FF2D55", icon: "🏆", owners: "234" },
  { name: "Racha de Fuego", desc: "30+ partidos seguidos", color: "#F59E0B", icon: "🔥", owners: "1,240" },
  { name: "Merch King", desc: "10+ compras en tienda", color: "#3B82F6", icon: "👕", owners: "8,400" },
  { name: "Digital Fan", desc: "Activo en todas las plataformas", color: "#00D4A8", icon: "📱", owners: "22,100" },
  { name: "Predictor", desc: "Acertó 10 resultados", color: "#8B5CF6", icon: "🎯", owners: "5,800" },
  { name: "Familia", desc: "Pack familiar activo", color: "#EC4899", icon: "👨‍👩‍👧", owners: "3,200" },
];

export default function GamificationPage() {
  return (
    <PageShell
      title="Gamificación"
      subtitle="Sistema de puntos, desafíos, badges y ranking para maximizar el engagement del hincha"
      actions={
        <>
          <button className="h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs text-[#8888AA] hover:text-[#F0F0F8] transition-colors">
            Configurar reglas
          </button>
          <button className="h-8 px-4 rounded-lg bg-[#FF2D55] text-white text-xs font-semibold hover:bg-[#CC1F3F] transition-colors">
            + Nuevo desafío
          </button>
        </>
      }
    >
      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          icon={<Gamepad2 size={18} />}
          title="Fans con cuenta activa"
          description="Fans que han interactuado con el sistema de puntos en los últimos 30 días."
          metric="89,400"
          metricLabel="60.5% del total"
          accent
          delay={0.05}
        />
        <PlaceholderCard
          icon={<Flame size={18} />}
          title="Puntos emitidos"
          description="Total de XP distribuidos en partidos, compras, redes y predicciones este mes."
          metric="4.2M"
          metricLabel="puntos este mes"
          delay={0.1}
        />
        <PlaceholderCard
          icon={<Gift size={18} />}
          title="Premios canjeados"
          description="Recompensas entregadas: entradas, merch, meet & greet y experiencias VIP."
          metric="1,840"
          metricLabel="canjes este mes"
          delay={0.15}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F0F0F8]">Ranking Global</h3>
              <p className="text-xs text-[#55556A] mt-0.5">Top fans por XP acumulado · temporada</p>
            </div>
            <Trophy size={14} className="text-[#F59E0B]" />
          </div>
          <div className="divide-y divide-white/[0.03]">
            {leaderboard.map((fan, i) => (
              <motion.div
                key={fan.rank}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.25 + i * 0.06 }}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-sm font-black ${
                  fan.rank === 1 ? "bg-[#F59E0B]/20 text-[#F59E0B]" :
                  fan.rank === 2 ? "bg-[#8888AA]/20 text-[#8888AA]" :
                  fan.rank === 3 ? "bg-amber-800/20 text-amber-600" :
                  "bg-white/[0.04] text-[#55556A]"
                }`}>
                  {fan.rank}
                </div>
                <span className="text-lg">{fan.badge}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#F0F0F8] truncate">{fan.name}</p>
                  <p className="text-[10px] text-[#55556A]">{fan.level} · 🔥 Streak {fan.streak}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-[#FF2D55]">{fan.points.toLocaleString()}</p>
                  <p className="text-[10px] text-[#55556A]">XP</p>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="px-6 py-3 border-t border-white/[0.04]">
            <button className="text-xs text-[#FF2D55] hover:text-[#FF6B6B] transition-colors">
              Ver ranking completo →
            </button>
          </div>
        </motion.div>

        {/* Challenges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#F0F0F8]">Desafíos activos</h3>
              <p className="text-xs text-[#55556A] mt-0.5">Misiones con mayor participación</p>
            </div>
            <Zap size={14} className="text-[#FF2D55]" />
          </div>
          <div className="p-6 space-y-4">
            {challenges.map((ch, i) => (
              <motion.div
                key={ch.title}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors cursor-pointer"
              >
                <span className="text-xl shrink-0">{ch.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-semibold text-[#F0F0F8]">{ch.title}</p>
                    <span className="text-[10px] font-bold text-[#00D4A8] shrink-0">{ch.points}</span>
                  </div>
                  <p className="text-xs text-[#55556A] mb-2">{ch.desc}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B6B]"
                        initial={{ width: 0 }}
                        animate={{ width: `${ch.progress}%` }}
                        transition={{ duration: 0.7, ease: "easeOut", delay: 0.35 + i * 0.07 }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-[#55556A] w-8 text-right">{ch.progress}%</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Badges */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-[#F0F0F8]">Biblioteca de badges</h3>
            <p className="text-xs text-[#55556A] mt-0.5">Insignias desbloqueables por logros en el club</p>
          </div>
          <Medal size={14} className="text-[#FF2D55]" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
              className="flex flex-col items-center text-center p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.10] transition-all cursor-pointer group"
            >
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl mb-2 group-hover:scale-110 transition-transform"
                style={{ background: `${badge.color}15`, border: `1px solid ${badge.color}30` }}
              >
                {badge.icon}
              </div>
              <p className="text-xs font-bold text-[#F0F0F8] mb-0.5">{badge.name}</p>
              <p className="text-[10px] text-[#55556A] leading-snug mb-1">{badge.desc}</p>
              <p className="text-[10px] font-semibold" style={{ color: badge.color }}>{badge.owners} fans</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </PageShell>
  );
}

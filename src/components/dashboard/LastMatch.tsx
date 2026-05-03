"use client";

import { motion } from "framer-motion";
import { MapPin, Users, Smartphone, Zap, ShoppingBag, HelpCircle, Trophy } from "lucide-react";
import { lastMatch } from "@/lib/mock-data";
import { Badge } from "@/components/ui/Badge";

function ScoreBlock() {
  const { homeTeam, awayTeam } = lastMatch;
  return (
    <div className="flex items-center justify-center gap-6 py-6">
      {/* Home */}
      <div className="flex flex-col items-center gap-2 flex-1">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF2D55] to-[#CC1F3F] flex items-center justify-center text-white font-black text-sm glow-brand-sm">
          {homeTeam.abbr}
        </div>
        <p className="text-xs font-semibold text-[#8888AA] text-center leading-tight">{homeTeam.name}</p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3">
        <span className="text-5xl font-black text-[#F0F0F8] tabular-nums">{homeTeam.score}</span>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[#55556A] text-lg font-light">–</span>
          <span className="text-[10px] font-semibold text-[#55556A] bg-white/[0.04] px-1.5 py-0.5 rounded">FT</span>
        </div>
        <span className="text-5xl font-black text-[#55556A] tabular-nums">{awayTeam.score}</span>
      </div>

      {/* Away */}
      <div className="flex flex-col items-center gap-2 flex-1">
        <div className="w-12 h-12 rounded-2xl bg-[#1C1C2A] border border-white/[0.08] flex items-center justify-center text-[#8888AA] font-black text-sm">
          {awayTeam.abbr}
        </div>
        <p className="text-xs font-semibold text-[#8888AA] text-center leading-tight">{awayTeam.name}</p>
      </div>
    </div>
  );
}

function MatchTimeline() {
  return (
    <div className="flex items-center gap-1 justify-center flex-wrap">
      {lastMatch.highlights.map((h, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.08 }}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold border ${
            h.team === "home"
              ? "bg-[#FF2D55]/10 border-[#FF2D55]/20 text-[#FF2D55]"
              : "bg-white/[0.04] border-white/[0.06] text-[#55556A]"
          }`}
        >
          <span>⚽</span>
          <span>{h.minute}&apos;</span>
          <span className="hidden sm:inline">{h.player}</span>
        </motion.div>
      ))}
    </div>
  );
}

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}

function StatPill({ icon, label, value, sub, highlight }: StatPillProps) {
  return (
    <div className={`flex flex-col gap-1 p-3 rounded-xl border ${
      highlight
        ? "bg-[#FF2D55]/[0.06] border-[#FF2D55]/15"
        : "bg-white/[0.02] border-white/[0.05]"
    }`}>
      <div className="flex items-center gap-1.5">
        <span className={highlight ? "text-[#FF2D55]" : "text-[#55556A]"}>{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#55556A]">{label}</span>
      </div>
      <p className={`text-base font-black ${highlight ? "text-[#FF2D55]" : "text-[#F0F0F8]"}`}>{value}</p>
      {sub && <p className="text-[10px] text-[#55556A]">{sub}</p>}
    </div>
  );
}

export function LastMatch() {
  const m = lastMatch;
  const attendancePct = m.attendance.pct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.25 }}
      className="relative rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden"
    >
      {/* Top glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-[#FF2D55]/[0.08] blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-0">
        <div className="flex items-center gap-2">
          <Trophy size={13} className="text-[#FF2D55]" />
          <span className="text-[11px] font-semibold text-[#55556A]">{m.competition}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="brand">{m.date}</Badge>
          <div className="flex items-center gap-1 text-[#55556A]">
            <MapPin size={11} />
            <span className="text-[10px]">{m.stadium}</span>
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="relative z-10 px-5">
        <ScoreBlock />
        <MatchTimeline />
      </div>

      {/* Divider */}
      <div className="mx-5 my-4 h-px bg-white/[0.05]" />

      {/* Stats grid */}
      <div className="relative z-10 px-5 pb-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatPill
          icon={<Users size={12} />}
          label="Asistentes"
          value={m.attendance.value.toLocaleString("es-AR")}
          sub={`${attendancePct}% del estadio`}
          highlight
        />
        <StatPill
          icon={<Smartphone size={12} />}
          label="Check-ins"
          value={m.checkins.value.toLocaleString("es-AR")}
          sub={`${m.checkins.pct}% de asistentes`}
        />
        <StatPill
          icon={<Zap size={12} />}
          label="Puntos XP"
          value={m.pointsAwarded.toLocaleString("es-AR")}
          sub="entregados en el partido"
        />
        <StatPill
          icon={<Zap size={12} />}
          label="Sponsor Top"
          value={m.topSponsor.name}
          sub={`${m.topSponsor.activations} activaciones`}
        />
        <StatPill
          icon={<ShoppingBag size={12} />}
          label="Producto Top"
          value={m.topProduct.revenue}
          sub={`${m.topProduct.units.toLocaleString()} unidades`}
        />
        <StatPill
          icon={<HelpCircle size={12} />}
          label="Trivia"
          value={`${m.trivia.participants.toLocaleString("es-AR")}`}
          sub={`${m.trivia.correct}% acierto`}
        />
      </div>

      {/* Attendance bar */}
      <div className="relative z-10 px-5 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#55556A]">Ocupación del estadio</span>
          <span className="text-[10px] font-bold text-[#00D4A8]">{attendancePct}%</span>
        </div>
        <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B6B]"
            initial={{ width: 0 }}
            animate={{ width: `${attendancePct}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
}

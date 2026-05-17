"use client";

import { motion } from "framer-motion";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Star,
  Ticket,
  Gift,
  Megaphone,
  Trophy,
  ChevronRight,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FanLevel } from "@/db/schema";
import type {
  BehavioralProfile,
  EngagementVelocity,
  EligibleExperience,
} from "@/server/queries/engagement-intelligence";

// ─── Props ────────────────────────────────────────────────────────────────────

interface FanIntelligencePanelProps {
  behavioral:      BehavioralProfile;
  velocity:        EngagementVelocity;
  experiences:     EligibleExperience[];
  orgLevels:       FanLevel[];
  engagementScore: number;
  segment:         string | null;
}

// ─── Experience type config ───────────────────────────────────────────────────

const EXPERIENCE_TYPE_CONFIG: Record<string, {
  label: string;
  icon:  React.ReactNode;
  color: string;
}> = {
  vip_access:    { label: "Acceso VIP",    icon: <Star    size={11} />, color: "#FF2D55" },
  reward:        { label: "Recompensa",    icon: <Gift    size={11} />, color: "#C97B2E" },
  campaign:      { label: "Campaña",       icon: <Megaphone size={11} />, color: "#3B82F6" },
  challenge:     { label: "Desafío",       icon: <Target  size={11} />, color: "#00D4A8" },
  content:       { label: "Contenido",     icon: <Trophy  size={11} />, color: "#8888AA" },
  sponsor_offer: { label: "Oferta Sponsor",icon: <Ticket  size={11} />, color: "#F59E0B" },
};

function getExperienceConfig(type: string) {
  return EXPERIENCE_TYPE_CONFIG[type] ?? {
    label: type,
    icon:  <Star size={11} />,
    color: "#8888AA",
  };
}

// ─── Event type labels ────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<string, string> = {
  match_attended:       "Asistencia a partido",
  purchase:             "Compra en tienda",
  trivia_correct:       "Trivia correcta",
  trivia_answered:      "Trivia respondida",
  prediction_submitted: "Predicción enviada",
  prediction_won:       "Predicción ganada",
  raffle_joined:        "Sorteo participado",
  daily_checkin:        "Check-in diario",
  content_shared:       "Contenido compartido",
  badge_earned:         "Badge desbloqueado",
  login:                "Inicio de sesión",
  manual_award:         "Premio manual",
  admin_deduction:      "Deducción admin",
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  match_attended:       "#FF2D55",
  purchase:             "#3B82F6",
  trivia_correct:       "#00D4A8",
  trivia_answered:      "#8888AA",
  prediction_submitted: "#C97B2E",
  prediction_won:       "#00D4A8",
  raffle_joined:        "#3B82F6",
  daily_checkin:        "#00D4A8",
  content_shared:       "#8888AA",
  badge_earned:         "#FF2D55",
  login:                "#55556A",
};

function eventLabel(type: string) {
  return EVENT_TYPE_LABELS[type] ?? type.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
function eventColor(type: string) {
  return EVENT_TYPE_COLORS[type] ?? "#55556A";
}

// ─── Velocity indicator ───────────────────────────────────────────────────────

function VelocityIndicator({ trend }: { trend: EngagementVelocity["trend"] }) {
  const config = {
    accelerating: {
      icon:  <TrendingUp size={12} />,
      label: "Acelerando",
      color: "#00D4A8",
      bg:    "bg-[#00D4A8]/[0.08]",
      border:"border-[#00D4A8]/20",
    },
    stable: {
      icon:  <Minus size={12} />,
      label: "Estable",
      color: "#8888AA",
      bg:    "bg-white/[0.04]",
      border:"border-white/[0.08]",
    },
    dormant: {
      icon:  <TrendingDown size={12} />,
      label: "Inactivo",
      color: "#C97B2E",
      bg:    "bg-[#C97B2E]/[0.08]",
      border:"border-[#C97B2E]/20",
    },
  }[trend];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border",
        config.bg,
        config.border,
      )}
      style={{ color: config.color }}
    >
      {config.icon}
      {config.label}
    </span>
  );
}

// ─── Level progress bar ───────────────────────────────────────────────────────

function LevelProgress({
  score,
  orgLevels,
}: {
  score:     number;
  orgLevels: FanLevel[];
}) {
  if (!orgLevels.length) return null;

  const sorted = [...orgLevels].sort((a, b) => a.minPoints - b.minPoints);

  // Find current level index
  let currentIdx = -1;
  for (let i = 0; i < sorted.length; i++) {
    if (score >= sorted[i].minPoints) currentIdx = i;
  }

  const current = currentIdx >= 0 ? sorted[currentIdx] : null;
  const next    = sorted[currentIdx + 1] ?? null;

  if (!next) {
    // Already at top tier
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#55556A]">Nivel máximo alcanzado</p>
          <span className="text-[10px] font-bold" style={{ color: current?.color ?? "#8888AA" }}>
            {current?.name}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-gradient-to-r from-[#FF2D55] to-[#FF6B6B]" />
      </div>
    );
  }

  const fromScore = current ? current.minPoints : 0;
  const toScore   = next.minPoints;
  const pct       = Math.min(
    Math.round(((score - fromScore) / (toScore - fromScore)) * 100),
    100,
  );
  const remaining = toScore - score;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[#55556A]">
          Próximo nivel
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="text-[10px] font-semibold"
            style={{ color: current?.color ?? "#8888AA" }}
          >
            {current?.name ?? "Sin nivel"}
          </span>
          <ChevronRight size={9} className="text-[#55556A]" />
          <span
            className="text-[10px] font-bold"
            style={{ color: next.color ?? "#8888AA" }}
          >
            {next.name}
          </span>
        </div>
      </div>

      <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: next.color ?? "#8888AA" }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-[#55556A] tabular-nums">{pct}% completado</p>
        <p className="text-[10px] text-[#55556A] tabular-nums">
          Faltan <span className="font-semibold text-[#8888AA]">{remaining.toLocaleString("es")}</span> pts
        </p>
      </div>
    </div>
  );
}

// ─── Behavioral fingerprint ───────────────────────────────────────────────────

function BehavioralFingerprint({
  profile,
}: {
  profile: BehavioralProfile;
}) {
  if (!profile.totalEvents) {
    return (
      <div className="flex flex-col items-center py-6 gap-2">
        <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.05] flex items-center justify-center">
          <Activity size={14} className="text-[#55556A]" />
        </div>
        <p className="text-xs text-[#55556A]">Sin actividad registrada</p>
      </div>
    );
  }

  const maxCount = Math.max(...profile.topEventTypes.map((e) => e.count), 1);

  return (
    <div className="space-y-2">
      {profile.topEventTypes.map((item, i) => {
        const color = eventColor(item.eventType);
        const pct   = Math.round((item.count / maxCount) * 100);

        return (
          <motion.div
            key={item.eventType}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2, delay: i * 0.06 }}
            className="flex items-center gap-2.5"
          >
            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="text-[10px] text-[#C8C8E0] truncate">{eventLabel(item.eventType)}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  {item.points > 0 && (
                    <span className="text-[9px] font-semibold text-[#00D4A8]">
                      +{item.points.toLocaleString("es")} pts
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-[#8888AA] tabular-nums w-4 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
              <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: i * 0.06 }}
                />
              </div>
            </div>
          </motion.div>
        );
      })}

      <div className="pt-1 flex items-center justify-between">
        <p className="text-[10px] text-[#55556A]">{profile.totalEvents} eventos totales</p>
        {profile.daysSinceLast !== null && (
          <p className="text-[10px] text-[#55556A]">
            Último hace{" "}
            <span className={cn(
              "font-semibold",
              profile.daysSinceLast > 30 ? "text-[#C97B2E]" : "text-[#8888AA]",
            )}>
              {profile.daysSinceLast === 0 ? "hoy" : `${profile.daysSinceLast}d`}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Experience list ──────────────────────────────────────────────────────────

function ExperienceList({
  experiences,
  segment,
}: {
  experiences: EligibleExperience[];
  segment:     string | null;
}) {
  if (!experiences.length) {
    return (
      <p className="text-xs text-[#55556A] py-4 text-center">
        Sin experiencias asignadas para este segmento.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {experiences.map((exp, i) => {
        const cfg = getExperienceConfig(exp.type);
        return (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: i * 0.07 }}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl",
              "bg-white/[0.02] border border-white/[0.05]",
              "hover:border-white/[0.09] transition-colors",
            )}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{
                background:   `${cfg.color}15`,
                border:       `1px solid ${cfg.color}30`,
                color:        cfg.color,
              }}
            >
              {cfg.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold text-[#C8C8E0] leading-snug">
                  {exp.title}
                </p>
                <span
                  className="shrink-0 text-[9px] font-bold px-1.5 py-px rounded-full border"
                  style={{
                    color:            cfg.color,
                    background:       `${cfg.color}10`,
                    borderColor:      `${cfg.color}25`,
                  }}
                >
                  {cfg.label}
                </span>
              </div>
              {exp.description && (
                <p className="text-[10px] text-[#55556A] mt-0.5 leading-snug">
                  {exp.description}
                </p>
              )}
              {exp.sponsorAffinity.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {exp.sponsorAffinity.map((tag) => (
                    <span
                      key={tag}
                      className="text-[8px] px-1.5 py-px rounded-full bg-white/[0.04] border border-white/[0.06] text-[#55556A] font-medium uppercase tracking-wider"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── Segment badge ────────────────────────────────────────────────────────────

function SegmentBadge({
  segment,
  segmentColor,
}: {
  segment:      string | null;
  segmentColor: string | null;
}) {
  if (!segment) {
    return (
      <span className="text-[10px] font-semibold text-[#55556A] italic">
        Sin segmento
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border"
      style={{
        color:       segmentColor ?? "#8888AA",
        background:  `${segmentColor ?? "#8888AA"}12`,
        borderColor: `${segmentColor ?? "#8888AA"}30`,
      }}
    >
      {segment}
    </span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ label }: { label: string }) {
  return (
    <p className="text-[9px] font-bold uppercase tracking-widest text-[#55556A] px-0.5 mb-2">
      {label}
    </p>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

export function FanIntelligencePanel({
  behavioral,
  velocity,
  experiences,
  orgLevels,
  engagementScore,
  segment,
}: FanIntelligencePanelProps) {
  // Find segment color from experiences (first experience has it)
  const segmentColor = experiences[0]?.segmentColor ?? null;

  return (
    <div className="space-y-5">

      {/* ── Segment + velocity row ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02] border border-white/[0.05]"
      >
        <div className="flex items-center gap-2">
          <Zap size={11} className="text-[#55556A]" />
          <p className="text-[10px] text-[#55556A] font-medium">Segmento</p>
          <SegmentBadge segment={segment} segmentColor={segmentColor} />
        </div>
        <VelocityIndicator trend={velocity.trend} />
      </motion.div>

      {/* ── Velocity stats ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.04 }}
        className="grid grid-cols-2 gap-2"
      >
        {[
          {
            label: "Puntos 30 días",
            value: velocity.points30d.toLocaleString("es"),
            sub:   `${velocity.events30d} movimientos`,
          },
          {
            label: "Puntos 7 días",
            value: velocity.points7d.toLocaleString("es"),
            sub:   `${velocity.events7d} movimientos`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          >
            <p className="text-[9px] font-semibold uppercase tracking-wider text-[#55556A]">
              {stat.label}
            </p>
            <p className="text-sm font-bold text-[#F0F0F8] mt-1 tabular-nums">
              {stat.value}
            </p>
            <p className="text-[9px] text-[#55556A] mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Level progress ────────────────────────────────────────────── */}
      {orgLevels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.08 }}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
        >
          <SectionLabel label="Progreso al siguiente nivel" />
          <LevelProgress score={engagementScore} orgLevels={orgLevels} />
        </motion.div>
      )}

      {/* ── Behavioral fingerprint ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.12 }}
        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
      >
        <SectionLabel label="Huella comportamental" />
        <BehavioralFingerprint profile={behavioral} />
      </motion.div>

      {/* ── Eligible experiences ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, delay: 0.16 }}
      >
        <SectionLabel label={`Experiencias habilitadas · ${experiences.length}`} />
        <ExperienceList experiences={experiences} segment={segment} />
      </motion.div>

    </div>
  );
}

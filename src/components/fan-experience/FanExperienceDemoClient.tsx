"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Gift,
  Layers,
  Megaphone,
  Sparkles,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import type { BadgeVariant } from "@/components/ui/Badge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";
import { Inline, Stack, Surface } from "@/components/ui/primitives";
import type {
  DemoCampaignAccent,
  DemoEngagementTier,
  DemoFanPersona,
} from "@/lib/fan-experience-demo-data";
import { FAN_EXPERIENCE_DEMO_PERSONAS } from "@/lib/fan-experience-demo-data";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

function engagementBarClasses(tier: DemoEngagementTier): string {
  switch (tier) {
    case "low":
      return "bg-white/[0.22]";
    case "medium":
      return "bg-blue-400/90";
    case "high":
      return "bg-[#FF2D55]";
    case "extreme":
      return "bg-[#FF2D55] shadow-[0_0_24px_rgba(255,45,85,0.45)]";
    default:
      return "bg-white/[0.22]";
  }
}

function campaignAccentClasses(accent: DemoCampaignAccent): string {
  switch (accent) {
    case "brand":
      return "border-[#FF2D55]/25 bg-gradient-to-br from-[#FF2D55]/[0.07] to-transparent";
    case "success":
      return "border-[#00D4A8]/20 bg-gradient-to-br from-[#00D4A8]/[0.06] to-transparent";
    default:
      return "border-white/[0.06] bg-[#0D0D14]";
  }
}

function levelBadgeVariant(rank: number): BadgeVariant {
  if (rank >= 4) return "vip";
  if (rank >= 3) return "premium";
  if (rank >= 2) return "core";
  return "casual";
}

function formatPercent(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(n / 100);
}

function DemoPhoneExperience({ persona }: { persona: DemoFanPersona }) {
  const progressPct = persona.rewards.progress
    ? Math.min(100, Math.round((persona.rewards.progress.current / persona.rewards.progress.target) * 100))
    : null;

  return (
    <motion.div
      key={persona.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.28 }}
      className="flex flex-col min-h-0"
    >
      {/* Status strip */}
      <Inline justify="between" className="px-1 pb-3 opacity-70">
        <span className="text-[10px] font-semibold text-[#55556A]">09:41</span>
        <span className="text-[10px] font-semibold text-[#55556A]">River ID · demo</span>
      </Inline>

      <Stack gap={4} className="flex-1 min-h-0 overflow-y-auto pr-1 -mr-1">
        <Stack gap={2}>
          <Inline justify="between" align="center">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[#55556A]">
              Club
            </span>
            <Badge variant={levelBadgeVariant(persona.levelRank)}>{persona.levelLabel}</Badge>
          </Inline>
          <h2 className="text-lg font-bold text-[#F0F0F8] leading-tight tracking-tight">
            {persona.greeting}
          </h2>
          <p className="text-xs text-[#8888AA] leading-relaxed">{persona.heroTagline}</p>
        </Stack>

        {/* Engagement */}
        <Surface variant="inset" radius="lg" className="p-3">
          <Inline justify="between" align="center" className="mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
              Engagement
            </span>
            <span className="text-xs font-bold text-[#F0F0F8] tabular-nums">
              {formatPercent(persona.engagementPercent)}
            </span>
          </Inline>
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className={cn("h-full rounded-full", engagementBarClasses(persona.engagementTier))}
              initial={{ width: 0 }}
              animate={{ width: `${persona.engagementPercent}%` }}
              transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        </Surface>

        {/* Sponsor affinity */}
        <Stack gap={2}>
          <Inline gap={2} align="center">
            <Target size={14} className="text-[#8888AA] shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
              Afinidad sponsor
            </span>
          </Inline>
          <div className="flex flex-wrap gap-2">
            {persona.sponsorAffinity.map((s) => (
              <span
                key={s.name}
                className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[#F0F0F8]"
              >
                <span className="text-[#55556A]">{s.category}</span>
                <span className="mx-1.5 text-white/[0.08]">·</span>
                {s.name}
              </span>
            ))}
          </div>
        </Stack>

        {/* Campaigns */}
        <Stack gap={2}>
          <Inline gap={2} align="center">
            <Megaphone size={14} className="text-[#8888AA] shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
              Campañas para vos
            </span>
          </Inline>
          <Stack gap={2}>
            {persona.campaigns.map((c) => (
              <Surface
                key={c.title}
                variant="base"
                radius="lg"
                noBorder={false}
                className={cn("p-3 border", campaignAccentClasses(c.accent))}
              >
                <Inline justify="between" align="start" className="gap-2 mb-1">
                  <p className="text-sm font-semibold text-[#F0F0F8] leading-snug">{c.title}</p>
                  {c.urgency && (
                    <span className="text-[9px] font-bold uppercase tracking-wide text-[#FF2D55]/90 whitespace-nowrap shrink-0">
                      {c.urgency}
                    </span>
                  )}
                </Inline>
                <p className="text-[11px] text-[#8888AA] leading-relaxed mb-3">{c.subtitle}</p>
                <Button
                  intent="outline"
                  size="xs"
                  className="w-full pointer-events-none"
                  rightIcon={<ChevronRight size={12} className="opacity-60" />}
                >
                  {c.cta}
                </Button>
              </Surface>
            ))}
          </Stack>
        </Stack>

        {/* Rewards */}
        <Surface variant={persona.rewards.unlocked ? "brand" : "inset"} radius="lg" className="p-3">
          <Inline gap={2} align="center" className="mb-2">
            <Gift size={14} className={persona.rewards.unlocked ? "text-[#FF2D55]" : "text-[#8888AA]"} />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
              Recompensas
            </span>
            <Badge variant={persona.rewards.unlocked ? "brand" : "ghost"} className="ml-auto">
              {persona.rewards.tierLabel}
            </Badge>
          </Inline>
          <p className="text-sm font-semibold text-[#F0F0F8]">{persona.rewards.headline}</p>
          <p className="text-[11px] text-[#8888AA] mt-1 leading-relaxed">{persona.rewards.detail}</p>
          {progressPct !== null && persona.rewards.progress && (
            <div className="mt-3">
              <Inline justify="between" className="mb-1">
                <span className="text-[10px] text-[#55556A]">Progreso</span>
                <span className="text-[10px] font-mono text-[#F0F0F8]">
                  {persona.rewards.progress.current.toLocaleString("es-AR")}
                  {" / "}
                  {persona.rewards.progress.target.toLocaleString("es-AR")}
                </span>
              </Inline>
              <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#FF2D55]/80"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          )}
        </Surface>

        {/* Experiences */}
        <Stack gap={2}>
          <Inline gap={2} align="center">
            <Sparkles size={14} className="text-[#8888AA] shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
              Experiencias
            </span>
          </Inline>
          <Stack gap={2}>
            {persona.experiences.map((ex) => (
              <Surface key={ex.title} variant="inset" radius="lg" className="p-3">
                <p className="text-xs font-semibold text-[#F0F0F8]">{ex.title}</p>
                <p className="text-[11px] text-[#55556A] mt-1 leading-relaxed">{ex.description}</p>
              </Surface>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </motion.div>
  );
}

function PersonaPicker({
  personas,
  selectedId,
  onSelect,
}: {
  personas: DemoFanPersona[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Stack gap={2}>
      {personas.map((p) => {
        const active = p.id === selectedId;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={cn(
              "text-left rounded-xl border transition-all duration-200 px-3 py-3",
              active
                ? "border-[#FF2D55]/35 bg-[#FF2D55]/[0.06] shadow-[0_0_20px_rgba(255,45,85,0.08)]"
                : "border-white/[0.06] bg-[#0D0D14]/80 hover:bg-white/[0.03] hover:border-white/[0.08]"
            )}
          >
            <Inline gap={3} align="center">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0",
                  active
                    ? "bg-[#FF2D55]/20 text-[#FF2D55]"
                    : "bg-white/[0.05] text-[#F0F0F8]"
                )}
              >
                {p.initials}
              </div>
              <Stack gap={0} className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-[#F0F0F8] truncate">{p.displayName}</span>
                <span className="text-[11px] text-[#55556A] truncate">{p.segmentLabel}</span>
                <Inline gap={1} className="mt-1 flex-wrap">
                  <Badge variant={levelBadgeVariant(p.levelRank)}>{p.levelLabel}</Badge>
                  <Badge variant="ghost">{formatPercent(p.engagementPercent)}</Badge>
                </Inline>
              </Stack>
            </Inline>
          </button>
        );
      })}
    </Stack>
  );
}

function DimensionPanel({ persona }: { persona: DemoFanPersona }) {
  const rows = useMemo(
    () => [
      {
        icon: <Trophy size={14} />,
        label: "Nivel",
        value: persona.levelLabel,
      },
      {
        icon: <Layers size={14} />,
        label: "Segmento",
        value: persona.segmentLabel,
      },
      {
        icon: <Users size={14} />,
        label: "Engagement",
        value: formatPercent(persona.engagementPercent),
      },
      {
        icon: <Target size={14} />,
        label: "Sponsors priorizados",
        value: persona.sponsorAffinity.map((s) => s.name).join(" · "),
      },
      {
        icon: <Megaphone size={14} />,
        label: "Campañas activas",
        value: persona.campaigns.map((c) => c.title).join(" · "),
      },
      {
        icon: <Gift size={14} />,
        label: "Recompensas",
        value: persona.rewards.headline,
      },
      {
        icon: <Sparkles size={14} />,
        label: "Experiencias",
        value: persona.experiences.map((e) => e.title).join(" · "),
      },
    ],
    [persona]
  );

  return (
    <Card className="overflow-hidden">
      <Card.Header
        title="Señales de personalización"
        description="Misma capa de experiencia, distinta composición por perfil."
        icon={<Sparkles size={16} />}
      />
      <Card.Content className="pt-0 space-y-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={persona.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {rows.map((row) => (
              <div key={row.label} className="flex gap-3 py-3 first:pt-0">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 text-[#8888AA]">
                  {row.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
                    {row.label}
                  </p>
                  <p className="text-xs text-[#F0F0F8] mt-0.5 leading-relaxed">{row.value}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </AnimatePresence>
      </Card.Content>
    </Card>
  );
}

export function FanExperienceDemoClient() {
  const [selectedId, setSelectedId] = useState(FAN_EXPERIENCE_DEMO_PERSONAS[0]?.id ?? "");
  const persona =
    FAN_EXPERIENCE_DEMO_PERSONAS.find((p) => p.id === selectedId) ?? FAN_EXPERIENCE_DEMO_PERSONAS[0];

  if (!persona) return null;

  return (
    <PageShell
      title="Experiencia fan · Demo"
      subtitle="Capa storytelling — mismos componentes, distinta narrativa por nivel, segmento, engagement y afinidad."
      actions={
        <Badge variant="warning" className="hidden sm:inline-flex">
          Demo · no producción
        </Badge>
      }
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="grid grid-cols-1 xl:grid-cols-[minmax(220px,260px)_minmax(320px,380px)_1fr] gap-6 items-start"
      >
        <Stack gap={3}>
          <Surface variant="elevated" radius="xl" className="p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[#55556A] mb-3">
              Perfiles demo
            </p>
            <PersonaPicker
              personas={FAN_EXPERIENCE_DEMO_PERSONAS}
              selectedId={persona.id}
              onSelect={setSelectedId}
            />
          </Surface>
        </Stack>

        <Stack gap={3}>
          <Surface variant="glass" radius="3xl" className="p-4 sm:p-5 glow-brand-sm">
            <div className="rounded-[1.75rem] border border-white/[0.08] bg-[#06060A] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] p-4 min-h-[580px] flex flex-col">
              <AnimatePresence mode="wait">
                <DemoPhoneExperience persona={persona} />
              </AnimatePresence>
            </div>
            <p className="text-[10px] text-[#55556A] text-center mt-3">
              Vista tipo app — ilustrativa para demos comerciales.
            </p>
          </Surface>
        </Stack>

        <DimensionPanel persona={persona} />
      </motion.div>
    </PageShell>
  );
}

"use client";

import { motion } from "framer-motion";
import {
  Gift,
  Layers,
  Megaphone,
  Sparkles,
  Target,
  Trophy,
  TrendingUp,
} from "lucide-react";
import { Badge, LevelBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Inline, Stack, Surface } from "@/components/ui/primitives";
import type { DemoFanExperienceResponse } from "@/lib/demo-fan-api-contract";
import { fadeUpProps } from "@/lib/design-system/motion";
import { cn } from "@/lib/utils";

const nf = new Intl.NumberFormat("es-AR");

function trendLabel(t: DemoFanExperienceResponse["stats"]["velocityTrend"]): string {
  switch (t) {
    case "accelerating":
      return "Acelerando";
    case "dormant":
      return "Latente";
    default:
      return "Estable";
  }
}

function trendVariant(t: DemoFanExperienceResponse["stats"]["velocityTrend"]): "success" | "warning" | "ghost" {
  if (t === "accelerating") return "success";
  if (t === "dormant") return "warning";
  return "ghost";
}

export function FanExperiencePreviewPanel({
  data,
  emptyHint,
}: {
  data:        DemoFanExperienceResponse | null;
  emptyHint?: string;
}) {
  if (!data) {
    return (
      <Surface variant="inset" radius="lg" className="p-8 text-center min-h-[280px] flex flex-col justify-center">
        <p className="text-sm text-[#55556A]">{emptyHint ?? "Ejecutá la solicitud para ver la vista previa."}</p>
      </Surface>
    );
  }

  const { fan, segment, level, campaigns, experiences, sponsors, stats, intelligence } = data;

  const dtShort = new Intl.DateTimeFormat("es-AR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <Stack gap={4} className="min-h-0">
      <motion.div {...fadeUpProps(0)}>
        <Surface variant="base" radius="lg" className="p-4 border border-white/[0.06]">
          <Inline justify="between" align="start" className="gap-3 mb-3">
            <Stack gap={1}>
              <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
                Fan
              </span>
              <p className="text-lg font-bold text-[#F0F0F8] tracking-tight">{fan.displayName}</p>
              <p className="text-[11px] text-[#8888AA]">{fan.email ?? "Sin email"}</p>
            </Stack>
            <Stack gap={2} align="end">
              {level.current?.name ? (
                <LevelBadge level={level.current.name} />
              ) : (
                <Badge variant="ghost">Sin nivel</Badge>
              )}
              <Badge variant="info">{nf.format(fan.engagementScore)} pts</Badge>
            </Stack>
          </Inline>

          <div className="grid grid-cols-2 gap-2">
            <Surface variant="inset" radius="lg" className="p-3">
              <Inline gap={2} align="center" className="mb-1">
                <Layers size={14} className="text-[#8888AA]" />
                <span className="text-[10px] font-semibold uppercase text-[#55556A]">Segmento</span>
              </Inline>
              <p className="text-sm font-semibold text-[#F0F0F8]">{segment.key ?? "—"}</p>
              {segment.rule?.color && (
                <span
                  className="inline-block mt-2 h-2 w-8 rounded-full border border-white/[0.08]"
                  style={{ backgroundColor: segment.rule.color }}
                  aria-hidden
                />
              )}
            </Surface>

            <Surface variant="inset" radius="lg" className="p-3">
              <Inline gap={2} align="center" className="mb-1">
                <TrendingUp size={14} className="text-[#8888AA]" />
                <span className="text-[10px] font-semibold uppercase text-[#55556A]">Momentum</span>
              </Inline>
              <Badge variant={trendVariant(stats.velocityTrend)}>{trendLabel(stats.velocityTrend)}</Badge>
              <p className="text-[11px] text-[#8888AA] mt-2">
                {nf.format(stats.points30d)} pts · {nf.format(stats.events30d)} evt · 30d
              </p>
            </Surface>
          </div>

          {level.next && level.pointsToNextLevel !== null && (
            <p className="text-[11px] text-[#55556A] mt-3">
              Próximo nivel:{" "}
              <span className="text-[#F0F0F8] font-medium">{level.next.name}</span>
              {" · "}
              <span className="tabular-nums">{nf.format(level.pointsToNextLevel)} pts para subir</span>
            </p>
          )}
        </Surface>
      </motion.div>

      <motion.div {...fadeUpProps(0.05)}>
        <Card className="p-4 border border-white/[0.06] bg-[#0D0D14]/80">
          <Inline gap={2} align="center" className="mb-3">
            <Megaphone size={14} className="text-[#8888AA]" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
              Campañas activas
            </span>
            <Badge variant="ghost" className="ml-auto">
              {campaigns.length}
            </Badge>
          </Inline>
          {campaigns.length === 0 ? (
            <p className="text-xs text-[#55556A]">No hay campañas elegibles en este momento.</p>
          ) : (
            <Stack gap={2} className="max-h-[200px] overflow-y-auto pr-1">
              {campaigns.map((c) => (
                <Surface
                  key={c.id}
                  variant="inset"
                  radius="lg"
                  className={cn(
                    "p-3 border",
                    c.alreadyResponded ? "border-amber-500/15" : "border-white/[0.05]",
                  )}
                >
                  <Inline justify="between" align="start" className="gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F0F0F8] leading-snug truncate">{c.title}</p>
                      <p className="text-[10px] text-[#55556A] mt-0.5">{c.type}</p>
                    </div>
                    {c.alreadyResponded ? (
                      <Badge variant="warning">Respondida</Badge>
                    ) : (
                      <Badge variant="brand">{nf.format(c.pointsReward)} pts</Badge>
                    )}
                  </Inline>
                  <p className="text-[10px] text-[#55556A] mt-2 tabular-nums">
                    {dtShort.format(new Date(c.startsAt))} — {dtShort.format(new Date(c.endsAt))}
                  </p>
                  <p className="text-[10px] text-[#55556A] mt-1">
                    {c.questions.length} pregunta{c.questions.length === 1 ? "" : "s"} · {c.ctaLabel}
                  </p>
                </Surface>
              ))}
            </Stack>
          )}
        </Card>
      </motion.div>

      <motion.div {...fadeUpProps(0.1)}>
        <Card className="p-4 border border-white/[0.06] bg-[#0D0D14]/80">
          <Inline gap={2} align="center" className="mb-3">
            <Target size={14} className="text-[#8888AA]" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
              Sponsors · targeting
            </span>
            <Badge variant="ghost" className="ml-auto">
              {sponsors.length}
            </Badge>
          </Inline>
          {sponsors.length === 0 ? (
            <p className="text-xs text-[#55556A]">Sin creatividades activas para este perfil.</p>
          ) : (
            <Stack gap={2} className="max-h-[160px] overflow-y-auto pr-1">
              {sponsors.map((s) => (
                <Surface key={s.id} variant="inset" radius="lg" className="p-3 border border-white/[0.05]">
                  <p className="text-[10px] text-[#55556A]">{s.sponsorName}</p>
                  <p className="text-sm font-semibold text-[#F0F0F8]">{s.title}</p>
                  {s.description && (
                    <p className="text-[11px] text-[#8888AA] mt-1 line-clamp-2">{s.description}</p>
                  )}
                </Surface>
              ))}
            </Stack>
          )}
        </Card>
      </motion.div>

      <motion.div {...fadeUpProps(0.12)}>
        <Card className="p-4 border border-white/[0.06] bg-[#0D0D14]/80">
          <Inline gap={2} align="center" className="mb-3">
            <Gift size={14} className="text-[#8888AA]" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
              Experiencias & recompensas
            </span>
            <Badge variant="ghost" className="ml-auto">
              {experiences.length}
            </Badge>
          </Inline>
          {experiences.length === 0 ? (
            <p className="text-xs text-[#55556A]">No hay experiencias activas segmentadas.</p>
          ) : (
            <Stack gap={2} className="max-h-[220px] overflow-y-auto pr-1">
              {experiences.map((ex) => (
                <Surface key={ex.id} variant="inset" radius="lg" className="p-3 border border-white/[0.05]">
                  <Inline justify="between" align="start" className="gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#F0F0F8]">{ex.title}</p>
                      <p className="text-[10px] text-[#55556A]">{ex.type}</p>
                    </div>
                    {ex.segmentName && (
                      <Badge variant="ghost" className="shrink-0">
                        {ex.segmentName}
                      </Badge>
                    )}
                  </Inline>
                  {ex.description && (
                    <p className="text-[11px] text-[#8888AA] mb-2">{ex.description}</p>
                  )}
                  {ex.sponsorAffinity.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {ex.sponsorAffinity.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-[#F0F0F8]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </Surface>
              ))}
            </Stack>
          )}
        </Card>
      </motion.div>

      <motion.div {...fadeUpProps(0.15)}>
        <Surface variant="inset" radius="lg" className="p-4 border border-white/[0.06]">
          <Inline gap={2} align="center" className="mb-3">
            <Sparkles size={14} className="text-[#8888AA]" />
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#55556A]">
              Intelligence snapshot
            </span>
          </Inline>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Inline gap={1} align="center" className="mb-1">
                <Trophy size={12} className="text-[#55556A]" />
                <span className="text-[10px] text-[#55556A]">Activity score</span>
              </Inline>
              <p className="text-xl font-bold text-[#F0F0F8] tabular-nums">
                {nf.format(intelligence.behavioral.activityScore)}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-[#55556A] mb-1">Eventos totales</p>
              <p className="text-xl font-bold text-[#F0F0F8] tabular-nums">
                {nf.format(intelligence.behavioral.totalEvents)}
              </p>
            </div>
          </div>
          {intelligence.behavioral.topEventTypes.length > 0 && (
            <Stack gap={1} className="mt-3 pt-3 border-t border-white/[0.06]">
              <span className="text-[10px] uppercase text-[#55556A]">Top tipos</span>
              {intelligence.behavioral.topEventTypes.slice(0, 4).map((row) => (
                <Inline key={row.eventType} justify="between" className="text-[11px]">
                  <span className="text-[#8888AA] truncate mr-2">{row.eventType}</span>
                  <span className="text-[#F0F0F8] tabular-nums shrink-0">{nf.format(row.count)}</span>
                </Inline>
              ))}
            </Stack>
          )}
        </Surface>
      </motion.div>
    </Stack>
  );
}

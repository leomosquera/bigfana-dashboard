"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Globe2,
  Megaphone,
  PieChart,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
} from "lucide-react";
import { StatCard, Card } from "@/components/ui/Card";
import { PageShell } from "@/components/ui/PageShell";
import { FanGrowthChart } from "@/components/dashboard/FanGrowthChart";
import { ActivityVolumeChart } from "@/components/dashboard/ActivityVolumeChart";
import {
  formatEventTypeLabel,
  formatRelativeTimeEs,
} from "@/lib/dashboard-home-format";
import type { DashboardHomeSnapshot } from "@/server/queries/dashboard-home";
import type {
  OrgEngagementKPIs,
  SegmentStat,
} from "@/server/queries/engagement-intelligence";
import type { CampaignWithResponseStats } from "@/server/queries/campaigns";
import type { LeaderboardEntry } from "@/server/queries/gamification";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DashboardHomeClientProps {
  orgName: string;
  snapshot: DashboardHomeSnapshot;
  segments: SegmentStat[];
  campaigns: CampaignWithResponseStats[];
  gamificationKpis: OrgEngagementKPIs;
  leaderboard: LeaderboardEntry[];
}

// ─── Motion ───────────────────────────────────────────────────────────────────

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function formatCount(value: number): string {
  return value.toLocaleString("es-AR");
}

const WINDOW_PERIOD = "Últimos 30 días";

const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  active: "Activa",
  paused: "Pausada",
  finished: "Finalizada",
};

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1 pb-0.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B6B80]">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function EmptyBlock({
  message,
  hint,
  icon,
}: {
  message: string;
  hint?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="px-6 py-9 flex flex-col items-center justify-center text-center gap-1.5">
      {icon && (
        <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-1">
          {icon}
        </div>
      )}
      <p className="text-sm text-[#8888AA]">{message}</p>
      {hint && <p className="text-xs text-[#55556A] max-w-[260px]">{hint}</p>}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DashboardHomeClient({
  orgName,
  snapshot,
  segments,
  campaigns,
  gamificationKpis,
  leaderboard,
}: DashboardHomeClientProps) {
  const {
    kpis,
    recentActivity,
    windowDays,
    fanGrowth,
    activitySeries,
    geography,
    integrationHealth,
  } = snapshot;

  const kpiCards = [
    {
      key: "totalFans",
      label: "Fans totales",
      value: formatCount(kpis.totalFans),
      period: "Membresía PRIMARY",
      icon: <Users size={15} />,
      accent: true,
    },
    {
      key: "newFans",
      label: "Nuevos fans",
      value: formatCount(kpis.newFans),
      period: WINDOW_PERIOD,
      icon: <UserPlus size={15} />,
      accent: false,
    },
    {
      key: "engagedFans",
      label: "Fans con actividad",
      value: formatCount(kpis.engagedFans),
      period: WINDOW_PERIOD,
      icon: <Flame size={15} />,
      accent: false,
    },
    {
      key: "interactions",
      label: "Interacciones",
      value: formatCount(kpis.interactions),
      period: WINDOW_PERIOD,
      icon: <Activity size={15} />,
      accent: false,
    },
    {
      key: "activeCampaigns",
      label: "Campañas activas",
      value: formatCount(kpis.activeCampaigns),
      period: "Estado actual",
      icon: <Megaphone size={15} />,
      accent: false,
    },
    {
      key: "pointsIssued",
      label: "Puntos otorgados",
      value: formatCount(kpis.pointsIssued),
      period: WINDOW_PERIOD,
      icon: <Sparkles size={15} />,
      accent: false,
    },
  ];

  const topSegments = segments.slice(0, 5);
  const topCampaigns = [...campaigns]
    .sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1;
      if (b.status === "active" && a.status !== "active") return 1;
      return b.responseCount - a.responseCount;
    })
    .slice(0, 5);
  const campaignResponsesTotal = campaigns.reduce(
    (s, c) => s + c.responseCount,
    0,
  );

  const attentionLabel =
    integrationHealth.attention === "requires_attention"
      ? "Requiere atención"
      : integrationHealth.attention === "processing"
        ? "Procesando"
        : integrationHealth.attention === "pending"
          ? "Trabajos pendientes"
          : integrationHealth.attention === "operational"
            ? "Operativo"
            : "Sin trabajos";

  // Healthy = green; attention = amber; pending/processing/idle = neutral
  const attentionTone =
    integrationHealth.attention === "requires_attention"
      ? "text-[#F59E0B]"
      : integrationHealth.attention === "operational"
        ? "text-[#00D4A8]"
        : "text-[#8888AA]";

  return (
    <PageShell
      title="Command Center"
      subtitle={orgName}
      className="space-y-5"
      actions={
        <div className="flex items-center gap-2 px-3 h-8 rounded-lg border border-white/[0.06] bg-white/[0.03]">
          <span className="text-xs font-medium text-[#8888AA]">
            Últimos {windowDays} días
          </span>
        </div>
      }
    >
      {/* ── 1. KPI Grid ── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"
      >
        {kpiCards.map((kpi) => (
          <motion.div key={kpi.key} variants={item}>
            <StatCard
              dense
              label={kpi.label}
              value={kpi.value}
              period={kpi.period}
              icon={kpi.icon}
              accent={kpi.accent}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ── 2. Charts ── */}
      <SectionLabel label="Crecimiento e interacciones" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12 }}
        className="grid grid-cols-1 xl:grid-cols-2 gap-3"
      >
        <FanGrowthChart data={fanGrowth} windowDays={windowDays} />
        <ActivityVolumeChart data={activitySeries} windowDays={windowDays} />
      </motion.div>

      {/* ── 3. Segments + Campaigns ── */}
      <SectionLabel label="Audiencias y campañas" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.16 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch"
      >
        <Card className="overflow-hidden h-full flex flex-col">
          <Card.Header
            title="Segmentos"
            description="Distribución actual de fans PRIMARY"
            icon={<PieChart size={14} />}
            actions={
              <Link
                href="/dashboard/segments"
                className="text-[10px] text-[#FF2D55] hover:text-[#FF6B6B] transition-colors"
              >
                Ver todo →
              </Link>
            }
          />
          <Card.Content className="p-0 flex-1">
            {topSegments.length === 0 ? (
              <EmptyBlock
                icon={<PieChart size={15} className="text-[#55556A]" />}
                message="Sin datos de segmentación"
                hint="Los segmentos aparecerán cuando se clasifiquen fans."
              />
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {topSegments.map((seg) => {
                  const name = seg.segmentName ?? "Sin clasificar";
                  return (
                    <li
                      key={`${name}-${seg.fanCount}`}
                      className="flex items-center gap-3 px-5 py-2.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: seg.color ?? "#55556A" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F0F0F8] truncate">{name}</p>
                        <p className="text-[11px] text-[#55556A]">
                          {formatCount(seg.fanCount)} fans · {seg.pct}%
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card.Content>
        </Card>

        <Card className="overflow-hidden h-full flex flex-col">
          <Card.Header
            title="Campañas"
            description={`${formatCount(kpis.activeCampaigns)} activas · ${formatCount(campaignResponsesTotal)} respuestas`}
            icon={<Megaphone size={14} />}
            actions={
              <Link
                href="/dashboard/campaigns"
                className="text-[10px] text-[#FF2D55] hover:text-[#FF6B6B] transition-colors"
              >
                Ver todo →
              </Link>
            }
          />
          <Card.Content className="p-0 flex-1">
            {topCampaigns.length === 0 ? (
              <EmptyBlock
                icon={<Megaphone size={15} className="text-[#55556A]" />}
                message="Sin campañas"
                hint="Creá campañas para ver su rendimiento aquí."
              />
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {topCampaigns.map((c) => (
                  <li key={c.id} className="flex items-center gap-3 px-5 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#F0F0F8] truncate">{c.title}</p>
                      <p className="text-[11px] text-[#55556A]">
                        {CAMPAIGN_STATUS_LABEL[c.status] ?? c.status}
                        {" · "}
                        {c.type}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#F0F0F8] tabular-nums">
                        {formatCount(c.responseCount)}
                      </p>
                      <p className="text-[10px] text-[#55556A]">respuestas</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>
      </motion.div>

      {/* ── 4. Gamification + Integrations ── */}
      <SectionLabel label="Gamificación e integraciones" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch"
      >
        <Card className="overflow-hidden h-full flex flex-col">
          <Card.Header
            title="Gamificación"
            description="Snapshot de puntos y ranking"
            icon={<Trophy size={14} />}
            actions={
              <Link
                href="/dashboard/gamification"
                className="text-[10px] text-[#FF2D55] hover:text-[#FF6B6B] transition-colors"
              >
                Ver todo →
              </Link>
            }
          />
          <Card.Content className="space-y-3 flex-1">
            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] text-[#55556A]">Con puntos</p>
                <p className="text-base font-bold text-[#F0F0F8] mt-0.5 tabular-nums">
                  {formatCount(gamificationKpis.fansWithPoints)}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] text-[#55556A]">Puntos (total)</p>
                <p className="text-base font-bold text-[#F0F0F8] mt-0.5 tabular-nums">
                  {formatCount(gamificationKpis.totalPointsEmitted)}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                <p className="text-[10px] text-[#55556A]">Score medio</p>
                <p className="text-base font-bold text-[#F0F0F8] mt-0.5 tabular-nums">
                  {formatCount(gamificationKpis.avgScore)}
                </p>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <EmptyBlock
                icon={<Trophy size={15} className="text-[#55556A]" />}
                message="Ranking vacío"
                hint="Los fans con puntos aparecerán aquí."
              />
            ) : (
              <ul className="divide-y divide-white/[0.04] -mx-6">
                {leaderboard.slice(0, 5).map((entry) => (
                  <li
                    key={entry.id}
                    className="flex items-center gap-3 px-6 py-2"
                  >
                    <span className="w-6 text-xs font-bold text-[#55556A] tabular-nums">
                      #{entry.rank}
                    </span>
                    <p className="flex-1 text-sm text-[#F0F0F8] truncate">
                      {entry.displayName?.trim() ||
                        [entry.firstName, entry.lastName]
                          .filter(Boolean)
                          .join(" ") ||
                        "Fan"}
                    </p>
                    <p className="text-sm font-semibold text-[#FF2D55] tabular-nums">
                      {formatCount(entry.engagementScore)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card.Content>
        </Card>

        <Card className="overflow-hidden h-full flex flex-col">
          <Card.Header
            title="Estado de integraciones"
            description="Trabajos EEP de la organización"
            icon={
              integrationHealth.attention === "requires_attention" ? (
                <AlertTriangle size={14} />
              ) : integrationHealth.attention === "operational" ? (
                <CheckCircle2 size={14} />
              ) : (
                <Activity size={14} />
              )
            }
          />
          <Card.Content className="space-y-3 flex-1">
            <div className="flex items-center justify-between px-0.5">
              <p className="text-xs text-[#55556A]">Estado operativo</p>
              <p className={`text-sm font-semibold ${attentionTone}`}>
                {attentionLabel}
              </p>
            </div>

            {integrationHealth.total === 0 ? (
              <EmptyBlock
                icon={<CheckCircle2 size={15} className="text-[#55556A]" />}
                message="Sin trabajos de integración"
                hint="Los jobs EEP de la organización aparecerán aquí."
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {(
                  [
                    ["pending", "Pendientes"],
                    ["processing", "Procesando"],
                    ["synced", "Sincronizados"],
                    ["failed", "Fallidos"],
                    ["retrying", "Reintentando"],
                  ] as const
                ).map(([key, label]) => (
                  <div
                    key={key}
                    className="rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                  >
                    <p className="text-[10px] text-[#55556A]">{label}</p>
                    <p className="text-base font-bold text-[#F0F0F8] mt-0.5 tabular-nums">
                      {formatCount(integrationHealth.byStatus[key])}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card.Content>
        </Card>
      </motion.div>

      {/* ── 5. Geography ── */}
      <SectionLabel label="Inteligencia geográfica" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.24 }}
      >
        <Card className="overflow-hidden">
          <Card.Header
            title="Top países"
            description={
              geography.totalFans === 0
                ? "Sin fans PRIMARY"
                : `${formatCount(geography.knownGeographyCount)} de ${formatCount(geography.totalFans)} fans con ubicación conocida`
            }
            icon={<Globe2 size={14} />}
          />
          <Card.Content className="p-0">
            {geography.countries.length === 0 ? (
              <EmptyBlock
                icon={<Globe2 size={15} className="text-[#55556A]" />}
                message="Sin ubicación conocida"
                hint="Los países aparecerán cuando los fans tengan country_code."
              />
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {geography.countries.map((c) => (
                  <li
                    key={c.countryCode}
                    className="flex items-center gap-3 px-5 py-2.5"
                  >
                    <span className="text-[11px] font-mono text-[#6B6B80] w-7 shrink-0">
                      {c.countryCode}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#F0F0F8] truncate">
                        {c.label}
                      </p>
                      <div className="mt-1.5 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#3B82F6]/65"
                          style={{ width: `${Math.min(c.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0 pl-2">
                      <p className="text-sm font-semibold text-[#F0F0F8] tabular-nums">
                        {formatCount(c.fanCount)}
                      </p>
                      <p className="text-[10px] text-[#55556A]">
                        {c.percentage}% de conocidos
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {geography.unknownGeographyCount > 0 && (
              <p className="px-5 py-2.5 text-[11px] text-[#55556A] border-t border-white/[0.04]">
                Sin país: {formatCount(geography.unknownGeographyCount)} fans ·
                el % se calcula solo sobre fans con country_code conocido.
              </p>
            )}
          </Card.Content>
        </Card>
      </motion.div>

      {/* ── 6. Recent Activity ── */}
      <SectionLabel label="Operaciones" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.28 }}
      >
        <Card className="overflow-hidden">
          <Card.Header
            title="Actividad reciente"
            description="Eventos de fans de la organización (PRIMARY)"
          />
          <Card.Content className="p-0">
            {recentActivity.length === 0 ? (
              <EmptyBlock
                icon={<Activity size={15} className="text-[#55556A]" />}
                message="No hay actividad reciente"
                hint="Los eventos de fans aparecerán aquí cuando se registren."
              />
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {recentActivity.map((event, i) => {
                  const name = event.fanDisplayName ?? "Fan";
                  const typeLabel = formatEventTypeLabel(event.eventType);
                  const when = formatRelativeTimeEs(new Date(event.occurredAt));

                  return (
                    <motion.li
                      key={event.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.22, delay: 0.28 + i * 0.03 }}
                      className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                        <Activity size={12} className="text-[#6B6B80]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#F0F0F8] truncate">
                          <span className="font-medium">{name}</span>
                          <span className="text-[#55556A]"> — {typeLabel}</span>
                        </p>
                        {(event.source || event.points > 0) && (
                          <p className="text-[11px] text-[#55556A] mt-0.5 truncate">
                            {event.source}
                            {event.points > 0
                              ? `${event.source ? " · " : ""}${event.points.toLocaleString("es-AR")} pts`
                              : ""}
                          </p>
                        )}
                      </div>
                      <p className="text-[11px] text-[#55556A] shrink-0 tabular-nums">
                        {when}
                      </p>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </Card.Content>
        </Card>
      </motion.div>
    </PageShell>
  );
}

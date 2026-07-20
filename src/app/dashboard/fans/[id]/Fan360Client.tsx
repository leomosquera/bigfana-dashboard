"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Pencil,
  Trophy,
  Zap,
  Activity,
  Layers,
  Radio,
  Megaphone,
  Shield,
  Info,
} from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FanForm } from "@/components/fans/FanForm";
import { FanRowActions } from "@/components/fans/FanRowActions";
import { FanActivityTimeline } from "@/components/fans/FanActivityTimeline";
import { FanActivityTrendChart } from "@/components/fans/FanActivityTrendChart";
import { FanActivityBreakdown } from "@/components/fans/FanActivityBreakdown";
import { PointsTimeline } from "@/components/gamification/PointsTimeline";
import { FanLevelBadge } from "@/components/gamification/FanLevelBadge";
import { formatRelativeTimeEs } from "@/lib/dashboard-home-format";
import {
  FAN_STATUS_LABELS,
  formatFanEventTypeLabel,
  getEepSyncStatusLabel,
  getEepSyncStatusVariant,
  getLocalSegmentLabel,
  resolveFanCountryLabel,
} from "@/lib/fan-intelligence";
import { cn } from "@/lib/utils";
import type { Fan360Profile } from "@/server/queries/fan-intelligence";
import type { FanView } from "@/db/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateEs(date: Date | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const CAMPAIGN_TYPE_LABELS: Record<string, string> = {
  survey: "Encuesta",
  poll: "Poll",
  trivia: "Trivia",
  prediction: "Predicción",
  raffle: "Sorteo",
  reward: "Reward",
};

const CAMPAIGN_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  scheduled: "Programada",
  active: "Activa",
  paused: "Pausada",
  finished: "Finalizada",
};

/** Compact section chrome — denser than default Card.Header / Content. */
const sectionHeaderClass = "px-4 py-3";
const sectionContentClass = "px-4 py-3";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Fan360ClientProps {
  profile: Fan360Profile;
  orgName: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Fan360Client({ profile, orgName }: Fan360ClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);
  const [editingFan, setEditingFan] = useState<FanView | undefined>(undefined);

  const {
    fan,
    relationship,
    activity,
    gamification,
    segmentation,
    campaigns,
    eep,
    orgLevels,
  } = profile;

  const statusCfg = FAN_STATUS_LABELS[fan.status] ?? FAN_STATUS_LABELS.inactive;
  const countryLabel = resolveFanCountryLabel(fan.countryCode);
  const isFollowing = relationship.type === "FOLLOWING";
  const isArchived = fan.status === "archived";
  const fanName = fan.displayName ?? "Fan";

  const initials =
    [fan.firstName, fan.lastName]
      .filter(Boolean)
      .map((n) => n![0].toUpperCase())
      .join("") ||
    fan.displayName?.[0]?.toUpperCase() ||
    "?";

  const handleMutated = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router, startTransition]);

  function handleEdit(target: FanView) {
    setEditingFan(target);
    setFormOpen(true);
  }

  const activityScrollable = activity.events.length > 8;

  return (
    <PageShell
      className="space-y-5"
      title={
        <nav
          aria-label="Navegación Fan 360"
          className="flex items-center gap-1.5 text-sm min-w-0"
        >
          <Link
            href="/dashboard/fans"
            className="text-[#8888AA] hover:text-[#F0F0F8] transition-colors shrink-0 font-medium"
          >
            Fans
          </Link>
          <ChevronRight size={14} className="text-[#55556A] shrink-0" />
          <span className="text-[#F0F0F8] font-semibold truncate">{fanName}</span>
        </nav>
      }
      subtitle={
        <p className="text-xs text-[#55556A] truncate">
          {orgName} · Fan 360
        </p>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button
            intent="secondary"
            size="sm"
            leftIcon={<Pencil size={13} />}
            onClick={() => handleEdit(fan)}
          >
            Editar fan
          </Button>
          <FanRowActions
            fan={fan}
            onEdit={handleEdit}
            onMutated={handleMutated}
            hideProfileLinks
          />
        </div>
      }
    >
      <div className="space-y-5">
        {/* Status banners */}
        {(isArchived || isFollowing) && (
          <div className="flex flex-col gap-2">
            {isArchived && (
              <div className="rounded-xl border border-[#FF2D55]/25 bg-[#FF2D55]/[0.06] px-3.5 py-2.5 text-xs text-[#F0F0F8]">
                Este fan está <span className="font-semibold">Archivado</span>.
                El perfil se muestra en modo lectura operativa.
              </div>
            )}
            {isFollowing && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-xs text-[#8888AA]">
                Relación{" "}
                <span className="font-semibold text-[#C8C8E0]">FOLLOWING</span>.
                La lealtad y gamificación pertenecen a la organización primaria
                del fan (ADR-002).
              </div>
            )}
          </div>
        )}

        {/* A. Identity header — CRM fiche, not a KPI card */}
        <section className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.03] to-transparent px-4 py-4 sm:px-5 sm:py-4">
          <div className="flex items-start gap-3.5 sm:gap-4">
            <div className="relative shrink-0">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-[#FF2D55]/25 to-[#FF2D55]/5 border border-[#FF2D55]/25 flex items-center justify-center">
                <span className="text-base sm:text-lg font-black text-[#FF2D55]">
                  {initials}
                </span>
              </div>
              <div
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0D0D14]",
                  fan.status === "active"
                    ? "bg-[#00D4A8]"
                    : fan.status === "suspended"
                      ? "bg-amber-400"
                      : "bg-[#55556A]",
                )}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-[#F0F0F8] tracking-tight truncate">
                  {fanName}
                </h2>
                <Badge variant={statusCfg.variant} className="text-[10px]">
                  {statusCfg.label}
                </Badge>
                <Badge
                  variant={isFollowing ? "ghost" : "brand"}
                  className="text-[10px]"
                >
                  {relationship.type}
                </Badge>
                {gamification.eligible && gamification.level && (
                  <FanLevelBadge
                    score={gamification.score ?? 0}
                    levels={orgLevels}
                    size="sm"
                  />
                )}
              </div>

              <div className="flex items-center flex-wrap gap-x-3.5 gap-y-1">
                {fan.email && (
                  <span className="flex items-center gap-1.5 text-xs text-[#8888AA] min-w-0">
                    <Mail size={11} className="shrink-0 text-[#55556A]" />
                    <span className="truncate">{fan.email}</span>
                  </span>
                )}
                {fan.phone && (
                  <span className="flex items-center gap-1.5 text-xs text-[#8888AA]">
                    <Phone size={11} className="shrink-0 text-[#55556A]" />
                    {fan.phone}
                  </span>
                )}
                {(countryLabel || fan.city) && (
                  <span className="flex items-center gap-1.5 text-xs text-[#8888AA]">
                    <MapPin size={11} className="shrink-0 text-[#55556A]" />
                    {[fan.city, countryLabel].filter(Boolean).join(", ")}
                  </span>
                )}
                <span className="flex items-center gap-1.5 text-xs text-[#55556A]">
                  <Calendar size={11} className="shrink-0" />
                  Alta {formatDateEs(fan.createdAt)}
                  {relationship.joinedAt && (
                    <> · Relación {formatDateEs(relationship.joinedAt)}</>
                  )}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* B. KPI strip — equal card height via reserved period slot + stretch */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5 items-stretch">
          <StatCard
            dense
            reservePeriodSlot
            className="h-full"
            accent={gamification.eligible}
            label="Puntos actuales"
            value={
              gamification.eligible
                ? (gamification.score ?? 0).toLocaleString("es")
                : "N/A"
            }
            icon={<Zap size={15} />}
            period={gamification.eligible ? "Balance de lealtad" : "Solo PRIMARY"}
          />
          <StatCard
            dense
            reservePeriodSlot
            className="h-full"
            label="Nivel"
            value={
              gamification.eligible
                ? (gamification.level?.name ?? "Sin nivel")
                : "N/A"
            }
            icon={<Trophy size={15} />}
          />
          <StatCard
            dense
            reservePeriodSlot
            className="h-full"
            label="Interacciones 30d"
            value={activity.summary.interactionsLast30d.toLocaleString("es")}
            icon={<Activity size={15} />}
            period="fan_events · esta org"
          />
          <StatCard
            dense
            reservePeriodSlot
            className="h-full"
            label="Última actividad"
            value={
              activity.summary.lastActivityAt
                ? formatRelativeTimeEs(new Date(activity.summary.lastActivityAt))
                : "—"
            }
            icon={<Radio size={15} />}
            period={activity.recencyLabel}
          />
          <div className="col-span-2 md:col-span-1 min-w-0 h-full">
            <StatCard
              dense
              reservePeriodSlot
              className="h-full"
              label="Segmento BigFana"
              value={getLocalSegmentLabel(segmentation.localSegment)}
              icon={<Layers size={15} />}
            />
          </div>
        </div>

        {/* Main grid — independent column heights (items-start) */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)] gap-4 items-start">
          {/* LEFT: Activity + Campaigns */}
          <div className="space-y-4 min-w-0">
            {/* C. Activity Intelligence (F3A) */}
            <Card>
              <Card.Header
                className={sectionHeaderClass}
                title="Actividad"
                description={
                  activity.summary.totalInteractions > 0
                    ? `${activity.summary.totalInteractions.toLocaleString("es")} interacciones · esta organización`
                    : "Sin interacciones en esta organización"
                }
                icon={<Activity size={13} />}
              />
              <Card.Content className={cn(sectionContentClass, "space-y-4")}>
                {/* Summary metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      Totales
                    </p>
                    <p className="text-sm font-bold text-[#F0F0F8] tabular-nums mt-0.5">
                      {activity.summary.totalInteractions.toLocaleString("es")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      Últimos {activity.windowDays}d
                    </p>
                    <p className="text-sm font-bold text-[#F0F0F8] tabular-nums mt-0.5">
                      {activity.summary.interactionsLast30d.toLocaleString("es")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-2">
                    <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      Días activos
                    </p>
                    <p className="text-sm font-bold text-[#F0F0F8] tabular-nums mt-0.5">
                      {activity.summary.activeDaysLast30d.toLocaleString("es")}
                    </p>
                  </div>
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-2.5 py-2 min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      Tipo frecuente
                    </p>
                    <p className="text-xs font-semibold text-[#C8C8E0] mt-0.5 truncate">
                      {activity.summary.mostFrequentEventType
                        ? formatFanEventTypeLabel(
                            activity.summary.mostFrequentEventType,
                          )
                        : "Sin actividad"}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-[#8888AA] -mt-1">
                  {activity.recencyLabel}
                </p>

                {/* Trend 30d */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold mb-1.5">
                    Actividad — últimos {activity.windowDays} días
                  </p>
                  <FanActivityTrendChart
                    data={activity.trend}
                    windowDays={activity.windowDays}
                  />
                </div>

                {/* Breakdown */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold mb-1.5">
                    Actividad por tipo
                  </p>
                  <FanActivityBreakdown rows={activity.breakdown} />
                </div>

                {/* Timeline — fan_events only */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold mb-1.5">
                    Timeline reciente
                  </p>
                  <div
                    className={cn(
                      activityScrollable &&
                        "max-h-[280px] overflow-y-auto pr-1 -mr-1",
                    )}
                  >
                    <FanActivityTimeline
                      events={activity.events}
                      compact
                      showPoints={gamification.eligible}
                    />
                  </div>
                </div>
              </Card.Content>
            </Card>

            {/* F. Campaigns */}
            <Card>
              <Card.Header
                className={sectionHeaderClass}
                title="Participación en campañas"
                description={
                  campaigns.totalCampaigns > 0
                    ? `${campaigns.totalCampaigns.toLocaleString("es")} campañas · ${campaigns.responseCount.toLocaleString("es")} respuestas`
                    : undefined
                }
                icon={<Megaphone size={13} />}
              />
              <Card.Content className={sectionContentClass}>
                {campaigns.recent.length === 0 ? (
                  <p className="text-xs text-[#8888AA] py-1">
                    Este fan todavía no registra participación en campañas.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {campaigns.recent.map((item) => (
                      <li
                        key={item.campaignId}
                        className="flex items-start justify-between gap-3 rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#F0F0F8] truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-[#55556A] mt-0.5">
                            {CAMPAIGN_TYPE_LABELS[item.type] ?? item.type}
                            {" · "}
                            {CAMPAIGN_STATUS_LABELS[item.status] ?? item.status}
                            {" · "}
                            {formatDateEs(item.lastRespondedAt)}
                          </p>
                        </div>
                        {item.pointsAwarded > 0 && (
                          <span className="text-[10px] font-semibold text-[#00D4A8] tabular-nums shrink-0">
                            +{item.pointsAwarded.toLocaleString("es")} pts
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card.Content>
            </Card>
          </div>

          {/* RIGHT: Gamification, Segment, EEP, Identity */}
          <div className="space-y-4 min-w-0">
            {/* D. Gamification */}
            <Card>
              <Card.Header
                className={sectionHeaderClass}
                title="Gamificación"
                description={
                  gamification.eligible
                    ? "Lealtad de esta organización"
                    : "No aplica para FOLLOWING"
                }
                icon={<Trophy size={13} />}
              />
              <Card.Content className={sectionContentClass}>
                {gamification.eligible ? (
                  <div className="space-y-3">
                    {/* A. Resumen */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                          Balance actual
                        </p>
                        <p className="text-lg font-bold text-[#F0F0F8] tabular-nums leading-tight mt-0.5">
                          {(gamification.score ?? 0).toLocaleString("es")}{" "}
                          <span className="text-xs font-semibold text-[#8888AA]">
                            pts
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                          Nivel
                        </p>
                        {gamification.level ? (
                          <p
                            className="text-sm font-semibold mt-0.5"
                            style={{
                              color: gamification.level.color ?? "#8888AA",
                            }}
                          >
                            {gamification.level.name}
                          </p>
                        ) : (
                          <p className="text-xs text-[#55556A] mt-0.5">
                            Sin nivel
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Points earned 30d — ledger economy, not activity */}
                    <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] px-3 py-2 flex items-center justify-between gap-3">
                      <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                        Puntos obtenidos · 30d
                      </p>
                      <p className="text-sm font-bold text-[#00D4A8] tabular-nums">
                        {(gamification.velocity?.points30d ?? 0).toLocaleString(
                          "es",
                        )}
                      </p>
                    </div>

                    {/* B. Historial */}
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold mb-1.5 px-0.5">
                        Historial de movimientos
                      </p>
                      <div
                        className={cn(
                          gamification.ledger.length > 6 &&
                            "max-h-[280px] overflow-y-auto pr-1 -mr-1",
                        )}
                      >
                        <PointsTimeline
                          entries={gamification.ledger}
                          compact
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#8888AA] leading-relaxed">
                    Este fan sigue a la organización (FOLLOWING). Los puntos,
                    niveles y el ledger de lealtad pertenecen a su organización
                    primaria y no se muestran aquí para evitar una lectura
                    incorrecta.
                  </p>
                )}
              </Card.Content>
            </Card>

            {/* E. Local segment */}
            <Card>
              <Card.Header
                className={sectionHeaderClass}
                title="Segmento BigFana"
                description="Segmentación local (no EEP)"
                icon={<Layers size={13} />}
              />
              <Card.Content className={cn(sectionContentClass, "space-y-3")}>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={segmentation.localSegment ? "brand" : "ghost"}
                    className="text-[11px]"
                  >
                    {getLocalSegmentLabel(segmentation.localSegment)}
                  </Badge>
                </div>

                {segmentation.experiences.length > 0 ? (
                  <div className="space-y-1.5">
                    <p className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold flex items-center gap-1.5">
                      <Info size={10} />
                      Señales asociadas al segmento
                    </p>
                    <ul className="space-y-1">
                      {segmentation.experiences.slice(0, 5).map((exp) => (
                        <li
                          key={exp.id}
                          className="text-xs text-[#8888AA] flex items-start gap-2 rounded-lg px-2 py-1.5 bg-white/[0.015] border border-white/[0.04]"
                        >
                          <span className="mt-1.5 w-1 h-1 rounded-full bg-[#55556A] shrink-0" />
                          <span className="min-w-0">
                            <span className="text-[#C8C8E0] font-medium">
                              {exp.title}
                            </span>
                            {exp.type && (
                              <span className="text-[#55556A]">
                                {" "}
                                · {exp.type}
                              </span>
                            )}
                            {exp.description && (
                              <span className="block text-[10px] text-[#55556A] mt-0.5 leading-snug">
                                {exp.description}
                              </span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-xs text-[#55556A]">
                    Sin señales asociadas al segmento actual.
                  </p>
                )}
              </Card.Content>
            </Card>

            {/* G. EEP — secondary technical block */}
            <Card>
              <Card.Header
                className={sectionHeaderClass}
                title="Estado EEP"
                description="Sincronización de contacto"
                icon={<Radio size={13} />}
              />
              <Card.Content className={sectionContentClass}>
                <div className="flex items-center gap-2 mb-2.5">
                  <Badge variant={getEepSyncStatusVariant(eep.syncStatus)}>
                    {getEepSyncStatusLabel(eep.syncStatus)}
                  </Badge>
                </div>
                <dl className="grid grid-cols-1 gap-1.5 text-xs">
                  <div className="flex justify-between gap-3 items-baseline">
                    <dt className="text-[#55556A] shrink-0">ID EEP</dt>
                    <dd className="text-[#C8C8E0] font-mono text-[11px] truncate text-right">
                      {eep.contactId ?? "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 items-baseline">
                    <dt className="text-[#55556A] shrink-0">Última sync</dt>
                    <dd className="text-[#C8C8E0] text-right">
                      {eep.lastSyncAt
                        ? formatRelativeTimeEs(new Date(eep.lastSyncAt))
                        : "—"}
                    </dd>
                  </div>
                </dl>
                {(eep.syncStatus === "failed" ||
                  eep.syncStatus === "retrying") &&
                  eep.lastError && (
                    <div className="mt-2.5 rounded-lg border border-[#FF2D55]/20 bg-[#FF2D55]/[0.05] px-2.5 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-[#FF2D55]/80 font-semibold mb-0.5">
                        Detalle
                      </p>
                      <p className="text-[11px] text-[#C8C8E0] leading-relaxed break-words">
                        {eep.lastError}
                      </p>
                    </div>
                  )}
              </Card.Content>
            </Card>

            {/* H. Identity — compact metadata grid */}
            <Card>
              <Card.Header
                className={sectionHeaderClass}
                title="Identidad y contacto"
                icon={<Shield size={13} />}
              />
              <Card.Content className={sectionContentClass}>
                <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                  <div className="min-w-0 col-span-2 sm:col-span-1">
                    <dt className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      Email
                    </dt>
                    <dd className="text-[#C8C8E0] mt-0.5 truncate">
                      {fan.email ?? "—"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      Teléfono
                    </dt>
                    <dd className="text-[#C8C8E0] mt-0.5">
                      {fan.phone ?? "—"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      País
                    </dt>
                    <dd className="text-[#C8C8E0] mt-0.5">
                      {countryLabel ?? "—"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      Ciudad
                    </dt>
                    <dd className="text-[#C8C8E0] mt-0.5">
                      {fan.city ?? "—"}
                    </dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      Estado
                    </dt>
                    <dd className="text-[#C8C8E0] mt-0.5">{statusCfg.label}</dd>
                  </div>
                  <div className="min-w-0">
                    <dt className="text-[10px] uppercase tracking-wider text-[#55556A] font-semibold">
                      Alta
                    </dt>
                    <dd className="text-[#C8C8E0] mt-0.5">
                      {formatDateEs(fan.createdAt)}
                    </dd>
                  </div>
                </dl>
              </Card.Content>
            </Card>
          </div>
        </div>
      </div>

      <FanForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingFan(undefined);
        }}
        onSuccess={handleMutated}
        fan={editingFan}
      />
    </PageShell>
  );
}

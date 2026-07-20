"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Trophy,
  Zap,
  Activity,
  ExternalLink,
  Layers,
  Radio,
} from "lucide-react";
import { Drawer } from "@/components/feedback/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  FanLevelBadge,
  computeLevelForScore,
} from "@/components/gamification/FanLevelBadge";
import { getFanProfile } from "@/server/actions/fan-profile";
import { formatRelativeTimeEs } from "@/lib/dashboard-home-format";
import {
  FAN_STATUS_LABELS,
  getEepSyncStatusLabel,
  getEepSyncStatusVariant,
  getLocalSegmentLabel,
  isLoyaltyEligible,
  resolveFanCountryLabel,
  type FanRelationshipType,
} from "@/lib/fan-intelligence";
import { cn } from "@/lib/utils";
import type { FanView, FanLevel } from "@/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

interface QuickProfileSummary {
  eventsCount: number;
  lastActivityAt: Date | null;
  error: string | null;
}

// ─── Stat mini card ───────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 text-[#55556A]">
        {icon && <span className="shrink-0">{icon}</span>}
        <p className="text-[10px] font-semibold uppercase tracking-wider">
          {label}
        </p>
      </div>
      <div className="text-sm font-bold text-[#F0F0F8]">{value}</div>
    </div>
  );
}

// ─── Profile content ──────────────────────────────────────────────────────────

function FanProfileContent({
  fan,
  orgLevels,
  relationshipType,
}: {
  fan: FanView;
  orgLevels: FanLevel[];
  relationshipType: FanRelationshipType;
}) {
  const router = useRouter();
  const [summary, setSummary] = useState<QuickProfileSummary | null>(null);

  useEffect(() => {
    let cancelled = false;

    getFanProfile(fan.id).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setSummary({
          eventsCount: result.data.events.length,
          lastActivityAt: result.data.intelligence.behavioral.lastEventAt,
          error: null,
        });
      } else {
        setSummary({
          eventsCount: 0,
          lastActivityAt: null,
          error: result.error,
        });
      }
    });

    return () => {
      cancelled = true;
    };
    // Intentional: runs once per mount (keyed on fan.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = summary === null;
  const loyaltyEligible = isLoyaltyEligible(relationshipType);
  const level = loyaltyEligible
    ? computeLevelForScore(fan.engagementScore ?? 0, orgLevels)
    : null;
  const statusCfg = FAN_STATUS_LABELS[fan.status] ?? FAN_STATUS_LABELS.inactive;

  const initials =
    [fan.firstName, fan.lastName]
      .filter(Boolean)
      .map((n) => n![0].toUpperCase())
      .join("") ||
    fan.displayName?.[0]?.toUpperCase() ||
    "?";

  const countryLabel = resolveFanCountryLabel(fan.countryCode);
  const locationParts = [fan.city, countryLabel].filter(Boolean).join(", ");
  const memberSince = new Intl.DateTimeFormat("es", {
    month: "short",
    year: "numeric",
  }).format(new Date(fan.createdAt));

  return (
    <div className="space-y-5">
      {/* Identity */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start gap-4"
      >
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF2D55]/20 to-[#FF2D55]/5 border border-[#FF2D55]/20 flex items-center justify-center">
            <span className="text-lg font-black text-[#FF2D55]">{initials}</span>
          </div>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0D0D14]",
              fan.status === "active"
                ? "bg-[#00D4A8]"
                : fan.status === "suspended"
                  ? "bg-amber-400"
                  : "bg-[#55556A]",
            )}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#F0F0F8]">
              {fan.displayName}
            </h3>
            <Badge variant={statusCfg.variant} className="text-[10px]">
              {statusCfg.label}
            </Badge>
            <Badge
              variant={relationshipType === "FOLLOWING" ? "ghost" : "brand"}
              className="text-[10px]"
            >
              {relationshipType}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {loyaltyEligible && level && (
              <FanLevelBadge
                score={fan.engagementScore ?? 0}
                levels={orgLevels}
                size="sm"
              />
            )}
            <span className="text-[10px] font-semibold text-[#55556A] flex items-center gap-1">
              <Layers size={9} />
              {getLocalSegmentLabel(fan.segment)}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {fan.email && (
              <span className="flex items-center gap-1 text-[10px] text-[#55556A]">
                <Mail size={9} />
                {fan.email}
              </span>
            )}
            {fan.phone && (
              <span className="flex items-center gap-1 text-[10px] text-[#55556A]">
                <Phone size={9} />
                {fan.phone}
              </span>
            )}
            {locationParts && (
              <span className="flex items-center gap-1 text-[10px] text-[#55556A]">
                <MapPin size={9} />
                {locationParts}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-[#55556A]">
              <Calendar size={9} />
              Desde {memberSince}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="border-t border-white/[0.05]" />

      {/* Quick KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="grid grid-cols-2 gap-2"
      >
        <MiniStat
          label="Puntos"
          icon={<Zap size={10} />}
          value={
            loyaltyEligible ? (
              <span className="tabular-nums">
                {(fan.engagementScore ?? 0).toLocaleString("es")}
              </span>
            ) : (
              <span className="text-[#55556A] text-xs font-medium">N/A</span>
            )
          }
        />
        <MiniStat
          label="Nivel"
          icon={<Trophy size={10} />}
          value={
            loyaltyEligible ? (
              level ? (
                <span style={{ color: level.color ?? "#8888AA" }}>
                  {level.name}
                </span>
              ) : (
                <span className="text-[#55556A] text-xs font-medium">
                  Sin nivel
                </span>
              )
            ) : (
              <span className="text-[#55556A] text-xs font-medium">
                Solo PRIMARY
              </span>
            )
          }
        />
        <MiniStat
          label="Actividad"
          icon={<Activity size={10} />}
          value={
            loading ? (
              <Skeleton className="h-4 w-16 rounded-lg" />
            ) : summary?.lastActivityAt ? (
              <span className="text-xs font-medium tabular-nums">
                {formatRelativeTimeEs(new Date(summary.lastActivityAt))}
              </span>
            ) : (
              <span className="text-[#55556A] text-xs font-medium">
                Sin actividad
              </span>
            )
          }
        />
        <MiniStat
          label="Sync EEP"
          icon={<Radio size={10} />}
          value={
            <Badge variant={getEepSyncStatusVariant(fan.eepSyncStatus)}>
              {getEepSyncStatusLabel(fan.eepSyncStatus)}
            </Badge>
          }
        />
      </motion.div>

      {relationshipType === "FOLLOWING" && (
        <p className="text-[11px] text-[#8888AA] leading-relaxed rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
          Relación FOLLOWING: la lealtad pertenece a la organización primaria.
        </p>
      )}

      {summary?.error && (
        <p className="text-xs text-red-400 text-center">{summary.error}</p>
      )}

      {!loading && summary && !summary.error && (
        <p className="text-[11px] text-[#55556A]">
          {summary.eventsCount.toLocaleString("es")} eventos recientes cargados
          para el resumen.
        </p>
      )}

      {/* CTA → Fan 360 */}
      <Button
        intent="primary"
        size="sm"
        className="w-full"
        leftIcon={<ExternalLink size={13} />}
        onClick={() => router.push(`/dashboard/fans/${fan.id}`)}
      >
        Ver perfil completo
      </Button>
    </div>
  );
}

// ─── Drawer shell ─────────────────────────────────────────────────────────────

interface FanProfileDrawerProps {
  open: boolean;
  onClose: () => void;
  fan: FanView | null;
  orgLevels: FanLevel[];
  /** From Fans CRM list this is PRIMARY; Fan 360 may pass FOLLOWING. */
  relationshipType?: FanRelationshipType;
}

export function FanProfileDrawer({
  open,
  onClose,
  fan,
  orgLevels,
  relationshipType = "PRIMARY",
}: FanProfileDrawerProps) {
  if (!fan) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={fan.displayName ?? undefined}
      subtitle="Vista rápida · Fan Intelligence"
      side="right"
      width="440px"
    >
      <FanProfileContent
        key={fan.id}
        fan={fan}
        orgLevels={orgLevels}
        relationshipType={relationshipType}
      />
    </Drawer>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Trophy,
  Gift,
  Zap,
  Activity,
  Brain,
} from "lucide-react";
import { Drawer } from "@/components/feedback/Drawer";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { FanLevelBadge, computeLevelForScore } from "@/components/gamification/FanLevelBadge";
import { FanActivityTimeline } from "./FanActivityTimeline";
import { FanIntelligencePanel } from "./FanIntelligencePanel";
import { PointsTimeline } from "@/components/gamification/PointsTimeline";
import { getFanProfile } from "@/server/actions/fan-profile";
import { getCountryLabel } from "@/lib/country-codes";
import { cn } from "@/lib/utils";
import type { FanView, FanLevel, FanEvent, FanPointsLedger } from "@/db/schema";
import type { FanIntelligence } from "@/server/actions/fan-profile";

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerTab = "actividad" | "puntos" | "inteligencia";

interface ProfileData {
  events:       FanEvent[];
  ledger:       FanPointsLedger[];
  intelligence: FanIntelligence;
  error:        string | null;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  active:    { label: "Activo",     variant: "success"  as const },
  inactive:  { label: "Inactivo",   variant: "ghost"    as const },
  suspended: { label: "Suspendido", variant: "warning"  as const },
  archived:  { label: "Archivado",  variant: "brand"    as const },
};

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
        <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <div className="text-sm font-bold text-[#F0F0F8]">{value}</div>
    </div>
  );
}

// ─── Tab bar ─────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
  eventCount,
  ledgerCount,
}: {
  active:      DrawerTab;
  onChange:    (tab: DrawerTab) => void;
  eventCount:  number;
  ledgerCount: number;
}) {
  const tabs: { id: DrawerTab; label: string; count?: number }[] = [
    { id: "actividad",    label: "Actividad",    count: eventCount  },
    { id: "puntos",       label: "Puntos",       count: ledgerCount },
    { id: "inteligencia", label: "Inteligencia"                     },
  ];

  return (
    <div className="flex gap-0 border-b border-white/[0.06]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold",
            "border-b-2 -mb-px transition-colors duration-150",
            active === tab.id
              ? "text-[#F0F0F8] border-[#FF2D55]"
              : "text-[#55556A] border-transparent hover:text-[#8888AA]",
          )}
        >
          {tab.id === "inteligencia" && (
            <Brain size={11} className={active === tab.id ? "text-[#FF2D55]" : "text-[#55556A]"} />
          )}
          {tab.label}
          {tab.count !== undefined && tab.count > 0 && (
            <span
              className={cn(
                "px-1.5 py-px rounded-full text-[9px] font-bold tabular-nums",
                active === tab.id
                  ? "bg-[#FF2D55]/15 text-[#FF2D55]"
                  : "bg-white/[0.06] text-[#55556A]",
              )}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Content skeleton ─────────────────────────────────────────────────────────

function ContentSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("rounded-xl", i % 3 === 0 ? "h-10" : "h-8")}
        />
      ))}
    </div>
  );
}

// ─── Profile content (keyed on fan.id — remounts on fan change) ───────────────

function FanProfileContent({
  fan,
  orgLevels,
}: {
  fan:       FanView;
  orgLevels: FanLevel[];
}) {
  const [activeTab,   setActiveTab]   = useState<DrawerTab>("actividad");
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    let cancelled = false;

    getFanProfile(fan.id).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setProfileData({
          events:       result.data.events,
          ledger:       result.data.ledger,
          intelligence: result.data.intelligence,
          error:        null,
        });
      } else {
        setProfileData({
          events:       [],
          ledger:       [],
          intelligence: {
            behavioral:  { totalEvents: 0, topEventTypes: [], lastEventAt: null, daysSinceLast: null, activityScore: 0 },
            velocity:    { points30d: 0, events30d: 0, points7d: 0, events7d: 0, trend: "dormant" },
            experiences: [],
            orgLevels:   [],
          },
          error: result.error,
        });
      }
    });

    return () => { cancelled = true; };
  // Intentional: runs once per mount (keyed on fan.id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading    = profileData === null;
  const level      = computeLevelForScore(fan.engagementScore ?? 0, orgLevels);
  const statusCfg  = STATUS_CONFIG[fan.status] ?? STATUS_CONFIG.inactive;

  const initials = [fan.firstName, fan.lastName]
    .filter(Boolean)
    .map((n) => n![0].toUpperCase())
    .join("") || fan.displayName?.[0]?.toUpperCase() || "?";

  const countryLabel = getCountryLabel(fan.countryCode);
  const locationParts = [fan.city, countryLabel].filter(Boolean).join(", ");
  const memberSince   = new Intl.DateTimeFormat("es", {
    month: "short",
    year:  "numeric",
  }).format(new Date(fan.createdAt));

  return (
    <div className="space-y-5">

      {/* ── Profile hero ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-start gap-4"
      >
        {/* Avatar */}
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF2D55]/20 to-[#FF2D55]/5 border border-[#FF2D55]/20 flex items-center justify-center">
            <span className="text-lg font-black text-[#FF2D55]">{initials}</span>
          </div>
          <div
            className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0D0D14]",
              fan.status === "active"    ? "bg-[#00D4A8]" :
              fan.status === "suspended" ? "bg-amber-400"  :
                                           "bg-[#55556A]",
            )}
          />
        </div>

        {/* Identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-bold text-[#F0F0F8]">{fan.displayName}</h3>
            <Badge variant={statusCfg.variant} className="text-[10px]">
              {statusCfg.label}
            </Badge>
          </div>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {level && (
              <FanLevelBadge score={fan.engagementScore ?? 0} levels={orgLevels} size="sm" />
            )}
            {fan.segment && (
              <span className="text-[10px] font-semibold text-[#55556A]">
                · {fan.segment}
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
            {fan.email && (
              <span className="flex items-center gap-1 text-[10px] text-[#55556A]">
                <Mail size={9} />{fan.email}
              </span>
            )}
            {fan.phone && (
              <span className="flex items-center gap-1 text-[10px] text-[#55556A]">
                <Phone size={9} />{fan.phone}
              </span>
            )}
            {locationParts && (
              <span className="flex items-center gap-1 text-[10px] text-[#55556A]">
                <MapPin size={9} />{locationParts}
              </span>
            )}
            <span className="flex items-center gap-1 text-[10px] text-[#55556A]">
              <Calendar size={9} />Desde {memberSince}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="border-t border-white/[0.05]" />

      {/* ── Engagement stats ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
        className="grid grid-cols-2 gap-2"
      >
        <MiniStat
          label="Puntos totales"
          icon={<Zap size={10} />}
          value={
            <span className="tabular-nums">
              {(fan.engagementScore ?? 0).toLocaleString("es")}
            </span>
          }
        />
        <MiniStat
          label="Nivel actual"
          icon={<Trophy size={10} />}
          value={
            level
              ? <span style={{ color: level.color ?? "#8888AA" }}>{level.name}</span>
              : <span className="text-[#55556A] text-xs font-medium">Sin nivel</span>
          }
        />
        <MiniStat
          label="Eventos"
          icon={<Activity size={10} />}
          value={
            loading
              ? <Skeleton className="h-4 w-10 rounded-lg" />
              : <span className="tabular-nums">{(profileData?.events.length ?? 0).toLocaleString("es")}</span>
          }
        />
        <MiniStat
          label="Ciudad"
          icon={<MapPin size={10} />}
          value={
            <span className="text-[#8888AA] text-xs font-medium">
              {fan.city ?? "—"}
            </span>
          }
        />
      </motion.div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <TabBar
          active={activeTab}
          onChange={setActiveTab}
          eventCount={profileData?.events.length ?? 0}
          ledgerCount={profileData?.ledger.length ?? 0}
        />

        <div className="mt-4 min-h-[200px]">
          {loading ? (
            <ContentSkeleton />
          ) : profileData?.error ? (
            <p className="text-xs text-red-400 text-center py-8">{profileData.error}</p>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === "actividad" && (
                  <FanActivityTimeline events={profileData?.events ?? []} />
                )}
                {activeTab === "puntos" && (
                  <PointsTimeline entries={profileData?.ledger ?? []} />
                )}
                {activeTab === "inteligencia" && profileData?.intelligence && (
                  <FanIntelligencePanel
                    behavioral={profileData.intelligence.behavioral}
                    velocity={profileData.intelligence.velocity}
                    experiences={profileData.intelligence.experiences}
                    orgLevels={profileData.intelligence.orgLevels}
                    engagementScore={fan.engagementScore ?? 0}
                    segment={fan.segment}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </motion.div>

    </div>
  );
}

// ─── Drawer shell ─────────────────────────────────────────────────────────────

interface FanProfileDrawerProps {
  open:      boolean;
  onClose:   () => void;
  fan:       FanView | null;
  orgLevels: FanLevel[];
}

export function FanProfileDrawer({
  open,
  onClose,
  fan,
  orgLevels,
}: FanProfileDrawerProps) {
  if (!fan) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={fan.displayName ?? undefined}
      subtitle={fan.email ?? undefined}
      side="right"
      width="520px"
    >
      <FanProfileContent key={fan.id} fan={fan} orgLevels={orgLevels} />
    </Drawer>
  );
}

"use client";

/**
 * PointsTimeline — Fan points ledger history component.
 *
 * Displays a chronological list of ledger entries for a fan.
 * Foundation component: not yet embedded in a page. Will be used
 * inside a fan detail drawer/panel in a future iteration.
 *
 * Data is passed in as a prop (fetched by the parent server component).
 */

import { cn } from "@/lib/utils";
import type { FanPointsLedger } from "@/db/schema";

// ─── Entry row ────────────────────────────────────────────────────────────────

function LedgerEntry({
  entry,
  isLast,
}: {
  entry:  FanPointsLedger;
  isLast: boolean;
}) {
  const isPositive = entry.points >= 0;

  return (
    <div
      className={cn(
        "flex items-start gap-3 py-3 px-1",
        !isLast && "border-b border-white/[0.04]",
      )}
    >
      {/* Delta pill */}
      <div
        className={cn(
          "shrink-0 min-w-[52px] text-center px-2 py-0.5 rounded-lg",
          "text-xs font-bold tabular-nums border",
          isPositive
            ? "bg-[#00D4A8]/[0.08] text-[#00D4A8] border-[#00D4A8]/20"
            : "bg-red-500/[0.08] text-red-400 border-red-500/20",
        )}
      >
        {isPositive ? "+" : ""}{entry.points}
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-[#C8C8E0] truncate leading-snug">
          {entry.reason}
        </p>
        <p className="text-[10px] text-[#55556A] mt-0.5 truncate">
          {entry.eventType}
          {entry.source !== "system" && (
            <span className="ml-1 text-[#3B82F6]/70">· {entry.source}</span>
          )}
        </p>
      </div>

      {/* Balance + date */}
      <div className="shrink-0 text-right">
        <p className="text-xs font-semibold text-[#8888AA] tabular-nums">
          {entry.balanceAfter.toLocaleString("es")} pts
        </p>
        <p className="text-[10px] text-[#55556A] mt-0.5 tabular-nums">
          {new Intl.DateTimeFormat("es", {
            day:   "2-digit",
            month: "short",
            year:  "numeric",
          }).format(new Date(entry.createdAt))}
        </p>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyLedger({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5",
        compact ? "py-4" : "py-12 gap-2",
      )}
    >
      {!compact && (
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <span className="text-base">✦</span>
        </div>
      )}
      <p
        className={cn(
          "font-semibold text-[#8888AA]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        Sin historial de puntos
      </p>
      {!compact && (
        <p className="text-xs text-[#55556A] text-center max-w-[200px]">
          Los puntos acumulados y deducciones aparecerán aquí.
        </p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PointsTimelineProps {
  entries: FanPointsLedger[];
  className?: string;
  /** Denser empty state for Fan 360 / compact panels. */
  compact?: boolean;
}

export function PointsTimeline({
  entries,
  className,
  compact = false,
}: PointsTimelineProps) {
  if (!entries.length) return <EmptyLedger compact={compact} />;

  return (
    <div className={cn("divide-y-0", className)}>
      {entries.map((entry, i) => (
        <LedgerEntry
          key={entry.id}
          entry={entry}
          isLast={i === entries.length - 1}
        />
      ))}
    </div>
  );
}

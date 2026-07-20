"use client";

import { cn } from "@/lib/utils";
import type { FanEvent } from "@/db/schema";
import { formatFanEventTypeLabel } from "@/lib/fan-intelligence";

// ─── Event type icon dot ──────────────────────────────────────────────────────

/** Accent for known implemented types only; unknowns share a neutral default. */
const EVENT_TYPE_COLORS: Record<string, string> = {
  campaign_engagement: "#FF2D55",
};

function eventColor(eventType: string): string {
  return EVENT_TYPE_COLORS[eventType] ?? "#55556A";
}

// ─── Entry ────────────────────────────────────────────────────────────────────

function ActivityEntry({
  event,
  isLast,
  showPoints,
}: {
  event: FanEvent;
  isLast: boolean;
  /** Loyalty deltas — hide for FOLLOWING (ADR-002). */
  showPoints: boolean;
}) {
  const color = eventColor(event.eventType);
  const hasPoints = showPoints && event.points > 0;

  return (
    <div className={cn("flex gap-3 pb-3", !isLast && "border-b border-white/[0.04] mb-3")}>
      {/* Timeline rail */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div
          className="w-2 h-2 rounded-full shrink-0 mt-1"
          style={{ backgroundColor: color }}
        />
        {!isLast && (
          <div className="w-px flex-1 mt-1.5 bg-white/[0.05]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-0.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#C8C8E0] truncate">
              {formatFanEventTypeLabel(event.eventType)}
            </p>
            <p className="text-[10px] text-[#55556A] mt-0.5">
              {event.source}
              {event.sourceId && (
                <span className="ml-1 opacity-50">· {event.sourceId}</span>
              )}
            </p>
          </div>

          <div className="shrink-0 text-right">
            {hasPoints && (
              <span className="inline-flex items-center px-1.5 py-px rounded-md text-[10px] font-bold bg-[#00D4A8]/[0.08] text-[#00D4A8] border border-[#00D4A8]/20 tabular-nums">
                +{event.points}
              </span>
            )}
            <p className="text-[10px] text-[#55556A] mt-0.5 tabular-nums">
              {new Intl.DateTimeFormat("es", {
                day:   "2-digit",
                month: "short",
                year:  "numeric",
              }).format(new Date(event.occurredAt))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyActivity({ compact }: { compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1.5",
        compact ? "py-4" : "py-12 gap-2",
      )}
    >
      {!compact && (
        <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
          <span className="text-[#55556A] text-sm">○</span>
        </div>
      )}
      <p
        className={cn(
          "font-semibold text-[#8888AA]",
          compact ? "text-xs" : "text-sm",
        )}
      >
        Sin actividad registrada
      </p>
      {!compact && (
        <p className="text-xs text-[#55556A] text-center max-w-[200px]">
          Los eventos de este fan aparecerán aquí cuando comiencen a interactuar.
        </p>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FanActivityTimelineProps {
  events: FanEvent[];
  className?: string;
  /** Denser empty state / tighter rows for Fan 360 fiche layout. */
  compact?: boolean;
  /**
   * Show fan_events.points badges. Default true for backward compat.
   * Fan 360 passes false for FOLLOWING (loyalty N/A).
   */
  showPoints?: boolean;
}

export function FanActivityTimeline({
  events,
  className,
  compact = false,
  showPoints = true,
}: FanActivityTimelineProps) {
  if (!events.length) return <EmptyActivity compact={compact} />;

  return (
    <div className={cn(compact && "space-y-0", className)}>
      {events.map((event, i) => (
        <ActivityEntry
          key={event.id}
          event={event}
          isLast={i === events.length - 1}
          showPoints={showPoints}
        />
      ))}
    </div>
  );
}

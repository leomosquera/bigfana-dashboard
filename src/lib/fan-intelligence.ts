/**
 * Pure Fan Intelligence helpers (client-safe).
 * No database imports — used by list filters, Fan 360 presentation, and tests.
 */

import type { EepSyncStatus, FanStatus } from "@/db/schema";
import { getCountryLabel } from "@/lib/country-codes";
import {
  buildDateKeys,
  type DailyCountPoint,
} from "@/lib/dashboard-home-series";
import { formatEventTypeLabel } from "@/lib/dashboard-home-format";

// ─── Relationship ─────────────────────────────────────────────────────────────

export type FanRelationshipType = "PRIMARY" | "FOLLOWING";

export function isPrimaryRelationship(
  type: FanRelationshipType | null | undefined,
): boolean {
  return type === "PRIMARY";
}

/** Loyalty / gamification UI is meaningful only for PRIMARY membership. */
export function isLoyaltyEligible(
  type: FanRelationshipType | null | undefined,
): boolean {
  return type === "PRIMARY";
}

// ─── EEP presentation ─────────────────────────────────────────────────────────

export const EEP_SYNC_STATUS_LABELS: Record<
  EepSyncStatus,
  { label: string; variant: "success" | "warning" | "ghost" | "brand" }
> = {
  pending:  { label: "Pendiente",     variant: "ghost"   },
  synced:   { label: "Sincronizado",  variant: "success" },
  failed:   { label: "Error",         variant: "brand"   },
  retrying: { label: "Reintentando",  variant: "warning" },
};

export function getEepSyncStatusLabel(
  status: EepSyncStatus | null | undefined,
): string {
  if (!status) return "Sin sincronizar";
  return EEP_SYNC_STATUS_LABELS[status]?.label ?? "Sin sincronizar";
}

export function getEepSyncStatusVariant(
  status: EepSyncStatus | null | undefined,
): "success" | "warning" | "ghost" | "brand" {
  if (!status) return "ghost";
  return EEP_SYNC_STATUS_LABELS[status]?.variant ?? "ghost";
}

// ─── Fan status ───────────────────────────────────────────────────────────────

export const FAN_STATUS_LABELS: Record<
  FanStatus,
  { label: string; variant: "success" | "warning" | "ghost" | "brand" }
> = {
  active:    { label: "Activo",     variant: "success" },
  inactive:  { label: "Inactivo",   variant: "ghost"   },
  suspended: { label: "Suspendido", variant: "warning" },
  archived:  { label: "Archivado",  variant: "brand"   },
};

// ─── Segment / country ────────────────────────────────────────────────────────

export const UNCLASSIFIED_SEGMENT_LABEL = "Sin clasificar";
export const UNCLASSIFIED_SEGMENT_FILTER = "__unclassified__";

export function getLocalSegmentLabel(
  segment: string | null | undefined,
): string {
  const trimmed = segment?.trim();
  return trimmed ? trimmed : UNCLASSIFIED_SEGMENT_LABEL;
}

export function resolveFanCountryLabel(
  countryCode: string | null | undefined,
): string | null {
  return getCountryLabel(countryCode);
}

// ─── Last activity merge ──────────────────────────────────────────────────────

export function mergeLastActivityAt<T extends { id: string }>(
  fans: T[],
  lastActivityByFanId: ReadonlyMap<string, Date>,
): Array<T & { lastActivityAt: Date | null }> {
  return fans.map((fan) => ({
    ...fan,
    lastActivityAt: lastActivityByFanId.get(fan.id) ?? null,
  }));
}

// ─── List filters ─────────────────────────────────────────────────────────────

export interface FanIntelligenceListFilters {
  status?: FanStatus | null;
  segment?: string | null;
  countryCode?: string | null;
  eepSyncStatus?: EepSyncStatus | null;
}

export interface FanIntelligenceFilterableRow {
  status: FanStatus;
  segment: string | null;
  countryCode: string | null;
  eepSyncStatus: EepSyncStatus;
  displayName: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
}

export function matchesFanIntelligenceFilters(
  row: FanIntelligenceFilterableRow,
  filters: FanIntelligenceListFilters,
): boolean {
  if (filters.status && row.status !== filters.status) return false;

  if (filters.segment) {
    if (filters.segment === UNCLASSIFIED_SEGMENT_FILTER) {
      if (row.segment?.trim()) return false;
    } else if ((row.segment ?? "") !== filters.segment) {
      return false;
    }
  }

  if (filters.countryCode) {
    if ((row.countryCode ?? "") !== filters.countryCode) return false;
  }

  if (filters.eepSyncStatus && row.eepSyncStatus !== filters.eepSyncStatus) {
    return false;
  }

  return true;
}

export function filterFanIntelligenceRows<T extends FanIntelligenceFilterableRow>(
  rows: T[],
  filters: FanIntelligenceListFilters,
): T[] {
  if (
    !filters.status &&
    !filters.segment &&
    !filters.countryCode &&
    !filters.eepSyncStatus
  ) {
    return rows;
  }
  return rows.filter((row) => matchesFanIntelligenceFilters(row, filters));
}

/** Distinct segment values for filter options (null → unclassified sentinel). */
export function collectSegmentFilterOptions(
  rows: Array<{ segment: string | null }>,
): Array<{ value: string; label: string }> {
  const seen = new Set<string>();
  let hasUnclassified = false;

  for (const row of rows) {
    const trimmed = row.segment?.trim();
    if (!trimmed) {
      hasUnclassified = true;
      continue;
    }
    seen.add(trimmed);
  }

  const options = [...seen]
    .sort((a, b) => a.localeCompare(b, "es"))
    .map((value) => ({ value, label: value }));

  if (hasUnclassified) {
    options.unshift({
      value: UNCLASSIFIED_SEGMENT_FILTER,
      label: UNCLASSIFIED_SEGMENT_LABEL,
    });
  }

  return options;
}

export function collectCountryFilterOptions(
  rows: Array<{ countryCode: string | null }>,
): Array<{ value: string; label: string }> {
  const map = new Map<string, string>();

  for (const row of rows) {
    const code = row.countryCode?.trim().toUpperCase();
    if (!code) continue;
    if (map.has(code)) continue;
    map.set(code, getCountryLabel(code) ?? code);
  }

  return [...map.entries()]
    .sort((a, b) => a[1].localeCompare(b[1], "es"))
    .map(([value, label]) => ({ value, label }));
}

// ─── Access contract (pure) ───────────────────────────────────────────────────

/**
 * Fan 360 access: requires an org relationship (PRIMARY or FOLLOWING).
 * Returns false when no relationship exists.
 */
export function canAccessFan360(
  relationship: FanRelationshipType | null | undefined,
): boolean {
  return relationship === "PRIMARY" || relationship === "FOLLOWING";
}

/** Normalize DB relationship_type + is_primary into UI contract. */
export function normalizeRelationshipType(
  relationshipType: string,
  isPrimary: boolean,
): FanRelationshipType {
  if (isPrimary || relationshipType === "PRIMARY") return "PRIMARY";
  return "FOLLOWING";
}

// ─── Activity Intelligence (F3A — fan_events only) ─────────────────────────────

export const ACTIVITY_WINDOW_DAYS = 30;

/**
 * Known implemented fan_events.event_type → Spanish UI label.
 * Only map types with a real application writer. Unknown types use fallback.
 */
const FAN_EVENT_TYPE_LABELS: Record<string, string> = {
  campaign_engagement: "Participación en campañas",
};

/**
 * Central event-type label helper for Fan Intelligence.
 * Does not invent product categories for unimplemented types.
 */
export function formatFanEventTypeLabel(eventType: string): string {
  const key = eventType?.trim();
  if (!key) return "Evento";
  return FAN_EVENT_TYPE_LABELS[key] ?? formatEventTypeLabel(key);
}

export interface FanActivitySummaryView {
  totalInteractions: number;
  interactionsLast30d: number;
  /** Distinct calendar days with ≥1 event in the 30d window (DB day bucket). */
  activeDaysLast30d: number;
  mostFrequentEventType: string | null;
  lastActivityAt: Date | null;
  daysSinceLast: number | null;
}

export interface FanActivityTrendPoint {
  /** YYYY-MM-DD */
  date: string;
  interactions: number;
}

export interface FanActivityBreakdownRow {
  eventType: string;
  label: string;
  count: number;
  /** Share of totalInteractions (0–100). Not an engagement rate. */
  percentage: number;
}

/**
 * Compose activity summary exclusively from fan_events aggregates.
 * Never accepts ledger velocity as interaction counts.
 */
export function buildFanActivitySummary(input: {
  totalInteractions: number;
  interactionsLast30d: number;
  activeDaysLast30d: number;
  mostFrequentEventType: string | null;
  lastActivityAt: Date | null;
  daysSinceLast?: number | null;
  now?: Date;
}): FanActivitySummaryView {
  const lastActivityAt = input.lastActivityAt
    ? new Date(input.lastActivityAt)
    : null;

  let daysSinceLast = input.daysSinceLast ?? null;
  if (daysSinceLast === null && lastActivityAt) {
    const now = input.now ?? new Date();
    daysSinceLast = Math.floor(
      (now.getTime() - lastActivityAt.getTime()) / (1000 * 60 * 60 * 24),
    );
  }
  if (!lastActivityAt) daysSinceLast = null;

  return {
    totalInteractions: Math.max(0, input.totalInteractions),
    interactionsLast30d: Math.max(0, input.interactionsLast30d),
    activeDaysLast30d: Math.max(0, input.activeDaysLast30d),
    mostFrequentEventType: input.mostFrequentEventType,
    lastActivityAt,
    daysSinceLast,
  };
}

/**
 * Zero-filled daily interactions series (same day-key continuum as Dashboard Home).
 */
export function buildFanActivityTrendSeries(
  daily: DailyCountPoint[],
  windowDays: number = ACTIVITY_WINDOW_DAYS,
  end: Date = new Date(),
): FanActivityTrendPoint[] {
  const keys = buildDateKeys(windowDays, end);
  const byDay = new Map(daily.map((p) => [p.date, p.count]));
  return keys.map((date) => ({
    date,
    interactions: byDay.get(date) ?? 0,
  }));
}

/**
 * Lifetime event-type distribution. Percentage denominator = total event count.
 * Top-N with optional "Otros" rollup.
 */
export function buildFanActivityBreakdown(
  typeCounts: Array<{ eventType: string; count: number }>,
  topN = 5,
): FanActivityBreakdownRow[] {
  const cleaned = typeCounts
    .map((row) => ({
      eventType: row.eventType.trim(),
      count: Math.max(0, Number(row.count) || 0),
    }))
    .filter((row) => row.eventType && row.count > 0)
    .sort((a, b) => b.count - a.count || a.eventType.localeCompare(b.eventType));

  const total = cleaned.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return [];

  const head = cleaned.slice(0, topN);
  const rest = cleaned.slice(topN);
  const rows: FanActivityBreakdownRow[] = head.map((row) => ({
    eventType: row.eventType,
    label: formatFanEventTypeLabel(row.eventType),
    count: row.count,
    percentage: Math.round((row.count / total) * 1000) / 10,
  }));

  if (rest.length > 0) {
    const otherCount = rest.reduce((sum, row) => sum + row.count, 0);
    rows.push({
      eventType: "__other__",
      label: "Otros",
      count: otherCount,
      percentage: Math.round((otherCount / total) * 1000) / 10,
    });
  }

  return rows;
}

/**
 * Factual recency copy from lastActivityAt / daysSinceLast.
 * Not a score — descriptive only (F3 audit vocabulary).
 */
export function formatActivityRecency(input: {
  lastActivityAt: Date | null;
  daysSinceLast: number | null;
}): string {
  if (!input.lastActivityAt || input.daysSinceLast === null) {
    return "Sin actividad registrada";
  }

  const days = input.daysSinceLast;
  if (days <= 0) return "Activo hoy";
  if (days === 1) return "Última actividad hace 1 día";
  if (days < 7) return `Última actividad hace ${days} días`;
  if (days < 30) return "Sin actividad reciente";
  return `Sin actividad hace ${days} días`;
}

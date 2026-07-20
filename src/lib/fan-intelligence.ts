/**
 * Pure Fan Intelligence helpers (client-safe).
 * No database imports — used by list filters, Fan 360 presentation, and tests.
 */

import type { EepSyncStatus, FanStatus } from "@/db/schema";
import { getCountryLabel } from "@/lib/country-codes";

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

export interface FanActivitySummaryView {
  totalInteractions: number;
  interactionsLast30d: number;
  mostFrequentEventType: string | null;
  lastActivityAt: Date | null;
}

/**
 * Compose honest activity summary from existing behavioral + velocity contracts.
 */
export function buildFanActivitySummary(
  behavioral: {
    totalEvents: number;
    topEventTypes: Array<{ eventType: string }>;
    lastEventAt: Date | null;
  },
  velocity: { events30d: number },
): FanActivitySummaryView {
  return {
    totalInteractions: behavioral.totalEvents,
    interactionsLast30d: velocity.events30d,
    mostFrequentEventType: behavioral.topEventTypes[0]?.eventType ?? null,
    lastActivityAt: behavioral.lastEventAt,
  };
}

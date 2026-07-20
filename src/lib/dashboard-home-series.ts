/**
 * Pure Dashboard Home series / aggregate transforms (client-safe, testable).
 */

export interface DailyCountPoint {
  /** YYYY-MM-DD */
  date: string;
  count: number;
}

export interface FanGrowthPoint {
  date: string;
  newFans: number;
  cumulativeFans: number;
}

export interface ActivitySeriesPoint {
  date: string;
  interactions: number;
  engagedFans: number;
}

export interface GeographyRowInput {
  countryCode: string | null;
  fanCount: number;
}

export interface GeographyCountry {
  countryCode: string;
  label: string;
  fanCount: number;
  /** Percentage among fans with known country_code only. */
  percentage: number;
}

export interface GeographySummary {
  countries: GeographyCountry[];
  knownGeographyCount: number;
  unknownGeographyCount: number;
  totalFans: number;
}

export type IntegrationJobStatusKey =
  | "pending"
  | "processing"
  | "synced"
  | "failed"
  | "retrying";

export type IntegrationHealthAttention =
  | "requires_attention"
  | "processing"
  | "pending"
  | "operational"
  | "no_jobs";

export interface IntegrationHealthSummary {
  byStatus: Record<IntegrationJobStatusKey, number>;
  total: number;
  /**
   * Derived operational status (priority order):
   * failed/retrying → processing → pending → operational → no_jobs
   */
  attention: IntegrationHealthAttention;
}

/** UTC calendar day YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Inclusive continuum of UTC days ending at `end` (default: now), length = windowDays. */
export function buildDateKeys(windowDays: number, end: Date = new Date()): string[] {
  const days = Math.max(1, Math.floor(windowDays));
  const endUtc = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endUtc);
    d.setUTCDate(endUtc.getUTCDate() - i);
    keys.push(toDateKey(d));
  }
  return keys;
}

/**
 * Build a continuous fan-growth series.
 * `baseBeforeWindow` = PRIMARY cohort fans whose membership date is before the first day.
 */
export function buildFanGrowthSeries(
  dailyNewFans: DailyCountPoint[],
  baseBeforeWindow: number,
  windowDays: number,
  end: Date = new Date(),
): FanGrowthPoint[] {
  const keys = buildDateKeys(windowDays, end);
  const byDay = new Map(dailyNewFans.map((p) => [p.date, p.count]));
  let cumulative = Math.max(0, baseBeforeWindow);

  return keys.map((date) => {
    const newFans = byDay.get(date) ?? 0;
    cumulative += newFans;
    return { date, newFans, cumulativeFans: cumulative };
  });
}

export function buildActivitySeries(
  daily: Array<{ date: string; interactions: number; engagedFans: number }>,
  windowDays: number,
  end: Date = new Date(),
): ActivitySeriesPoint[] {
  const keys = buildDateKeys(windowDays, end);
  const byDay = new Map(daily.map((p) => [p.date, p]));

  return keys.map((date) => {
    const row = byDay.get(date);
    return {
      date,
      interactions: row?.interactions ?? 0,
      engagedFans: row?.engagedFans ?? 0,
    };
  });
}

/**
 * Top countries among fans with known country_code.
 * Percentage denominator = knownGeographyCount (not total fans).
 */
export function buildGeographySummary(
  rows: GeographyRowInput[],
  getLabel: (code: string) => string | null,
  topN = 5,
): GeographySummary {
  let knownGeographyCount = 0;
  let unknownGeographyCount = 0;
  const known: Array<{ countryCode: string; fanCount: number }> = [];

  for (const row of rows) {
    const code = row.countryCode?.trim().toUpperCase() || null;
    const n = Number(row.fanCount) || 0;
    if (!code) {
      unknownGeographyCount += n;
      continue;
    }
    knownGeographyCount += n;
    known.push({ countryCode: code, fanCount: n });
  }

  known.sort((a, b) => b.fanCount - a.fanCount);

  const countries: GeographyCountry[] = known.slice(0, topN).map((r) => ({
    countryCode: r.countryCode,
    label: getLabel(r.countryCode) ?? r.countryCode,
    fanCount: r.fanCount,
    percentage:
      knownGeographyCount > 0
        ? Math.round((r.fanCount / knownGeographyCount) * 1000) / 10
        : 0,
  }));

  return {
    countries,
    knownGeographyCount,
    unknownGeographyCount,
    totalFans: knownGeographyCount + unknownGeographyCount,
  };
}

export function buildIntegrationHealth(
  statusCounts: Array<{ status: string; count: number }>,
): IntegrationHealthSummary {
  const byStatus: Record<IntegrationJobStatusKey, number> = {
    pending: 0,
    processing: 0,
    synced: 0,
    failed: 0,
    retrying: 0,
  };

  for (const row of statusCounts) {
    const key = row.status as IntegrationJobStatusKey;
    if (key in byStatus) {
      byStatus[key] = Number(row.count) || 0;
    }
  }

  const total = Object.values(byStatus).reduce((s, n) => s + n, 0);

  let attention: IntegrationHealthAttention;
  if (total === 0) {
    attention = "no_jobs";
  } else if (byStatus.failed > 0 || byStatus.retrying > 0) {
    attention = "requires_attention";
  } else if (byStatus.processing > 0) {
    attention = "processing";
  } else if (byStatus.pending > 0) {
    attention = "pending";
  } else {
    // Jobs exist and none are pending/processing/failed/retrying (typically all synced).
    attention = "operational";
  }

  return { byStatus, total, attention };
}

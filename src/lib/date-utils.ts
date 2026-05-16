/**
 * BigFana Date Utilities
 *
 * Single source of truth for all date operations.
 * Wraps date-fns — never import date-fns directly elsewhere.
 *
 * Usage:
 *   import { formatDate, formatDateRange, getPresetRange } from "@/lib/date-utils";
 */

import {
  format,
  isValid,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  addDays,
  subDays,
  addMonths,
  subMonths,
  differenceInDays,
  getHours,
  getMinutes,
  getSeconds,
  setHours,
  setMinutes,
  setSeconds,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

export type DateRange = { from: Date | undefined; to?: Date | undefined };

export type TimeValue = { hours: number; minutes: number; seconds?: number };

export type DatePreset =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth";

// ─── Formatting ───────────────────────────────────────────────────────────────

export function today(): Date {
  return startOfDay(new Date());
}

export function formatDate(
  date: Date | null | undefined,
  fmt = "MMM d, yyyy"
): string {
  if (!date || !isValid(date)) return "";
  return format(date, fmt);
}

export function formatDateCompact(date: Date | null | undefined): string {
  if (!date || !isValid(date)) return "";
  return format(date, "dd/MM/yyyy");
}

export function formatDateRange(
  range: DateRange | null | undefined,
  fmt = "MMM d, yyyy"
): string {
  if (!range?.from) return "";
  if (!range.to) return `${format(range.from, fmt)} –`;
  if (isSameDay(range.from, range.to)) return format(range.from, fmt);
  return `${format(range.from, fmt)} – ${format(range.to, fmt)}`;
}

export function formatTime(
  h: number,
  m: number,
  s?: number,
  is24 = true
): string {
  if (is24) {
    const base = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    return s !== undefined
      ? `${base}:${String(s).padStart(2, "0")}`
      : base;
  }
  const period = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const base = `${h12}:${String(m).padStart(2, "0")}`;
  return s !== undefined
    ? `${base}:${String(s).padStart(2, "0")} ${period}`
    : `${base} ${period}`;
}

// ─── Range Presets ────────────────────────────────────────────────────────────

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: "today",     label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "last7",     label: "Last 7 days" },
  { id: "last30",    label: "Last 30 days" },
  { id: "thisMonth", label: "This month" },
  { id: "lastMonth", label: "Last month" },
];

export function getPresetRange(preset: DatePreset): DateRange {
  const now = today();
  switch (preset) {
    case "today":
      return { from: now, to: now };
    case "yesterday": {
      const y = subDays(now, 1);
      return { from: y, to: y };
    }
    case "last7":
      return { from: subDays(now, 6), to: now };
    case "last30":
      return { from: subDays(now, 29), to: now };
    case "thisMonth":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "lastMonth": {
      const lm = subMonths(now, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
  }
}

export function isPresetActive(range: DateRange | undefined, preset: DatePreset): boolean {
  if (!range?.from) return false;
  const p = getPresetRange(preset);
  if (!p.from || !p.to) return false;
  return (
    isSameDay(range.from, p.from) &&
    !!range.to &&
    isSameDay(range.to, p.to)
  );
}

// ─── Re-exports ───────────────────────────────────────────────────────────────

export {
  isSameDay, isBefore, isAfter,
  startOfDay, endOfDay, startOfMonth, endOfMonth,
  addDays, subDays, addMonths, subMonths, differenceInDays,
  getHours, getMinutes, getSeconds, setHours, setMinutes, setSeconds,
  format, isValid,
};

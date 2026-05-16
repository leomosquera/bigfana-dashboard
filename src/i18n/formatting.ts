"use client";

/**
 * BigFana i18n — Formatting Utilities
 *
 * Two categories:
 *
 * 1. createFormatters(locale) — pure Intl.NumberFormat factory.
 *    Replaces the custom formatCurrency / formatNumber in utils.ts
 *    with locale-aware equivalents. Migrate call sites progressively.
 *
 * 2. useDatePresets() — React hook returning translated date preset
 *    shortcuts for RangePicker and any future filter components.
 */

import { useTranslations } from "next-intl";
import type { DatePreset } from "@/lib/date-utils";

// ─── Number / Currency formatters ────────────────────────────────────────────

/**
 * Returns locale-aware Intl.NumberFormat instances.
 * Forward-compatible with next-intl's useFormatter() hook.
 *
 * @example
 * const fmt = createFormatters("es-AR");
 * fmt.currency.format(1_500_000); // → "US$ 1.500.000"
 * fmt.compact.format(147_800);    // → "148 mil"
 */
export function createFormatters(locale: string) {
  return {
    currency: new Intl.NumberFormat(locale, {
      style:                "currency",
      currency:             "USD",
      maximumFractionDigits: 0,
    }),
    number: new Intl.NumberFormat(locale, {
      maximumFractionDigits: 1,
    }),
    compact: new Intl.NumberFormat(locale, {
      notation:              "compact",
      maximumFractionDigits: 1,
    }),
  };
}

// ─── Date preset hook ─────────────────────────────────────────────────────────

/**
 * Returns the standard date preset list with translated labels.
 *
 * Use in components that render quick-select date shortcuts.
 * Replaces the hardcoded `label` field that was previously on DATE_PRESETS.
 *
 * @example
 * const presets = useDatePresets();
 * // [{ id: "today", label: "Hoy" }, { id: "yesterday", label: "Ayer" }, ...]
 */
export function useDatePresets(): { id: DatePreset; label: string }[] {
  const t = useTranslations("common.datePresets");
  return [
    { id: "today",     label: t("today")     },
    { id: "yesterday", label: t("yesterday") },
    { id: "last7",     label: t("last7")     },
    { id: "last30",    label: t("last30")    },
    { id: "thisMonth", label: t("thisMonth") },
    { id: "lastMonth", label: t("lastMonth") },
  ];
}

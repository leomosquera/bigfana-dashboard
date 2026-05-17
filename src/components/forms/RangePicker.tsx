"use client";

/**
 * BigFana RangePicker
 *
 * Date-range picker with:
 * - Dual-month calendar on desktop, single on compact/mobile
 * - Quick preset shortcuts (Today, Last 7 days, This month …)
 * - Hover range preview while selecting
 * - Apply / Cancel footer
 * - Full keyboard navigation via react-day-picker v10
 *
 * Usage:
 *   <RangePicker value={range} onChange={setRange} label="Date range" />
 */

import * as RadixPopover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarIcon, Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";
import { DayPicker } from "react-day-picker";
import type { DateRange as RDPDateRange, DayPickerProps } from "react-day-picker";

import { useTranslations } from "next-intl";
import { scaleInProps } from "@/lib/design-system/motion";
import { zLayerTw } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useDatePresets } from "@/i18n/formatting";
import {
  type DateRange,
  type DatePreset,
  formatDateRange,
  getPresetRange,
  isPresetActive,
  isBefore,
  isSameDay,
} from "@/lib/date-utils";
import { rdpBaseClassNames } from "./DatePicker";

// ─── Chevron component ────────────────────────────────────────────────────────

function CustomChevron({
  orientation,
}: {
  orientation?: "left" | "right" | "up" | "down";
  className?:   string;
  disabled?:    boolean;
  size?:        number;
  style?:       React.CSSProperties;
}) {
  if (orientation === "right") return <ChevronRight size={14} />;
  return <ChevronLeft size={14} />;
}

// ─── Size tokens ──────────────────────────────────────────────────────────────

const triggerHeight = { sm: "h-8",  md: "h-10", lg: "h-11" } as const;
const triggerPx     = { sm: "px-2.5", md: "px-3", lg: "px-3.5" } as const;
const triggerText   = { sm: "text-xs", md: "text-sm", lg: "text-sm" } as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RangePickerProps {
  value?:            DateRange | null;
  onChange?:         (range: DateRange | null) => void;
  placeholder?:      string;
  displayFormat?:    string;
  size?:             "sm" | "md" | "lg";
  disabled?:         boolean;
  clearable?:        boolean;
  minDate?:          Date;
  maxDate?:          Date;
  disabledDates?:    DayPickerProps["disabled"];
  /** Show Apply/Cancel footer. When false, changes are committed immediately. */
  withFooter?:       boolean;
  /** Show dual-month view (defaults to true). */
  dualMonth?:        boolean;
  label?:            string;
  helperText?:       string;
  errorText?:        string;
  wrapperClassName?: string;
  className?:        string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function RangePicker({
  value,
  onChange,
  placeholder    = "Select date range…",
  displayFormat  = "MMM d, yyyy",
  size           = "md",
  disabled       = false,
  clearable      = false,
  minDate,
  maxDate,
  disabledDates,
  withFooter     = true,
  dualMonth      = true,
  label,
  helperText,
  errorText,
  wrapperClassName,
  className,
}: RangePickerProps) {
  const uid       = useId();
  const [open, setOpen] = useState(false);
  const hasError  = !!errorText;

  const tCommon  = useTranslations("common");
  const datePresets = useDatePresets();

  // ── Internal draft state (uncommitted while popover is open) ─────────────
  const [draft, setDraft]     = useState<DateRange>({ from: undefined, to: undefined });
  const [hovered, setHovered] = useState<Date | undefined>();

  // Active preset badge
  const [activePreset, setActivePreset] = useState<DatePreset | null>(null);

  const handleOpen = useCallback((next: boolean) => {
    if (next) {
      setDraft(value ?? { from: undefined, to: undefined });
      setHovered(undefined);
      setActivePreset(null);
    }
    setOpen(next);
  }, [value]);

  // Merge disabled matchers
  const disabledMatcher = useMemo(() => {
    const matchers: DayPickerProps["disabled"][] = [];
    if (minDate) matchers.push({ before: minDate });
    if (maxDate) matchers.push({ after: maxDate });
    if (disabledDates) matchers.push(disabledDates);
    if (matchers.length === 0) return undefined;
    if (matchers.length === 1) return matchers[0];
    return matchers as DayPickerProps["disabled"];
  }, [minDate, maxDate, disabledDates]);

  // ── Range selection handler ───────────────────────────────────────────────
  const handleDpSelect = useCallback((range: RDPDateRange | undefined) => {
    setDraft({ from: range?.from, to: range?.to });
    setActivePreset(null);
    // Clear hover when range is complete
    if (range?.from && range?.to) setHovered(undefined);
  }, []);

  // ── Hover preview modifiers ───────────────────────────────────────────────
  //  Only shown when a start date is selected but end is not
  const previewInterval = useMemo(() => {
    if (!draft.from || draft.to || !hovered) return undefined;
    const [a, b] = isBefore(draft.from, hovered) || isSameDay(draft.from, hovered)
      ? [draft.from, hovered]
      : [hovered, draft.from];
    return { from: a, to: b };
  }, [draft.from, draft.to, hovered]);

  const previewModifiers = useMemo(() => {
    if (!previewInterval?.from || !previewInterval?.to) return {};
    if (isSameDay(previewInterval.from, previewInterval.to)) {
      return { preview_cap: [previewInterval.from] as Date[] };
    }
    return {
      preview_mid: {
        after:  previewInterval.from,
        before: previewInterval.to,
      } as DayPickerProps["disabled"],
      preview_cap: [previewInterval.to] as Date[],
    };
  }, [previewInterval]);

  // ── Preset handler ────────────────────────────────────────────────────────
  const handlePreset = useCallback((preset: DatePreset) => {
    const range = getPresetRange(preset);
    setDraft(range);
    setActivePreset(preset);
    setHovered(undefined);
    if (!withFooter) {
      onChange?.(range);
      setOpen(false);
    }
  }, [withFooter, onChange]);

  // ── Apply / Cancel ────────────────────────────────────────────────────────
  const handleApply = useCallback(() => {
    onChange?.(draft.from ? draft : null);
    setOpen(false);
  }, [draft, onChange]);

  const handleCancel = useCallback(() => {
    setDraft(value ?? { from: undefined, to: undefined });
    setOpen(false);
  }, [value]);

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
  }, [onChange]);

  // ── Display string ────────────────────────────────────────────────────────
  const displayValue = value?.from
    ? formatDateRange(value, displayFormat)
    : null;

  // ── Merged classNames for range picker ────────────────────────────────────
  const rangeClassNames = useMemo(() => ({
    ...rdpBaseClassNames,
    months: dualMonth ? "flex gap-6" : "flex",
  }), [dualMonth]);

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={`${uid}-trigger`}
          className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <RadixPopover.Root open={open} onOpenChange={handleOpen} modal={false}>
        <RadixPopover.Trigger asChild>
          <button
            id={`${uid}-trigger`}
            type="button"
            disabled={disabled}
            aria-label={displayValue ?? placeholder}
            className={cn(
              "relative flex items-center w-full rounded-xl border",
              "bg-white/[0.03] transition-all duration-200 outline-none",
              "focus:ring-2 focus:ring-[#FF2D55]/30",
              hasError
                ? "border-red-500/40 focus:border-red-500/60"
                : "border-white/[0.08] hover:border-white/[0.14] focus:border-[#FF2D55]/40 focus:bg-[#141420]",
              open && "border-[#FF2D55]/40 bg-[#141420] ring-2 ring-[#FF2D55]/30",
              disabled && "opacity-40 pointer-events-none",
              triggerHeight[size],
              triggerPx[size],
              triggerText[size],
              "gap-2",
              className
            )}
          >
            <CalendarIcon
              size={size === "sm" ? 13 : 14}
              className={cn(
                "shrink-0 transition-colors",
                displayValue ? "text-[#FF2D55]" : "text-[#55556A]"
              )}
            />
            <span className={cn("flex-1 text-left truncate", displayValue ? "text-[#F0F0F8]" : "text-[#55556A]")}>
              {displayValue ?? placeholder}
            </span>
            {clearable && value?.from && (
              <span
                role="button"
                aria-label="Clear range"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-[#55556A] hover:text-[#F0F0F8] transition-colors"
              >
                <X size={11} />
              </span>
            )}
          </button>
        </RadixPopover.Trigger>

        <RadixPopover.Portal>
          <RadixPopover.Content
            sideOffset={6}
            collisionPadding={12}
            align="start"
            forceMount
            onOpenAutoFocus={(e) => e.preventDefault()}
            className={cn(zLayerTw("nestedOverlay"), "outline-none")}
          >
            <AnimatePresence>
              {open && (
                <motion.div
                  key="rangepicker-panel"
                  {...scaleInProps()}
                  className={cn(
                    "rounded-2xl border border-white/[0.10]",
                    "bg-[#1C1C2A]",
                    "shadow-[0_20px_80px_rgba(0,0,0,0.55)]",
                    "backdrop-blur-xl overflow-hidden"
                  )}
                >
                  <div className="flex">
                    {/* ── Presets sidebar ───────────────────────── */}
                    <div className="w-36 shrink-0 border-r border-white/[0.07] p-2 flex flex-col gap-0.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#55556A] px-3 py-1.5">
                        {tCommon("rangePicker.quickSelect")}
                      </p>
                      {datePresets.map((preset) => {
                        const isActive =
                          activePreset === preset.id ||
                          (!activePreset && isPresetActive(draft, preset.id));
                        return (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => handlePreset(preset.id)}
                            className={cn(
                              "relative flex items-center justify-between gap-2 h-8 px-3 rounded-lg text-xs font-medium text-left",
                              "transition-all duration-150 outline-none",
                              "focus-visible:ring-1 focus-visible:ring-[#FF2D55]/50",
                              isActive
                                ? "bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/20"
                                : "text-[#8888AA] hover:text-[#F0F0F8] hover:bg-white/[0.06]"
                            )}
                          >
                            {preset.label}
                            {isActive && <Check size={11} className="shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* ── Calendar panel ────────────────────────── */}
                    <div className="p-4 flex flex-col gap-0">
                      <DayPicker
                        mode="range"
                        selected={draft as RDPDateRange}
                        onSelect={handleDpSelect}
                        disabled={disabledMatcher}
                        defaultMonth={draft.from ?? new Date()}
                        numberOfMonths={dualMonth ? 2 : 1}
                        classNames={rangeClassNames}
                        components={{ Chevron: CustomChevron }}
                        modifiers={previewModifiers}
                        modifiersClassNames={{
                          preview_mid: "bf-day-preview-mid",
                          preview_cap: "bf-day-preview-cap",
                        }}
                        onDayMouseEnter={(day) => setHovered(day)}
                        onDayMouseLeave={() => setHovered(undefined)}
                      />

                      {/* ── Footer ────────────────────────────────── */}
                      {withFooter && (
                        <div className="flex items-center justify-between gap-3 pt-3 mt-1 border-t border-white/[0.07]">
                          {/* Selected range display */}
                          <p className="text-xs text-[#8888AA] truncate min-w-0">
                            {draft.from && draft.to
                              ? formatDateRange(draft, displayFormat)
                              : draft.from
                              ? <span className="text-[#55556A]">{tCommon("rangePicker.selectEndDate")}</span>
                              : <span className="text-[#55556A]">{tCommon("rangePicker.noRangeSelected")}</span>
                            }
                          </p>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              intent="ghost"
                              size="sm"
                              onClick={handleCancel}
                            >
                              {tCommon("actions.cancel")}
                            </Button>
                            <Button
                              intent="primary"
                              size="sm"
                              disabled={!draft.from}
                              onClick={handleApply}
                            >
                              {tCommon("actions.apply")}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </RadixPopover.Content>
        </RadixPopover.Portal>
      </RadixPopover.Root>

      {/* Helper / error */}
      {(helperText || errorText) && (
        <p className={cn("text-xs", errorText ? "text-red-400" : "text-[#55556A]")}>
          {errorText ?? helperText}
        </p>
      )}
    </div>
  );
}

RangePicker.displayName = "RangePicker";

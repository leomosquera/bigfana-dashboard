"use client";

/**
 * BigFana DatePicker
 *
 * Single-date selection built on react-day-picker v10 + Radix Popover.
 * Matches the Combobox/Select trigger API (label, helperText, errorText, size).
 * Uses the shared BigFana calendar classNames from globals.css.
 *
 * Usage:
 *   <DatePicker value={date} onChange={setDate} label="Start date" clearable />
 */

import * as RadixPopover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useState,
} from "react";
import { DayPicker } from "react-day-picker";
import type { ClassNames, DayPickerProps } from "react-day-picker";

import { cn } from "@/lib/utils";
import { scaleInProps } from "@/lib/design-system/motion";
import { formatDate } from "@/lib/date-utils";

// ─── Shared calendar classNames ───────────────────────────────────────────────

export const rdpBaseClassNames: Partial<ClassNames> = {
  root:           "w-full select-none",
  months:         "flex gap-6",
  month:          "min-w-0",
  month_caption:  "flex items-center justify-between px-1 pb-3",
  caption_label:  "text-sm font-semibold text-[#F0F0F8] select-none",
  nav:            "flex items-center gap-0.5",
  button_previous: [
    "w-7 h-7 flex items-center justify-center rounded-lg",
    "text-[#55556A] hover:text-[#F0F0F8] hover:bg-white/[0.08]",
    "transition-all duration-150 outline-none",
    "focus-visible:ring-1 focus-visible:ring-[#FF2D55]/50",
    "disabled:opacity-25 disabled:pointer-events-none",
  ].join(" "),
  button_next: [
    "w-7 h-7 flex items-center justify-center rounded-lg",
    "text-[#55556A] hover:text-[#F0F0F8] hover:bg-white/[0.08]",
    "transition-all duration-150 outline-none",
    "focus-visible:ring-1 focus-visible:ring-[#FF2D55]/50",
    "disabled:opacity-25 disabled:pointer-events-none",
  ].join(" "),
  month_grid:  "w-full border-collapse",
  weekdays:    "",
  weekday:     "text-[10px] font-semibold uppercase tracking-widest text-[#55556A] text-center pb-2 w-9",
  weeks:       "",
  week:        "",
  day:         "p-[2px] relative text-center",
  day_button: [
    "w-8 h-8 rounded-lg text-sm",
    "transition-all duration-100 outline-none font-normal",
    "mx-auto flex items-center justify-center w-full",
    "text-[#C8C8E0] hover:bg-white/[0.08] hover:text-[#F0F0F8]",
    "focus-visible:ring-1 focus-visible:ring-[#FF2D55]/50",
  ].join(" "),
  today:        "bf-day-today",
  selected:     "bf-day-selected",
  range_start:  "bf-day-range-start",
  range_end:    "bf-day-range-end",
  range_middle: "bf-day-range-mid",
  outside:      "bf-day-outside",
  disabled:     "bf-day-disabled",
  hidden:       "invisible",
  chevron:      "hidden",
};

// ─── Custom chevron icons (Lucide) ────────────────────────────────────────────

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

export interface DatePickerProps {
  value?:            Date | null;
  onChange?:         (date: Date | null) => void;
  placeholder?:      string;
  /** Date format string for the trigger display. Defaults to "MMM d, yyyy". */
  displayFormat?:    string;
  size?:             "sm" | "md" | "lg";
  disabled?:         boolean;
  clearable?:        boolean;
  minDate?:          Date;
  maxDate?:          Date;
  /** Extra dates to disable. Accepts any react-day-picker Matcher. */
  disabledDates?:    DayPickerProps["disabled"];
  label?:            string;
  helperText?:       string;
  errorText?:        string;
  wrapperClassName?: string;
  className?:        string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DatePicker = forwardRef<HTMLButtonElement, DatePickerProps>(
  (
    {
      value,
      onChange,
      placeholder      = "Pick a date…",
      displayFormat    = "MMM d, yyyy",
      size             = "md",
      disabled         = false,
      clearable        = false,
      minDate,
      maxDate,
      disabledDates,
      label,
      helperText,
      errorText,
      wrapperClassName,
      className,
    },
    ref
  ) => {
    const uid      = useId();
    const [open, setOpen] = useState(false);
    const hasError = !!errorText;

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

    const handleSelect = useCallback(
      (date: Date | undefined) => {
        onChange?.(date ?? null);
        setOpen(false);
      },
      [onChange]
    );

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.(null);
      },
      [onChange]
    );

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

        <RadixPopover.Root open={open} onOpenChange={setOpen} modal={false}>
          <RadixPopover.Trigger asChild>
            <button
              ref={ref}
              id={`${uid}-trigger`}
              type="button"
              aria-label={value ? formatDate(value, displayFormat) : placeholder}
              disabled={disabled}
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
              {/* Calendar icon */}
              <CalendarIcon
                size={size === "sm" ? 13 : 14}
                className={cn(
                  "shrink-0 transition-colors",
                  value ? "text-[#FF2D55]" : "text-[#55556A]"
                )}
              />

              {/* Display value / placeholder */}
              <span
                className={cn(
                  "flex-1 text-left truncate",
                  value ? "text-[#F0F0F8]" : "text-[#55556A]"
                )}
              >
                {value ? formatDate(value, displayFormat) : placeholder}
              </span>

              {/* Clear button */}
              {clearable && value && (
                <span
                  role="button"
                  aria-label="Clear date"
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
              className="z-40 outline-none"
            >
              <AnimatePresence>
                {open && (
                  <motion.div
                    key="datepicker-panel"
                    {...scaleInProps()}
                    className={cn(
                      "rounded-2xl border border-white/[0.10]",
                      "bg-[#1C1C2A]",
                      "shadow-[0_20px_80px_rgba(0,0,0,0.55)]",
                      "backdrop-blur-xl",
                      "p-4"
                    )}
                  >
                    <DayPicker
                      mode="single"
                      selected={value ?? undefined}
                      onSelect={handleSelect}
                      disabled={disabledMatcher}
                      defaultMonth={value ?? new Date()}
                      classNames={rdpBaseClassNames}
                      components={{ Chevron: CustomChevron }}
                    />
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
);

DatePicker.displayName = "DatePicker";

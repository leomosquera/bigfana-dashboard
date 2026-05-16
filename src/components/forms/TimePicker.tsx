"use client";

/**
 * BigFana TimePicker
 *
 * Scroll-wheel / keyboard drum-roll time picker.
 * Features:
 * - 12h / 24h toggle
 * - Optional seconds column
 * - Mouse-wheel scroll to change values
 * - Keyboard arrow keys on focus
 * - Smooth scroll-snap to selected item
 * - Popover-based (same visual language as DatePicker)
 * - Timezone-ready architecture (value is always raw h/m/s integers)
 *
 * Usage:
 *   <TimePicker value={time} onChange={setTime} label="Event time" />
 */

import * as RadixPopover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import { ClockIcon, X } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";
import { scaleInProps } from "@/lib/design-system/motion";
import { type TimeValue, formatTime } from "@/lib/date-utils";

// ─── Constants ────────────────────────────────────────────────────────────────

const ITEM_H  = 36; // px per item
const VISIBLE = 7;  // items visible in column
const PAD     = Math.floor(VISIBLE / 2); // padding rows above/below

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function buildHours(is24: boolean): { value: number; label: string }[] {
  if (is24) return Array.from({ length: 24 }, (_, i) => ({ value: i, label: pad(i) }));
  return Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: pad(i + 1),
  }));
}

function buildMinutes(): { value: number; label: string }[] {
  return Array.from({ length: 60 }, (_, i) => ({ value: i, label: pad(i) }));
}

// ─── TimeColumn ───────────────────────────────────────────────────────────────

interface TimeColumnProps {
  items:     { value: number; label: string }[];
  selected:  number;
  onSelect:  (v: number) => void;
  label:     string;
}

function TimeColumn({ items, selected, onSelect, label }: TimeColumnProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef       = useRef<number>(0);

  // ── Scroll to selected ─────────────────────────────────────────────────────
  const mountedRef = useRef(false);

  const scrollToSelected = useCallback(
    (smooth = true) => {
      const el  = containerRef.current;
      if (!el) return;
      const idx = items.findIndex((i) => i.value === selected);
      if (idx < 0) return;
      const target = idx * ITEM_H;
      if (smooth) {
        el.scrollTo({ top: target, behavior: "smooth" });
      } else {
        el.scrollTop = target;
      }
    },
    [items, selected]
  );

  useEffect(() => {
    // Instant scroll on first mount, smooth on subsequent selection changes
    scrollToSelected(!mountedRef.current ? false : true);
    mountedRef.current = true;
  }, [scrollToSelected]);

  // ── Wheel handler ──────────────────────────────────────────────────────────
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const idx  = items.findIndex((i) => i.value === selected);
        const next = e.deltaY > 0
          ? Math.min(idx + 1, items.length - 1)
          : Math.max(idx - 1, 0);
        if (next !== idx) onSelect(items[next].value);
      });
    },
    [items, selected, onSelect]
  );

  // ── Keyboard handler ───────────────────────────────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
      e.preventDefault();
      const idx  = items.findIndex((i) => i.value === selected);
      const next = e.key === "ArrowDown"
        ? Math.min(idx + 1, items.length - 1)
        : Math.max(idx - 1, 0);
      if (next !== idx) onSelect(items[next].value);
    },
    [items, selected, onSelect]
  );

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Column label */}
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#55556A] pb-1">
        {label}
      </span>

      {/* Drum-roll container */}
      <div className="relative">
        {/* Highlight ring — marks the selected row */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 rounded-lg border border-[#FF2D55]/25 bg-[#FF2D55]/[0.06]"
          style={{
            top:    PAD * ITEM_H,
            height: ITEM_H,
          }}
        />

        {/* Top fade */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-20"
          style={{
            height: PAD * ITEM_H,
            background: "linear-gradient(to bottom, #1C1C2A 0%, transparent 100%)",
          }}
        />

        {/* Bottom fade */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20"
          style={{
            height: PAD * ITEM_H,
            background: "linear-gradient(to top, #1C1C2A 0%, transparent 100%)",
          }}
        />

        {/* Scrollable list */}
        <div
          ref={containerRef}
          tabIndex={0}
          role="listbox"
          aria-label={label}
          aria-activedescendant={`${label}-${selected}`}
          onWheel={handleWheel}
          onKeyDown={handleKeyDown}
          className={cn(
            "overflow-y-auto outline-none",
            "scrollbar-hide focus-visible:ring-1 focus-visible:ring-[#FF2D55]/40 rounded-lg"
          )}
          style={{
            height: VISIBLE * ITEM_H,
            width:  56,
            scrollbarWidth: "none",
          }}
        >
          {/* Top padding rows */}
          {Array.from({ length: PAD }, (_, i) => (
            <div key={`pad-top-${i}`} style={{ height: ITEM_H }} />
          ))}

          {items.map((item) => (
            <button
              key={item.value}
              id={`${label}-${item.value}`}
              role="option"
              aria-selected={item.value === selected}
              type="button"
              onClick={() => onSelect(item.value)}
              className={cn(
                "w-full flex items-center justify-center rounded-lg",
                "text-sm font-medium transition-all duration-100 outline-none",
                "focus-visible:ring-1 focus-visible:ring-[#FF2D55]/50",
                item.value === selected
                  ? "text-[#F0F0F8]"
                  : "text-[#55556A] hover:text-[#C8C8E0]"
              )}
              style={{ height: ITEM_H }}
            >
              {item.label}
            </button>
          ))}

          {/* Bottom padding rows */}
          {Array.from({ length: PAD }, (_, i) => (
            <div key={`pad-bot-${i}`} style={{ height: ITEM_H }} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── AM/PM Column ─────────────────────────────────────────────────────────────

function AmPmColumn({
  value,
  onChange,
}: {
  value:    "AM" | "PM";
  onChange: (v: "AM" | "PM") => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#55556A] pb-1">
        Period
      </span>
      <div
        className="flex flex-col justify-center gap-2"
        style={{ height: VISIBLE * ITEM_H, width: 48 }}
      >
        {(["AM", "PM"] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={cn(
              "h-9 w-full rounded-lg text-sm font-semibold transition-all duration-150",
              "outline-none focus-visible:ring-1 focus-visible:ring-[#FF2D55]/50",
              p === value
                ? "bg-[#FF2D55]/10 text-[#FF2D55] border border-[#FF2D55]/25"
                : "text-[#55556A] hover:text-[#F0F0F8] hover:bg-white/[0.06]"
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Separator ────────────────────────────────────────────────────────────────

function ColSep() {
  return (
    <div
      className="flex items-center justify-center text-[#55556A] font-bold text-lg select-none"
      style={{ marginTop: 26, height: ITEM_H * VISIBLE }}
    >
      :
    </div>
  );
}

// ─── Size tokens ──────────────────────────────────────────────────────────────

const triggerHeight = { sm: "h-8",  md: "h-10", lg: "h-11" } as const;
const triggerPx     = { sm: "px-2.5", md: "px-3", lg: "px-3.5" } as const;
const triggerText   = { sm: "text-xs", md: "text-sm", lg: "text-sm" } as const;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TimePickerProps {
  value?:            TimeValue | null;
  onChange?:         (time: TimeValue) => void;
  /** 12-hour mode (default) or 24-hour mode */
  is24?:             boolean;
  /** Show seconds column */
  withSeconds?:      boolean;
  placeholder?:      string;
  size?:             "sm" | "md" | "lg";
  disabled?:         boolean;
  clearable?:        boolean;
  label?:            string;
  helperText?:       string;
  errorText?:        string;
  wrapperClassName?: string;
  className?:        string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TimePicker({
  value,
  onChange,
  is24           = false,
  withSeconds    = false,
  placeholder    = "Select time…",
  size           = "md",
  disabled       = false,
  clearable      = false,
  label,
  helperText,
  errorText,
  wrapperClassName,
  className,
}: TimePickerProps) {
  const uid      = useId();
  const [open, setOpen] = useState(false);
  const hasError = !!errorText;

  // ── Internal draft state ───────────────────────────────────────────────────
  const [draftH,  setDraftH]  = useState<number>(() => value?.hours   ?? (is24 ? 0 : 12));
  const [draftM,  setDraftM]  = useState<number>(() => value?.minutes ?? 0);
  const [draftS,  setDraftS]  = useState<number>(() => value?.seconds ?? 0);
  const [draftAP, setDraftAP] = useState<"AM" | "PM">(() => {
    if (is24 || !value) return "AM";
    return value.hours < 12 ? "AM" : "PM";
  });

  const handleOpen = useCallback((next: boolean) => {
    if (next && value) {
      const raw = value.hours;
      if (is24) {
        setDraftH(raw);
      } else {
        const h12 = raw % 12 === 0 ? 12 : raw % 12;
        setDraftH(h12);
        setDraftAP(raw < 12 ? "AM" : "PM");
      }
      setDraftM(value.minutes);
      setDraftS(value.seconds ?? 0);
    }
    setOpen(next);
  }, [value, is24]);

  const hours   = buildHours(is24);
  const minutes = buildMinutes();
  const seconds = buildMinutes(); // same 0–59 range

  // ── Commit on any change ───────────────────────────────────────────────────
  const commit = useCallback((h: number, m: number, s: number, ap: "AM" | "PM") => {
    let finalH = h;
    if (!is24) {
      if (ap === "AM") finalH = h === 12 ? 0 : h;
      else             finalH = h === 12 ? 12 : h + 12;
    }
    onChange?.({
      hours:   finalH,
      minutes: m,
      seconds: withSeconds ? s : undefined,
    });
  }, [is24, withSeconds, onChange]);

  const handleHour   = (v: number) => { setDraftH(v);  commit(v,      draftM, draftS,  draftAP); };
  const handleMinute = (v: number) => { setDraftM(v);  commit(draftH, v,      draftS,  draftAP); };
  const handleSecond = (v: number) => { setDraftS(v);  commit(draftH, draftM, v,       draftAP); };
  const handleAmPm   = (v: "AM" | "PM") => { setDraftAP(v); commit(draftH, draftM, draftS, v); };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.({ hours: 0, minutes: 0 });
  };

  // ── Display string ─────────────────────────────────────────────────────────
  const displayValue = value != null
    ? formatTime(value.hours, value.minutes, withSeconds ? (value.seconds ?? 0) : undefined, is24)
    : null;

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
            <ClockIcon
              size={size === "sm" ? 13 : 14}
              className={cn(
                "shrink-0 transition-colors",
                displayValue ? "text-[#FF2D55]" : "text-[#55556A]"
              )}
            />
            <span className={cn(
              "flex-1 text-left font-mono tracking-wide",
              displayValue ? "text-[#F0F0F8]" : "text-[#55556A]"
            )}>
              {displayValue ?? placeholder}
            </span>
            {clearable && value != null && (
              <span
                role="button"
                aria-label="Clear time"
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
                  key="timepicker-panel"
                  {...scaleInProps()}
                  className={cn(
                    "rounded-2xl border border-white/[0.10]",
                    "bg-[#1C1C2A]",
                    "shadow-[0_20px_80px_rgba(0,0,0,0.55)]",
                    "backdrop-blur-xl"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 pt-3 pb-0">
                    <p className="text-xs font-semibold text-[#8888AA]">Select time</p>
                    {/* 24h toggle */}
                    <div className="flex items-center gap-1 rounded-lg bg-white/[0.04] border border-white/[0.06] p-0.5">
                      {(["12h", "24h"] as const).map((mode) => {
                        const isActive = mode === "24h" ? is24 : !is24;
                        return (
                          <span
                            key={mode}
                            className={cn(
                              "px-2 h-5 flex items-center justify-center rounded-md text-[10px] font-semibold",
                              "transition-all duration-150 select-none cursor-default",
                              isActive
                                ? "bg-[#FF2D55]/15 text-[#FF2D55]"
                                : "text-[#55556A]"
                            )}
                          >
                            {mode}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Columns */}
                  <div className="flex items-start gap-0 px-3 pb-3 pt-1">
                    <TimeColumn
                      label="Hour"
                      items={hours}
                      selected={draftH}
                      onSelect={handleHour}
                    />
                    <ColSep />
                    <TimeColumn
                      label="Min"
                      items={minutes}
                      selected={draftM}
                      onSelect={handleMinute}
                    />
                    {withSeconds && (
                      <>
                        <ColSep />
                        <TimeColumn
                          label="Sec"
                          items={seconds}
                          selected={draftS}
                          onSelect={handleSecond}
                        />
                      </>
                    )}
                    {!is24 && (
                      <>
                        <div style={{ width: 8 }} />
                        <AmPmColumn value={draftAP} onChange={handleAmPm} />
                      </>
                    )}
                  </div>

                  {/* Current value display */}
                  <div className="px-4 pb-3 text-center">
                    <p className="text-xl font-bold font-mono text-[#F0F0F8] tracking-widest">
                      {formatTime(
                        (() => {
                          if (is24) return draftH;
                          if (draftAP === "AM") return draftH === 12 ? 0 : draftH;
                          return draftH === 12 ? 12 : draftH + 12;
                        })(),
                        draftM,
                        withSeconds ? draftS : undefined,
                        is24
                      )}
                    </p>
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

TimePicker.displayName = "TimePicker";

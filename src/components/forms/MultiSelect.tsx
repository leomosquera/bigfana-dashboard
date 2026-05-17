"use client";

/**
 * BigFana MultiSelect
 *
 * Multi-value selection with removable chips, search, grouped options,
 * select all, overflow counter, compact mode, and full keyboard navigation.
 *
 * Built on @radix-ui/react-popover for the float layer.
 * Uses ScrollArea for long option lists.
 *
 * Usage:
 *   <MultiSelect
 *     value={values}
 *     onChange={setValues}
 *     options={kpiOptions}
 *     placeholder="Select metrics…"
 *     maxSelections={5}
 *     overflowAt={2}
 *   />
 */

import * as RadixPopover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronDown, Loader2, Search, X, CheckSquare, Square,
} from "lucide-react";
import {
  useCallback, useId, useMemo, useRef, useState,
} from "react";
import { scaleInProps } from "@/lib/design-system/motion";
import { zLayerTw } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/ScrollArea";

// ─── Types (shared with Combobox) ─────────────────────────────────────────────

export interface MultiSelectOption {
  value:        string;
  label:        string;
  icon?:        React.ReactNode;
  description?: string;
  disabled?:    boolean;
}

export interface MultiSelectGroup {
  group:   string;
  options: MultiSelectOption[];
}

export type MultiSelectItems = MultiSelectOption[] | MultiSelectGroup[];

// ─── Size tokens (matches Select.tsx) ────────────────────────────────────────

const triggerMinHeight = { sm: "min-h-[32px]", md: "min-h-[40px]", lg: "min-h-[44px]" } as const;
const triggerPx        = { sm: "px-2.5",       md: "px-3",          lg: "px-3.5"        } as const;
const triggerText      = { sm: "text-xs",       md: "text-sm",       lg: "text-sm"       } as const;
const chipSize         = { sm: "text-[10px] px-1.5 py-0.5 gap-1", md: "text-xs px-2 py-0.5 gap-1", lg: "text-xs px-2 py-1 gap-1.5" } as const;
const chevronSize      = { sm: 12, md: 14, lg: 15 } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isGrouped(items: MultiSelectItems): items is MultiSelectGroup[] {
  return items.length > 0 && "group" in items[0];
}

function flattenOptions(items: MultiSelectItems): MultiSelectOption[] {
  if (isGrouped(items)) return items.flatMap((g) => g.options);
  return items as MultiSelectOption[];
}

function filterItems(items: MultiSelectItems, query: string): MultiSelectItems {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  if (isGrouped(items)) {
    return (items as MultiSelectGroup[])
      .map((g) => ({
        ...g,
        options: g.options.filter(
          (o) =>
            o.label.toLowerCase().includes(q) ||
            o.description?.toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.options.length > 0);
  }
  return (items as MultiSelectOption[]).filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q)
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface ChipProps {
  label:    string;
  onRemove: () => void;
  size:     "sm" | "md" | "lg";
  disabled?: boolean;
}

function Chip({ label, onRemove, size, disabled }: ChipProps) {
  return (
    <motion.span
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{    opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.12 }}
      className={cn(
        "inline-flex items-center rounded-lg shrink-0",
        "bg-[#FF2D55]/[0.12] text-[#FF2D55] border border-[#FF2D55]/20",
        "font-medium leading-none",
        chipSize[size]
      )}
    >
      <span className="truncate max-w-[120px]">{label}</span>
      {!disabled && (
        <button
          type="button"
          aria-label={`Remove ${label}`}
          data-ms-chip-remove="true"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X size={9} strokeWidth={2.5} />
        </button>
      )}
    </motion.span>
  );
}

// ─── Multi-select option item ─────────────────────────────────────────────────

interface MultiOptionItemProps {
  option:       MultiSelectOption;
  isSelected:   boolean;
  isActive:     boolean;
  onToggle:     (o: MultiSelectOption) => void;
  id:           string;
  maxReached:   boolean;
}

function MultiOptionItem({
  option, isSelected, isActive, onToggle, id, maxReached,
}: MultiOptionItemProps) {
  const isDisabled = option.disabled || (!isSelected && maxReached);

  return (
    <li
      id={id}
      role="option"
      aria-selected={isSelected}
      aria-disabled={isDisabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => !isDisabled && onToggle(option)}
      className={cn(
        "relative flex items-center gap-2.5 mx-1 px-2.5 py-2 rounded-lg",
        "cursor-pointer select-none outline-none",
        "transition-colors duration-100",
        isActive  && !isDisabled && "bg-white/[0.08] text-[#F0F0F8]",
        !isActive && !isDisabled && "text-[#C8C8E0] hover:bg-white/[0.05] hover:text-[#F0F0F8]",
        isDisabled && "opacity-40 pointer-events-none text-[#55556A]"
      )}
    >
      {/* Checkbox indicator */}
      <span className="w-4 h-4 flex items-center justify-center shrink-0">
        {isSelected
          ? <CheckSquare size={14} className="text-[#FF2D55]" />
          : <Square size={14} className="text-[#55556A]" />
        }
      </span>

      {/* Option icon */}
      {option.icon && (
        <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#8888AA]">
          {option.icon}
        </span>
      )}

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate leading-tight">{option.label}</p>
        {option.description && (
          <p className="text-[10px] text-[#55556A] truncate mt-0.5 leading-tight">
            {option.description}
          </p>
        )}
      </div>
    </li>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface MultiSelectProps {
  value?:             string[];
  onChange?:          (values: string[]) => void;
  options:            MultiSelectItems;
  placeholder?:       string;
  searchPlaceholder?: string;
  size?:              "sm" | "md" | "lg";
  disabled?:          boolean;
  loading?:           boolean;
  /** Prevent selecting more than N items */
  maxSelections?:     number;
  /**
   * compact: shows "N selected" chip instead of individual chips.
   * Use when space is limited.
   */
  compact?:           boolean;
  /** Show individual chips, but collapse beyond this count to "+N more" */
  overflowAt?:        number;
  /** Show "Select all" toggle in the panel */
  selectAll?:         boolean;
  /** Called on every keystroke — hook for async option loading */
  onSearchChange?:    (query: string) => void;
  label?:             string;
  helperText?:        string;
  errorText?:         string;
  emptyMessage?:      string;
  wrapperClassName?:  string;
  className?:         string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiSelect({
  value             = [],
  onChange,
  options,
  placeholder       = "Select options…",
  searchPlaceholder = "Search…",
  size              = "md",
  disabled          = false,
  loading           = false,
  maxSelections,
  compact           = false,
  overflowAt,
  selectAll         = false,
  onSearchChange,
  label,
  helperText,
  errorText,
  emptyMessage = "No results found",
  wrapperClassName,
  className,
}: MultiSelectProps) {
  const uid        = useId();
  const inputRef   = useRef<HTMLInputElement>(null);
  const anchorRef  = useRef<HTMLDivElement>(null);

  const [open,        setOpen]        = useState(false);
  const [search,      setSearch]      = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const hasError = !!errorText;

  // Memoize all derived option lists to keep callback deps stable
  const allFlat = useMemo(
    () => flattenOptions(options).filter((o) => !o.disabled),
    [options]
  );
  const filtered = useMemo(
    () => filterItems(options, search),
    [options, search]
  );
  const flatFiltered = useMemo(
    () => flattenOptions(filtered).filter((o) => !o.disabled),
    [filtered]
  );
  const maxReached = maxSelections !== undefined && value.length >= maxSelections;

  // All-selected state for "select all" feature
  const allSelected  = useMemo(() => allFlat.every((o) => value.includes(o.value)), [allFlat, value]);
  const someSelected = useMemo(() => allFlat.some((o) => value.includes(o.value)) && !allSelected, [allFlat, value, allSelected]);

  // Close handler resets search + highlight — not in a useEffect
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        setSearch("");
        setActiveIndex(-1);
        onSearchChange?.("");
      }
    },
    [onSearchChange]
  );

  const handleToggle = useCallback(
    (option: MultiSelectOption) => {
      const next = value.includes(option.value)
        ? value.filter((v) => v !== option.value)
        : maxReached
          ? value
          : [...value, option.value];
      onChange?.(next);
    },
    [value, onChange, maxReached]
  );

  const handleRemove = useCallback(
    (val: string) => {
      onChange?.(value.filter((v) => v !== val));
    },
    [value, onChange]
  );

  const handleClearAll = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.([]);
    },
    [onChange]
  );

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      onChange?.([]);
    } else {
      // Read current allFlat via options prop directly to avoid mutable dep
      const enabledValues = flattenOptions(options)
        .filter((o) => !o.disabled)
        .map((o) => o.value);
      const next = maxSelections
        ? enabledValues.slice(0, maxSelections)
        : enabledValues;
      onChange?.(next);
    }
  }, [allSelected, options, onChange, maxSelections]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Snapshot navigable options at call time to avoid mutable dep warning
      const navigable = flattenOptions(filterItems(options, search)).filter((o) => !o.disabled);
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((i) => Math.min(i + 1, navigable.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && navigable[activeIndex]) {
            handleToggle(navigable[activeIndex]);
          }
          break;
        case "Backspace":
          if (!search && value.length > 0) {
            handleRemove(value[value.length - 1]);
          }
          break;
        case "Escape":
          e.preventDefault();
          handleOpenChange(false);
          break;
        case "Tab":
          handleOpenChange(false);
          break;
      }
    },
    [activeIndex, options, search, handleToggle, value, handleRemove, handleOpenChange]
  );

  // Reset active index in the search handler — not in a useEffect
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
      setActiveIndex(-1);
      onSearchChange?.(e.target.value);
    },
    [onSearchChange]
  );

  // ── Trigger content rendering ────────────────────────────────────────────

  const selectedOptions = value
    .map((v) => flattenOptions(options).find((o) => o.value === v))
    .filter(Boolean) as MultiSelectOption[];

  function renderTriggerContent() {
    if (value.length === 0) {
      return (
        <span className="text-[#55556A] truncate flex-1">
          {placeholder}
        </span>
      );
    }

    if (compact) {
      return (
        <span className={cn(
          "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium",
          "bg-[#FF2D55]/[0.12] text-[#FF2D55] border border-[#FF2D55]/20"
        )}>
          {value.length} selected
        </span>
      );
    }

    const visibleOptions = overflowAt !== undefined
      ? selectedOptions.slice(0, overflowAt)
      : selectedOptions;
    const overflowCount = overflowAt !== undefined
      ? Math.max(0, selectedOptions.length - overflowAt)
      : 0;

    return (
      <AnimatePresence mode="popLayout" initial={false}>
        <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0 py-1">
          {visibleOptions.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              size={size}
              disabled={disabled}
              onRemove={() => handleRemove(opt.value)}
            />
          ))}
          {overflowCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-medium bg-white/[0.06] text-[#8888AA] border border-white/[0.06] shrink-0">
              +{overflowCount} more
            </span>
          )}
        </div>
      </AnimatePresence>
    );
  }

  return (
    <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
      {/* Label */}
      {label && (
        <label
          htmlFor={`${uid}-anchor`}
          className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider"
        >
          {label}
        </label>
      )}

      <RadixPopover.Root open={open} onOpenChange={handleOpenChange} modal={false}>
        {/* Anchor — the multi-select trigger area */}
        <RadixPopover.Anchor asChild>
          <div
            ref={anchorRef}
            id={`${uid}-anchor`}
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${uid}-listbox`}
            tabIndex={disabled ? -1 : 0}
            onPointerDown={(e) => {
              if (disabled) return;
              // Only handle clicks directly on the anchor surface (not on
              // chip remove buttons or the clear-all icon — those already
              // call stopPropagation so they never reach here, but check
              // the data attribute as a belt-and-suspenders guard).
              const target = e.target as HTMLElement;
              if (target.closest("[data-ms-chip-remove]")) return;
              // Prevent the browser from moving focus to this div on
              // mousedown. Without this, onFocus fires *before* the click
              // event, calling setOpen(true) on the same frame that onClick
              // would call setOpen(v => !v) — resulting in the popover
              // immediately closing the moment it opens.
              e.preventDefault();
              setOpen((v) => !v);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (!disabled) setOpen((v) => !v);
              }
            }}
            className={cn(
              "relative flex items-center w-full rounded-xl border cursor-pointer",
              "bg-white/[0.03] transition-all duration-200 outline-none",
              "focus:ring-2 focus:ring-[#FF2D55]/30",
              hasError
                ? "border-red-500/40 focus:border-red-500/60"
                : "border-white/[0.08] hover:border-white/[0.14] focus:border-[#FF2D55]/40 focus:bg-[#141420]",
              open && "border-[#FF2D55]/40 bg-[#141420] ring-2 ring-[#FF2D55]/30",
              disabled && "opacity-40 pointer-events-none",
              triggerMinHeight[size],
              triggerPx[size],
              triggerText[size],
              "gap-2 flex-wrap",
              className
            )}
          >
            {/* Chips / placeholder */}
            {renderTriggerContent()}

            <div className="ml-auto flex items-center gap-1 shrink-0 pl-1">
              {/* Loading */}
              {loading && <Loader2 size={13} className="animate-spin text-[#55556A]" />}

              {/* Clear all */}
              {value.length > 0 && !loading && !disabled && (
                <span
                  role="button"
                  aria-label="Clear all selections"
                  data-ms-chip-remove="true"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={handleClearAll}
                  className="w-4 h-4 flex items-center justify-center rounded text-[#55556A] hover:text-[#F0F0F8] transition-colors"
                >
                  <X size={11} />
                </span>
              )}

              {/* Chevron */}
              <motion.span
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-[#55556A]"
              >
                <ChevronDown size={chevronSize[size]} />
              </motion.span>
            </div>
          </div>
        </RadixPopover.Anchor>

        <RadixPopover.Portal>
          <RadixPopover.Content
            sideOffset={6}
            collisionPadding={12}
            align="start"
            forceMount
            onOpenAutoFocus={(e) => {
              // Move focus into the search input immediately on open.
              // This ensures focus is inside the Content from the first
              // frame, preventing Radix's DismissableLayer from seeing
              // "focus outside" and closing the panel.
              e.preventDefault();
              inputRef.current?.focus();
            }}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onFocusOutside={(e) => {
              // Prevent close when focus moves to the anchor (e.g. the
              // user clicks the anchor area while the panel is open).
              if (anchorRef.current?.contains(e.target as Node)) {
                e.preventDefault();
              }
            }}
            onInteractOutside={(e) => {
              // Prevent Radix from closing when the user clicks anywhere
              // on the anchor div (chips, chevron, clear button, etc.).
              if (anchorRef.current?.contains(e.target as Node)) {
                e.preventDefault();
              }
            }}
            className={cn(zLayerTw("nestedOverlay"), "outline-none")}
            style={{ minWidth: "var(--radix-popover-trigger-width)" }}
          >
            <AnimatePresence>
              {open && (
                <motion.div
                  key="multiselect-panel"
                  {...scaleInProps()}
                  className={cn(
                    "rounded-2xl border border-white/[0.10]",
                    "bg-[#1C1C2A]",
                    "shadow-[0_20px_80px_rgba(0,0,0,0.55)]",
                    "backdrop-blur-xl overflow-hidden",
                    "min-w-[220px]"
                  )}
                >
                  {/* Search */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/[0.06]">
                    <Search size={13} className="shrink-0 text-[#55556A]" />
                    <input
                      ref={inputRef}
                      type="text"
                      role="searchbox"
                      aria-label="Search options"
                      value={search}
                      onChange={handleSearchChange}
                      onKeyDown={handleKeyDown}
                      placeholder={searchPlaceholder}
                      className="flex-1 bg-transparent text-sm text-[#F0F0F8] placeholder:text-[#55556A] outline-none"
                    />
                    {search && (
                      <button
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setSearch(""); onSearchChange?.(""); }}
                        className="text-[#55556A] hover:text-[#F0F0F8] transition-colors"
                      >
                        <X size={11} />
                      </button>
                    )}
                  </div>

                  {/* Select all + count header */}
                  {(selectAll || value.length > 0) && !search && (
                    <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.04]">
                      {selectAll && (
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={handleSelectAll}
                          className="flex items-center gap-2 text-xs text-[#8888AA] hover:text-[#F0F0F8] transition-colors"
                        >
                          {allSelected
                            ? <CheckSquare size={13} className="text-[#FF2D55]" />
                            : someSelected
                              ? <CheckSquare size={13} className="text-[#FF2D55]/50" />
                              : <Square size={13} />
                          }
                          <span>{allSelected ? "Deselect all" : "Select all"}</span>
                        </button>
                      )}
                      {value.length > 0 && (
                        <span className="ml-auto text-[10px] text-[#55556A]">
                          {value.length}{maxSelections ? `/${maxSelections}` : ""} selected
                        </span>
                      )}
                    </div>
                  )}

                  {/* Options */}
                  <ScrollArea maxHeight={280}>
                    {loading ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-[#55556A]">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="text-xs">Loading…</span>
                      </div>
                    ) : flattenOptions(filtered).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 gap-1.5">
                        <Search size={16} className="text-[#55556A]" />
                        <p className="text-xs text-[#55556A]">{emptyMessage}</p>
                      </div>
                    ) : (
                      <ul
                        id={`${uid}-listbox`}
                        role="listbox"
                        aria-multiselectable="true"
                        aria-label="Options"
                        className="py-1.5"
                      >
                        {isGrouped(filtered)
                          ? (filtered as MultiSelectGroup[]).map((group) => (
                              <li key={group.group} role="presentation">
                                <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-widest text-[#55556A]">
                                  {group.group}
                                </p>
                                <ul role="group" aria-label={group.group}>
                                  {group.options.map((option) => {
                                    const globalIdx = flatFiltered.findIndex(
                                      (o) => o.value === option.value
                                    );
                                    return (
                                      <MultiOptionItem
                                        key={option.value}
                                        id={`${uid}-opt-${option.value}`}
                                        option={option}
                                        isSelected={value.includes(option.value)}
                                        isActive={globalIdx === activeIndex}
                                        onToggle={handleToggle}
                                        maxReached={maxReached}
                                      />
                                    );
                                  })}
                                </ul>
                              </li>
                            ))
                          : (filtered as MultiSelectOption[]).map((option) => {
                              const idx = flatFiltered.findIndex(
                                (o) => o.value === option.value
                              );
                              return (
                                <MultiOptionItem
                                  key={option.value}
                                  id={`${uid}-opt-${option.value}`}
                                  option={option}
                                  isSelected={value.includes(option.value)}
                                  isActive={idx === activeIndex}
                                  onToggle={handleToggle}
                                  maxReached={maxReached}
                                />
                              );
                            })
                        }
                      </ul>
                    )}
                  </ScrollArea>

                  {/* Footer — max hint */}
                  {maxSelections && (
                    <div className="px-3 py-2 border-t border-white/[0.04]">
                      <p className={cn(
                        "text-[10px]",
                        maxReached ? "text-[#FF2D55]" : "text-[#55556A]"
                      )}>
                        {maxReached
                          ? `Maximum of ${maxSelections} selections reached`
                          : `Select up to ${maxSelections} options`
                        }
                      </p>
                    </div>
                  )}
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

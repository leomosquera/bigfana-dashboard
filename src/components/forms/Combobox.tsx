"use client";

/**
 * BigFana Combobox
 *
 * Searchable single-select with grouped options, icons, loading state,
 * empty state, clear selection, and full keyboard navigation.
 *
 * Built on @radix-ui/react-popover for the float layer.
 * Uses ScrollArea for long option lists.
 * Async-ready: parent drives `options` + `loading` + optional `onSearchChange`.
 *
 * Usage:
 *   <Combobox
 *     value={val}
 *     onChange={setVal}
 *     options={groupedOptions}
 *     placeholder="Select fan segment..."
 *     clearable
 *   />
 */

import * as RadixPopover from "@radix-ui/react-popover";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, ChevronDown, Loader2, Search, X,
} from "lucide-react";
import {
  forwardRef, useCallback, useEffect, useId, useMemo, useRef, useState,
} from "react";
import { scaleInProps } from "@/lib/design-system/motion";
import { zLayerTw } from "@/lib/design-system/tokens";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/ScrollArea";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ComboboxOption {
  value:        string;
  label:        string;
  icon?:        React.ReactNode;
  description?: string;
  disabled?:    boolean;
}

export interface ComboboxGroup {
  group:   string;
  options: ComboboxOption[];
}

export type ComboboxItems = ComboboxOption[] | ComboboxGroup[];

// ─── Size tokens (matches Select.tsx) ────────────────────────────────────────

const triggerHeight = { sm: "h-8",  md: "h-10", lg: "h-11" } as const;
const triggerPx     = { sm: "px-2.5", md: "px-3", lg: "px-3.5" } as const;
const triggerText   = { sm: "text-xs", md: "text-sm", lg: "text-sm" } as const;
const chevronSize   = { sm: 12, md: 14, lg: 15 } as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isGrouped(items: ComboboxItems): items is ComboboxGroup[] {
  return items.length > 0 && "group" in items[0];
}

/** Flatten all options from grouped or flat list */
function flattenOptions(items: ComboboxItems): ComboboxOption[] {
  if (isGrouped(items)) return items.flatMap((g) => g.options);
  return items as ComboboxOption[];
}

/** Filter keeping structure */
function filterItems(items: ComboboxItems, query: string): ComboboxItems {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  if (isGrouped(items)) {
    return (items as ComboboxGroup[])
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
  return (items as ComboboxOption[]).filter(
    (o) =>
      o.label.toLowerCase().includes(q) ||
      o.description?.toLowerCase().includes(q)
  );
}

// ─── Option item ──────────────────────────────────────────────────────────────

interface OptionItemProps {
  option:       ComboboxOption;
  isSelected:   boolean;
  isActive:     boolean;
  onSelect:     (o: ComboboxOption) => void;
  id:           string;
}

function OptionItem({ option, isSelected, isActive, onSelect, id }: OptionItemProps) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={isSelected}
      aria-disabled={option.disabled}
      onMouseDown={(e) => e.preventDefault()} // keep search input focused
      onClick={() => !option.disabled && onSelect(option)}
      className={cn(
        "relative flex items-center gap-2.5 mx-1 px-2.5 py-2 rounded-lg",
        "cursor-pointer select-none outline-none",
        "transition-colors duration-100",
        isActive   && !option.disabled && "bg-white/[0.08] text-[#F0F0F8]",
        !isActive  && !option.disabled && "text-[#C8C8E0] hover:bg-white/[0.05] hover:text-[#F0F0F8]",
        option.disabled && "opacity-40 pointer-events-none text-[#55556A]"
      )}
    >
      {/* Icon / check slot */}
      <span className="w-4 h-4 flex items-center justify-center shrink-0 text-[#8888AA]">
        {isSelected
          ? <Check size={13} className="text-[#FF2D55]" />
          : option.icon ?? null
        }
      </span>

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

export interface ComboboxProps {
  value?:             string | null;
  onChange?:          (value: string | null) => void;
  options:            ComboboxItems;
  placeholder?:       string;
  searchPlaceholder?: string;
  size?:              "sm" | "md" | "lg";
  disabled?:          boolean;
  loading?:           boolean;
  clearable?:         boolean;
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

export const Combobox = forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      value,
      onChange,
      options,
      placeholder       = "Select option…",
      searchPlaceholder = "Search…",
      size              = "md",
      disabled          = false,
      loading           = false,
      clearable         = false,
      onSearchChange,
      label,
      helperText,
      errorText,
      emptyMessage = "No results found",
      wrapperClassName,
      className,
    },
    ref
  ) => {
    const uid          = useId();
    const inputRef     = useRef<HTMLInputElement>(null);
    const listRef      = useRef<HTMLUListElement>(null);
    const itemRefs     = useRef<(HTMLLIElement | null)[]>([]);

    const [open,         setOpen]         = useState(false);
    const [search,       setSearch]       = useState("");
    const [activeIndex,  setActiveIndex]  = useState<number>(-1);

    const hasError = !!errorText;

    // Memoize derived option lists to keep callback deps stable
    const allFlat = useMemo(() => flattenOptions(options), [options]);
    const selectedOption = useMemo(
      () => value ? allFlat.find((o) => o.value === value) : null,
      [allFlat, value]
    );
    const filtered     = useMemo(() => filterItems(options, search), [options, search]);
    const flatFiltered = useMemo(
      () => flattenOptions(filtered).filter((o) => !o.disabled),
      [filtered]
    );

    // Scroll highlighted item into view — reads DOM only, no setState
    useEffect(() => {
      if (activeIndex >= 0 && itemRefs.current[activeIndex]) {
        itemRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
      }
    }, [activeIndex]);

    // Closing resets search + highlight — all in one handler, never in an effect
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

    const handleSelect = useCallback(
      (option: ComboboxOption) => {
        onChange?.(option.value === value ? null : option.value);
        handleOpenChange(false);
      },
      [onChange, value, handleOpenChange]
    );

    const handleClear = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.(null);
      },
      [onChange]
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, flatFiltered.length - 1));
            break;
          case "ArrowUp":
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
            break;
          case "Enter":
            e.preventDefault();
            if (activeIndex >= 0 && flatFiltered[activeIndex]) {
              handleSelect(flatFiltered[activeIndex]);
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
      [activeIndex, flatFiltered, handleSelect, handleOpenChange]
    );

    // Reset active index in the change handler — not in a useEffect
    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setActiveIndex(-1);
        onSearchChange?.(e.target.value);
      },
      [onSearchChange]
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

        {/* Popover */}
          <RadixPopover.Root open={open} onOpenChange={handleOpenChange} modal={false}>
          <RadixPopover.Trigger asChild>
            <button
              ref={ref}
              id={`${uid}-trigger`}
              type="button"
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-controls={`${uid}-listbox`}
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
              {/* Selected icon */}
              {selectedOption?.icon && (
                <span className="shrink-0 text-[#8888AA]">{selectedOption.icon}</span>
              )}

              {/* Label / placeholder */}
              <span className={cn("flex-1 text-left truncate", selectedOption ? "text-[#F0F0F8]" : "text-[#55556A]")}>
                {selectedOption?.label ?? placeholder}
              </span>

              {/* Loading spinner */}
              {loading && (
                <Loader2 size={13} className="shrink-0 animate-spin text-[#55556A]" />
              )}

              {/* Clear button */}
              {clearable && value && !loading && (
                <span
                  role="button"
                  aria-label="Clear selection"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClear}
                  className="shrink-0 w-4 h-4 flex items-center justify-center rounded text-[#55556A] hover:text-[#F0F0F8] transition-colors"
                >
                  <X size={11} />
                </span>
              )}

              {/* Chevron */}
              <motion.span
                animate={{ rotate: open ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 text-[#55556A]"
              >
                <ChevronDown size={chevronSize[size]} />
              </motion.span>
            </button>
          </RadixPopover.Trigger>

          <RadixPopover.Portal>
            <RadixPopover.Content
              sideOffset={6}
              collisionPadding={12}
              align="start"
              forceMount
              onOpenAutoFocus={(e) => {
                // Prevent Radix from focusing the Content wrapper itself;
                // instead immediately focus our search input so focus is
                // inside the Content from the very first frame — this
                // eliminates the 50ms race window where Radix could close
                // because it saw focus sitting outside the Content.
                e.preventDefault();
                inputRef.current?.focus();
              }}
              onCloseAutoFocus={(e) => e.preventDefault()}
              className={cn(zLayerTw("nestedOverlay"), "outline-none")}
              style={{ minWidth: "var(--radix-popover-trigger-width)" }}
            >
              <AnimatePresence>
                {open && (
                  <motion.div
                    key="combobox-panel"
                    {...scaleInProps()}
                    className={cn(
                      "rounded-2xl border border-white/[0.10]",
                      "bg-[#1C1C2A]",
                      "shadow-[0_20px_80px_rgba(0,0,0,0.55)]",
                      "backdrop-blur-xl overflow-hidden",
                      "min-w-[220px]"
                    )}
                  >
                    {/* Search input */}
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
                        className={cn(
                          "flex-1 bg-transparent text-sm text-[#F0F0F8]",
                          "placeholder:text-[#55556A] outline-none"
                        )}
                      />
                      {search && (
                        <button
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => { setSearch(""); onSearchChange?.(""); }}
                          className="shrink-0 text-[#55556A] hover:text-[#F0F0F8] transition-colors"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>

                    {/* Options list */}
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
                          ref={listRef}
                          id={`${uid}-listbox`}
                          role="listbox"
                          aria-label="Options"
                          className="py-1.5"
                        >
                          {isGrouped(filtered)
                            ? (filtered as ComboboxGroup[]).map((group) => (
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
                                        <OptionItem
                                          key={option.value}
                                          id={`${uid}-opt-${option.value}`}
                                          option={option}
                                          isSelected={option.value === value}
                                          isActive={globalIdx === activeIndex}
                                          onSelect={handleSelect}
                                        />
                                      );
                                    })}
                                  </ul>
                                </li>
                              ))
                            : (filtered as ComboboxOption[]).map((option) => {
                                const idx = flatFiltered.findIndex(
                                  (o) => o.value === option.value
                                );
                                return (
                                  <OptionItem
                                    key={option.value}
                                    id={`${uid}-opt-${option.value}`}
                                    option={option}
                                    isSelected={option.value === value}
                                    isActive={idx === activeIndex}
                                    onSelect={handleSelect}
                                  />
                                );
                              })
                          }
                        </ul>
                      )}
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </RadixPopover.Content>
          </RadixPopover.Portal>
        </RadixPopover.Root>

        {/* Helper / error text */}
        {(helperText || errorText) && (
          <p className={cn("text-xs", errorText ? "text-red-400" : "text-[#55556A]")}>
            {errorText ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

Combobox.displayName = "Combobox";

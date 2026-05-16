"use client";

/**
 * BigFana ScrollArea
 *
 * Thin wrapper around @radix-ui/react-scroll-area.
 * Applies the BigFana scrollbar aesthetic (slim, dark, auto-hide).
 * Used by Combobox, MultiSelect, and any overflow container.
 */

import * as RadixScrollArea from "@radix-ui/react-scroll-area";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ScrollAreaProps {
  children:    React.ReactNode;
  className?:  string;
  /** Max height applied to the Root element */
  maxHeight?:  string | number;
  /** Scrollbar orientation */
  orientation?: "vertical" | "horizontal" | "both";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScrollArea({
  children,
  className,
  maxHeight,
  orientation = "vertical",
}: ScrollAreaProps) {
  return (
    <RadixScrollArea.Root
      className={cn("overflow-hidden", className)}
      style={maxHeight !== undefined ? { maxHeight } : undefined}
    >
      <RadixScrollArea.Viewport className="w-full h-full">
        {children}
      </RadixScrollArea.Viewport>

      {(orientation === "vertical" || orientation === "both") && (
        <RadixScrollArea.Scrollbar
          orientation="vertical"
          className={cn(
            "flex select-none touch-none",
            "py-0.5 px-[3px] w-[10px]",
            "transition-[width] duration-150 ease-out hover:w-3",
            "bg-transparent"
          )}
        >
          <RadixScrollArea.Thumb
            className={cn(
              "flex-1 bg-white/[0.12] rounded-full relative",
              "hover:bg-white/[0.20]",
              // Expand hit area
              "before:content-[''] before:absolute before:top-1/2 before:left-1/2",
              "before:-translate-x-1/2 before:-translate-y-1/2",
              "before:min-w-[44px] before:min-h-[44px]"
            )}
          />
        </RadixScrollArea.Scrollbar>
      )}

      {(orientation === "horizontal" || orientation === "both") && (
        <RadixScrollArea.Scrollbar
          orientation="horizontal"
          className={cn(
            "flex select-none touch-none",
            "px-0.5 py-[3px] h-[10px]",
            "transition-[height] duration-150 ease-out hover:h-3",
            "bg-transparent"
          )}
        >
          <RadixScrollArea.Thumb
            className="flex-1 bg-white/[0.12] rounded-full hover:bg-white/[0.20]"
          />
        </RadixScrollArea.Scrollbar>
      )}

      <RadixScrollArea.Corner className="bg-transparent" />
    </RadixScrollArea.Root>
  );
}

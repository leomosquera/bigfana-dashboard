/**
 * BigFana UI Kit — Layout Primitives
 *
 * Composable, zero-logic layout helpers that replace repeated
 * Tailwind utility strings with semantic, reusable components.
 *
 * Stack    – vertical flex column
 * Inline   – horizontal flex row
 * Container – max-width wrapper
 * Grid     – responsive grid
 * Surface  – semantic dark panel (replaces raw rounded-2xl border ... divs)
 * Section  – content section with optional heading + divider
 */

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// ─── Gap mapping ─────────────────────────────────────────────────────────────

export type GapSize = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16;

const gapCls: Record<GapSize, string> = {
  0:  "gap-0",
  1:  "gap-1",
  2:  "gap-2",
  3:  "gap-3",
  4:  "gap-4",
  5:  "gap-5",
  6:  "gap-6",
  8:  "gap-8",
  10: "gap-10",
  12: "gap-12",
  16: "gap-16",
};

// ─── Stack ────────────────────────────────────────────────────────────────────

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Spacing between children */
  gap?:   GapSize;
  /** Cross-axis alignment */
  align?: "start" | "center" | "end" | "stretch";
}

/**
 * Vertical flex column.
 *
 * @example
 * <Stack gap={4} align="start">
 *   <Title />
 *   <Body />
 * </Stack>
 */
export const Stack = forwardRef<HTMLDivElement, StackProps>(
  ({ gap = 4, align = "stretch", className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex flex-col",
        gapCls[gap],
        align === "start"  && "items-start",
        align === "center" && "items-center",
        align === "end"    && "items-end",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Stack.displayName = "Stack";

// ─── Inline ───────────────────────────────────────────────────────────────────

export interface InlineProps extends React.HTMLAttributes<HTMLDivElement> {
  gap?:    GapSize;
  align?:  "start" | "center" | "end" | "baseline";
  justify?: "start" | "center" | "end" | "between" | "around";
  wrap?:   boolean;
}

/**
 * Horizontal flex row.
 *
 * @example
 * <Inline gap={2} align="center" justify="between">
 *   <Label />
 *   <Actions />
 * </Inline>
 */
export const Inline = forwardRef<HTMLDivElement, InlineProps>(
  ({ gap = 2, align = "center", justify, wrap = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "flex",
        gapCls[gap],
        wrap && "flex-wrap",
        align === "start"    && "items-start",
        align === "center"   && "items-center",
        align === "end"      && "items-end",
        align === "baseline" && "items-baseline",
        justify === "start"   && "justify-start",
        justify === "center"  && "justify-center",
        justify === "end"     && "justify-end",
        justify === "between" && "justify-between",
        justify === "around"  && "justify-around",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Inline.displayName = "Inline";

// ─── Container ────────────────────────────────────────────────────────────────

export type ContainerSize = "sm" | "md" | "lg" | "xl" | "full";

const containerSizes: Record<ContainerSize, string> = {
  sm:   "max-w-2xl",
  md:   "max-w-4xl",
  lg:   "max-w-6xl",
  xl:   "max-w-7xl",
  full: "max-w-full",
};

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: ContainerSize;
  /** Remove horizontal padding */
  noPadding?: boolean;
}

/**
 * Max-width centering wrapper.
 *
 * @example
 * <Container size="lg">
 *   <PageContent />
 * </Container>
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = "xl", noPadding = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-full mx-auto",
        !noPadding && "px-6",
        containerSizes[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Container.displayName = "Container";

// ─── Grid ─────────────────────────────────────────────────────────────────────

export type GridCols = 1 | 2 | 3 | 4 | 6 | 12;

const gridColsCls: Record<GridCols, string> = {
  1:  "grid-cols-1",
  2:  "grid-cols-1 sm:grid-cols-2",
  3:  "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4:  "grid-cols-2 md:grid-cols-4",
  6:  "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  12: "grid-cols-12",
};

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: GridCols;
  gap?:  GapSize;
}

/**
 * Responsive CSS grid with preset column breakpoints.
 *
 * @example
 * <Grid cols={3} gap={4}>
 *   <Card />
 *   <Card />
 *   <Card />
 * </Grid>
 */
export const Grid = forwardRef<HTMLDivElement, GridProps>(
  ({ cols = 3, gap = 4, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("grid", gridColsCls[cols], gapCls[gap], className)}
      {...props}
    >
      {children}
    </div>
  )
);
Grid.displayName = "Grid";

// ─── Surface ──────────────────────────────────────────────────────────────────

export type SurfaceVariant =
  | "base"      // bg-surface-1  — primary widget background
  | "elevated"  // bg-surface-2  — settings panels, modals
  | "overlay"   // bg-surface-3  — dropdowns, popovers
  | "glass"     // frosted glass  — floating overlays
  | "inset"     // bg-white/0.02 — inner cells, mini-stat rows
  | "brand";    // brand tint    — accent call-to-action panels

export type SurfaceRadius = "sm" | "lg" | "xl" | "2xl" | "3xl";

export interface SurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:   SurfaceVariant;
  radius?:    SurfaceRadius;
  /** Remove the border */
  noBorder?:  boolean;
  overflow?:  "hidden" | "visible" | "auto";
}

const surfaceVariantCls: Record<SurfaceVariant, string> = {
  base:     "bg-[#0D0D14] border-white/[0.06]",
  elevated: "bg-[#141420] border-white/[0.08]",
  overlay:  "bg-[#1C1C2A] border-white/[0.10]",
  glass:    "bg-white/[0.03] backdrop-blur-xl border-white/[0.06]",
  inset:    "bg-white/[0.02] border-white/[0.04]",
  brand:    "bg-[#FF2D55]/[0.05] border-[#FF2D55]/20",
};

const surfaceRadiusCls: Record<SurfaceRadius, string> = {
  sm:   "rounded-lg",
  lg:   "rounded-xl",
  xl:   "rounded-xl",
  "2xl":"rounded-2xl",
  "3xl":"rounded-3xl",
};

/**
 * Semantic dark surface panel — replaces repeated
 * `className="rounded-2xl border border-white/[0.06] bg-[#0D0D14]"` patterns.
 *
 * @example
 * <Surface variant="elevated" overflow="hidden">
 *   <Table />
 * </Surface>
 */
export const Surface = forwardRef<HTMLDivElement, SurfaceProps>(
  ({ variant = "base", radius = "2xl", noBorder = false, overflow, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        surfaceRadiusCls[radius],
        !noBorder && "border",
        surfaceVariantCls[variant],
        overflow === "hidden"  && "overflow-hidden",
        overflow === "visible" && "overflow-visible",
        overflow === "auto"    && "overflow-auto",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
Surface.displayName = "Surface";

// ─── Section ──────────────────────────────────────────────────────────────────

export interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional section heading */
  title?:       string;
  /** Optional description line below the title */
  description?: string;
  /** Show a bottom border under the heading */
  divider?:     boolean;
  /** Slot for right-side actions next to the heading */
  actions?:     React.ReactNode;
}

/**
 * Content section with optional heading, description, and action slot.
 *
 * @example
 * <Section title="Revenue & Audiences" divider actions={<FilterButton />}>
 *   <RevenueChart />
 * </Section>
 */
export function Section({
  title,
  description,
  divider = false,
  actions,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {(title || actions) && (
        <div
          className={cn(
            "flex items-start justify-between gap-4",
            divider && "pb-3 border-b border-white/[0.05]"
          )}
        >
          <div>
            {title && (
              <h2 className="text-sm font-semibold text-[#F0F0F8]">{title}</h2>
            )}
            {description && (
              <p className="text-xs text-[#55556A] mt-0.5">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 shrink-0">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

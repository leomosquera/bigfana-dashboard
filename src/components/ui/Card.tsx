"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Base Card ────────────────────────────────────────────────────────────────

interface CardBaseProps {
  children:   React.ReactNode;
  className?: string;
  glow?:      boolean;
  hover?:     boolean;
  onClick?:   () => void;
}

function CardBase({ children, className, glow = false, hover = false, onClick }: CardBaseProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      transition={{ duration: 0.2, ease: "easeOut" }}
      onClick={onClick}
      className={cn(
        "relative rounded-2xl border border-white/[0.06] bg-[#0D0D14] overflow-hidden",
        glow  && "glow-brand-sm",
        hover && "cursor-pointer",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

// ─── Card.Header ──────────────────────────────────────────────────────────────

export interface CardHeaderProps {
  title?:       string;
  description?: string;
  icon?:        React.ReactNode;
  actions?:     React.ReactNode;
  className?:   string;
  children?:    React.ReactNode;
}

function CardHeader({ title, description, icon, actions, className, children }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 px-6 py-4 border-b border-white/[0.05]",
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center shrink-0 text-[#8888AA]">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {title    && <h3 className="text-sm font-semibold text-[#F0F0F8]">{title}</h3>}
          {description && <p className="text-xs text-[#55556A] mt-0.5">{description}</p>}
          {children}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      )}
    </div>
  );
}

// ─── Card.Content ─────────────────────────────────────────────────────────────

function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

// ─── Card.Footer ──────────────────────────────────────────────────────────────

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  justify?: "start" | "center" | "end" | "between";
}

function CardFooter({ justify = "end", className, children, ...props }: CardFooterProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 px-6 py-4 border-t border-white/[0.05]",
        justify === "start"   && "justify-start",
        justify === "center"  && "justify-center",
        justify === "end"     && "justify-end",
        justify === "between" && "justify-between",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ─── Compound export ──────────────────────────────────────────────────────────

/**
 * Card — primary surface container with optional sub-component anatomy.
 *
 * Plain usage (backward compatible):
 *   <Card className="p-6">...</Card>
 *
 * Compound anatomy usage:
 *   <Card>
 *     <Card.Header title="Revenue" description="Monthly breakdown" actions={<Button />} />
 *     <Card.Content>...</Card.Content>
 *     <Card.Footer justify="between"><CancelBtn /><SaveBtn /></Card.Footer>
 *   </Card>
 */
export const Card = Object.assign(CardBase, {
  Header:  CardHeader,
  Content: CardContent,
  Footer:  CardFooter,
});

// ─── StatCard ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label:    string;
  value:    string;
  change?:  number;
  period?:  string;
  icon:     React.ReactNode;
  accent?:  boolean;
  /** Compact executive density for Command Center KPI grids. */
  dense?:   boolean;
  /**
   * Always reserve one secondary line (period slot), even when `period` is empty.
   * Opt-in for aligned KPI strips (e.g. Fan 360). Default false — no visual change
   * for Dashboard Home / other callers that omit period inconsistently.
   */
  reservePeriodSlot?: boolean;
  /** Merged onto the root Card (e.g. `h-full` in equal-height grids). */
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  period,
  icon,
  accent = false,
  dense = false,
  reservePeriodSlot = false,
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const showPeriodSlot = reservePeriodSlot || Boolean(period);

  return (
    <Card
      hover
      className={cn(dense ? "p-3.5" : "p-6", className)}
    >
      <div
        className={cn(
          "flex items-start justify-between",
          dense ? "mb-2.5" : "mb-4",
        )}
      >
        <div
          className={cn(
            "rounded-xl flex items-center justify-center",
            dense ? "w-8 h-8" : "w-10 h-10",
            accent
              ? "bg-[#FF2D55]/15 text-[#FF2D55]"
              : "bg-white/[0.05] text-[#8888AA]"
          )}
        >
          {icon}
        </div>
        {change !== undefined && (
          <span
            className={cn(
              "text-xs font-semibold px-2 py-1 rounded-full",
              isPositive
                ? "bg-[#00D4A8]/10 text-[#00D4A8]"
                : "bg-red-500/10 text-red-400"
            )}
          >
            {isPositive ? "+" : ""}{change}%
          </span>
        )}
      </div>
      <div className={dense ? "space-y-0.5 min-w-0" : "space-y-1"}>
        <p
          className={cn(
            "font-bold text-[#F0F0F8] tracking-tight tabular-nums",
            dense ? "text-lg truncate" : "text-2xl",
          )}
          title={typeof value === "string" ? value : undefined}
        >
          {value}
        </p>
        <p
          className={cn(
            "font-medium text-[#8888AA]",
            dense ? "text-xs" : "text-sm",
          )}
        >
          {label}
        </p>
        {showPeriodSlot && (
          <p
            className="text-[11px] text-[#55556A] leading-snug truncate min-h-[1.25rem]"
            title={period || undefined}
          >
            {period || "\u00A0"}
          </p>
        )}
      </div>
    </Card>
  );
}

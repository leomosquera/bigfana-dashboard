"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TabItem {
  id:       string;
  label:    string;
  icon?:    React.ReactNode;
  badge?:   string | number;
  disabled?: boolean;
}

// ─── Track Variants ───────────────────────────────────────────────────────────

const trackVariants = cva("flex items-center", {
  variants: {
    variant: {
      line: "border-b border-white/[0.08] gap-0",
      pill: "bg-white/[0.04] border border-white/[0.06] rounded-xl p-1 gap-1",
      underline: "gap-0",
    },
    size: {
      sm: "text-xs",
      md: "text-sm",
    },
  },
  defaultVariants: {
    variant: "line",
    size:    "md",
  },
});

const tabItemVariants = cva(
  [
    "relative flex items-center gap-2 font-medium",
    "transition-all duration-200 cursor-pointer select-none",
    "focus-visible:outline-none",
    "disabled:opacity-40 disabled:pointer-events-none",
  ].join(" "),
  {
    variants: {
      variant: {
        line: [
          "px-4 py-2.5 text-[#8888AA]",
          "hover:text-[#F0F0F8]",
          "data-[active=true]:text-[#F0F0F8]",
        ].join(" "),
        pill: [
          "px-3 py-1.5 rounded-lg text-[#8888AA]",
          "hover:text-[#F0F0F8] hover:bg-white/[0.04]",
          "data-[active=true]:text-[#F0F0F8]",
        ].join(" "),
        underline: [
          "px-3 py-2.5 text-[#8888AA]",
          "hover:text-[#F0F0F8]",
          "data-[active=true]:text-[#F0F0F8]",
        ].join(" "),
      },
      size: {
        sm: "text-xs",
        md: "text-sm",
      },
    },
    defaultVariants: {
      variant: "line",
      size:    "md",
    },
  }
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface TabsProps extends VariantProps<typeof trackVariants> {
  items:     TabItem[];
  active:    string;
  onChange:  (id: string) => void;
  className?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Tabs({ items, active, onChange, variant = "line", size = "md", className }: TabsProps) {
  return (
    <div className={cn(trackVariants({ variant, size }), className)} role="tablist">
      {items.map((tab) => {
        const isActive = tab.id === active;

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            disabled={tab.disabled}
            data-active={isActive}
            onClick={() => !tab.disabled && onChange(tab.id)}
            className={cn(tabItemVariants({ variant, size }))}
          >
            {/* Pill active background */}
            {variant === "pill" && isActive && (
              <motion.span
                layoutId="tabs-pill-bg"
                className="absolute inset-0 rounded-lg bg-[#141420] border border-white/[0.08]"
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              />
            )}

            {tab.icon && (
              <span className="relative z-10 shrink-0">{tab.icon}</span>
            )}
            <span className="relative z-10 whitespace-nowrap">{tab.label}</span>

            {tab.badge !== undefined && (
              <span className="relative z-10 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-[#FF2D55]/15 text-[#FF2D55]">
                {tab.badge}
              </span>
            )}

            {/* Line active indicator */}
            {variant === "line" && isActive && (
              <motion.span
                layoutId="tabs-line-indicator"
                className="absolute bottom-[-1px] left-0 right-0 h-px bg-[#FF2D55]"
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              />
            )}

            {/* Underline variant */}
            {variant === "underline" && isActive && (
              <motion.span
                layoutId="tabs-underline-indicator"
                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#FF2D55]"
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Tab Panel ────────────────────────────────────────────────────────────────

interface TabPanelProps {
  id:       string;
  active:   string;
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ id, active, children, className }: TabPanelProps) {
  if (id !== active) return null;
  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}

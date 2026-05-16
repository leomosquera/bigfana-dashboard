"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Variants ─────────────────────────────────────────────────────────────────

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "font-semibold rounded-xl select-none",
    "transition-all duration-200 shrink-0",
    "focus-ring",
    "disabled:pointer-events-none disabled:opacity-40",
    "active:scale-[0.97]",
  ].join(" "),
  {
    variants: {
      intent: {
        primary: [
          "bg-[#FF2D55] text-white",
          "hover:bg-[#CC1F3F]",
          "glow-brand-sm hover:glow-brand",
        ].join(" "),
        secondary: [
          "bg-white/[0.06] text-[#F0F0F8]",
          "border border-white/[0.08]",
          "hover:bg-white/[0.10] hover:border-white/[0.14]",
        ].join(" "),
        ghost: [
          "text-[#8888AA]",
          "hover:text-[#F0F0F8] hover:bg-white/[0.05]",
        ].join(" "),
        outline: [
          "bg-transparent text-[#FF2D55]",
          "border border-[#FF2D55]/30",
          "hover:bg-[#FF2D55]/[0.08] hover:border-[#FF2D55]/50",
        ].join(" "),
        success: [
          "bg-[#00D4A8]/10 text-[#00D4A8]",
          "border border-[#00D4A8]/20",
          "hover:bg-[#00D4A8]/20 hover:border-[#00D4A8]/40",
        ].join(" "),
        danger: [
          "bg-red-500/10 text-red-400",
          "border border-red-500/20",
          "hover:bg-red-500/20 hover:border-red-500/40",
        ].join(" "),
      },
      size: {
        xs:       "h-7 px-2.5 text-xs rounded-lg",
        sm:       "h-8 px-3 text-xs",
        md:       "h-10 px-4 text-sm",
        lg:       "h-11 px-5 text-sm",
        xl:       "h-12 px-6 text-base",
        "icon-xs": "w-7 h-7 p-0 rounded-lg",
        "icon-sm": "w-8 h-8 p-0",
        "icon-md": "w-10 h-10 p-0",
        "icon-lg": "w-11 h-11 p-0",
      },
    },
    defaultVariants: {
      intent: "secondary",
      size:   "md",
    },
  }
);

export type ButtonIntent = NonNullable<VariantProps<typeof buttonVariants>["intent"]>;
export type ButtonSize   = NonNullable<VariantProps<typeof buttonVariants>["size"]>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?:   boolean;
  leftIcon?:  React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, intent, size, loading, leftIcon, rightIcon, children, disabled, ...props },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={cn(buttonVariants({ intent, size }), className)}
        {...props}
      >
        {loading ? (
          <Loader2 size={14} className="animate-spin shrink-0" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };

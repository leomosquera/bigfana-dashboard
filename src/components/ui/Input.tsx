"use client";

import { forwardRef, useId } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// ─── Input Variants ───────────────────────────────────────────────────────────

const inputWrapperVariants = cva(
  [
    "flex items-center gap-2",
    "rounded-xl border",
    "transition-all duration-200",
    "has-[input:focus]:ring-2 has-[input:focus]:ring-[#FF2D55]/30",
  ].join(" "),
  {
    variants: {
      state: {
        default: [
          "border-white/[0.08] bg-white/[0.03]",
          "has-[input:focus]:border-[#FF2D55]/40 has-[input:focus]:bg-[#141420]",
        ].join(" "),
        error: [
          "border-red-500/40 bg-red-500/[0.04]",
          "has-[input:focus]:border-red-500/60",
        ].join(" "),
        success: [
          "border-[#00D4A8]/30 bg-[#00D4A8]/[0.04]",
          "has-[input:focus]:border-[#00D4A8]/50",
        ].join(" "),
        disabled: [
          "border-white/[0.05] bg-white/[0.02] opacity-50 pointer-events-none",
        ].join(" "),
      },
      size: {
        sm: "h-8 px-2.5",
        md: "h-10 px-3",
        lg: "h-11 px-3.5",
      },
    },
    defaultVariants: {
      state: "default",
      size:  "md",
    },
  }
);

// ─── Props ────────────────────────────────────────────────────────────────────

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputWrapperVariants> {
  label?:      string;
  helperText?: string;
  errorText?:  string;
  leftIcon?:   React.ReactNode;
  rightIcon?:  React.ReactNode;
  wrapperClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      helperText,
      errorText,
      leftIcon,
      rightIcon,
      state,
      size,
      wrapperClassName,
      disabled,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const generatedId  = useId();
    const id           = idProp ?? generatedId;
    const resolvedState = disabled ? "disabled" : errorText ? "error" : state;

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider"
          >
            {label}
          </label>
        )}

        <div className={cn(inputWrapperVariants({ state: resolvedState, size }))}>
          {leftIcon && (
            <span className="shrink-0 text-[#55556A]">{leftIcon}</span>
          )}
          <input
            ref={ref}
            id={id}
            disabled={disabled}
            className={cn(
              "flex-1 bg-transparent outline-none",
              "text-sm text-[#F0F0F8] placeholder:text-[#55556A]",
              size === "sm" ? "text-xs" : size === "lg" ? "text-sm" : "text-sm",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="shrink-0 text-[#55556A]">{rightIcon}</span>
          )}
        </div>

        {(helperText || errorText) && (
          <p
            className={cn(
              "text-xs",
              errorText ? "text-red-400" : "text-[#55556A]"
            )}
          >
            {errorText ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

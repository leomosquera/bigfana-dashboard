"use client";

import { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:      string;
  helperText?: string;
  errorText?:  string;
  wrapperClassName?: string;
  resize?:     "none" | "vertical" | "horizontal" | "both";
}

// ─── Component ────────────────────────────────────────────────────────────────

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      helperText,
      errorText,
      wrapperClassName,
      resize = "vertical",
      disabled,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id          = idProp ?? generatedId;
    const hasError    = !!errorText;

    const resizeClass = {
      none:       "resize-none",
      vertical:   "resize-y",
      horizontal: "resize-x",
      both:       "resize",
    }[resize];

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

        <textarea
          ref={ref}
          id={id}
          disabled={disabled}
          className={cn(
            "w-full min-h-[80px] px-3 py-2.5 rounded-xl border",
            "bg-white/[0.03] text-sm text-[#F0F0F8] placeholder:text-[#55556A]",
            "transition-all duration-200 outline-none",
            "focus:ring-2 focus:ring-[#FF2D55]/30",
            hasError
              ? "border-red-500/40 focus:border-red-500/60"
              : "border-white/[0.08] focus:border-[#FF2D55]/40 focus:bg-[#141420]",
            disabled && "opacity-40 pointer-events-none",
            resizeClass,
            className
          )}
          {...props}
        />

        {(helperText || errorText) && (
          <p className={cn("text-xs", errorText ? "text-red-400" : "text-[#55556A]")}>
            {errorText ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

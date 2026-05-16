"use client";

import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SelectOption {
  value:    string;
  label:    string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  label?:      string;
  helperText?: string;
  errorText?:  string;
  options:     SelectOption[];
  placeholder?: string;
  size?:        "sm" | "md" | "lg";
  wrapperClassName?: string;
}

const sizeClasses = {
  sm: "h-8 pl-2.5 pr-8 text-xs",
  md: "h-10 pl-3 pr-9 text-sm",
  lg: "h-11 pl-3.5 pr-10 text-sm",
};

const iconSizes = {
  sm: "right-2 w-3 h-3",
  md: "right-2.5 w-3.5 h-3.5",
  lg: "right-3 w-4 h-4",
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      label,
      helperText,
      errorText,
      options,
      placeholder,
      size = "md",
      wrapperClassName,
      disabled,
      id: idProp,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id          = idProp ?? generatedId;
    const hasError    = !!errorText;

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

        <div className="relative">
          <select
            ref={ref}
            id={id}
            disabled={disabled}
            className={cn(
              "w-full appearance-none rounded-xl border",
              "bg-white/[0.03] text-[#F0F0F8]",
              "transition-all duration-200 outline-none",
              "focus:ring-2 focus:ring-[#FF2D55]/30",
              hasError
                ? "border-red-500/40 focus:border-red-500/60"
                : "border-white/[0.08] focus:border-[#FF2D55]/40 focus:bg-[#141420]",
              disabled && "opacity-40 pointer-events-none",
              sizeClasses[size],
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-[#141420] text-[#F0F0F8]"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <ChevronDown
            className={cn(
              "absolute top-1/2 -translate-y-1/2 text-[#55556A] pointer-events-none",
              iconSizes[size]
            )}
          />
        </div>

        {(helperText || errorText) && (
          <p className={cn("text-xs", errorText ? "text-red-400" : "text-[#55556A]")}>
            {errorText ?? helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";

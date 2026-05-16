"use client";

import { forwardRef, useId } from "react";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "type"> {
  label?:         string;
  description?:   string;
  indeterminate?: boolean;
  size?:          "sm" | "md";
}

const boxSizes = {
  sm: "w-4 h-4 rounded",
  md: "w-[18px] h-[18px] rounded-md",
};

const iconSizes = {
  sm: 10,
  md: 11,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, indeterminate, size = "md", id: idProp, disabled, ...props }, ref) => {
    const generatedId = useId();
    const id          = idProp ?? generatedId;

    return (
      <div className={cn("flex items-start gap-2.5", disabled && "opacity-40")}>
        <div className="relative flex items-center justify-center shrink-0 mt-px">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              "flex items-center justify-center cursor-pointer",
              "border transition-all duration-150",
              "peer-checked:bg-[#FF2D55] peer-checked:border-[#FF2D55]",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[#FF2D55]/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[#06060A]",
              indeterminate
                ? "bg-[#FF2D55]/20 border-[#FF2D55]/60"
                : "bg-white/[0.04] border-white/[0.12] hover:border-white/[0.20]",
              boxSizes[size],
              className
            )}
          >
            {indeterminate ? (
              <Minus size={iconSizes[size]} className="text-[#FF2D55]" strokeWidth={3} />
            ) : (
              <Check
                size={iconSizes[size]}
                className="text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                strokeWidth={3}
              />
            )}
          </label>
        </div>

        {label && (
          <div className="flex flex-col gap-0.5">
            <label
              htmlFor={id}
              className={cn(
                "text-sm font-medium leading-tight cursor-pointer",
                disabled ? "text-[#55556A]" : "text-[#F0F0F8]"
              )}
            >
              {label}
            </label>
            {description && (
              <p className="text-xs text-[#55556A] leading-snug">{description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

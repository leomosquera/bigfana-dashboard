"use client";

import { forwardRef, useId } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Props ────────────────────────────────────────────────────────────────────

interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "size"> {
  label?:       string;
  description?: string;
  size?:        "sm" | "md";
}

const trackSizes = {
  sm: "w-8 h-4",
  md: "w-10 h-[22px]",
};

const thumbSizes = {
  sm: "w-3 h-3",
  md: "w-[16px] h-[16px]",
};

const thumbOff = {
  sm: 2,
  md: 3,
};

const thumbOn = {
  sm: 18,
  md: 21,
};

// ─── Component ────────────────────────────────────────────────────────────────

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, size = "md", checked, defaultChecked, id: idProp, disabled, onChange, ...props }, ref) => {
    const generatedId = useId();
    const id          = idProp ?? generatedId;

    return (
      <label
        htmlFor={id}
        className={cn(
          "flex items-start gap-3 cursor-pointer group",
          disabled && "opacity-40 pointer-events-none",
          className
        )}
      >
        <div className="relative shrink-0 mt-px">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            role="switch"
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            onChange={onChange}
            className="sr-only peer"
            {...props}
          />

          {/* Track */}
          <div
            className={cn(
              "rounded-full border transition-all duration-200",
              "peer-checked:bg-[#FF2D55] peer-checked:border-[#FF2D55]/80",
              "peer-focus-visible:ring-2 peer-focus-visible:ring-[#FF2D55]/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[#06060A]",
              "bg-white/[0.08] border-white/[0.12]",
              trackSizes[size]
            )}
          />

          {/* Thumb */}
          <motion.div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow-sm pointer-events-none",
              thumbSizes[size]
            )}
            animate={{
              x: (checked ?? defaultChecked) ? thumbOn[size] : thumbOff[size],
            }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>

        {label && (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium text-[#F0F0F8] leading-tight">
              {label}
            </span>
            {description && (
              <span className="text-xs text-[#55556A] leading-snug">{description}</span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Switch.displayName = "Switch";

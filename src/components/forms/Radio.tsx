"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RadioOption {
  value:        string;
  label:        string;
  description?: string;
  disabled?:    boolean;
}

// ─── Single Radio ─────────────────────────────────────────────────────────────

interface RadioItemProps {
  option:    RadioOption;
  name:      string;
  checked?:  boolean;
  onChange?: (value: string) => void;
  size?:     "sm" | "md";
}

function RadioItem({ option, name, checked, onChange, size = "md" }: RadioItemProps) {
  const id = useId();
  const dotSize = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";
  const ringSize = size === "sm" ? "w-4 h-4" : "w-[18px] h-[18px]";

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex items-start gap-2.5 cursor-pointer group",
        option.disabled && "opacity-40 pointer-events-none"
      )}
    >
      <div className="relative shrink-0 mt-px">
        <input
          id={id}
          type="radio"
          name={name}
          value={option.value}
          checked={checked}
          disabled={option.disabled}
          onChange={() => onChange?.(option.value)}
          className="sr-only peer"
        />
        <div
          className={cn(
            "rounded-full border flex items-center justify-center transition-all duration-150",
            "peer-checked:border-[#FF2D55]",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-[#FF2D55]/40 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-[#06060A]",
            "bg-white/[0.04] border-white/[0.12] group-hover:border-white/[0.20]",
            ringSize
          )}
        >
          {checked && (
            <span className={cn("rounded-full bg-[#FF2D55]", dotSize)} />
          )}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium text-[#F0F0F8] leading-tight">
          {option.label}
        </span>
        {option.description && (
          <span className="text-xs text-[#55556A] leading-snug">
            {option.description}
          </span>
        )}
      </div>
    </label>
  );
}

// ─── Radio Group ──────────────────────────────────────────────────────────────

interface RadioGroupProps {
  name:      string;
  options:   RadioOption[];
  value?:    string;
  onChange?: (value: string) => void;
  label?:    string;
  size?:     "sm" | "md";
  direction?: "vertical" | "horizontal";
  className?: string;
}

export function RadioGroup({
  name,
  options,
  value,
  onChange,
  label,
  size = "md",
  direction = "vertical",
  className,
}: RadioGroupProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)} role="radiogroup">
      {label && (
        <p className="text-xs font-semibold text-[#8888AA] uppercase tracking-wider mb-1">
          {label}
        </p>
      )}
      <div
        className={cn(
          "flex gap-3",
          direction === "vertical" ? "flex-col" : "flex-row flex-wrap"
        )}
      >
        {options.map((opt) => (
          <RadioItem
            key={opt.value}
            option={opt}
            name={name}
            checked={value === opt.value}
            onChange={onChange}
            size={size}
          />
        ))}
      </div>
    </div>
  );
}

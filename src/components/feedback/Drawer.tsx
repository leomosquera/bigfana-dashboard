"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerSide = "right" | "left" | "bottom";

interface DrawerProps {
  open:      boolean;
  onClose:   () => void;
  title?:    string;
  subtitle?: string;
  children:  React.ReactNode;
  footer?:   React.ReactNode;
  side?:     DrawerSide;
  width?:    string;
  className?: string;
  hideClose?: boolean;
}

const sideConfig: Record<
  DrawerSide,
  {
    container:  string;
    panel:      string;
    initial:    Record<string, string | number>;
    animate:    Record<string, string | number>;
    exit:       Record<string, string | number>;
  }
> = {
  right: {
    container: "items-stretch justify-end",
    panel:     "h-full rounded-l-2xl rounded-r-none",
    initial:   { x: "100%" },
    animate:   { x: 0 },
    exit:      { x: "100%" },
  },
  left: {
    container: "items-stretch justify-start",
    panel:     "h-full rounded-r-2xl rounded-l-none",
    initial:   { x: "-100%" },
    animate:   { x: 0 },
    exit:      { x: "-100%" },
  },
  bottom: {
    container: "items-end",
    panel:     "w-full rounded-t-2xl rounded-b-none max-h-[90vh]",
    initial:   { y: "100%" },
    animate:   { y: 0 },
    exit:      { y: "100%" },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  side = "right",
  width = "400px",
  className,
  hideClose = false,
}: DrawerProps) {
  const config = sideConfig[side];

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (typeof window === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Container */}
          <div className={cn("fixed inset-0 z-50 flex overflow-hidden", config.container)}>
            <motion.div
              initial={config.initial}
              animate={config.animate}
              exit={config.exit}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              style={side !== "bottom" ? { width } : undefined}
              className={cn(
                "flex flex-col border border-white/[0.08]",
                "bg-[#0D0D14] shadow-[0_0_80px_rgba(0,0,0,0.6)]",
                config.panel,
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || !hideClose) && (
                <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
                  <div>
                    {title && (
                      <h2 className="text-base font-bold text-[#F0F0F8]">{title}</h2>
                    )}
                    {subtitle && (
                      <p className="text-sm text-[#8888AA] mt-0.5">{subtitle}</p>
                    )}
                  </div>
                  {!hideClose && (
                    <button
                      onClick={onClose}
                      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl text-[#55556A] hover:text-[#F0F0F8] hover:bg-white/[0.05] transition-all"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="shrink-0 flex items-center justify-end gap-2 px-5 py-4 border-t border-white/[0.06]">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

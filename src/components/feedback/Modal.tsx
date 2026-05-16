"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Use Modal.Header / Modal.Body / Modal.Footer for composable anatomy
 * when you need full control over layout inside the modal panel.
 */

export function ModalHeader({
  title,
  description,
  onClose,
  className,
}: {
  title?:       string;
  description?: string;
  onClose?:     () => void;
  className?:   string;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0",
        className
      )}
    >
      <div>
        {title       && <h2 className="text-base font-bold text-[#F0F0F8]">{title}</h2>}
        {description && <p className="text-sm text-[#8888AA] mt-0.5">{description}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="shrink-0 flex items-center justify-center w-8 h-8 rounded-xl text-[#55556A] hover:text-[#F0F0F8] hover:bg-white/[0.05] transition-all"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

export function ModalBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex-1 overflow-y-auto px-6 py-4", className)} {...props}>
      {children}
    </div>
  );
}

export function ModalFooter({
  justify = "end",
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { justify?: "start" | "center" | "end" | "between" }) {
  return (
    <div
      className={cn(
        "shrink-0 flex items-center gap-3 px-6 py-4 border-t border-white/[0.06]",
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

// ─── Types ────────────────────────────────────────────────────────────────────

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  open:      boolean;
  onClose:   () => void;
  title?:    string;
  subtitle?: string;
  children:  React.ReactNode;
  footer?:   React.ReactNode;
  size?:     ModalSize;
  className?: string;
  hideClose?: boolean;
}

const sizeClasses: Record<ModalSize, string> = {
  sm:   "max-w-sm",
  md:   "max-w-md",
  lg:   "max-w-lg",
  xl:   "max-w-2xl",
  full: "max-w-[calc(100vw-2rem)]",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = "md",
  className,
  hideClose = false,
}: ModalProps) {
  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Close on Escape
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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                "relative w-full pointer-events-auto",
                "rounded-2xl border border-white/[0.08]",
                "bg-[#141420] shadow-[0_24px_100px_rgba(0,0,0,0.6)]",
                "flex flex-col max-h-[90vh]",
                sizeClasses[size],
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || !hideClose) && (
                <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-white/[0.06] shrink-0">
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
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="shrink-0 flex items-center justify-end gap-2 px-6 py-4 border-t border-white/[0.06]">
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

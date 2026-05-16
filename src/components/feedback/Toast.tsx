"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, XCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = "success" | "error" | "warning" | "info" | "default";

export interface ToastItem {
  id:       string;
  title:    string;
  message?: string;
  variant?: ToastVariant;
  duration?: number;
}

// ─── Toast UI ─────────────────────────────────────────────────────────────────

const toastStyles: Record<ToastVariant, { icon: React.ElementType; iconClass: string; border: string }> = {
  success: { icon: CheckCircle2,  iconClass: "text-[#00D4A8]", border: "border-[#00D4A8]/20" },
  error:   { icon: XCircle,       iconClass: "text-red-400",   border: "border-red-500/20"   },
  warning: { icon: AlertTriangle, iconClass: "text-amber-400", border: "border-amber-500/20" },
  info:    { icon: Info,          iconClass: "text-blue-400",  border: "border-blue-500/20"  },
  default: { icon: Info,          iconClass: "text-[#8888AA]", border: "border-white/[0.08]" },
};

function ToastItem({ toast, onClose }: { toast: ToastItem; onClose: (id: string) => void }) {
  const variant = toast.variant ?? "default";
  const { icon: Icon, iconClass, border } = toastStyles[variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 16, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "relative flex items-start gap-3 w-80 p-4 rounded-2xl",
        "bg-[#141420] border shadow-[0_20px_80px_rgba(0,0,0,0.5)]",
        "backdrop-blur-xl",
        border
      )}
    >
      <Icon size={18} className={cn("shrink-0 mt-px", iconClass)} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#F0F0F8] leading-tight">
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs text-[#8888AA] mt-1 leading-snug">
            {toast.message}
          </p>
        )}
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className="shrink-0 mt-px text-[#55556A] hover:text-[#F0F0F8] transition-colors"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  toast: (options: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback((options: Omit<ToastItem, "id">) => {
    const id       = `toast-${Date.now()}-${Math.random()}`;
    const duration = options.duration ?? 4000;

    setToasts((prev) => [...prev.slice(-4), { ...options, id }]);

    const timer = setTimeout(() => dismiss(id), duration);
    timers.current.set(id, timer);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {typeof window !== "undefined" &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="false"
            className="fixed bottom-5 right-5 z-[60] flex flex-col gap-2 pointer-events-none"
          >
            <AnimatePresence mode="popLayout">
              {toasts.map((t) => (
                <div key={t.id} className="pointer-events-auto">
                  <ToastItem toast={t} onClose={dismiss} />
                </div>
              ))}
            </AnimatePresence>
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a <ToastProvider>");
  }
  return ctx;
}

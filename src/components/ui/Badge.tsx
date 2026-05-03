import { cn } from "@/lib/utils";

type BadgeVariant = "brand" | "success" | "warning" | "info" | "ghost" | "vip" | "premium" | "core" | "casual";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  brand: "bg-[#FF2D55]/15 text-[#FF2D55] border border-[#FF2D55]/20",
  success: "bg-[#00D4A8]/10 text-[#00D4A8] border border-[#00D4A8]/20",
  warning: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  info: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  ghost: "bg-white/[0.05] text-[#8888AA] border border-white/[0.06]",
  vip: "bg-gradient-to-r from-[#FF2D55]/20 to-[#FF6B6B]/10 text-[#FF2D55] border border-[#FF2D55]/30",
  premium: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  core: "bg-white/[0.05] text-[#8888AA] border border-white/[0.08]",
  casual: "bg-white/[0.03] text-[#55556A] border border-white/[0.05]",
};

export function Badge({ children, variant = "ghost", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function LevelBadge({ level }: { level: string }) {
  const map: Record<string, BadgeVariant> = {
    "Ultra VIP": "vip",
    "Premium": "premium",
    "Core": "core",
    "Casual": "casual",
  };
  return <Badge variant={map[level] ?? "ghost"}>{level}</Badge>;
}

export function StatusBadge({ status }: { status: "active" | "negotiating" | "renewing" }) {
  const map = {
    active: { variant: "success" as BadgeVariant, label: "Activo" },
    negotiating: { variant: "warning" as BadgeVariant, label: "Negociando" },
    renewing: { variant: "info" as BadgeVariant, label: "Renovando" },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

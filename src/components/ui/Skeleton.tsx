import { cn } from "@/lib/utils";

// ─── Base Skeleton ────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  style?:     React.CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-xl animate-shimmer bg-white/[0.04]",
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

// ─── Skeleton Text ────────────────────────────────────────────────────────────

interface SkeletonTextProps {
  lines?:   number;
  className?: string;
  lastLineWidth?: string;
}

export function SkeletonText({ lines = 3, className, lastLineWidth = "60%" }: SkeletonTextProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3"
          style={i === lines - 1 ? { width: lastLineWidth } : undefined}
        />
      ))}
    </div>
  );
}

// ─── Skeleton Avatar ──────────────────────────────────────────────────────────

interface SkeletonAvatarProps {
  size?: "sm" | "md" | "lg";
}

const avatarSizes = {
  sm: "w-7 h-7",
  md: "w-9 h-9",
  lg: "w-11 h-11",
};

export function SkeletonAvatar({ size = "md" }: SkeletonAvatarProps) {
  return (
    <Skeleton className={cn("rounded-full shrink-0", avatarSizes[size])} />
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────────

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6 space-y-4",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// ─── Skeleton Table Row ───────────────────────────────────────────────────────

export function SkeletonTableRow() {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-white/[0.04]">
      <SkeletonAvatar size="sm" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-20" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full" />
      <Skeleton className="h-3 w-12" />
    </div>
  );
}

// ─── Skeleton Chart ───────────────────────────────────────────────────────────

interface SkeletonChartProps {
  className?: string;
}

export function SkeletonChart({ className }: SkeletonChartProps) {
  return (
    <div className={cn("rounded-2xl border border-white/[0.06] bg-[#0D0D14] p-6", className)}>
      <div className="flex items-start justify-between mb-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-7 w-20 rounded-lg" />
      </div>
      {/* Bar chart preview */}
      <div className="flex items-end gap-2 h-28">
        {[65, 85, 45, 90, 70, 80, 55, 75, 88, 60, 78, 92].map((h, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

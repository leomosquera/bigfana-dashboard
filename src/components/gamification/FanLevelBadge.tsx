import { cn } from "@/lib/utils";
import type { FanLevel } from "@/db/schema";

// ─── Level computation ────────────────────────────────────────────────────────

/**
 * Returns the highest level tier whose minPoints ≤ score.
 * Expects levels sorted by minPoints ascending (as returned by getOrgLevels).
 * Returns null if score is below every tier's threshold.
 */
export function computeLevelForScore(
  score: number,
  levels: FanLevel[],
): FanLevel | null {
  if (!levels.length) return null;
  let matched: FanLevel | null = null;
  for (const level of levels) {
    if (score >= level.minPoints) matched = level;
  }
  return matched;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FanLevelBadgeProps {
  score:     number;
  levels:    FanLevel[];
  className?: string;
  /** Size variant: 'sm' (default) or 'xs' for compact contexts. */
  size?:     "xs" | "sm";
}

export function FanLevelBadge({
  score,
  levels,
  className,
  size = "sm",
}: FanLevelBadgeProps) {
  const level = computeLevelForScore(score, levels);
  if (!level) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold border",
        size === "xs"
          ? "px-1.5 py-px text-[9px] leading-none"
          : "px-2 py-0.5 text-[10px]",
        "bg-white/[0.04]",
        className,
      )}
      style={{
        color:       level.color ?? "#8888AA",
        borderColor: level.color ? `${level.color}33` : "rgba(136,136,170,0.2)",
      }}
    >
      {level.name}
    </span>
  );
}

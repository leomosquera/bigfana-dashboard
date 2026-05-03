import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  color?: "brand" | "auto";
  className?: string;
}

const colors = [
  "from-[#FF2D55] to-[#FF6B6B]",
  "from-blue-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-500",
];

function getColor(initials: string) {
  const idx = initials.charCodeAt(0) % colors.length;
  return colors[idx];
}

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

export function Avatar({ initials, size = "md", color = "auto", className }: AvatarProps) {
  const gradient = color === "brand" ? "from-[#FF2D55] to-[#FF6B6B]" : getColor(initials);
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white shrink-0",
        gradient,
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}

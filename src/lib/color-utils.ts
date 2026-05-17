import type { BrandTokens } from "@/lib/design-system/theme";

/**
 * Derives a full BrandTokens set from a single hex color string.
 *
 * Used to convert an organization's brandColor DB field into the shape
 * expected by applyTenantTheme(). Keeps color derivation logic in one place
 * so it can be updated without touching providers or the theme system.
 *
 * Derivation rules:
 *   primary        — the hex color as-is
 *   primaryDim     — darkened by 20% (multiplying each channel by 0.8)
 *   primaryGlow    — rgba with 0.15 alpha (subtle glow for surfaces)
 *   primaryGlowStrong — rgba with 0.30 alpha (stronger glow for focus/hover)
 *
 * Returns null if the hex string is invalid, allowing callers to fall back
 * to the default theme.
 */
export function brandColorToTokens(hex: string): BrandTokens | null {
  const cleaned = hex.trim();
  const match = /^#([0-9a-f]{6})$/i.exec(cleaned);
  if (!match) return null;

  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);

  const dimR = Math.round(r * 0.8);
  const dimG = Math.round(g * 0.8);
  const dimB = Math.round(b * 0.8);

  return {
    primary: cleaned,
    primaryDim: `rgb(${dimR}, ${dimG}, ${dimB})`,
    primaryGlow: `rgba(${r}, ${g}, ${b}, 0.15)`,
    primaryGlowStrong: `rgba(${r}, ${g}, ${b}, 0.30)`,
  };
}

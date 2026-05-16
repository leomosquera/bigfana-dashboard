/**
 * BigFana Design System — Theme Architecture
 *
 * Defines the tenant theme contract and provides the default BigFana theme.
 * Designed for future multi-tenant SaaS: each tenant can override brand tokens
 * at runtime without a rebuild by writing CSS custom properties to :root.
 *
 * Usage (app bootstrap):
 *   import { applyTenantTheme, defaultTheme } from "@/lib/design-system/theme";
 *   applyTenantTheme(defaultTheme);
 *
 * Usage (tenant switch):
 *   import { applyTenantTheme, tenantPresets } from "@/lib/design-system/theme";
 *   applyTenantTheme(tenantPresets["real-madrid"]);
 */

// ─── Brand Token Contract ─────────────────────────────────────────────────────

export interface BrandTokens {
  /** Primary action color — buttons, highlights, accents */
  primary:           string;
  /** Hover / pressed / darker variant of primary */
  primaryDim:        string;
  /** Glow shadow color (with low alpha) for subtle glows */
  primaryGlow:       string;
  /** Strong glow (used on modal/card focus states) */
  primaryGlowStrong: string;
}

// ─── Tenant Theme Contract ────────────────────────────────────────────────────

export interface TenantTheme {
  /** Unique slug — used as a CSS data-attribute key and as a DB identifier */
  id:           string;
  /** Human-readable display name of the club / tenant */
  displayName:  string;
  /** Brand color overrides */
  brand:        BrandTokens;
  /** Optional: custom Google Font or system font stack */
  fontFamily?:  string;
  /** Optional: hex code for the light-mode variant (future) */
  lightBrand?:  string;
}

// ─── Default BigFana Theme ────────────────────────────────────────────────────

export const defaultTheme: TenantTheme = {
  id:          "bigfana",
  displayName: "BigFana",
  brand: {
    primary:           "#FF2D55",
    primaryDim:        "#CC1F3F",
    primaryGlow:       "rgba(255, 45, 85, 0.15)",
    primaryGlowStrong: "rgba(255, 45, 85, 0.30)",
  },
};

// ─── Demo Tenant Presets ──────────────────────────────────────────────────────
// These are example overrides — real tenant themes would live in the DB.

export const tenantPresets: Record<string, TenantTheme> = {
  bigfana: defaultTheme,

  blue: {
    id:          "club-azul",
    displayName: "Club Azul",
    brand: {
      primary:           "#3B82F6",
      primaryDim:        "#2563EB",
      primaryGlow:       "rgba(59, 130, 246, 0.15)",
      primaryGlowStrong: "rgba(59, 130, 246, 0.30)",
    },
  },

  green: {
    id:          "club-verde",
    displayName: "Club Verde",
    brand: {
      primary:           "#10B981",
      primaryDim:        "#059669",
      primaryGlow:       "rgba(16, 185, 129, 0.15)",
      primaryGlowStrong: "rgba(16, 185, 129, 0.30)",
    },
  },

  gold: {
    id:          "club-dorado",
    displayName: "Club Dorado",
    brand: {
      primary:           "#F59E0B",
      primaryDim:        "#D97706",
      primaryGlow:       "rgba(245, 158, 11, 0.15)",
      primaryGlowStrong: "rgba(245, 158, 11, 0.30)",
    },
  },

  violet: {
    id:          "club-violeta",
    displayName: "Club Violeta",
    brand: {
      primary:           "#8B5CF6",
      primaryDim:        "#7C3AED",
      primaryGlow:       "rgba(139, 92, 246, 0.15)",
      primaryGlowStrong: "rgba(139, 92, 246, 0.30)",
    },
  },
};

// ─── CSS Custom Property Map ──────────────────────────────────────────────────

/**
 * Maps theme brand tokens → CSS custom property names.
 * Mirrors the @theme inline definitions in globals.css.
 */
export const cssVarMap = {
  primary:           "--color-brand",
  primaryDim:        "--color-brand-dim",
  primaryGlow:       "--color-brand-glow",
  primaryGlowStrong: "--color-brand-glow-strong",
} as const satisfies Record<keyof BrandTokens, string>;

// ─── Theme Application ────────────────────────────────────────────────────────

/**
 * Writes tenant brand tokens as CSS custom properties to :root.
 * Works at runtime without a rebuild — call on tenant switch.
 */
export function applyTenantTheme(theme: TenantTheme): void {
  if (typeof document === "undefined") return;

  const root = document.documentElement;

  root.style.setProperty(cssVarMap.primary,           theme.brand.primary);
  root.style.setProperty(cssVarMap.primaryDim,        theme.brand.primaryDim);
  root.style.setProperty(cssVarMap.primaryGlow,       theme.brand.primaryGlow);
  root.style.setProperty(cssVarMap.primaryGlowStrong, theme.brand.primaryGlowStrong);

  if (theme.fontFamily) {
    root.style.setProperty("--font-sans", theme.fontFamily);
  }

  root.setAttribute("data-tenant", theme.id);
}

/**
 * Resets to the default BigFana theme.
 */
export function resetTheme(): void {
  applyTenantTheme(defaultTheme);
}

// ─── Utility: read current brand color ────────────────────────────────────────

/**
 * Reads the current primary brand color from CSS custom properties.
 * Useful for imperative canvas / chart color reads.
 */
export function getCurrentBrandColor(): string {
  if (typeof window === "undefined") return defaultTheme.brand.primary;
  return getComputedStyle(document.documentElement)
    .getPropertyValue("--color-brand")
    .trim() || defaultTheme.brand.primary;
}

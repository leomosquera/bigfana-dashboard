/**
 * BigFana Design System — Token Reference
 *
 * Single source of truth for all design values.
 * CSS custom properties are defined in globals.css (@theme inline).
 * These typed constants mirror them for use in TypeScript (CVA, helpers, etc.)
 * and as documentation for the design system page.
 */

// ─── Colors ───────────────────────────────────────────────────────────────────

export const colors = {
  brand:          "#FF2D55",
  brandDim:       "#CC1F3F",
  brandGlow:      "rgba(255, 45, 85, 0.15)",
  brandGlowStrong:"rgba(255, 45, 85, 0.30)",

  surface0:       "#06060A",
  surface1:       "#0D0D14",
  surface2:       "#141420",
  surface3:       "#1C1C2A",
  surface4:       "#242436",

  border:         "rgba(255, 255, 255, 0.06)",
  borderStrong:   "rgba(255, 255, 255, 0.12)",

  textPrimary:    "#F0F0F8",
  textSecondary:  "#8888AA",
  textMuted:      "#55556A",

  success:        "#00D4A8",
  warning:        "#F59E0B",
  info:           "#3B82F6",
  danger:         "#EF4444",
} as const;

export type ColorToken = keyof typeof colors;

// ─── Typography ───────────────────────────────────────────────────────────────

export const fontSizes = {
  "2xs":    "10px",
  xs:       "12px",
  sm:       "13px",
  base:     "14px",
  md:       "15px",
  lg:       "16px",
  xl:       "18px",
  "2xl":    "20px",
  "3xl":    "24px",
  "4xl":    "30px",
  "5xl":    "36px",
  display:  "48px",
} as const;

export const fontWeights = {
  normal:   400,
  medium:   500,
  semibold: 600,
  bold:     700,
  black:    900,
} as const;

export const lineHeights = {
  tight:    1.2,
  snug:     1.35,
  normal:   1.5,
  relaxed:  1.625,
} as const;

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const spacing = {
  0.5:  "2px",
  1:    "4px",
  1.5:  "6px",
  2:    "8px",
  2.5:  "10px",
  3:    "12px",
  4:    "16px",
  5:    "20px",
  6:    "24px",
  8:    "32px",
  10:   "40px",
  12:   "48px",
  16:   "64px",
  20:   "80px",
  24:   "96px",
} as const;

// ─── Border Radius ────────────────────────────────────────────────────────────

export const radius = {
  sm:   "6px",
  md:   "8px",
  lg:   "12px",
  xl:   "16px",
  "2xl":"20px",
  "3xl":"24px",
  full: "9999px",
} as const;

// ─── Shadows ──────────────────────────────────────────────────────────────────

export const shadows = {
  sm:       "0 2px 8px rgba(0, 0, 0, 0.3)",
  md:       "0 4px 20px rgba(0, 0, 0, 0.4)",
  lg:       "0 8px 40px rgba(0, 0, 0, 0.5)",
  xl:       "0 20px 80px rgba(0, 0, 0, 0.55)",
  brand:    "0 0 20px rgba(255, 45, 85, 0.25), 0 0 60px rgba(255, 45, 85, 0.08)",
  brandSm:  "0 0 10px rgba(255, 45, 85, 0.20), 0 0 30px rgba(255, 45, 85, 0.05)",
  success:  "0 0 16px rgba(0, 212, 168, 0.20)",
} as const;

// ─── Motion ───────────────────────────────────────────────────────────────────

export const motion = {
  durations: {
    instant:  0.1,
    fast:     0.15,
    normal:   0.2,
    slow:     0.3,
    enter:    0.35,
    page:     0.4,
  },
  easings: {
    easeOut:    [0, 0, 0.2, 1],
    easeIn:     [0.4, 0, 1, 1],
    easeInOut:  [0.4, 0, 0.2, 1],
    spring:     { type: "spring", stiffness: 300, damping: 30 },
  },
  presets: {
    fadeUp: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      exit:    { opacity: 0, y: 12 },
    },
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit:    { opacity: 0 },
    },
    scaleIn: {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      exit:    { opacity: 0, scale: 0.95 },
    },
    slideRight: {
      initial: { opacity: 0, x: "100%" },
      animate: { opacity: 1, x: 0 },
      exit:    { opacity: 0, x: "100%" },
    },
  },
} as const;

// ─── Z-Index ──────────────────────────────────────────────────────────────────

export const zIndex = {
  base:     0,
  elevated: 10,
  sticky:   20,
  header:   30,
  dropdown: 40,
  modal:    50,
  toast:    60,
} as const;

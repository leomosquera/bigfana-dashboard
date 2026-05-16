/**
 * BigFana Design System — Motion Standards
 *
 * Standardized transitions, variant presets, and stagger helpers for
 * consistent Framer Motion animations across the entire product.
 *
 * Usage:
 *   import { fadeUp, stagger, t } from "@/lib/design-system/motion";
 *
 *   // One-shot animation
 *   <motion.div {...fadeUp(0.1)}>...</motion.div>
 *
 *   // Stagger container
 *   <motion.ul variants={stagger.container()} initial="hidden" animate="visible">
 *     {items.map((i) => (
 *       <motion.li key={i.id} variants={stagger.item}>...</motion.li>
 *     ))}
 *   </motion.ul>
 */

import type { Transition, Variants } from "framer-motion";

// ─── Easing curves ────────────────────────────────────────────────────────────

export const ease = {
  /** Standard deceleration — most common for entering elements */
  out:    [0, 0, 0.2, 1]     as [number, number, number, number],
  /** Standard acceleration — for exiting elements */
  in:     [0.4, 0, 1, 1]     as [number, number, number, number],
  /** Symmetric in-out — for elements that move while staying on screen */
  inOut:  [0.4, 0, 0.2, 1]   as [number, number, number, number],
  /** Sharp entrance — micro-interactions */
  sharp:  [0.2, 0, 0, 1]     as [number, number, number, number],
} as const;

// ─── Duration scale ───────────────────────────────────────────────────────────

export const duration = {
  /** 100ms — immediate, micro-interactions */
  instant: 0.1,
  /** 150ms — fast feedback (hover, toggle) */
  fast:    0.15,
  /** 200ms — default transitions */
  normal:  0.2,
  /** 300ms — moderate movement */
  slow:    0.3,
  /** 350ms — content entering */
  enter:   0.35,
  /** 400ms — page-level transitions */
  page:    0.4,
  /** 700ms — metric/progress fills */
  fill:    0.7,
} as const;

// ─── Named transitions ────────────────────────────────────────────────────────

/** Pre-built Transition objects for the most common scenarios. */
export const t = {
  instant:  { duration: duration.instant }                    as Transition,
  fast:     { duration: duration.fast,   ease: ease.out    }  as Transition,
  normal:   { duration: duration.normal, ease: ease.out    }  as Transition,
  slow:     { duration: duration.slow,   ease: ease.inOut  }  as Transition,
  enter:    { duration: duration.enter,  ease: ease.out    }  as Transition,
  page:     { duration: duration.page,   ease: ease.out    }  as Transition,
  fill:     { duration: duration.fill,   ease: ease.out    }  as Transition,
  spring:   { type: "spring", stiffness: 300, damping: 30  }  as Transition,
  bouncy:   { type: "spring", stiffness: 400, damping: 20  }  as Transition,
} as const;

// ─── Variant Presets ──────────────────────────────────────────────────────────

/** Fade up from 12px below — most common entry animation. */
export const fadeUp: Variants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0  },
};

/** Fade down from 12px above — for top-entering elements. */
export const fadeDown: Variants = {
  hidden:  { opacity: 0, y: -12 },
  visible: { opacity: 1, y: 0   },
};

/** Opacity-only fade. */
export const fadeIn: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1 },
};

/** Scale + fade — for modals, dialogs, popups. */
export const scaleIn: Variants = {
  hidden:  { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1    },
};

/** Slide in from the right. */
export const slideRight: Variants = {
  hidden:  { opacity: 0, x: "100%" },
  visible: { opacity: 1, x: 0      },
};

/** Slide in from the left. */
export const slideLeft: Variants = {
  hidden:  { opacity: 0, x: "-100%" },
  visible: { opacity: 1, x: 0       },
};

/** Slide in from the bottom. */
export const slideUp: Variants = {
  hidden:  { opacity: 0, y: "100%" },
  visible: { opacity: 1, y: 0      },
};

// ─── Stagger helpers ──────────────────────────────────────────────────────────

/**
 * Builds a stagger parent + child variant pair.
 *
 * @example
 * const { container, item } = stagger(0.07);
 *
 * <motion.div variants={container} initial="hidden" animate="visible">
 *   {items.map((i) => (
 *     <motion.div key={i.id} variants={item}>...</motion.div>
 *   ))}
 * </motion.div>
 */
export function stagger(
  staggerChildren = 0.07,
  delayChildren   = 0,
  itemDuration    = duration.page
): { container: Variants; item: Variants } {
  return {
    container: {
      hidden:  {},
      visible: { transition: { staggerChildren, delayChildren } },
    },
    item: {
      hidden:  { opacity: 0, y: 16 },
      visible: { opacity: 1, y: 0, transition: { duration: itemDuration, ease: ease.out } },
    },
  };
}

/** Default stagger config — matches the existing dashboard pattern. */
export const defaultStagger = stagger(0.07);

// ─── One-shot prop spreads ────────────────────────────────────────────────────
// These return plain objects you can spread onto <motion.div> directly,
// as an alternative to variants when you only have one animation.

/**
 * Spread onto <motion.div> for a one-shot fade-up entry.
 *
 * @example
 * <motion.div {...fadeUpProps(0.1)}>...</motion.div>
 */
export function fadeUpProps(delay = 0, dur = duration.page) {
  return {
    initial:    { opacity: 0, y: 16 },
    animate:    { opacity: 1, y: 0  },
    transition: { duration: dur, ease: ease.out, delay },
  } as const;
}

/** Spread onto <motion.div> for a one-shot fade entry. */
export function fadeInProps(delay = 0, dur = duration.enter) {
  return {
    initial:    { opacity: 0 },
    animate:    { opacity: 1 },
    transition: { duration: dur, delay },
  } as const;
}

/** Spread onto <motion.div> for a one-shot scale+fade entry (modals). */
export function scaleInProps(delay = 0, dur = duration.normal) {
  return {
    initial:    { opacity: 0, scale: 0.95, y: 12 },
    animate:    { opacity: 1, scale: 1,    y: 0  },
    exit:       { opacity: 0, scale: 0.95, y: 12 },
    transition: { duration: dur, ease: ease.inOut, delay },
  } as const;
}

// ─── Hover micro-interaction presets ─────────────────────────────────────────

export const hover = {
  /** Lift — used on interactive cards */
  lift:   { y: -2, scale: 1.005 },
  /** Scale up — used on icon buttons, badges */
  grow:   { scale: 1.08 },
  /** Brightness — used on image overlays */
  bright: { filter: "brightness(1.1)" },
  /** Dim — used on destructive hover states */
  dim:    { opacity: 0.75 },
} as const;

export const tapScale = { scale: 0.97 } as const;

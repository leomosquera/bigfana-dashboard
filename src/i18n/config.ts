/**
 * BigFana i18n — Shared Config
 *
 * Single source of truth for locale constants.
 * Import this in both client and server contexts.
 *
 * To add a new locale later:
 *   1. Add the locale string to `locales`
 *   2. Create src/messages/<locale>/ with all namespace files
 *   3. Update request.ts to load the new locale's messages
 */

export const defaultLocale = "es" as const;

export const locales = ["es"] as const;
export type Locale = (typeof locales)[number];

/** IANA time zone used for date formatting across the platform. */
export const timeZone = "America/Argentina/Buenos_Aires" as const;

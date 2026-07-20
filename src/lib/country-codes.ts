/**
 * Fan profile geography helpers — ISO 3166-1 alpha-2.
 *
 * Canonical storage: fans.country_code (nullable TEXT + CHECK ^[A-Z]{2}$).
 * Display labels are derived via Intl.DisplayNames (default locale: es).
 *
 * Legacy free-text fans.country was physically removed from Neon.
 * Do not persist free-text country names.
 */

import { defaultLocale } from "@/i18n/config";

/** Practical ISO-3166-1 alpha-2 catalog for fan profile selection. */
export const ISO_COUNTRY_CODES = [
  "AE",
  "AR",
  "AT",
  "AU",
  "BE",
  "BO",
  "BR",
  "CA",
  "CH",
  "CL",
  "CN",
  "CO",
  "CR",
  "CU",
  "CZ",
  "DE",
  "DK",
  "DO",
  "EC",
  "EG",
  "ES",
  "FI",
  "FR",
  "GB",
  "GR",
  "GT",
  "HN",
  "IE",
  "IL",
  "IN",
  "IT",
  "JP",
  "KR",
  "MA",
  "MX",
  "NG",
  "NI",
  "NL",
  "NO",
  "NZ",
  "PA",
  "PE",
  "PL",
  "PR",
  "PT",
  "PY",
  "QA",
  "RO",
  "RU",
  "SA",
  "SE",
  "SV",
  "TR",
  "UA",
  "US",
  "UY",
  "VE",
  "ZA",
] as const;

const ISO_COUNTRY_CODE_SET = new Set<string>(ISO_COUNTRY_CODES);

export function isIsoCountryCode(value: string): boolean {
  return /^[A-Z]{2}$/.test(value);
}

/**
 * Normalize user/API input to a Neon-valid country_code or null.
 * Empty / whitespace → null.
 * Invalid format → null (use isInvalidCountryCodeInput for validation errors).
 */
export function normalizeCountryCode(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const code = trimmed.toUpperCase();
  return isIsoCountryCode(code) ? code : null;
}

/** True when input was non-empty but failed ISO-2 normalization. */
export function isInvalidCountryCodeInput(
  value: string | null | undefined,
): boolean {
  if (value == null) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return normalizeCountryCode(trimmed) == null;
}

export function getCountryLabel(
  code: string | null | undefined,
  locale: string = defaultLocale,
): string | null {
  const normalized = normalizeCountryCode(code);
  if (!normalized) return null;
  try {
    return (
      new Intl.DisplayNames([locale], { type: "region" }).of(normalized) ??
      normalized
    );
  } catch {
    return normalized;
  }
}

export function getCountrySelectOptions(
  locale: string = defaultLocale,
): Array<{ value: string; label: string }> {
  return [...ISO_COUNTRY_CODE_SET]
    .map((code) => ({
      value: code,
      label: getCountryLabel(code, locale) ?? code,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, locale));
}

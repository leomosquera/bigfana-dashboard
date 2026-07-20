/**
 * Pure Dashboard Home presentation helpers (client-safe).
 * No database imports — used by server queries tests and Home UI.
 */

export function resolveFanDisplayName(fan: {
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
}): string | null {
  const display = fan.displayName?.trim();
  if (display) return display;

  const parts = [fan.firstName?.trim(), fan.lastName?.trim()].filter(
    (p): p is string => Boolean(p),
  );
  if (parts.length > 0) return parts.join(" ");

  return null;
}

/** Truthful event-type label: snake_case → spaces (no invented copy). */
export function formatEventTypeLabel(eventType: string): string {
  return eventType.replace(/_/g, " ").trim();
}

export function formatRelativeTimeEs(
  date: Date,
  now: Date = new Date(),
): string {
  const diffMs = date.getTime() - now.getTime();
  const absSec = Math.round(Math.abs(diffMs) / 1000);
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

  if (absSec < 60) return rtf.format(Math.round(diffMs / 1000), "second");
  const absMin = Math.round(absSec / 60);
  if (absMin < 60) return rtf.format(Math.round(diffMs / (60 * 1000)), "minute");
  const absHour = Math.round(absMin / 60);
  if (absHour < 48) {
    return rtf.format(Math.round(diffMs / (60 * 60 * 1000)), "hour");
  }
  const absDay = Math.round(absHour / 24);
  if (absDay < 30) {
    return rtf.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), "day");
  }
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

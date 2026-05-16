/**
 * BigFana i18n — Server Request Config
 *
 * Loaded by the next-intl plugin at request time.
 * Merges per-namespace JSON files into a single messages object
 * so each namespace is independently maintainable.
 *
 * To add a new locale later:
 *   1. Add a case to the switch below
 *   2. Create src/messages/<locale>/ with matching namespace files
 */

import { getRequestConfig } from "next-intl/server";
import { timeZone } from "./config";

export default getRequestConfig(async () => ({
  locale: "es",
  timeZone,
  messages: {
    common:    (await import("../messages/es/common.json")).default,
    nav:       (await import("../messages/es/nav.json")).default,
    header:    (await import("../messages/es/header.json")).default,
    dashboard: (await import("../messages/es/dashboard.json")).default,
    fans:      (await import("../messages/es/fans.json")).default,
    campaigns: (await import("../messages/es/campaigns.json")).default,
    analytics: (await import("../messages/es/analytics.json")).default,
    settings:  (await import("../messages/es/settings.json")).default,
  },
}));

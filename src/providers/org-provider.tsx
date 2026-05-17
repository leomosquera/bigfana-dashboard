"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Organization, MembershipRole } from "@/db/schema";
import {
  applyTenantTheme,
  defaultTheme,
  type TenantTheme,
} from "@/lib/design-system/theme";
import { brandColorToTokens } from "@/lib/color-utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrgContextValue {
  org: Organization | null;
  role: MembershipRole | null;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const OrgContext = createContext<OrgContextValue>({
  org: null,
  role: null,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

interface OrgProviderProps {
  children: React.ReactNode;
  /** Org fetched server-side in the dashboard layout. Never null here. */
  initialOrg: Organization;
  /** Role of the authenticated user within the org. */
  initialRole: MembershipRole;
}

/**
 * Provides the active organization and user role to the dashboard tree.
 *
 * On mount (and whenever the org changes), it derives BrandTokens from
 * the org's brandColor and calls applyTenantTheme() — writing CSS custom
 * properties to :root so the entire UI re-themes without a rebuild.
 *
 * If the org has no brandColor configured, it falls back to defaultTheme.
 *
 * Initial data arrives from the server (no client-side fetch on first load).
 * Future org-switching can be implemented by calling setOrg() from a switcher
 * component — the useEffect handles re-theming automatically.
 */
export function OrgProvider({ children, initialOrg, initialRole }: OrgProviderProps) {
  const [org, setOrg] = useState<Organization>(initialOrg);
  const [role] = useState<MembershipRole>(initialRole);

  // Expose setOrg for future org-switcher without exposing it on the context yet.
  void setOrg;

  useEffect(() => {
    let theme: TenantTheme;

    if (org.brandColor) {
      const tokens = brandColorToTokens(org.brandColor);
      theme = tokens
        ? { id: org.slug, displayName: org.name, brand: tokens }
        : defaultTheme;
    } else {
      theme = defaultTheme;
    }

    applyTenantTheme(theme);
  }, [org]);

  return (
    <OrgContext.Provider value={{ org, role }}>
      {children}
    </OrgContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useOrg(): OrgContextValue {
  return useContext(OrgContext);
}

import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserActiveMembership } from "./organizations";
import type { ActiveMembership } from "./organizations";
import type { Organization } from "@/db/schema";

export interface DashboardContext extends ActiveMembership {
  userId: string;
}

/**
 * Returns the authenticated session + active org membership for any dashboard
 * server component or server action that needs tenant context.
 *
 * Wrapped in React cache() so the session + membership lookup is deduplicated
 * per request — the layout and every page that calls this share one round-trip.
 *
 * Redirects to /login or /onboarding on failure, matching the layout guard.
 */
export const getDashboardContext = cache(async (): Promise<DashboardContext> => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const membership = await getUserActiveMembership(session.user.id);

  if (!membership) {
    redirect("/onboarding");
  }

  return {
    userId: session.user.id,
    org: membership.org,
    role: membership.role,
  };
});

export interface DashboardOrgApiContext {
  userId: string;
  org: Organization;
}

/**
 * Same tenant resolution as the dashboard, without redirects — for Route Handlers.
 * Returns null when unauthenticated or missing active membership.
 */
export async function getDashboardOrgContextForApi(): Promise<DashboardOrgApiContext | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) return null;

  const membership = await getUserActiveMembership(session.user.id);
  if (!membership) return null;

  return { userId: session.user.id, org: membership.org };
}

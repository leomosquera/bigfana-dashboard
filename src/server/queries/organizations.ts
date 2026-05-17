import { db } from "@/db";
import { organizations, memberships } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { Organization, MembershipRole } from "@/db/schema";

export interface ActiveMembership {
  org: Organization;
  role: MembershipRole;
}

/**
 * Returns the first active organization membership for a given Better Auth user.
 *
 * Joins on better_auth_user_id (not user_id) so that the legacy users table
 * is not involved in the auth flow. Legacy user_id rows are preserved as-is.
 *
 * Used by the dashboard layout server component to:
 *   1. Guard against users with no active org (redirect to /onboarding)
 *   2. Pass org and role to OrgProvider for theme application
 */
export async function getUserActiveMembership(
  betterAuthUserId: string,
): Promise<ActiveMembership | null> {
  const result = await db
    .select({
      org: organizations,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(organizations, eq(memberships.organizationId, organizations.id))
    .where(
      and(
        eq(memberships.betterAuthUserId, betterAuthUserId),
        eq(memberships.status, "active"),
      ),
    )
    .limit(1);

  if (!result[0]) return null;

  return {
    org: result[0].org,
    role: result[0].role as MembershipRole,
  };
}

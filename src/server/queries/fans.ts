import { db } from "@/db";
import { fans, fanOrganizations, toFanView } from "@/db/schema";
import { eq, and, ne, desc, sql } from "drizzle-orm";
import type { Fan, FanView } from "@/db/schema";
import {
  hasFanOrgMembership,
  listFansForOrganization,
} from "./fan-organizations";

export type { Fan, FanView };
export { toFanView };

/**
 * Returns non-archived PRIMARY fans for the organization (R03 / ADR-009 Phase C).
 * Membership via fan_organizations (is_primary). Not ANY / FOLLOWING.
 * Returns FanView (identity only; membership via fan_organizations).
 */
export async function getFansByOrg(organizationId: string): Promise<FanView[]> {
  const rows = await listFansForOrganization(organizationId, "primary", {
    excludeArchived: true,
  });

  return rows.sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

/**
 * Returns a single fan by id if they have ANY fan_organizations relation
 * to the organization (PRIMARY or FOLLOWING). Returns null otherwise.
 *
 * @param organizationId Command/tenant access context (not fan ownership).
 */
export async function getFanById(
  organizationId: string,
  fanId: string,
): Promise<FanView | null> {
  const related = await hasFanOrgMembership(fanId, organizationId, "any");
  if (!related) return null;

  const result = await db
    .select()
    .from(fans)
    .where(eq(fans.id, fanId))
    .limit(1);

  return result[0] ? toFanView(result[0]) : null;
}

/**
 * Lookup by email for demo / fan-facing flows — case-insensitive trim.
 * Requires ANY fan_organizations membership in the organization.
 * Excludes archived fans.
 *
 * @param organizationId Command/tenant access context (not fan ownership).
 */
export async function getFanByEmail(
  organizationId: string,
  email: string,
): Promise<FanView | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const result = await db
    .select({ fan: fans })
    .from(fanOrganizations)
    .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
    .where(
      and(
        eq(fanOrganizations.organizationId, organizationId),
        ne(fans.status, "archived"),
        sql`lower(trim(${fans.email})) = ${normalized}`,
      ),
    )
    .orderBy(desc(fans.updatedAt))
    .limit(1);

  return result[0] ? toFanView(result[0].fan) : null;
}

/**
 * Platform-global fan identity lookup by normalized email (ADR-001 / R04).
 * Includes archived fans — matches fans_email_normalized_unique_idx occupancy.
 * Does not filter by organization membership.
 */
export async function findFanByNormalizedEmail(
  email: string,
): Promise<Pick<Fan, "id"> | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const result = await db
    .select({ id: fans.id })
    .from(fans)
    .where(sql`lower(trim(${fans.email})) = ${normalized}`)
    .limit(1);

  return result[0] ?? null;
}

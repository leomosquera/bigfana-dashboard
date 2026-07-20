/**
 * Canonical fan↔organization membership primitives (ADR-001 / ADR-002 / ADR-009).
 *
 * Source of truth: fan_organizations.
 * Do NOT use the deprecated legacy fan ownership column for membership.
 *
 * Phase B helpers; Phase C read paths adopt these for tenancy.
 */

import { db } from "@/db";
import { fanOrganizations, fans, toFanView } from "@/db/schema";
import type { FanOrganization, FanView } from "@/db/schema";
import { and, eq, ne } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { FanOrgRelationshipScope } from "./fan-org-membership";

export type { FanOrganization, FanOrgRelationshipScope, FanView };
export {
  fanOrgRowMatchesMembership,
  fanOrgRowMatchesScope,
} from "./fan-org-membership";

/** SQL fragment for scope on fan_organizations (no fans.organization_id). */
function scopeCondition(scope: FanOrgRelationshipScope): SQL | undefined {
  if (scope === "primary") {
    return eq(fanOrganizations.isPrimary, true);
  }
  return undefined;
}

// ─── Membership checks ───────────────────────────────────────────────────────

/**
 * ANY or PRIMARY membership for (fanId, organizationId) via fan_organizations.
 */
export async function hasFanOrgMembership(
  fanId: string,
  organizationId: string,
  scope: FanOrgRelationshipScope = "any",
): Promise<boolean> {
  const conditions = [
    eq(fanOrganizations.fanId, fanId),
    eq(fanOrganizations.organizationId, organizationId),
  ];
  const scoped = scopeCondition(scope);
  if (scoped) conditions.push(scoped);

  const rows = await db
    .select({ id: fanOrganizations.id })
    .from(fanOrganizations)
    .where(and(...conditions))
    .limit(1);

  return rows.length > 0;
}

/**
 * Canonical PRIMARY membership for (fanId, organizationId).
 * Uses fan_organizations.is_primary — never the deprecated legacy ownership column.
 */
export async function hasPrimaryFanOrganization(
  fanId: string,
  organizationId: string,
): Promise<boolean> {
  return hasFanOrgMembership(fanId, organizationId, "primary");
}

/**
 * Returns the fan's canonical PRIMARY fan_organizations row, or null if none.
 * Does not fall back to the deprecated legacy ownership column.
 */
export async function getPrimaryFanOrganization(
  fanId: string,
): Promise<FanOrganization | null> {
  const rows = await db
    .select()
    .from(fanOrganizations)
    .where(
      and(
        eq(fanOrganizations.fanId, fanId),
        eq(fanOrganizations.isPrimary, true),
      ),
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Returns the fan's canonical PRIMARY organization_id, or null if none.
 */
export async function getPrimaryOrganizationId(
  fanId: string,
): Promise<string | null> {
  const primary = await getPrimaryFanOrganization(fanId);
  return primary?.organizationId ?? null;
}

/**
 * Throws when the fan lacks the required fan_organizations membership.
 * For Phase C adoption of assertFanOwnership-style guards.
 */
export async function assertFanOrgMembership(
  fanId: string,
  organizationId: string,
  scope: FanOrgRelationshipScope = "any",
): Promise<void> {
  const ok = await hasFanOrgMembership(fanId, organizationId, scope);
  if (!ok) {
    throw new Error("Fan not found or access denied");
  }
}

// ─── Organization → fans listing ─────────────────────────────────────────────

/**
 * Fan IDs related to an organization via fan_organizations.
 */
export async function listFanIdsForOrganization(
  organizationId: string,
  scope: FanOrgRelationshipScope = "any",
): Promise<string[]> {
  const conditions = [eq(fanOrganizations.organizationId, organizationId)];
  const scoped = scopeCondition(scope);
  if (scoped) conditions.push(scoped);

  const rows = await db
    .select({ fanId: fanOrganizations.fanId })
    .from(fanOrganizations)
    .where(and(...conditions));

  return rows.map((r) => r.fanId);
}

export interface ListFansForOrganizationOptions {
  /**
   * When true (default), excludes fans.status = 'archived'.
   * Lifecycle convention only — does not decide R03 product listing semantics.
   */
  excludeArchived?: boolean;
}

/**
 * Fans related to an organization via fan_organizations (join on fans.id).
 *
 * Scope must be explicit (`any` | `primary`) so Phase C can choose per call site.
 * Returns FanView (Fan identity rows; ownership via fan_organizations only).
 */
export async function listFansForOrganization(
  organizationId: string,
  scope: FanOrgRelationshipScope,
  options: ListFansForOrganizationOptions = {},
): Promise<FanView[]> {
  const { excludeArchived = true } = options;

  const conditions = [eq(fanOrganizations.organizationId, organizationId)];
  const scoped = scopeCondition(scope);
  if (scoped) conditions.push(scoped);
  if (excludeArchived) {
    conditions.push(ne(fans.status, "archived"));
  }

  // Join fans for row payload only. Membership filter is fan_organizations exclusively.
  const rows = await db
    .select({ fan: fans })
    .from(fanOrganizations)
    .innerJoin(fans, eq(fanOrganizations.fanId, fans.id))
    .where(and(...conditions));

  return rows.map((r) => toFanView(r.fan));
}

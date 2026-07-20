/**
 * Pure ANY / PRIMARY membership predicates for fan_organizations (ADR-009).
 *
 * Kept free of DB imports so semantics can be unit-tested without Neon.
 * Runtime query helpers live in fan-organizations.ts.
 */

export type FanOrgRelationshipScope = "any" | "primary";

export interface FanOrgMembershipRow {
  fanId: string;
  organizationId: string;
  isPrimary: boolean;
}

/**
 * Whether a fan_organizations row satisfies the requested scope.
 * Assumes fan_id / organization_id already match the query context.
 *
 * PRIMARY uses is_primary = TRUE (Migration 001 unique invariant).
 * Does not consult fans.organization_id.
 */
export function fanOrgRowMatchesScope(
  row: Pick<FanOrgMembershipRow, "isPrimary">,
  scope: FanOrgRelationshipScope,
): boolean {
  if (scope === "primary") return row.isPrimary === true;
  return true;
}

/**
 * Full membership check against an in-memory fan_organizations row.
 */
export function fanOrgRowMatchesMembership(
  row: FanOrgMembershipRow,
  fanId: string,
  organizationId: string,
  scope: FanOrgRelationshipScope,
): boolean {
  if (row.fanId !== fanId || row.organizationId !== organizationId) {
    return false;
  }
  return fanOrgRowMatchesScope(row, scope);
}

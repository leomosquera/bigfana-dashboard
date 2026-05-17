import { db } from "@/db";
import { fans } from "@/db/schema";
import { eq, and, ne, desc, sql } from "drizzle-orm";
import type { Fan } from "@/db/schema";

export type { Fan };

/**
 * Returns all non-archived fans for the given organization.
 * Archived fans are excluded by default to match the lifecycle model.
 * Results are ordered by creation date descending (newest first).
 */
export async function getFansByOrg(organizationId: string): Promise<Fan[]> {
  return db
    .select()
    .from(fans)
    .where(
      and(
        eq(fans.organizationId, organizationId),
        ne(fans.status, "archived"),
      ),
    )
    .orderBy(desc(fans.createdAt));
}

/**
 * Returns a single fan by id, scoped to the organization.
 * Returns null if the fan does not exist or belongs to a different org.
 */
export async function getFanById(
  organizationId: string,
  fanId: string,
): Promise<Fan | null> {
  const result = await db
    .select()
    .from(fans)
    .where(
      and(
        eq(fans.organizationId, organizationId),
        eq(fans.id, fanId),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Lookup by email for demo / fan-facing flows — case-insensitive trim.
 * Excludes archived fans. Returns null when missing or ambiguous safely via first match.
 */
export async function getFanByEmail(
  organizationId: string,
  email: string,
): Promise<Fan | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const result = await db
    .select()
    .from(fans)
    .where(
      and(
        eq(fans.organizationId, organizationId),
        ne(fans.status, "archived"),
        sql`lower(trim(${fans.email})) = ${normalized}`,
      ),
    )
    .orderBy(desc(fans.updatedAt))
    .limit(1);

  return result[0] ?? null;
}

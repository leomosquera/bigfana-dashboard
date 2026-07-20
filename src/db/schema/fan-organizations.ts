/**
 * fan_organizations — sole authoritative fan↔organization relationship.
 *
 * Reflects Neon table shape from Migration 001 (ADR-001 / ADR-002).
 * ADR-009 contract COMPLETE: fans.organization_id physically removed (018b).
 * Canonical path: fan → fan_organizations → organization.
 */

import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { fans } from "./fans";
import { organizations } from "./organizations";

export const fanOrganizations = pgTable(
  "fan_organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    fanId: uuid("fan_id")
      .notNull()
      .references(() => fans.id, { onDelete: "cascade" }),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    /**
     * Allowed values (DB CHECK): 'PRIMARY' | 'FOLLOWING'
     * Stored as VARCHAR(20) in Neon (no PG enum).
     */
    relationshipType: varchar("relationship_type", { length: 20 }).notNull(),

    isPrimary: boolean("is_primary").notNull().default(false),

    joinedAt: timestamp("joined_at"),

    metadata: jsonb("metadata")
      .notNull()
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    index("fan_organizations_fan_idx").on(table.fanId),
    index("fan_organizations_org_idx").on(table.organizationId),
    index("fan_organizations_relationship_idx").on(table.relationshipType),
    uniqueIndex("fan_organizations_unique_relation_idx").on(
      table.fanId,
      table.organizationId,
    ),
    // Exactly one PRIMARY organization per fan
    uniqueIndex("fan_organizations_primary_idx")
      .on(table.fanId)
      .where(sql`${table.isPrimary} = TRUE`),
  ],
);

// --- Inferred types ---

export type FanOrganization = typeof fanOrganizations.$inferSelect;
export type NewFanOrganization = typeof fanOrganizations.$inferInsert;

/** Narrowed relationship_type values (Neon CHECK; not a PG enum). */
export type FanOrganizationRelationshipType = "PRIMARY" | "FOLLOWING";

/**
 * competition_organizations — organization ↔ competition membership.
 *
 * Completes canonical sport context (ADR-004 / Migration 004 / 019a):
 *   organization → competition_organizations → competitions → sports
 *
 * Multi-competition organizations are supported:
 * UNIQUE (competition_id, organization_id) only — never UNIQUE (organization_id).
 *
 * Neon timestamps (verified Block B / F08): TIMESTAMP WITHOUT TIME ZONE.
 * FK ON DELETE RESTRICT on both parents (catalog / org longevity).
 */

import {
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { competitions } from "./competitions";
import { organizations } from "./organizations";

export const competitionOrganizations = pgTable(
  "competition_organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    competitionId: uuid("competition_id")
      .notNull()
      .references(() => competitions.id, { onDelete: "restrict" }),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),

    /** NULL for Foundation seed memberships (Migration 019a). */
    joinedAt: timestamp("joined_at"),

    // Neon: TIMESTAMP WITHOUT TIME ZONE
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("competition_organizations_unique_membership").on(
      table.competitionId,
      table.organizationId,
    ),
    index("competition_organizations_competition_idx").on(table.competitionId),
    index("competition_organizations_organization_idx").on(
      table.organizationId,
    ),
  ],
);

export type CompetitionOrganization =
  typeof competitionOrganizations.$inferSelect;
export type NewCompetitionOrganization =
  typeof competitionOrganizations.$inferInsert;

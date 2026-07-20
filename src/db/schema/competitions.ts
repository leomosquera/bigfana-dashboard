/**
 * competitions — global competition catalog (ADR-004 / ADR-005 / Migration 003).
 *
 * Neon: competition_type is TEXT + CHECK (not a PG enum).
 * Neon timestamps (verified Block B / F08): TIMESTAMP WITHOUT TIME ZONE.
 */

import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sports } from "./sports";

// --- Application / CHECK-aligned value domain (Neon: TEXT + CHECK) ---

export const COMPETITION_TYPE_VALUES = ["INTEGRATED", "MANAGED"] as const;

export type CompetitionType = (typeof COMPETITION_TYPE_VALUES)[number];

export const competitions = pgTable(
  "competitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    sportId: uuid("sport_id")
      .notNull()
      .references(() => sports.id, { onDelete: "restrict" }),

    name: text("name").notNull(),

    /** Canonical competition identifier. */
    slug: text("slug").notNull(),

    /**
     * Neon CHECK competitions_competition_type_check:
     * INTEGRATED | MANAGED — TEXT, not a PG enum.
     */
    competitionType: text("competition_type")
      .$type<CompetitionType>()
      .notNull(),

    /**
     * ISO 3166-1 alpha-2 when domestic; NULL for international.
     * Neon CHECK competitions_country_code_check: NULL or ^[A-Z]{2}$.
     */
    countryCode: text("country_code"),

    isActive: boolean("is_active").notNull().default(true),

    // Neon: TIMESTAMP WITHOUT TIME ZONE
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("competitions_slug_unique").on(table.slug),
    index("competitions_sport_idx").on(table.sportId),
    index("competitions_type_idx").on(table.competitionType),
    index("competitions_active_idx").on(table.isActive),
  ],
);

export type Competition = typeof competitions.$inferSelect;
export type NewCompetition = typeof competitions.$inferInsert;

/**
 * sports — global sports catalog (ADR-004 / Migration 002).
 *
 * Canonical organization sport context is NOT stored on organizations.
 * Path: organization → competition_organizations → competitions → sports.
 *
 * Neon timestamps (verified Block B / F08): TIMESTAMP WITHOUT TIME ZONE.
 */

import {
  boolean,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const sports = pgTable(
  "sports",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    /** English display label (unique). slug is the canonical identifier. */
    name: text("name").notNull(),

    /** Canonical global sport identifier. */
    slug: text("slug").notNull(),

    isActive: boolean("is_active").notNull().default(true),

    // Neon: TIMESTAMP WITHOUT TIME ZONE
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("sports_name_unique").on(table.name),
    uniqueIndex("sports_slug_unique").on(table.slug),
  ],
);

export type Sport = typeof sports.$inferSelect;
export type NewSport = typeof sports.$inferInsert;

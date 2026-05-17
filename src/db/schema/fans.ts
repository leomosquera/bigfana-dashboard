import {
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

// --- Enums ---

export const eepSyncStatusEnum = pgEnum("eep_sync_status", [
  "pending",
  "synced",
  "failed",
  "retrying",
]);

// --- Tables ---

export const fans = pgTable("fans", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),

  // Identity
  /**
   * Optional reference to an external source system (CRM import, CSV, etc.).
   * Not the same as eepContactId.
   */
  externalId: text("external_id"),
  displayName: text("display_name").notNull(),
  email: text("email"),
  phone: text("phone"),

  // Segmentation
  segment: text("segment"),
  tier: text("tier"),
  engagementScore: integer("engagement_score").notNull().default(0),

  // EEP Integration
  /**
   * The contact ID returned by EEP after a successful sync.
   * Null until the integration job is processed and confirmed.
   */
  eepContactId: text("eep_contact_id"),
  /**
   * Tracks the current EEP sync lifecycle.
   * Default 'pending' ensures every new fan enters the sync queue immediately.
   */
  eepSyncStatus: eepSyncStatusEnum("eep_sync_status").notNull().default("pending"),
  /**
   * Timestamp of the last successful EEP sync.
   */
  eepLastSyncAt: timestamp("eep_last_sync_at", { withTimezone: true }),
  /**
   * The last EEP sync error message, if any.
   * Reset to null on successful sync.
   */
  eepLastError: text("eep_last_error"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Inferred types ---

export type Fan = typeof fans.$inferSelect;
export type NewFan = typeof fans.$inferInsert;

export type EepSyncStatus = (typeof eepSyncStatusEnum.enumValues)[number];

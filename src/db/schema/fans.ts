import {
  date,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// --- Application / CHECK-aligned value domains (Neon: TEXT + CHECK) ---
// Neon physical columns are TEXT, not PG enum types.
// Do not reintroduce pgEnum column mappings for these fields.
// Note: an unused PG type `fan_status` may still exist in Neon (DB hygiene debt only).

export const FAN_STATUS_VALUES = [
  "active",
  "inactive",
  "suspended",
  "archived",
] as const;

export const EEP_SYNC_STATUS_VALUES = [
  "pending",
  "synced",
  "failed",
  "retrying",
] as const;

export type FanStatus = (typeof FAN_STATUS_VALUES)[number];
export type EepSyncStatus = (typeof EEP_SYNC_STATUS_VALUES)[number];

// --- Tables ---

/**
 * Fan identity table (ADR-001).
 *
 * Ownership / tenancy is NOT on this table.
 * Sole authoritative fan↔organization relationship: fan_organizations (ADR-002 / ADR-009).
 *
 * Legacy fans.organization_id was physically removed by Migration 018b (COMPLETE).
 * Do not reintroduce ownership columns on this table.
 */
export const fans = pgTable("fans", {
  id: uuid("id").primaryKey().defaultRandom(),

  // Lifecycle
  /**
   * Fan lifecycle status. All standard queries exclude 'archived'.
   * UI actions: suspend, reactivate, archive. No physical deletes.
   * Neon: TEXT + CHECK (fans_status_check) — not a PG enum column type.
   */
  status: text("status").$type<FanStatus>().notNull().default("active"),

  // Identity
  /**
   * Optional reference to an external source system (CRM import, CSV, etc.).
   * Not the same as eepContactId.
   */
  externalId: text("external_id"),
  /**
   * Source of truth: firstName + lastName. displayName is derived and persisted
   * at write time for DataTable display and search compatibility.
   * Neon: nullable TEXT (application writes currently populate it).
   */
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  email: text("email"),
  phone: text("phone"),
  birthDate: date("birth_date"),
  gender: text("gender"),
  city: text("city"),
  /**
   * Canonical fan profile geography (Migration 006 / Block D cutover).
   * Neon: TEXT + CHECK fans_country_code_check — NULL or ISO 3166-1 alpha-2 ^[A-Z]{2}$.
   * Legacy fans.country remains physically in Neon but is unmapped (do not reintroduce).
   */
  countryCode: text("country_code"),
  /**
   * Optional avatar URL (Migration 006). Mapped for representation alignment only.
   * No upload / profile feature wiring in this phase.
   */
  avatarUrl: text("avatar_url"),

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
   * Neon: TEXT + CHECK (fans_eep_sync_status_check) — not a PG enum column type.
   */
  eepSyncStatus: text("eep_sync_status")
    .$type<EepSyncStatus>()
    .notNull()
    .default("pending"),
  /**
   * Timestamp of the last successful EEP sync.
   * Neon: TIMESTAMP WITHOUT TIME ZONE.
   */
  eepLastSyncAt: timestamp("eep_last_sync_at"),
  /**
   * The last EEP sync error message, if any.
   * Reset to null on successful sync.
   */
  eepLastError: text("eep_last_error"),

  // Neon: TIMESTAMP WITHOUT TIME ZONE
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// --- Inferred types ---

/** Drizzle fan row — identity only; relationships live in fan_organizations. */
export type Fan = typeof fans.$inferSelect;

/**
 * App-facing fan record.
 * Structurally equivalent to Fan after Phase F2 removed the legacy ownership mapping.
 */
export type FanView = Fan;

/** Insert shape — identity only; relationships live in fan_organizations. */
export type NewFan = typeof fans.$inferInsert;

/** Identity mapper retained for call-site stability (FanView ≡ Fan post-F2). */
export function toFanView(fan: Fan): FanView {
  return fan;
}

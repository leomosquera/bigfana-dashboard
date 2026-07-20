/**
 * Organizations and memberships schema.
 *
 * Reflects the Neon PostgreSQL table structure used by the application.
 * The existing database uses text (not enums) for role and status columns,
 * and uuid (not text) for user_id in memberships.
 *
 * better_auth_user_id links a membership to a Better Auth user session.
 * It is separate from user_id (which references the legacy users table)
 * so that existing seeded data is not disturbed.
 *
 * Legacy organizations.sport was removed by Migration 019b. Canonical sport /
 * competition context is derived via:
 *   organization → competition_organizations → competitions → sports
 *
 * Do not reintroduce organizations.sport or organizations.sport_id.
 */

import {
  boolean,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// ─── Organizations ────────────────────────────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  brandColor: text("brand_color"),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  country: text("country"),
  timezone: text("timezone"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Memberships ─────────────────────────────────────────────────────────────

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  /**
   * FK to the legacy users table (uuid). Preserved from existing schema.
   * New auth-based access uses better_auth_user_id instead.
   */
  userId: uuid("user_id").notNull(),
  organizationId: uuid("organization_id").notNull(),
  /**
   * Neon CHECK vocabulary: 'owner' | 'admin' | 'tenant' | 'analyst'
   * Stored as TEXT in Neon (no PG enum).
   */
  role: text("role").notNull(),
  /**
   * Neon CHECK vocabulary: 'active' | 'invited' | 'suspended'
   * Stored as TEXT in Neon (no PG enum).
   */
  status: text("status").notNull().default("active"),
  /**
   * Better Auth user ID (text). Links this membership to an authenticated
   * session. Set when the user is created via Better Auth and their
   * membership is confirmed. Null for legacy memberships not yet migrated.
   */
  betterAuthUserId: text("better_auth_user_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;

export type Membership = typeof memberships.$inferSelect;
export type NewMembership = typeof memberships.$inferInsert;

/**
 * Canonical membership role contract — matches Neon memberships.role CHECK.
 * Neon is SoT: owner | admin | tenant | analyst.
 * Do not reintroduce manager / member without an explicit Neon CHECK change.
 */
export const MEMBERSHIP_ROLE_VALUES = [
  "owner",
  "admin",
  "tenant",
  "analyst",
] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLE_VALUES)[number];
export type MembershipStatus = "active" | "invited" | "suspended";

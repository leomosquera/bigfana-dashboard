import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { fans } from "./fans";
import { fanEvents } from "./events";

// Neon timestamps for this module (verified Block A / NEW-F17):
// TIMESTAMP WITH TIME ZONE. `withTimezone: true` is intentional and ALIGNED.

// ─── fan_points_ledger ────────────────────────────────────────────────────────

/**
 * Immutable, append-only points ledger.
 *
 * Every point award or deduction for a fan is a row in this table.
 * The table is the source of truth for the points economy.
 *
 * Design constraints:
 *   - No updatedAt  — rows are immutable once written.
 *   - No deletedAt  — no physical or logical deletes. Ever.
 *   - Reversals     — add a new negative entry, not a delete.
 *   - balanceAfter  — denormalized running total; enables O(1) balance reads
 *                     without summing the full history. Can be rebuilt from
 *                     ledger rows at any time (rebuildable invariant).
 *   - fanId         — onDelete RESTRICT: preserve ledger even if fan record
 *                     is somehow removed. Status lifecycle prevents this in
 *                     practice, but RESTRICT enforces the contract at DB level.
 */
export const fanPointsLedger = pgTable(
  "fan_points_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    fanId: uuid("fan_id")
      .notNull()
      .references(() => fans.id, { onDelete: "restrict" }),

    /**
     * Optional link to the fan_event that triggered this ledger entry.
     * Null for manual admin awards and automated system grants.
     * Set to null if the source event is deleted (unlikely, events are
     * also append-only, but guarded with SET NULL).
     */
    fanEventId: uuid("fan_event_id").references(() => fanEvents.id, {
      onDelete: "set null",
    }),

    // ── Core economy ─────────────────────────────────────────────────────────
    /**
     * Points delta. Positive = award, negative = deduction.
     * Zero entries are valid (no-op records for audit trail purposes).
     */
    points: integer("points").notNull(),

    /**
     * Denormalized running total AFTER this entry was applied.
     * Matches fans.engagement_score at write time.
     * Can be used to restore engagement_score from ledger history.
     */
    balanceAfter: integer("balance_after").notNull(),

    // ── Classification ────────────────────────────────────────────────────────
    /**
     * What type of action produced this entry. Free-form text, not an enum,
     * so new event types don't require schema migrations.
     *
     * Convention: snake_case
     * Examples: 'manual_award', 'trivia_correct', 'daily_checkin',
     *           'match_attended', 'prediction_won', 'admin_deduction'
     */
    eventType: text("event_type").notNull(),

    /**
     * Origin system that triggered this entry.
     * Examples: 'admin', 'system', 'campaign', 'eep', 'mobile'
     */
    source: text("source").notNull().default("system"),

    // ── Context ───────────────────────────────────────────────────────────────
    /** Human-readable reason shown in admin UIs and fan history. */
    reason: text("reason").notNull(),

    /** Flexible event-specific data (trivia question ID, campaign ID, etc.). */
    metadata: jsonb("metadata"),

    // ── Attribution ───────────────────────────────────────────────────────────
    /**
     * Admin user ID if this entry was created manually.
     * Null for automated system entries.
     */
    awardedBy: uuid("awarded_by"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // Intentionally no updatedAt — this table is immutable.
  },
  (table) => [
    // Primary access pattern: fan history timeline
    index("fan_points_ledger_fan_idx").on(table.fanId, table.createdAt),
    // Org-scoped analytics and leaderboard aggregations
    index("fan_points_ledger_org_idx").on(table.organizationId, table.createdAt),
    // Event-type analytics (e.g. total points from trivia across org)
    index("fan_points_ledger_org_type_idx").on(
      table.organizationId,
      table.eventType,
    ),
  ],
);

// ─── fan_levels ───────────────────────────────────────────────────────────────

/**
 * Per-organization fan level tier definitions.
 *
 * Levels are configured per org so each club can brand their own tier names
 * (e.g. "Hincha → Fanático → Embajador → Leyenda" or custom names).
 *
 * Level computation: the highest tier whose minPoints ≤ fan.engagementScore.
 * Fans below every tier's minPoints have no level.
 *
 * Default tiers are seeded for new organizations.
 */
export const fanLevels = pgTable(
  "fan_levels",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    /** Display name shown in badges and fan-facing UIs. */
    name: text("name").notNull(),

    /**
     * Minimum cumulative points required to reach this level.
     * Fans with engagementScore >= minPoints qualify for this tier
     * (subject to higher tiers taking precedence).
     */
    minPoints: integer("min_points").notNull().default(0),

    /** Optional hex color for level badges (e.g. '#C97B2E' for bronze). */
    color: text("color"),

    /** Ordering weight. Lower = less prestigious. Used for display sorting. */
    sortOrder: integer("sort_order").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Threshold lookup: find all levels for an org ordered by minPoints
    index("fan_levels_org_points_idx").on(
      table.organizationId,
      table.minPoints,
    ),
    // Prevent duplicate level names per org
    uniqueIndex("fan_levels_org_name_idx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

// ─── Inferred types ───────────────────────────────────────────────────────────

export type FanPointsLedger    = typeof fanPointsLedger.$inferSelect;
export type NewFanPointsLedger = typeof fanPointsLedger.$inferInsert;

export type FanLevel    = typeof fanLevels.$inferSelect;
export type NewFanLevel = typeof fanLevels.$inferInsert;

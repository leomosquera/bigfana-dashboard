import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { fans } from "./fans";

// --- Tables ---

export const fanEvents = pgTable(
  "fan_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fanId: uuid("fan_id")
      .notNull()
      .references(() => fans.id, { onDelete: "cascade" }),

    /**
     * Flexible text identifier for the event type.
     * Intentionally not an enum — new event types are added by writing
     * new records, not by modifying the schema.
     *
     * Recommended convention: snake_case
     * Examples: "match_attended", "purchase", "login", "badge_earned"
     */
    eventType: text("event_type").notNull(),

    /**
     * Origin system that produced this event.
     * Examples: "manual", "eep", "mobile", "crm", "webhook"
     */
    source: text("source").notNull(),

    /**
     * Optional external event ID from the source system.
     * Used for deduplication when ingesting events from EEP webhooks.
     */
    sourceId: text("source_id"),

    /**
     * Event-specific payload. Schema is open to accommodate any event type
     * without requiring migrations.
     */
    payload: jsonb("payload"),

    /**
     * Optional debug and provider context (request IDs, API versions, etc.).
     * Kept separate from payload to avoid polluting the business data.
     */
    metadata: jsonb("metadata"),

    /**
     * Points awarded for this event. Feed into the gamification engine.
     * 0 means the event is recorded but carries no point value.
     */
    points: integer("points").notNull().default(0),

    /**
     * When the event actually occurred (not when BigFana recorded it).
     * Required — analytics and streaks depend on accurate event timestamps.
     */
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Fan timeline queries
    index("fan_events_fan_occurred_idx").on(table.fanId, table.occurredAt),
    // Org-level analytics aggregations
    index("fan_events_org_type_occurred_idx").on(
      table.organizationId,
      table.eventType,
      table.occurredAt,
    ),
    // Source deduplication lookups
    index("fan_events_source_idx").on(table.source, table.sourceId),
  ],
);

// --- Inferred types ---

export type FanEvent = typeof fanEvents.$inferSelect;
export type NewFanEvent = typeof fanEvents.$inferInsert;

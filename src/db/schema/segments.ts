import {
  boolean,
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

// Neon timestamps for this module (verified Block A / NEW-F17):
// TIMESTAMP WITH TIME ZONE. `withTimezone: true` is intentional and ALIGNED.

// ─── SegmentConditions ────────────────────────────────────────────────────────
//
// Typed JSONB payload stored in fan_segment_rules.conditions.
// All fields are optional — omitted fields are not evaluated.
//
// Evaluation logic: AND across all present conditions.
//
//   minScore / maxScore         fan.engagement_score inclusive range
//   levelNames                  fan's current level name must be in this list
//   minEventsTotal              total fan_events count for the fan
//   minEventsLast30d            fan_events in the last 30 calendar days
//   minEventsLast90d            fan_events in the last 90 calendar days
//   requiredEventTypes          fan must have ≥1 event of each type
//   maxDaysSinceLastEvent       inactivity gate — fan's last event must be
//                               ≤ N days ago (null last-event = never active)
//   fanStatuses                 only fans with these lifecycle status values

export interface SegmentConditions {
  minScore?:              number;
  maxScore?:              number;
  levelNames?:            string[];
  minEventsTotal?:        number;
  minEventsLast30d?:      number;
  minEventsLast90d?:      number;
  requiredEventTypes?:    string[];
  maxDaysSinceLastEvent?: number;
  fanStatuses?:           string[];
}

// ─── fan_segment_rules ────────────────────────────────────────────────────────
//
// Per-org configurable segment definitions.
//
// A fan's segment is computed by evaluating all active rules for the org
// in descending priority order. The first matching rule wins.
// If no rule matches, the fan's segment is set to null.
//
// Default rules are seeded for new organizations (see migrate-eil-v1.ts).
// Admins can add, edit, or disable rules — new rules don't require migrations.

export const fanSegmentRules = pgTable(
  "fan_segment_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    /** Display name shown in admin UIs and fan profile badges. */
    name: text("name").notNull(),

    description: text("description"),

    /** Hex color for segment badges and charts. */
    color: text("color"),

    /**
     * Priority order. Higher number = evaluated first.
     * When a fan matches multiple rules, the highest-priority rule wins.
     * Default priority ranges by tier:
     *   Ultra VIP = 100, Core Fan = 50, Casual = 20, Dormant = 10
     */
    priority: integer("priority").notNull().default(0),

    /** Evaluation conditions. See SegmentConditions interface. */
    conditions: jsonb("conditions")
      .notNull()
      .$type<SegmentConditions>(),

    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Priority-ordered rule evaluation per org
    index("fan_segment_rules_org_priority_idx").on(
      table.organizationId,
      table.priority,
    ),
    // Prevent duplicate segment names per org
    uniqueIndex("fan_segment_rules_org_name_idx").on(
      table.organizationId,
      table.name,
    ),
  ],
);

// ─── fan_experiences ──────────────────────────────────────────────────────────
//
// Defines the experiences, offers, campaigns or content pieces that fans
// in a specific segment are eligible for.
//
// type (free-form text, intentionally not an enum so new types never require
// schema migrations):
//   campaign      targeted push / email / SMS campaigns
//   reward        redeemable item or discount
//   content       exclusive video, article, or media
//   challenge     gamification mission or trivia event
//   vip_access    early ticket access, meet & greet, stadium tour
//   sponsor_offer co-branded promotion from a sponsor partner
//
// sponsorAffinity: affinity tags used for sponsor targeting.
//   Examples: ['alcohol', 'sports_gear', 'family', 'premium', 'youth']
//   Matched against fan behavioral profile tags during experience selection.

export const fanExperiences = pgTable(
  "fan_experiences",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    /**
     * The segment this experience targets.
     * Null = available to all fans regardless of segment.
     */
    segmentRuleId: uuid("segment_rule_id").references(
      () => fanSegmentRules.id,
      { onDelete: "set null" },
    ),

    type:        text("type").notNull(),
    title:       text("title").notNull(),
    description: text("description"),

    /**
     * Sponsor affinity tags for targeted sponsor offer matching.
     * Stored as a JSON array of strings.
     */
    sponsorAffinity: jsonb("sponsor_affinity").$type<string[]>(),

    /**
     * Arbitrary extra data: campaign IDs, URLs, deep links,
     * reward codes, trivia event IDs, etc.
     */
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),

    isActive: boolean("is_active").notNull().default(true),

    // Optional time window for time-bounded experiences
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt:   timestamp("ends_at",   { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Org-scoped active experience listing
    index("fan_experiences_org_active_idx").on(
      table.organizationId,
      table.isActive,
    ),
    // Segment → experiences join
    index("fan_experiences_segment_idx").on(table.segmentRuleId),
  ],
);

// ─── Inferred types ───────────────────────────────────────────────────────────

export type FanSegmentRule    = typeof fanSegmentRules.$inferSelect;
export type NewFanSegmentRule = typeof fanSegmentRules.$inferInsert;

export type FanExperience    = typeof fanExperiences.$inferSelect;
export type NewFanExperience = typeof fanExperiences.$inferInsert;

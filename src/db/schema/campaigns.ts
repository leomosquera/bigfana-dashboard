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
import { fans } from "./fans";

// Neon timestamps for this module (verified Block A / NEW-F17):
// TIMESTAMP WITH TIME ZONE. `withTimezone: true` is intentional and ALIGNED.

/** Engagement campaign modalities (stored as lowercase text — extensible without migrations). */
export const CAMPAIGN_TYPES = [
  "survey",
  "poll",
  "trivia",
  "prediction",
  "raffle",
  "reward",
] as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

export const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "active",
  "paused",
  "finished",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/**
 * Lightweight audience routing for demos.
 * - `all`: any fan can participate (segment eligibility skipped).
 * - `segments`: fan.segment must equal one of the linked rule names.
 */
export type CampaignAudienceRules =
  | { mode: "all" }
  | { mode: "segments"; segmentRuleIds: string[] };

export const QUESTION_TYPES = ["multiple_choice", "short_text"] as const;

export type CampaignQuestionKind = (typeof QUESTION_TYPES)[number];

/** Sponsor creatives shown alongside campaigns — org-scoped. */
export const SPONSOR_AD_STATUSES = ["draft", "active", "paused"] as const;
export type SponsorAdStatus = (typeof SPONSOR_AD_STATUSES)[number];

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    title:       text("title").notNull(),
    description: text("description"),
    /** See CampaignType */
    type:        text("type").notNull(),
    /** See CampaignStatus */
    status:      text("status").notNull().default("draft"),

    pointsReward: integer("points_reward").notNull().default(0),

    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt:   timestamp("ends_at", { withTimezone: true }).notNull(),

    /** Segment targeting hints — see CampaignAudienceRules */
    segmentRules: jsonb("segment_rules")
      .$type<CampaignAudienceRules>()
      .notNull()
      .default({ mode: "all" }),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("campaigns_org_status_idx").on(t.organizationId, t.status),
    index("campaigns_org_type_idx").on(t.organizationId, t.type),
    index("campaigns_org_dates_idx").on(t.organizationId, t.startsAt, t.endsAt),
  ],
);

export const campaignQuestions = pgTable(
  "campaign_questions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),

    question: text("question").notNull(),
    type:     text("type").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("campaign_questions_campaign_sort_idx").on(t.campaignId, t.sortOrder),
  ],
);

export const campaignOptions = pgTable(
  "campaign_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => campaignQuestions.id, { onDelete: "cascade" }),

    label:     text("label").notNull(),
    value:     text("value").notNull(),
    isCorrect: boolean("is_correct"),
    sortOrder: integer("sort_order").notNull().default(0),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("campaign_options_question_sort_idx").on(t.questionId, t.sortOrder),
  ],
);

export const sponsorAds = pgTable(
  "sponsor_ads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    sponsorName: text("sponsor_name").notNull(),
    title:       text("title").notNull(),
    description: text("description"),

    imageUrl:       text("image_url"),
    destinationUrl: text("destination_url"),
    priority:       integer("priority").notNull().default(0),

    segmentRules: jsonb("segment_rules").$type<CampaignAudienceRules>(),
    status:       text("status").notNull().default("draft"),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("sponsor_ads_org_status_idx").on(t.organizationId, t.status),
  ],
);

export const campaignAds = pgTable(
  "campaign_ads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    sponsorAdId: uuid("sponsor_ad_id")
      .notNull()
      .references(() => sponsorAds.id, { onDelete: "cascade" }),

    priority: integer("priority").notNull().default(0),

    metadata: jsonb("metadata"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("campaign_ads_campaign_idx").on(t.campaignId),
    uniqueIndex("campaign_ads_campaign_sponsor_uidx").on(t.campaignId, t.sponsorAdId),
  ],
);

export const campaignResponses = pgTable(
  "campaign_responses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),

    questionId: uuid("question_id")
      .notNull()
      .references(() => campaignQuestions.id, { onDelete: "cascade" }),

    optionId: uuid("option_id").references(() => campaignOptions.id, { onDelete: "set null" }),

    fanId: uuid("fan_id")
      .notNull()
      .references(() => fans.id, { onDelete: "cascade" }),

    /** Free-form answer payload (surveys / short-text). */
    value: jsonb("value"),

    isCorrect: boolean("is_correct"),
    /** Points attributable to this row (denormalised; summed on fan_event + ledger separately). */
    pointsAwarded: integer("points_awarded").notNull().default(0),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("campaign_responses_fan_question_uidx").on(
      t.campaignId,
      t.questionId,
      t.fanId,
    ),
    index("campaign_responses_campaign_idx").on(t.campaignId),
    index("campaign_responses_fan_idx").on(t.organizationId, t.fanId),
  ],
);

export type Campaign            = typeof campaigns.$inferSelect;
export type NewCampaign         = typeof campaigns.$inferInsert;
export type CampaignQuestion    = typeof campaignQuestions.$inferSelect;
export type NewCampaignQuestion = typeof campaignQuestions.$inferInsert;
export type CampaignOption      = typeof campaignOptions.$inferSelect;
export type NewCampaignOption   = typeof campaignOptions.$inferInsert;
export type SponsorAd           = typeof sponsorAds.$inferSelect;
export type NewSponsorAd        = typeof sponsorAds.$inferInsert;
export type CampaignAd          = typeof campaignAds.$inferSelect;
export type CampaignResponseRow = typeof campaignResponses.$inferSelect;

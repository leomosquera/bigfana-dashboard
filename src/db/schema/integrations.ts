import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

// --- Enums ---

export const integrationJobStatusEnum = pgEnum("integration_job_status", [
  "pending",
  "processing",
  "synced",
  "failed",
  "retrying",
]);

export const integrationProviderEnum = pgEnum("integration_provider", [
  "eep",
]);

export const integrationOperationEnum = pgEnum("integration_operation", [
  "create",
  "update",
  "delete",
]);

// --- Tables ---

export const integrationJobs = pgTable(
  "integration_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    // What is being synced
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    provider: integrationProviderEnum("provider").notNull(),
    operation: integrationOperationEnum("operation").notNull(),
    /**
     * Snapshot of the entity data at enqueue time.
     * Prevents stale-read issues when processing is delayed.
     */
    payload: jsonb("payload"),

    // Job lifecycle
    status: integrationJobStatusEnum("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    /**
     * Computed on failure using exponential backoff.
     * Null means "process immediately" (initial state).
     * Pattern: 2^attempts * 30s, capped at 1h.
     */
    nextRetryAt: timestamp("next_retry_at", { withTimezone: true }),
    lastError: text("last_error"),
    processedAt: timestamp("processed_at", { withTimezone: true }),

    /**
     * Optional idempotency key to prevent duplicate jobs for the same entity+operation.
     * Recommended pattern: "{provider}:{entityType}:{operation}:{entityId}"
     * Example: "eep:fan:create:550e8400-e29b-41d4-a716-446655440000"
     */
    idempotencyKey: text("idempotency_key").unique(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Primary polling index: find work to process
    index("integration_jobs_status_retry_idx").on(
      table.status,
      table.nextRetryAt,
    ),
    // Entity lookup index: find all jobs for a given entity
    index("integration_jobs_entity_idx").on(
      table.organizationId,
      table.entityType,
      table.entityId,
    ),
    // Uniqueness on idempotency_key is enforced at the column level (.unique()).
    // A partial index (WHERE idempotency_key IS NOT NULL) can be added via a
    // raw SQL migration if needed once the sync layer is introduced.
  ],
);

// --- Inferred types ---

export type IntegrationJob = typeof integrationJobs.$inferSelect;
export type NewIntegrationJob = typeof integrationJobs.$inferInsert;

export type IntegrationJobStatus =
  (typeof integrationJobStatusEnum.enumValues)[number];
export type IntegrationProvider =
  (typeof integrationProviderEnum.enumValues)[number];
export type IntegrationOperation =
  (typeof integrationOperationEnum.enumValues)[number];

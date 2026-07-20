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

// --- Application value domains (Neon: TEXT / TEXT + CHECK) ---
// Neon physical columns are TEXT, not PG enum types.
// Status is CHECK-constrained in Neon; provider / operation are TEXT without CHECK.
// Application-supported unions below are TypeScript contracts, not DB enum types.

/** Neon CHECK-aligned integration_jobs.status values. */
export const INTEGRATION_JOB_STATUS_VALUES = [
  "pending",
  "processing",
  "synced",
  "failed",
  "retrying",
] as const;

/** Application-supported provider values (Neon: unconstrained TEXT). */
export const INTEGRATION_PROVIDER_VALUES = ["eep"] as const;

/** Application-supported operation values (Neon: unconstrained TEXT). */
export const INTEGRATION_OPERATION_VALUES = [
  "create",
  "update",
  "delete",
] as const;

export type IntegrationJobStatus =
  (typeof INTEGRATION_JOB_STATUS_VALUES)[number];
export type IntegrationProvider =
  (typeof INTEGRATION_PROVIDER_VALUES)[number];
export type IntegrationOperation =
  (typeof INTEGRATION_OPERATION_VALUES)[number];

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
    /** Neon: TEXT (no CHECK). Application-supported values: IntegrationProvider. */
    provider: text("provider").$type<IntegrationProvider>().notNull(),
    /** Neon: TEXT (no CHECK). Application-supported values: IntegrationOperation. */
    operation: text("operation").$type<IntegrationOperation>().notNull(),
    /**
     * Snapshot of the entity data at enqueue time.
     * Prevents stale-read issues when processing is delayed.
     */
    payload: jsonb("payload"),

    // Job lifecycle
    /** Neon: TEXT + CHECK — pending | processing | synced | failed | retrying */
    status: text("status")
      .$type<IntegrationJobStatus>()
      .notNull()
      .default("pending"),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    /**
     * Computed on failure using exponential backoff.
     * Null means "process immediately" (initial state).
     * Pattern: 2^attempts * 30s, capped at 1h.
     * Neon: TIMESTAMP WITHOUT TIME ZONE.
     */
    nextRetryAt: timestamp("next_retry_at"),
    lastError: text("last_error"),
    /** Neon: TIMESTAMP WITHOUT TIME ZONE. */
    processedAt: timestamp("processed_at"),

    /**
     * Optional idempotency key to prevent duplicate jobs for the same entity+operation.
     * Recommended pattern: "{provider}:{entityType}:{operation}:{entityId}"
     * Example: "eep:fan:create:550e8400-e29b-41d4-a716-446655440000"
     */
    idempotencyKey: text("idempotency_key").unique(),

    // Neon: TIMESTAMP WITHOUT TIME ZONE
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    // Physical Neon indexes (do not declare composites absent from Neon)
    index("idx_integration_jobs_status").on(table.status),
    index("idx_integration_jobs_org").on(table.organizationId),
    // Uniqueness on idempotency_key is enforced at the column level (.unique()).
  ],
);

// --- Inferred types ---

export type IntegrationJob = typeof integrationJobs.$inferSelect;
export type NewIntegrationJob = typeof integrationJobs.$inferInsert;

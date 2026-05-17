import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";

/**
 * Fans table v2 migration.
 *
 * Adds missing columns that exist in the Drizzle schema but not in the DB:
 *   - external_id (text, nullable)
 *   - segment     (text, nullable)
 *   - tier        (text, nullable)
 *
 * Also renames profile_points → engagement_score to match the Drizzle schema.
 * Idempotent.
 */
async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Running fans v2 migration...\n");

  // 1. Add external_id
  console.log("1. Adding external_id column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'external_id'
      ) THEN
        ALTER TABLE fans ADD COLUMN external_id text;
        RAISE NOTICE 'Added external_id';
      ELSE
        RAISE NOTICE 'external_id already exists — skipping';
      END IF;
    END
    $$
  `;

  // 2. Add segment
  console.log("2. Adding segment column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'segment'
      ) THEN
        ALTER TABLE fans ADD COLUMN segment text;
        RAISE NOTICE 'Added segment';
      ELSE
        RAISE NOTICE 'segment already exists — skipping';
      END IF;
    END
    $$
  `;

  // 3. Add tier
  console.log("3. Adding tier column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'tier'
      ) THEN
        ALTER TABLE fans ADD COLUMN tier text;
        RAISE NOTICE 'Added tier';
      ELSE
        RAISE NOTICE 'tier already exists — skipping';
      END IF;
    END
    $$
  `;

  // 4. Rename profile_points → engagement_score (if profile_points exists and engagement_score doesn't)
  console.log("4. Reconciling profile_points → engagement_score...");
  await sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'profile_points'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'engagement_score'
      ) THEN
        ALTER TABLE fans RENAME COLUMN profile_points TO engagement_score;
        RAISE NOTICE 'Renamed profile_points → engagement_score';
      ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'engagement_score'
      ) THEN
        RAISE NOTICE 'engagement_score already exists — skipping';
      ELSE
        RAISE NOTICE 'profile_points not found and engagement_score not found — adding engagement_score';
        ALTER TABLE fans ADD COLUMN engagement_score integer NOT NULL DEFAULT 0;
      END IF;
    END
    $$
  `;

  // Verify
  const cols = await sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'fans'
    ORDER BY ordinal_position
  `;

  console.log("\nFans table columns after migration:");
  cols.forEach((c) => {
    console.log(`  ${c.column_name.padEnd(22)} ${c.data_type.padEnd(20)} nullable=${c.is_nullable}`);
  });

  console.log("\nMigration v2 complete.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

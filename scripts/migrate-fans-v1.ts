import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";

/**
 * Fans table v1 migration.
 *
 * Adds:
 *   - fan_status enum (active, inactive, suspended, archived)
 *   - status column (default 'active')
 *   - first_name, last_name, birth_date, gender, city, country columns
 *
 * All new columns are nullable except status (which has a default).
 * Idempotent: checks each step before applying.
 */
async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Running fans v1 migration...\n");

  // 1. Create enum if not exists
  console.log("1. Creating fan_status enum...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'fan_status') THEN
        CREATE TYPE fan_status AS ENUM ('active', 'inactive', 'suspended', 'archived');
        RAISE NOTICE 'Created fan_status enum';
      ELSE
        RAISE NOTICE 'fan_status enum already exists — skipping';
      END IF;
    END
    $$
  `;

  // 2. Add status column
  console.log("2. Adding status column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'status'
      ) THEN
        ALTER TABLE fans ADD COLUMN status fan_status NOT NULL DEFAULT 'active';
        RAISE NOTICE 'Added status column';
      ELSE
        RAISE NOTICE 'status column already exists — skipping';
      END IF;
    END
    $$
  `;

  // 3. Add first_name
  console.log("3. Adding first_name column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'first_name'
      ) THEN
        ALTER TABLE fans ADD COLUMN first_name text;
        RAISE NOTICE 'Added first_name column';
      ELSE
        RAISE NOTICE 'first_name column already exists — skipping';
      END IF;
    END
    $$
  `;

  // 4. Add last_name
  console.log("4. Adding last_name column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'last_name'
      ) THEN
        ALTER TABLE fans ADD COLUMN last_name text;
        RAISE NOTICE 'Added last_name column';
      ELSE
        RAISE NOTICE 'last_name column already exists — skipping';
      END IF;
    END
    $$
  `;

  // 5. Add birth_date
  console.log("5. Adding birth_date column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'birth_date'
      ) THEN
        ALTER TABLE fans ADD COLUMN birth_date date;
        RAISE NOTICE 'Added birth_date column';
      ELSE
        RAISE NOTICE 'birth_date column already exists — skipping';
      END IF;
    END
    $$
  `;

  // 6. Add gender
  console.log("6. Adding gender column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'gender'
      ) THEN
        ALTER TABLE fans ADD COLUMN gender text;
        RAISE NOTICE 'Added gender column';
      ELSE
        RAISE NOTICE 'gender column already exists — skipping';
      END IF;
    END
    $$
  `;

  // 7. Add city
  console.log("7. Adding city column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'city'
      ) THEN
        ALTER TABLE fans ADD COLUMN city text;
        RAISE NOTICE 'Added city column';
      ELSE
        RAISE NOTICE 'city column already exists — skipping';
      END IF;
    END
    $$
  `;

  // 8. Add country
  console.log("8. Adding country column...");
  await sql`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'fans' AND column_name = 'country'
      ) THEN
        ALTER TABLE fans ADD COLUMN country text;
        RAISE NOTICE 'Added country column';
      ELSE
        RAISE NOTICE 'country column already exists — skipping';
      END IF;
    END
    $$
  `;

  // Verify
  const cols = await sql`
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'fans'
    ORDER BY ordinal_position
  `;

  console.log("\nFans table columns after migration:");
  cols.forEach((c) => {
    console.log(`  ${c.column_name.padEnd(20)} ${c.data_type.padEnd(20)} nullable=${c.is_nullable} default=${c.column_default ?? "—"}`);
  });

  console.log("\nMigration complete.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

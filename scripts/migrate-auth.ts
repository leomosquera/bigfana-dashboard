/**
 * migrate-auth.ts
 *
 * Creates Better Auth's required tables in Neon and adds the
 * better_auth_user_id column to memberships.
 *
 * Run once:
 *   npx tsx --env-file=.env.local scripts/migrate-auth.ts
 *
 * Safe to run multiple times — uses IF NOT EXISTS throughout.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("─── Better Auth Migration ────────────────────────────");

  // 1. Better Auth `user` table (text PK — Better Auth generates its own IDs)
  await sql`
    CREATE TABLE IF NOT EXISTS "user" (
      "id"             TEXT PRIMARY KEY,
      "name"           TEXT NOT NULL,
      "email"          TEXT NOT NULL UNIQUE,
      "email_verified" BOOLEAN NOT NULL DEFAULT FALSE,
      "image"          TEXT,
      "created_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓  Table "user" ready');

  // 2. Better Auth `session` table
  await sql`
    CREATE TABLE IF NOT EXISTS "session" (
      "id"          TEXT PRIMARY KEY,
      "user_id"     TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "token"       TEXT NOT NULL UNIQUE,
      "expires_at"  TIMESTAMPTZ NOT NULL,
      "ip_address"  TEXT,
      "user_agent"  TEXT,
      "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓  Table "session" ready');

  // 3. Better Auth `account` table
  await sql`
    CREATE TABLE IF NOT EXISTS "account" (
      "id"                       TEXT PRIMARY KEY,
      "user_id"                  TEXT NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
      "account_id"               TEXT NOT NULL,
      "provider_id"              TEXT NOT NULL,
      "access_token"             TEXT,
      "refresh_token"            TEXT,
      "access_token_expires_at"  TIMESTAMPTZ,
      "refresh_token_expires_at" TIMESTAMPTZ,
      "scope"                    TEXT,
      "id_token"                 TEXT,
      "password"                 TEXT,
      "created_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "updated_at"               TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log('✓  Table "account" ready');

  // 4. Better Auth `verification` table
  await sql`
    CREATE TABLE IF NOT EXISTS "verification" (
      "id"          TEXT PRIMARY KEY,
      "identifier"  TEXT NOT NULL,
      "value"       TEXT NOT NULL,
      "expires_at"  TIMESTAMPTZ NOT NULL,
      "created_at"  TIMESTAMPTZ DEFAULT NOW(),
      "updated_at"  TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  console.log('✓  Table "verification" ready');

  // 5. Add better_auth_user_id to memberships (links memberships to Better Auth users)
  await sql`
    ALTER TABLE memberships
    ADD COLUMN IF NOT EXISTS better_auth_user_id TEXT
  `;
  console.log("✓  Column memberships.better_auth_user_id ready");

  // 6. Unique index on better_auth_user_id per org (one Better Auth user per org)
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS memberships_better_auth_user_id_org_idx
    ON memberships (better_auth_user_id, organization_id)
    WHERE better_auth_user_id IS NOT NULL
  `;
  console.log("✓  Unique index on (better_auth_user_id, organization_id) ready");

  console.log("\n─── Migration complete ────────────────────────────────\n");
  process.exit(0);
}

main().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});

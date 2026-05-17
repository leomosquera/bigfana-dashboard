/**
 * seed-admin.ts
 *
 * Creates a real Better Auth user and links them to the existing
 * Toluca organization membership via better_auth_user_id.
 *
 * Run once after migrate-auth.ts:
 *   npx tsx --env-file=.env.local scripts/seed-admin.ts
 *
 * Strategy:
 *   - Creates a new Better Auth user (email + password)
 *   - Finds the existing Toluca membership (seeded with legacy user)
 *   - Sets better_auth_user_id on that membership
 *
 * Safe to run multiple times — skips creation if user already exists,
 * skips membership update if better_auth_user_id is already set.
 */

import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { auth } from "../src/lib/auth";
import { db } from "../src/db";
import { organizations, memberships, users } from "../src/db/schema";
import { eq, and, isNull } from "drizzle-orm";

const ADMIN_EMAIL = "admin@bigfana.com";
const ADMIN_PASSWORD = "BigFana2026!";
const ADMIN_NAME = "BigFana Admin";
const ORG_SLUG = "toluca";

async function main() {
  console.log("─── BigFana Admin Seed ───────────────────────────────");

  // 1. Find the Toluca organization
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.slug, ORG_SLUG))
    .limit(1);

  if (!org) {
    console.error(`\n✗  Organization with slug="${ORG_SLUG}" not found.`);
    process.exit(1);
  }
  console.log(`✓  Organization: ${org.name} (${org.id})`);

  // 2. Check if Better Auth user already exists
  // Query the Better Auth "user" table directly via raw SQL
  const { neon } = await import("@neondatabase/serverless");
  const sql = neon(process.env.DATABASE_URL!);

  const existingAuthUsers = await sql`
    SELECT id FROM "user" WHERE email = ${ADMIN_EMAIL} LIMIT 1
  `;

  let betterAuthUserId: string;

  if (existingAuthUsers[0]) {
    betterAuthUserId = existingAuthUsers[0].id as string;
    console.log(`✓  Better Auth user already exists: ${ADMIN_EMAIL} (${betterAuthUserId})`);
  } else {
    const created = await auth.api.signUpEmail({
      body: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        name: ADMIN_NAME,
      },
    });

    if (!created?.user?.id) {
      console.error("\n✗  Failed to create Better Auth user.");
      console.error("   Response:", JSON.stringify(created, null, 2));
      process.exit(1);
    }

    betterAuthUserId = created.user.id;
    console.log(`✓  Better Auth user created: ${ADMIN_EMAIL} (${betterAuthUserId})`);
  }

  // 3. Find the existing Toluca membership (created with legacy user)
  const [existingMembership] = await db
    .select({ id: memberships.id, betterAuthUserId: memberships.betterAuthUserId })
    .from(memberships)
    .where(eq(memberships.organizationId, org.id))
    .limit(1);

  if (!existingMembership) {
    console.error(`\n✗  No membership found for organization ${org.name}.`);
    process.exit(1);
  }

  if (existingMembership.betterAuthUserId === betterAuthUserId) {
    console.log(`✓  Membership already linked to Better Auth user — skipped.`);
  } else {
    await db
      .update(memberships)
      .set({ betterAuthUserId })
      .where(eq(memberships.id, existingMembership.id));
    console.log(`✓  Membership linked: better_auth_user_id = ${betterAuthUserId}`);
  }

  console.log("\n─── Done ─────────────────────────────────────────────");
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);
  console.log(`   Org:      ${org.name} [${org.slug}]`);
  console.log("──────────────────────────────────────────────────────\n");

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

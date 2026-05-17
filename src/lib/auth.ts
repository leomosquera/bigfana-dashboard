import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import {
  users,
  sessions,
  accounts,
  verifications,
} from "@/db/schema";

/**
 * Better Auth server instance.
 *
 * Environment variables used:
 *   AUTH_SECRET         — passed explicitly as `secret` (replaces BETTER_AUTH_SECRET)
 *   NEXT_PUBLIC_APP_URL — passed explicitly as `baseURL` (replaces BETTER_AUTH_URL)
 *   DATABASE_URL        — consumed by the Drizzle client in @/db
 *
 * The Drizzle adapter maps Better Auth's internal table names to our manually
 * written schema. Column names and types must match exactly what Better Auth
 * expects — see src/db/schema/auth.ts for the constraints.
 */
export const auth = betterAuth({
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.NEXT_PUBLIC_APP_URL,

  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),

  emailAndPassword: {
    enabled: true,
  },
});

export type Auth = typeof auth;

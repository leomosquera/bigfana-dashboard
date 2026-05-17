"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Better Auth browser client.
 *
 * baseURL is set explicitly so the client works correctly in all environments.
 * NEXT_PUBLIC_APP_URL must match the baseURL configured on the server (auth.ts).
 *
 * Cookie name used by the server (for reference / middleware):
 *   better-auth.session_token  (dev, http)
 *   __Secure-better-auth.session_token  (prod, https)
 *
 * If the prefix ever needs changing, update auth.ts → advanced.cookiePrefix
 * and the BETTER_AUTH_COOKIE_PREFIX constant in middleware.ts simultaneously.
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
});

export const { signIn, signOut, useSession } = authClient;

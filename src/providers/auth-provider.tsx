"use client";

import { createContext, useContext } from "react";
import { useSession } from "@/lib/auth-client";
import type { Session, User } from "better-auth";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  /** True while the session is being fetched on first render. */
  isPending: boolean;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  isPending: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Wraps the application with the current Better Auth session.
 *
 * Place this in the root layout (inside NextIntlClientProvider) so useAuth()
 * is available everywhere. The server-side auth check in the dashboard layout
 * is the security boundary — this provider is for client-side UX only.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, isPending } = useSession();

  return (
    <AuthContext.Provider
      value={{
        user: data?.user ?? null,
        session: data?.session ?? null,
        isPending,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

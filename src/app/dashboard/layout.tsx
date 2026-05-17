import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserActiveMembership } from "@/server/queries/organizations";
import { OrgProvider } from "@/providers/org-provider";
import { DashboardShell } from "./shell";

/**
 * Dashboard layout — server component.
 *
 * Performs two security checks before rendering any dashboard content:
 *
 *   1. Session check  — calls auth.api.getSession() with the incoming request
 *      headers for full cryptographic validation (not just cookie presence).
 *      The middleware does a fast cookie-presence redirect, but this is the
 *      authoritative guard.
 *
 *   2. Membership check — ensures the user belongs to at least one active org.
 *      Users with a session but no org are redirected to /onboarding.
 *
 * On success, the org and role are passed to OrgProvider (client component),
 * which applies the tenant theme client-side via applyTenantTheme().
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  const membership = await getUserActiveMembership(session.user.id);

  if (!membership) {
    redirect("/onboarding");
  }

  return (
    <OrgProvider initialOrg={membership.org} initialRole={membership.role}>
      <DashboardShell>{children}</DashboardShell>
    </OrgProvider>
  );
}

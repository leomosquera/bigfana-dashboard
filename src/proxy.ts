import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Cookie prefix used by Better Auth.
 *
 * Default: "better-auth" → full cookie name: "better-auth.session_token"
 * In production (https): "__Secure-better-auth.session_token"
 *
 * If you change advanced.cookiePrefix in src/lib/auth.ts, update this constant.
 */
const COOKIE_PREFIX = "better-auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /**
   * Fan Experience demo API — never enforce Better Auth cookies at the edge.
   *
   * - POST /api/demo/fan/login → public (email + organizationId); used by Postman / fan webapp.
   * - GET  /api/demo/fan/experience, POST /api/demo/fan/campaign/respond → Authorization: Bearer
   *   validated inside route handlers (`requireDemoFanBearer`).
   *
   * Matcher below must include this prefix so the proxy runs on these routes and skips the
   * dashboard session gate (a broader “protect all /api” deployment would otherwise 401 here).
   */
  if (pathname.startsWith("/api/demo/fan/")) {
    return NextResponse.next();
  }

  const session = getSessionCookie(request, { cookiePrefix: COOKIE_PREFIX });

  const isDashboard = pathname.startsWith("/dashboard");
  const isLogin = pathname === "/login";

  // Unauthenticated user trying to access protected routes → login
  if (isDashboard && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Authenticated user hitting the login page → dashboard
  if (isLogin && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/api/demo/fan/:path*",
  ],
};

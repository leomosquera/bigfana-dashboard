import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import {
  demoFanCorsPreflightResponse,
  mergeDemoFanCorsHeaders,
} from "@/lib/demo-fan-cors";

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
   * - POST /api/demo/fan/login, POST /api/demo/fan/register → public; used by fan webapp.
   * - GET  /api/demo/fan/experience, POST /api/demo/fan/campaign/respond → Authorization: Bearer
   *   validated inside route handlers (`requireDemoFanBearer`).
   *
   * CORS for browser clients (e.g. fan webapp on localhost:3000): OPTIONS preflight +
   * response headers are applied in the proxy; see `@/lib/demo-fan-cors`.
   */
  if (pathname.startsWith("/api/demo/fan/")) {
    if (request.method === "OPTIONS") {
      return demoFanCorsPreflightResponse(request);
    }
    return mergeDemoFanCorsHeaders(request, NextResponse.next());
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

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
  const session = getSessionCookie(request, { cookiePrefix: COOKIE_PREFIX });

  const { pathname } = request.nextUrl;

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
  ],
};

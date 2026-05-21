import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Allowed origins:
 * - Local development
 * - Production Vercel app
 * - Any Vercel preview deployment
 */
function isAllowedOrigin(origin: string): boolean {
  return (
    origin === "http://localhost:3000" ||
    origin === "https://bigfana-plataform.vercel.app" ||
    origin.endsWith(".vercel.app")
  );
}

/**
 * Resolves CORS origin for browser requests.
 */
export function resolveDemoFanCorsOrigin(
  request: NextRequest,
): string | null {
  const origin = request.headers.get("origin");

  if (!origin) {
    return null;
  }

  return isAllowedOrigin(origin) ? origin : null;
}

/**
 * Generates CORS headers.
 */
export function demoFanCorsHeaders(
  request: NextRequest,
): Record<string, string> | null {
  const allowOrigin = resolveDemoFanCorsOrigin(request);

  if (!allowOrigin) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Authorization, Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

/**
 * Handles OPTIONS preflight requests.
 */
export function demoFanCorsPreflightResponse(
  request: NextRequest,
): NextResponse {
  const headers = demoFanCorsHeaders(request);

  return new NextResponse(null, {
    status: 204,
    headers: headers ?? undefined,
  });
}

/**
 * Merges CORS headers into an existing response.
 */
export function mergeDemoFanCorsHeaders(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const headers = demoFanCorsHeaders(request);

  if (!headers) {
    return response;
  }

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  return response;
}
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGIN = "http://localhost:3000";

function allowedDemoFanOrigin(): string {
  const fromEnv = process.env.DEMO_FAN_WEBAPP_ORIGIN?.trim();
  return fromEnv && fromEnv.length > 0 ? fromEnv : DEFAULT_ALLOWED_ORIGIN;
}

/**
 * Reflects a single allowed origin for demo fan APIs (browser + Bearer).
 * Returns null when the request should not receive CORS headers (non-browser or wrong origin).
 */
export function resolveDemoFanCorsOrigin(request: NextRequest): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const allowed = allowedDemoFanOrigin();
  return origin === allowed ? origin : null;
}

export function demoFanCorsHeaders(
  request: NextRequest,
): Record<string, string> | null {
  const allowOrigin = resolveDemoFanCorsOrigin(request);
  if (!allowOrigin) return null;

  return {
    "Access-Control-Allow-Origin":      allowOrigin,
    "Access-Control-Allow-Methods":     "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers":     "Authorization, Content-Type",
    "Access-Control-Max-Age":           "86400",
    "Vary":                             "Origin",
  };
}

/**
 * Short-circuit OPTIONS preflight for `/api/demo/fan/*` (handled in middleware).
 */
export function demoFanCorsPreflightResponse(
  request: NextRequest,
): NextResponse {
  const headers = demoFanCorsHeaders(request);
  // Always 2xx so the browser applies CORS logic; wrong/missing Origin → no ACAO headers.
  return new NextResponse(null, {
    status:  204,
    headers: headers ?? undefined,
  });
}

export function mergeDemoFanCorsHeaders(
  request: NextRequest,
  response: NextResponse,
): NextResponse {
  const headers = demoFanCorsHeaders(request);
  if (!headers) return response;

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

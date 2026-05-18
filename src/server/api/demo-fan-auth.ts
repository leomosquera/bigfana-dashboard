/**
 * Helpers for demo fan Bearer tokens on Route Handlers (not Better Auth).
 */

import { NextResponse } from "next/server";
import { getFanById } from "@/server/queries/fans";
import {
  verifyDemoFanToken,
  type VerifiedDemoFanClaims,
} from "@/lib/demo-fan-token";

export { VerifiedDemoFanClaims };

export function extractBearerToken(authorization: string | null): string | null {
  if (!authorization) return null;
  const m = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  return m?.[1]?.trim() || null;
}

/**
 * Validates HMAC token + optional live fan row (non-archived, org match).
 */
export async function requireDemoFanBearer(
  req: Request,
  options: { verifyFanExists?: boolean } = { verifyFanExists: true },
): Promise<
  | { ok: true; claims: VerifiedDemoFanClaims }
  | { ok: false; response: NextResponse }
> {
  const raw = extractBearerToken(req.headers.get("authorization"));
  if (!raw) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Se requiere Authorization: Bearer <token> (demo fan).",
        },
        { status: 401 },
      ),
    };
  }

  const claims = verifyDemoFanToken(raw);
  if (!claims) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Token inválido o expirado." },
        { status: 401 },
      ),
    };
  }

  if (options.verifyFanExists) {
    const fan = await getFanById(claims.organizationId, claims.fanId);
    if (!fan || fan.status === "archived") {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Fan no encontrado o inactivo." },
          { status: 403 },
        ),
      };
    }
  }

  return { ok: true, claims };
}

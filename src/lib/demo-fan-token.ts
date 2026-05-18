/**
 * Demo fan access token — compact signed payload (HMAC-SHA256).
 * Not production OAuth/OIDC; suitable for external fan webapp MVP / demos.
 *
 * Secret: DEMO_FAN_TOKEN_SECRET (preferred) or AUTH_SECRET fallback.
 */

import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TYPE = "demo-fan" as const;
const DEFAULT_TTL_SEC = 60 * 60 * 24 * 7; // 7 days

export interface DemoFanTokenPayload {
  fanId:          string;
  organizationId: string;
  type:           typeof TOKEN_TYPE;
  iat:            number;
  exp:            number;
}

export type VerifiedDemoFanClaims = DemoFanTokenPayload;

function getSigningSecret(): string {
  const s =
    process.env.DEMO_FAN_TOKEN_SECRET ?? process.env.AUTH_SECRET ?? "";
  if (!s) {
    throw new Error(
      "Falta DEMO_FAN_TOKEN_SECRET o AUTH_SECRET para firmar tokens demo.",
    );
  }
  return s;
}

function toB64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/=+$/, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fromB64url(s: string): Buffer {
  const padLen = (4 - (s.length % 4)) % 4;
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
  return Buffer.from(b64, "base64");
}

/** Issue a signed token string: `b64url(header).b64url(payload).b64url(sig)` */
export function signDemoFanToken(
  fanId: string,
  organizationId: string,
  ttlSeconds: number = DEFAULT_TTL_SEC,
): { token: string; expiresIn: number; expiresAtSec: number } {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;

  const header = { alg: "HS256", typ: "BF-DEMO" as const };
  const payload: DemoFanTokenPayload = {
    fanId,
    organizationId,
    type: TOKEN_TYPE,
    iat,
    exp,
  };

  const encHeader  = toB64url(Buffer.from(JSON.stringify(header), "utf8"));
  const encPayload = toB64url(Buffer.from(JSON.stringify(payload), "utf8"));
  const signingInput = `${encHeader}.${encPayload}`;

  const sig = createHmac("sha256", getSigningSecret())
    .update(signingInput)
    .digest();

  const encSig = toB64url(sig);
  return {
    token:        `${signingInput}.${encSig}`,
    expiresIn:    ttlSeconds,
    expiresAtSec: exp,
  };
}

/**
 * Verifies signature, expiry, and required claims. Returns null when invalid.
 */
export function verifyDemoFanToken(token: string): VerifiedDemoFanClaims | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [encH, encP, encSig] = parts;
    const signingInput = `${encH}.${encP}`;

    let header: unknown;
    let payload: unknown;
    try {
      header  = JSON.parse(fromB64url(encH).toString("utf8"));
      payload = JSON.parse(fromB64url(encP).toString("utf8"));
    } catch {
      return null;
    }

    if (
      !header ||
      typeof header !== "object" ||
      (header as { alg?: string }).alg !== "HS256"
    ) {
      return null;
    }

    const expected = createHmac("sha256", getSigningSecret())
      .update(signingInput)
      .digest();
    let got: Buffer;
    try {
      got = fromB64url(encSig);
    } catch {
      return null;
    }

    if (expected.length !== got.length || !timingSafeEqual(expected, got)) {
      return null;
    }

    if (!payload || typeof payload !== "object") return null;
    const p = payload as Record<string, unknown>;
    const now = Math.floor(Date.now() / 1000);

    if (
      typeof p.fanId !== "string" ||
      typeof p.organizationId !== "string" ||
      p.type !== TOKEN_TYPE ||
      typeof p.exp !== "number" ||
      p.exp < now
    ) {
      return null;
    }

    return {
      fanId:          p.fanId,
      organizationId: p.organizationId,
      type:           TOKEN_TYPE,
      iat:            typeof p.iat === "number" ? p.iat : 0,
      exp:            p.exp,
    };
  } catch {
    return null;
  }
}

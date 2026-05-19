/**
 * Shared demo fan session payload — login + register routes.
 */

import type { DemoFanLoginSnapshot } from "@/lib/demo-fan-api-contract";
import { signDemoFanToken } from "@/lib/demo-fan-token";
import { getFanLedgerPointsAggregate } from "@/server/queries/gamification";

export async function resolveDemoFanPoints(
  organizationId: string,
  fanId: string,
  engagementScore: number,
): Promise<number> {
  const agg = await getFanLedgerPointsAggregate(organizationId, fanId);
  return agg.entryCount > 0 ? agg.sumPoints : engagementScore;
}

export type DemoFanSessionPayload = DemoFanLoginSnapshot & {
  token:     string;
  tokenType: "Bearer";
  expiresIn: number;
  points:    number;
};

export function issueDemoFanSession(
  organizationId: string,
  snapshot: DemoFanLoginSnapshot,
  points: number,
): { payload: DemoFanSessionPayload } | { error: string } {
  try {
    const { token, expiresIn } = signDemoFanToken(snapshot.fanId, organizationId);

    return {
      payload: {
        ...snapshot,
        token,
        tokenType: "Bearer",
        expiresIn,
        points,
      },
    };
  } catch (err) {
    console.error("[demo fan session] token issue:", err);
    return {
      error:
        "No se pudo emitir el token. Verificá DEMO_FAN_TOKEN_SECRET o AUTH_SECRET.",
    };
  }
}

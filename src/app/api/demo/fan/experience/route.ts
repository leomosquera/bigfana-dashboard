import { NextResponse } from "next/server";
import { buildDemoFanExperiencePayload } from "@/server/services/demo-fan-api";
import { requireDemoFanBearer } from "@/server/api/demo-fan-auth";

/**
 * Fan experience payload — requires `Authorization: Bearer <demo-fan-token>`.
 * Fan identity comes from the token (org + fanId enforced).
 */
export async function GET(req: Request) {
  const auth = await requireDemoFanBearer(req);
  if (!auth.ok) return auth.response;

  const { claims } = auth;

  const payload = await buildDemoFanExperiencePayload(
    claims.organizationId,
    claims.fanId,
  );

  if (!payload) {
    return NextResponse.json({ error: "Fan no encontrado." }, { status: 404 });
  }

  return NextResponse.json(payload);
}

import { NextResponse } from "next/server";
import { getDashboardOrgContextForApi } from "@/server/queries/session";
import { buildDemoFanExperiencePayload } from "@/server/services/demo-fan-api";

export async function GET(req: Request) {
  const ctx = await getDashboardOrgContextForApi();
  if (!ctx) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const url   = new URL(req.url);
  const fanId = url.searchParams.get("fanId")?.trim() ?? "";

  if (!fanId) {
    return NextResponse.json({ error: "fanId es obligatorio." }, { status: 400 });
  }

  const payload = await buildDemoFanExperiencePayload(ctx.org.id, fanId);
  if (!payload) {
    return NextResponse.json({ error: "Fan no encontrado." }, { status: 404 });
  }

  return NextResponse.json(payload);
}

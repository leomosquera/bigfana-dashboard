import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  issueDemoFanSession,
  resolveDemoFanPoints,
} from "@/server/api/demo-fan-session";
import { demoFanLoginByEmail } from "@/server/services/demo-fan-api";

/**
 * Public demo fan login (no Better Auth).
 * Body: { "email": "...", "organizationId": "<uuid>" } — org is required for tenant scoping.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const o =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>)
      : null;

  const email = typeof o?.email === "string" ? o.email.trim() : "";
  const organizationId =
    typeof o?.organizationId === "string" ? o.organizationId.trim() : "";

  if (!email) {
    return NextResponse.json({ error: "El email es obligatorio." }, { status: 400 });
  }

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId es obligatorio." },
      { status: 400 },
    );
  }

  const [orgRow] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!orgRow) {
    return NextResponse.json(
      { error: "Organización no encontrada." },
      { status: 404 },
    );
  }

  const row = await demoFanLoginByEmail(organizationId, email);
  if (!row) {
    return NextResponse.json(
      { error: "Fan no encontrado para este club." },
      { status: 404 },
    );
  }

  const points = await resolveDemoFanPoints(
    organizationId,
    row.fanId,
    row.engagementScore,
  );

  const session = issueDemoFanSession(organizationId, row, points);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: 503 });
  }

  return NextResponse.json(session.payload);
}

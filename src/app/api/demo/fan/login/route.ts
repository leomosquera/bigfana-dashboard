import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { demoFanLoginByEmail } from "@/server/services/demo-fan-api";
import { signDemoFanToken } from "@/lib/demo-fan-token";

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

  try {
    const { token, expiresIn } = signDemoFanToken(row.fanId, organizationId);

    return NextResponse.json({
      token,
      tokenType:       "Bearer" as const,
      expiresIn,
      fanId:           row.fanId,
      displayName:     row.displayName,
      segment:         row.segment,
      level:           row.level,
      engagementScore: row.engagementScore,
      status:          row.status,
    });
  } catch (err) {
    console.error("[demo fan login] token issue:", err);
    return NextResponse.json(
      {
        error:
          "No se pudo emitir el token. Verificá DEMO_FAN_TOKEN_SECRET o AUTH_SECRET.",
      },
      { status: 503 },
    );
  }
}

import { NextResponse } from "next/server";
import { getDashboardOrgContextForApi } from "@/server/queries/session";
import { demoFanLoginByEmail } from "@/server/services/demo-fan-api";

export async function POST(req: Request) {
  const ctx = await getDashboardOrgContextForApi();
  if (!ctx) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email?: unknown }).email ?? "").trim()
      : "";

  if (!email) {
    return NextResponse.json({ error: "El email es obligatorio." }, { status: 400 });
  }

  const row = await demoFanLoginByEmail(ctx.org.id, email);
  if (!row) {
    return NextResponse.json(
      { error: "Fan no encontrado para este club." },
      { status: 404 },
    );
  }

  return NextResponse.json(row);
}

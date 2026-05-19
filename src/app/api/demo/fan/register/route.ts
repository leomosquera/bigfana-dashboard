import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  issueDemoFanSession,
  resolveDemoFanPoints,
} from "@/server/api/demo-fan-session";
import { demoFanLoginByEmail } from "@/server/services/demo-fan-api";
import {
  birthDateFromAge,
  createOrganizationFan,
} from "@/server/services/fans";

const MIN_AGE = 13;
const MAX_AGE = 120;

/**
 * Public demo fan registration (no Better Auth).
 * Body: { firstName, lastName, email, age, organizationId }
 * Creates fan locally, enqueues EEP sync, returns Bearer session (same shape as login).
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

  const firstName =
    typeof o?.firstName === "string" ? o.firstName.trim() : "";
  const lastName =
    typeof o?.lastName === "string" ? o.lastName.trim() : "";
  const email = typeof o?.email === "string" ? o.email.trim() : "";
  const organizationId =
    typeof o?.organizationId === "string" ? o.organizationId.trim() : "";

  const ageRaw = o?.age;
  const age =
    typeof ageRaw === "number" && Number.isFinite(ageRaw)
      ? Math.trunc(ageRaw)
      : typeof ageRaw === "string" && ageRaw.trim()
        ? Math.trunc(Number(ageRaw))
        : NaN;

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "Nombre y apellido son obligatorios." },
      { status: 400 },
    );
  }

  if (!email) {
    return NextResponse.json({ error: "El email es obligatorio." }, { status: 400 });
  }

  if (!organizationId) {
    return NextResponse.json(
      { error: "organizationId es obligatorio." },
      { status: 400 },
    );
  }

  if (!Number.isFinite(age) || age < MIN_AGE || age > MAX_AGE) {
    return NextResponse.json(
      { error: `La edad debe estar entre ${MIN_AGE} y ${MAX_AGE}.` },
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

  const created = await createOrganizationFan({
    organizationId,
    firstName,
    lastName,
    email,
    birthDate: birthDateFromAge(age),
  });

  if (!created.ok) {
    if (created.code === "duplicate_email") {
      return NextResponse.json({ error: created.error }, { status: 409 });
    }
    return NextResponse.json({ error: created.error }, { status: 400 });
  }

  const snapshot = await demoFanLoginByEmail(organizationId, email);
  if (!snapshot) {
    return NextResponse.json(
      { error: "No se pudo cargar la sesión del fan recién creado." },
      { status: 500 },
    );
  }

  const points = await resolveDemoFanPoints(
    organizationId,
    snapshot.fanId,
    snapshot.engagementScore,
  );

  const session = issueDemoFanSession(organizationId, snapshot, points);
  if ("error" in session) {
    return NextResponse.json({ error: session.error }, { status: 503 });
  }

  return NextResponse.json(session.payload);
}

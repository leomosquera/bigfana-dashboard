import { NextResponse } from "next/server";
import {
  submitCampaignAnswers,
  type CampaignAnswerPayload,
} from "@/server/services/campaign-submissions";
import { requireDemoFanBearer } from "@/server/api/demo-fan-auth";

/**
 * Campaign participation — requires `Authorization: Bearer <demo-fan-token>`.
 * `fanId` in the body is optional; if present it must match the token. Effective fanId is always from the token.
 */
export async function POST(req: Request) {
  const auth = await requireDemoFanBearer(req);
  if (!auth.ok) return auth.response;

  const { claims } = auth;
  const fanIdFromToken = claims.fanId;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const o          = body as Record<string, unknown>;
  const bodyFanId  = typeof o.fanId === "string" ? o.fanId.trim() : "";
  const campaignId = typeof o.campaignId === "string" ? o.campaignId.trim() : "";
  const answersRaw = o.answers;

  if (bodyFanId && bodyFanId !== fanIdFromToken) {
    return NextResponse.json(
      { error: "fanId no coincide con el token." },
      { status: 403 },
    );
  }

  if (!campaignId) {
    return NextResponse.json({ error: "campaignId es obligatorio." }, { status: 400 });
  }

  if (!Array.isArray(answersRaw)) {
    return NextResponse.json({ error: "answers debe ser un array." }, { status: 400 });
  }

  const normalized: CampaignAnswerPayload[] = [];

  for (const item of answersRaw) {
    if (!item || typeof item !== "object") {
      return NextResponse.json(
        { error: "Cada respuesta debe ser un objeto." },
        { status: 400 },
      );
    }
    const q          = item as Record<string, unknown>;
    const questionId = typeof q.questionId === "string" ? q.questionId : "";
    if (!questionId) {
      return NextResponse.json(
        { error: "questionId obligatorio en cada respuesta." },
        { status: 400 },
      );
    }

    let optionId: string | null | undefined;
    if (q.optionId === null) optionId = null;
    else if (typeof q.optionId === "string") optionId = q.optionId;

    let value: Record<string, unknown> | null | undefined;
    if (q.value === null) value = null;
    else if (typeof q.value === "object" && q.value !== null) {
      value = q.value as Record<string, unknown>;
    }

    normalized.push({ questionId, optionId, value });
  }

  try {
    const result = await submitCampaignAnswers({
      organizationId: claims.organizationId,
      fanId:          fanIdFromToken,
      campaignId,
      answers:        normalized,
    });

    return NextResponse.json({
      ok: true,
      recordedRows:       result.recordedRows,
      totalPointsAwarded: result.totalPointsAwarded,
      fanEventId:         result.fanEventId,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido.";
    const lower = msg.toLowerCase();

    const status =
      lower.includes("no encontrado") || lower.includes("no pertenece")
        ? 404
        : lower.includes("ya participó") ||
            lower.includes("fuera de ventana") ||
            lower.includes("no está activa")
          ? 409
          : 400;

    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}

import { NextResponse } from "next/server";
import { getDashboardOrgContextForApi } from "@/server/queries/session";
import {
  submitCampaignAnswers,
  type CampaignAnswerPayload,
} from "@/server/services/campaign-submissions";

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

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Cuerpo inválido." }, { status: 400 });
  }

  const o          = body as Record<string, unknown>;
  const fanId      = typeof o.fanId === "string" ? o.fanId.trim() : "";
  const campaignId = typeof o.campaignId === "string" ? o.campaignId.trim() : "";
  const answersRaw = o.answers;

  if (!fanId || !campaignId) {
    return NextResponse.json(
      { error: "fanId y campaignId son obligatorios." },
      { status: 400 },
    );
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
      organizationId: ctx.org.id,
      fanId,
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

"use server";

import { db } from "@/db";
import {
  campaignOptions,
  campaignQuestions,
  campaigns,
  CAMPAIGN_TYPES,
  type CampaignAudienceRules,
  type CampaignQuestionKind,
  type CampaignStatus,
  type CampaignType,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { getDashboardContext } from "@/server/queries/session";
import { getCampaignDetail, type CampaignDetail } from "@/server/queries/campaigns";

export type CampaignActionError = { success: false; error: string };

// ─── Inputs ─────────────────────────────────────────────────────────────────-

export interface CampaignOptionInput {
  label: string;
  value: string;
  sortOrder?: number;
  /** For trivia Multiple Choice correctness */
  isCorrect?: boolean | null;
}

export interface CampaignQuestionInput {
  question: string;
  /** multiple_choice drives options; short_text collects free answers */
  type: CampaignQuestionKind;
  sortOrder?: number;
  options: CampaignOptionInput[];
}

export interface CreateCampaignInput {
  title: string;
  description?: string | null;
  type: CampaignType;
  pointsReward: number;
  startsAtIso: string;
  endsAtIso: string;
  /** When empty → open to entire org */
  segmentRuleIds?: string[];
  questions: CampaignQuestionInput[];
}

export interface UpdateCampaignInput extends CreateCampaignInput {
  id: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildAudience(segmentRuleIds: string[] | undefined): CampaignAudienceRules {
  const ids = (segmentRuleIds ?? []).filter(Boolean);
  if (!ids.length) return { mode: "all" };
  return { mode: "segments", segmentRuleIds: ids };
}

function parseWindow(startsIso: string, endsIso: string): { startsAt: Date; endsAt: Date } {
  const startsAt = new Date(startsIso);
  const endsAt   = new Date(endsIso);
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new Error("Fechas inválidas.");
  }
  if (endsAt <= startsAt) {
    throw new Error("La fecha de cierre debe ser posterior al inicio.");
  }
  return { startsAt, endsAt };
}

function deriveLaunchStatus(startsAt: Date, endsAt: Date): CampaignStatus {
  const now = new Date();
  if (startsAt > now) return "scheduled";
  if (startsAt <= now && endsAt >= now) return "active";
  return "draft";
}

function assertQuestionKit(type: CampaignType, questions: CampaignQuestionInput[]): void {
  if (questions.length === 0) {
    throw new Error("Debés cargar al menos una pregunta.");
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const label = q.question.trim() || `Pregunta ${i + 1}`;

    if (q.type === "multiple_choice") {
      const opts = (q.options ?? []).filter((o) => o.label.trim() && o.value.trim());
      if (opts.length < 2) {
        throw new Error(`"${label}" necesita al menos dos opciones.`);
      }
      continue;
    }

    if (!q.question.trim()) {
      throw new Error("Las preguntas de texto libre no pueden ir vacías.");
    }
    if ((q.options?.length ?? 0) > 0) {
      throw new Error("Las preguntas abiertas no deben tener opciones.");
    }
  }

  if (type === "trivia") {
    const mc = questions.filter((q) => q.type === "multiple_choice");
    if (mc.length === 0) {
      throw new Error("Las trivias requieren al menos una pregunta tipo opciones.");
    }

    let anyCorrect = false;
    for (const question of mc) {
      const opts = (question.options ?? []).filter((o) => o.label.trim() && o.value.trim());
      for (const o of opts) {
        if (o.isCorrect === true) {
          anyCorrect = true;
        }
      }
    }
    if (!anyCorrect) {
      throw new Error("Marcá al menos una respuesta correcta en la trivia.");
    }
  }
}


async function persistQuestionTree(
  campaignId: string,
  payload: CampaignQuestionInput[],
): Promise<void> {
  const sortedQs = [...payload].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  for (let qi = 0; qi < sortedQs.length; qi++) {
    const qInput = sortedQs[qi];

    const [questionRow] = await db
      .insert(campaignQuestions)
      .values({
        campaignId,
        question:   qInput.question.trim(),
        type:       qInput.type,
        sortOrder:  qInput.sortOrder ?? qi,
        metadata:   null,
        updatedAt:  new Date(),
      })
      .returning({ id: campaignQuestions.id });

    const options = [...(qInput.options ?? [])]
      .filter((o) => o.label.trim() && o.value.trim())
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    if (!options.length && qInput.type === "multiple_choice") {
      throw new Error("Faltaron opciones en una pregunta de opción múltiple.");
    }

    let oi = 0;
    for (const opt of options) {
      await db.insert(campaignOptions).values({
        questionId: questionRow.id,
        label:      opt.label.trim(),
        value:      opt.value.trim(),
        sortOrder:  opt.sortOrder ?? oi++,
        isCorrect:
          opt.isCorrect === true
            ? true
            : opt.isCorrect === false
              ? false
              : null,
        updatedAt:  new Date(),
      });
    }
  }
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/** Server entry used by dashboards / future loaders to hydrate drawers and forms. */
export async function fetchCampaignDetailAction(
  campaignId: string,
): Promise<
  | { success: true; detail: CampaignDetail }
  | CampaignActionError
> {
  try {
    const { org } = await getDashboardContext();
    const detail = await getCampaignDetail(org.id, campaignId);

    if (!detail) {
      return { success: false, error: "Campaña no encontrada." };
    }

    return { success: true, detail };
  } catch (err) {
    console.error("[fetchCampaignDetailAction]", err);
    return { success: false, error: "No se pudo obtener la campaña." };
  }
}

// ─── Mutations ───────────────────────────────────────────────────────────────

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<
  | { success: true; id: string }
  | CampaignActionError
> {
  try {
    const { org } = await getDashboardContext();

    if (!CAMPAIGN_TYPES.includes(input.type)) {
      return { success: false, error: "Tipo de campaña inválido." };
    }

    assertQuestionKit(input.type, input.questions);

    const { startsAt, endsAt } = parseWindow(input.startsAtIso, input.endsAtIso);
    const status = deriveLaunchStatus(startsAt, endsAt);

    const [campaign] = await db
      .insert(campaigns)
      .values({
        organizationId: org.id,
        title:          input.title.trim(),
        description:    input.description?.trim() ?? null,
        type:           input.type,
        status,
        pointsReward:   Math.max(0, Math.round(input.pointsReward)),
        startsAt,
        endsAt,
        segmentRules:   buildAudience(input.segmentRuleIds),
        metadata:       { createdFrom: "dashboard_v1" },
        updatedAt:      new Date(),
      })
      .returning({ id: campaigns.id });

    await persistQuestionTree(campaign.id, input.questions);

    return { success: true, id: campaign.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo crear la campaña.";
    console.error("[createCampaign]", err);
    return { success: false, error: message };
  }
}

export async function updateCampaign(
  input: UpdateCampaignInput,
): Promise<{ success: true } | CampaignActionError> {
  try {
    const { org } = await getDashboardContext();

    if (!CAMPAIGN_TYPES.includes(input.type)) {
      return { success: false, error: "Tipo de campaña inválido." };
    }

    assertQuestionKit(input.type, input.questions);

    const { startsAt, endsAt } = parseWindow(input.startsAtIso, input.endsAtIso);

    const [existing] = await db
      .select({ id: campaigns.id, status: campaigns.status })
      .from(campaigns)
      .where(and(eq(campaigns.id, input.id), eq(campaigns.organizationId, org.id)))
      .limit(1);

    if (!existing) {
      return { success: false, error: "Campaña no encontrada." };
    }

    if (existing.status === "finished") {
      return { success: false, error: "No se pueden editar campañas finalizadas." };
    }

    await db
      .update(campaigns)
      .set({
        title:        input.title.trim(),
        description:  input.description?.trim() ?? null,
        type:         input.type,
        pointsReward: Math.max(0, Math.round(input.pointsReward)),
        startsAt,
        endsAt,
        segmentRules: buildAudience(input.segmentRuleIds),
        updatedAt:    new Date(),
      })
      .where(and(eq(campaigns.id, input.id), eq(campaigns.organizationId, org.id)));

    await db
      .delete(campaignQuestions)
      .where(eq(campaignQuestions.campaignId, input.id));

    await persistQuestionTree(input.id, input.questions);

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo guardar la campaña.";
    console.error("[updateCampaign]", err);
    return { success: false, error: message };
  }
}

export async function pauseCampaign(
  campaignId: string,
): Promise<{ success: true } | CampaignActionError> {
  return setCampaignLifecycleInternal(campaignId, "paused");
}

export async function activateCampaign(
  campaignId: string,
): Promise<{ success: true } | CampaignActionError> {
  return setCampaignLifecycleInternal(campaignId, "active");
}

export async function finishCampaign(
  campaignId: string,
): Promise<{ success: true } | CampaignActionError> {
  return setCampaignLifecycleInternal(campaignId, "finished");
}

async function setCampaignLifecycleInternal(
  campaignId: string,
  target: "active" | "paused" | "finished",
): Promise<{ success: true } | CampaignActionError> {
  try {
    const { org } = await getDashboardContext();

    const rows = await db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.organizationId, org.id)))
      .limit(1);

    const current = rows[0];
    if (!current) {
      return { success: false, error: "Campaña no encontrada." };
    }

    if (current.status === "finished") {
      return { success: false, error: "Esta campaña ya está finalizada." };
    }

    if (target === "paused" && current.status !== "active") {
      return { success: false, error: "Solo podés pausar campañas activas." };
    }

    if (
      target === "active"
      && !["draft", "scheduled", "paused"].includes(current.status as string)
    ) {
      return { success: false, error: "La campaña no puede activarse desde este estado." };
    }

    if (target === "finished" && ["finished"].includes(current.status)) {
      return { success: false, error: "Sin cambios." };
    }

    const now = new Date();
    let nextStatus: CampaignStatus = target;

    if (target === "active") {
      if (current.endsAt < now) {
        return {
          success: false,
          error: "Ya expiró el cierre configurado · ajustá las fechas antes de activar.",
        };
      }
      if (current.startsAt > now) nextStatus = "scheduled";
      else nextStatus = "active";
    }

    await db
      .update(campaigns)
      .set({
        status:    nextStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(campaigns.id, campaignId), eq(campaigns.organizationId, org.id)));

    return { success: true };
  } catch (err) {
    console.error("[setCampaignLifecycleInternal]", err);
    return { success: false, error: "No se pudo actualizar la campaña." };
  }
}

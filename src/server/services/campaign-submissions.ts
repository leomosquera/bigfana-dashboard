/**
 * Submission pipeline for engagement campaigns — safe to import from
 * dashboard actions and future REST / mobile callers.
 */

import { db } from "@/db";
import {
  campaigns,
  campaignOptions,
  campaignQuestions,
  campaignResponses,
  fanEvents,
  fans,
  fanSegmentRules,
  type CampaignAudienceRules,
  type CampaignType,
} from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { awardPoints } from "./points";

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface CampaignAnswerPayload {
  questionId: string;
  optionId?: string | null;
  value?: Record<string, unknown> | null;
}

export interface SubmitCampaignAnswersParams {
  organizationId: string;
  campaignId: string;
  fanId: string;
  answers: CampaignAnswerPayload[];
  /** ISO string or Date coerced downstream */
  submittedAt?: Date;
}

export interface SubmitCampaignAnswersResult {
  recordedRows:       number;
  totalPointsAwarded: number;
  fanEventId:         string;
  /** Delta aplicado al balance en esta solicitud (= puntos concedidos aquí). */
  engagementDelta:    number;
}

// ─── Audience ───────────────────────────────────────────────────────────────

export function normalizeCampaignAudience(segmentRules: unknown): CampaignAudienceRules {
  const r = segmentRules as CampaignAudienceRules | undefined;
  if (!r || typeof r !== "object") return { mode: "all" };

  const mode = "mode" in r ? String((r as { mode?: unknown }).mode) : "all";

  if (mode === "segments") {
    const ids = Array.isArray((r as { segmentRuleIds?: unknown }).segmentRuleIds)
      ? (r as { segmentRuleIds: string[] }).segmentRuleIds.filter(Boolean)
      : [];
    return { mode: "segments", segmentRuleIds: ids };
  }

  return { mode: "all" };
}

/**
 * Whether the fan's stored segment label qualifies for campaign/sponsor routing.
 * Mirrors submission validation — reuse from fan-facing surfaces instead of duplicating rules.
 */
export async function fanEligibleForCampaignAudience(
  organizationId: string,
  fanSegment: string | null,
  audience: CampaignAudienceRules,
): Promise<boolean> {
  if (audience.mode !== "segments" || audience.segmentRuleIds.length === 0) {
    return true;
  }

  const rules = await db
    .select({ name: fanSegmentRules.name })
    .from(fanSegmentRules)
    .where(
      and(
        eq(fanSegmentRules.organizationId, organizationId),
        inArray(fanSegmentRules.id, audience.segmentRuleIds),
      ),
    );

  const allowed = new Set(rules.map((r) => r.name));
  return Boolean(fanSegment && allowed.has(fanSegment));
}

async function assertFanEligibleAudience(
  organizationId: string,
  fanSegment: string | null,
  audience: CampaignAudienceRules,
): Promise<void> {
  const ok = await fanEligibleForCampaignAudience(
    organizationId,
    fanSegment,
    audience,
  );
  if (!ok) {
    throw new Error(
      "Este fan no califica para la audiencia objetivo configurada en la campaña.",
    );
  }
}

// ─── Points ────────────────────────────────────────────────────────────────────

function rowPointsBudget(
  campaignType: CampaignType,
  campaignPointsReward: number,
  questionTotal: number,
  isCorrect: boolean | null,
): number {
  if (questionTotal <= 0) return 0;
  const per = Math.round(campaignPointsReward / questionTotal);

  if (campaignType === "trivia") {
    return isCorrect === true ? per : 0;
  }

  // Poll / prediction / raffle / reward / survey — participation slices evenly
  return Math.max(per, 0);
}

/** Core submission write path (no auth — caller verifies org boundaries). */
export async function submitCampaignAnswers(
  input: SubmitCampaignAnswersParams,
): Promise<SubmitCampaignAnswersResult> {
  const submittedAt = input.submittedAt ?? new Date();

  const detailRows = await db
    .select({
      fanSegment: fans.segment,
    })
    .from(fans)
    .where(and(eq(fans.id, input.fanId), eq(fans.organizationId, input.organizationId)))
    .limit(1);

  const fanRow = detailRows[0];
  if (!fanRow) {
    throw new Error("Fan no encontrado o no pertenece a la organización.");
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, input.campaignId), eq(campaigns.organizationId, input.organizationId)))
    .limit(1);

  if (!campaign) {
    throw new Error("Campaña no encontrada.");
  }

  if (campaign.status !== "active") {
    throw new Error("La campaña no está activa.");
  }

  const now =
    submittedAt instanceof Date ? submittedAt : new Date(submittedAt);
  const startsOk = campaign.startsAt <= now;
  const endsOk   = campaign.endsAt >= now;
  if (!startsOk || !endsOk) {
    throw new Error("La campaña está fuera de ventana temporal.");
  }

  const audience = normalizeCampaignAudience(campaign.segmentRules);
  await assertFanEligibleAudience(input.organizationId, fanRow.fanSegment, audience);

  const questions = await db
    .select()
    .from(campaignQuestions)
    .where(eq(campaignQuestions.campaignId, input.campaignId));

  if (questions.length === 0) {
    throw new Error("La campaña no tiene preguntas.");
  }

  if (input.answers.length !== questions.length) {
    throw new Error("Se requiere una respuesta por cada pregunta.");
  }

  const questionIds = questions.map((q) => q.id);

  /* Ensure no duplicate replies */
  const prior = await db
    .select({ id: campaignResponses.id })
    .from(campaignResponses)
    .where(
      and(
        eq(campaignResponses.campaignId, input.campaignId),
        eq(campaignResponses.fanId, input.fanId),
        inArray(campaignResponses.questionId, questionIds),
      ),
    )
    .limit(1);

  if (prior.length > 0) {
    throw new Error("El fan ya participó en esta campaña.");
  }

  const answerKeySet = new Set(input.answers.map((a) => a.questionId));
  if (answerKeySet.size !== questions.length) {
    throw new Error("Cada pregunta debe responderse una sola vez.");
  }

  const type = campaign.type as CampaignType;

  /** Materialised inserts */
  type RowInsert = {
    questionId: string;
    optionId?: string | null;
    value: Record<string, unknown> | null;
    isCorrect: boolean | null;
    pointsAwarded: number;
  };

  const planned: RowInsert[] = [];

  for (const answer of input.answers) {
    const q = questions.find((row) => row.id === answer.questionId);
    if (!q) {
      throw new Error("Pregunta inválida para esta campaña.");
    }

    if (q.type === "multiple_choice") {
      if (!answer.optionId) {
        throw new Error(`Falta la opción seleccionada para "${q.question}".`);
      }

      const [opt] = await db
        .select()
        .from(campaignOptions)
        .where(
          and(
            eq(campaignOptions.id, answer.optionId),
            eq(campaignOptions.questionId, q.id),
          ),
        )
        .limit(1);

      if (!opt) {
        throw new Error("La opción enviada no pertenece a la pregunta.");
      }

      const isCorrect = opt.isCorrect;
      planned.push({
        questionId: q.id,
        optionId: opt.id,
        value: answer.value ?? null,
        isCorrect,
        pointsAwarded: rowPointsBudget(type, campaign.pointsReward, questions.length, isCorrect),
      });
      continue;
    }

    /* short-text / qualitative */
    if (!answer.value || typeof answer.value !== "object") {
      throw new Error(`La respuesta de texto es obligatoria para "${q.question}".`);
    }
    const textVal = "text" in answer.value ? (answer.value as { text?: unknown }).text : undefined;
    if (typeof textVal !== "string" || textVal.trim() === "") {
      throw new Error(`La respuesta de texto es obligatoria para "${q.question}".`);
    }

    planned.push({
      questionId: q.id,
      optionId: null,
      value: { text: textVal.trim() },
      isCorrect: null,
      pointsAwarded: rowPointsBudget(type, campaign.pointsReward, questions.length, true),
    });
  }

  const totalPoints = planned.reduce((sum, row) => sum + row.pointsAwarded, 0);

  await db.insert(campaignResponses).values(
    planned.map((row) => ({
      organizationId: input.organizationId,
      campaignId:     campaign.id,
      questionId:     row.questionId,
      optionId:       row.optionId ?? null,
      fanId:          input.fanId,
      value:          row.value,
      isCorrect:      row.isCorrect,
      pointsAwarded:  row.pointsAwarded,
      createdAt:      now,
    })),
  );

  const [fanEventRecord] = await db
    .insert(fanEvents)
    .values({
      organizationId: input.organizationId,
      fanId:          input.fanId,
      eventType:      "campaign_engagement",
      source:         "campaign",
      payload:        {
        campaignId: campaign.id,
        campaignType: type,
        answeredQuestionIds: planned.map((p) => p.questionId),
      },
      metadata: null,
      points:     totalPoints,
      occurredAt: now,
    })
    .returning({ id: fanEvents.id });

  const fanEventId = fanEventRecord.id;

  const awardResult = await awardPoints({
    organizationId: input.organizationId,
    fanId:          input.fanId,
    points:         totalPoints,
    eventType:
      campaign.type === "trivia"
        ? "campaign_trivia"
        : "campaign_participation",
    reason:         `Participación · ${campaign.title}`,
    source:         "campaign",
    fanEventId,
    metadata:       { campaignId: campaign.id, campaignType: campaign.type },
  });

  return {
    recordedRows:       planned.length,
    totalPointsAwarded: totalPoints,
    fanEventId,
    engagementDelta:    awardResult.points,
  };
}

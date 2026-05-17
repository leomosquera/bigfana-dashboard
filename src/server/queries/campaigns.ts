import { db } from "@/db";
import {
  campaignOptions,
  campaignQuestions,
  campaignResponses,
  campaigns,
  type Campaign,
  type CampaignOption,
  type CampaignQuestion,
} from "@/db/schema";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";

export interface CampaignWithResponseStats extends Campaign {
  responseCount: number;
}

export interface CampaignQuestionWithOptions extends CampaignQuestion {
  options: CampaignOption[];
}

export interface CampaignDetail extends Campaign {
  questions: CampaignQuestionWithOptions[];
}

/** Campaigns sorted newest first plus distinct responding fans count. */
export async function listCampaignsWithStats(
  organizationId: string,
): Promise<CampaignWithResponseStats[]> {
  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.organizationId, organizationId))
    .orderBy(desc(campaigns.createdAt));

  if (rows.length === 0) return [];

  const countsRows = await db
    .select({
      campaignId: campaignResponses.campaignId,
      n: sql<number>`count(distinct ${campaignResponses.fanId})::int`,
    })
    .from(campaignResponses)
    .where(eq(campaignResponses.organizationId, organizationId))
    .groupBy(campaignResponses.campaignId);

  const counts = new Map<string, number>(countsRows.map((r) => [r.campaignId, r.n]));

  return rows.map((campaign) => ({
    ...campaign,
    responseCount: counts.get(campaign.id) ?? 0,
  }));
}

/**
 * Full questionnaire graph for dashboards / reusable submission validation.
 */
export async function getCampaignDetail(
  organizationId: string,
  campaignId: string,
): Promise<CampaignDetail | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.organizationId, organizationId)))
    .limit(1);

  if (!campaign) return null;

  const questions = await db
    .select()
    .from(campaignQuestions)
    .where(eq(campaignQuestions.campaignId, campaignId))
    .orderBy(asc(campaignQuestions.sortOrder), asc(campaignQuestions.createdAt));

  const questionIds = questions.map((q) => q.id);
  let optionsRows: CampaignOption[] = [];

  if (questionIds.length > 0) {
    optionsRows = await db
      .select()
      .from(campaignOptions)
      .where(inArray(campaignOptions.questionId, questionIds))
      .orderBy(asc(campaignOptions.sortOrder), asc(campaignOptions.createdAt));
  }

  const byQuestion = new Map<string, CampaignOption[]>();
  for (const opt of optionsRows) {
    const list = byQuestion.get(opt.questionId) ?? [];
    list.push(opt);
    byQuestion.set(opt.questionId, list);
  }

  return {
    ...campaign,
    questions: questions.map((q) => ({
      ...q,
      options: byQuestion.get(q.id) ?? [],
    })),
  };
}

/**
 * Fan-facing eligibility reads — active campaigns/sponsor creatives routed by segment rules.
 * Delegates segment matching to campaign-submissions so rules stay single-sourced.
 */

import { db } from "@/db";
import {
  campaigns,
  campaignQuestions,
  campaignOptions,
  sponsorAds,
  campaignResponses,
} from "@/db/schema";
import { eq, and, lte, gte, desc, asc, inArray } from "drizzle-orm";
import { getFanById } from "./fans";
import {
  normalizeCampaignAudience,
  fanEligibleForCampaignAudience,
} from "@/server/services/campaign-submissions";

export interface EligibleCampaignSurface {
  id:               string;
  title:            string;
  description:      string | null;
  type:             string;
  status:           string;
  pointsReward:     number;
  startsAt:         Date;
  endsAt:           Date;
  /** Raw row metadata — fan API derives presentation fields server-side */
  metadata:         unknown;
  segmentRules:     unknown;
  alreadyResponded: boolean;
}

export interface EligibleSponsorAdSurface {
  id:             string;
  sponsorName:    string;
  title:          string;
  description:    string | null;
  imageUrl:       string | null;
  destinationUrl: string | null;
  priority:       number;
  segmentRules:   unknown;
}

/** Fan-app surface for a question row (options omit `isCorrect`). */
export interface FanFacingCampaignQuestionPayload {
  id:        string;
  type:      string;
  question:  string;
  sortOrder: number;
  options:   {
    id:        string;
    label:     string;
    value:     string;
    sortOrder: number;
  }[];
}

/**
 * Loads ordered questions + options for campaigns already vetted as org-scoped + fan-eligible.
 * Enforces organization_id on joins — do not pass arbitrary campaign ids from clients.
 */
export async function loadFanFacingCampaignQuestionsByCampaignIds(
  organizationId: string,
  campaignIds:  string[],
): Promise<Map<string, FanFacingCampaignQuestionPayload[]>> {
  const byCampaign = new Map<string, FanFacingCampaignQuestionPayload[]>();
  if (campaignIds.length === 0) return byCampaign;

  const qRows = await db
    .select({
      id:         campaignQuestions.id,
      campaignId: campaignQuestions.campaignId,
      question:   campaignQuestions.question,
      type:       campaignQuestions.type,
      sortOrder:  campaignQuestions.sortOrder,
    })
    .from(campaignQuestions)
    .innerJoin(campaigns, eq(campaignQuestions.campaignId, campaigns.id))
    .where(
      and(
        eq(campaigns.organizationId, organizationId),
        inArray(campaignQuestions.campaignId, campaignIds),
      ),
    )
    .orderBy(asc(campaignQuestions.campaignId), asc(campaignQuestions.sortOrder));

  const questionIds = qRows.map((r) => r.id);

  const optRows =
    questionIds.length === 0
      ? []
      : await db
          .select({
            id:         campaignOptions.id,
            questionId: campaignOptions.questionId,
            label:      campaignOptions.label,
            value:      campaignOptions.value,
            sortOrder:  campaignOptions.sortOrder,
          })
          .from(campaignOptions)
          .innerJoin(campaignQuestions, eq(campaignOptions.questionId, campaignQuestions.id))
          .innerJoin(campaigns, eq(campaignQuestions.campaignId, campaigns.id))
          .where(
            and(
              eq(campaigns.organizationId, organizationId),
              inArray(campaignOptions.questionId, questionIds),
            ),
          )
          .orderBy(asc(campaignOptions.questionId), asc(campaignOptions.sortOrder));

  const optsByQuestion = new Map<string, FanFacingCampaignQuestionPayload["options"]>();
  for (const o of optRows) {
    const list = optsByQuestion.get(o.questionId) ?? [];
    list.push({
      id:        o.id,
      label:     o.label,
      value:     o.value,
      sortOrder: o.sortOrder,
    });
    optsByQuestion.set(o.questionId, list);
  }

  for (const row of qRows) {
    const options =
      row.type === "multiple_choice" ? (optsByQuestion.get(row.id) ?? []) : [];
    const payload: FanFacingCampaignQuestionPayload = {
      id:        row.id,
      type:      row.type,
      question:  row.question,
      sortOrder: row.sortOrder,
      options,
    };
    const arr = byCampaign.get(row.campaignId) ?? [];
    arr.push(payload);
    byCampaign.set(row.campaignId, arr);
  }

  return byCampaign;
}

async function fanRespondedCampaignIds(
  organizationId: string,
  fanId:          string,
): Promise<Set<string>> {
  const rows = await db
    .select({ campaignId: campaignResponses.campaignId })
    .from(campaignResponses)
    .where(
      and(
        eq(campaignResponses.organizationId, organizationId),
        eq(campaignResponses.fanId, fanId),
      ),
    );

  return new Set(rows.map((r) => r.campaignId));
}

/**
 * Active campaigns in their time window that match audience rules for this fan.
 */
export async function listEligibleActiveCampaignsForFan(
  organizationId: string,
  fanId:          string,
): Promise<EligibleCampaignSurface[]> {
  const fan = await getFanById(organizationId, fanId);
  if (!fan) return [];

  const now = new Date();

  const rows = await db
    .select()
    .from(campaigns)
    .where(
      and(
        eq(campaigns.organizationId, organizationId),
        eq(campaigns.status, "active"),
        lte(campaigns.startsAt, now),
        gte(campaigns.endsAt, now),
      ),
    )
    .orderBy(desc(campaigns.startsAt));

  const responded = await fanRespondedCampaignIds(organizationId, fanId);

  const out: EligibleCampaignSurface[] = [];

  for (const c of rows) {
    const audience = normalizeCampaignAudience(c.segmentRules);
    const ok       = await fanEligibleForCampaignAudience(
      organizationId,
      fan.segment,
      audience,
    );
    if (!ok) continue;

    out.push({
      id:               c.id,
      title:            c.title,
      description:      c.description,
      type:             c.type,
      status:           c.status,
      pointsReward:     c.pointsReward,
      startsAt:         c.startsAt,
      endsAt:           c.endsAt,
      metadata:         c.metadata,
      segmentRules:     c.segmentRules,
      alreadyResponded: responded.has(c.id),
    });
  }

  return out;
}

/**
 * Active sponsor creatives matching audience rules for this fan (inventory targeting).
 */
export async function listEligibleActiveSponsorAdsForFan(
  organizationId: string,
  fanId:          string,
): Promise<EligibleSponsorAdSurface[]> {
  const fan = await getFanById(organizationId, fanId);
  if (!fan) return [];

  const rows = await db
    .select()
    .from(sponsorAds)
    .where(
      and(
        eq(sponsorAds.organizationId, organizationId),
        eq(sponsorAds.status, "active"),
      ),
    )
    .orderBy(desc(sponsorAds.priority), asc(sponsorAds.createdAt));

  const out: EligibleSponsorAdSurface[] = [];

  for (const ad of rows) {
    const audience = normalizeCampaignAudience(ad.segmentRules ?? { mode: "all" });
    const ok       = await fanEligibleForCampaignAudience(
      organizationId,
      fan.segment,
      audience,
    );
    if (!ok) continue;

    out.push({
      id:             ad.id,
      sponsorName:    ad.sponsorName,
      title:          ad.title,
      description:    ad.description,
      imageUrl:       ad.imageUrl,
      destinationUrl: ad.destinationUrl,
      priority:       ad.priority,
      segmentRules:   ad.segmentRules,
    });
  }

  return out;
}

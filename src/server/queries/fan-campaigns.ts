/**
 * Org-scoped fan campaign participation for Fan 360.
 * Source: campaign_responses → campaigns.
 */

import { db } from "@/db";
import { campaignResponses, campaigns } from "@/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";

export interface FanCampaignParticipation {
  campaignId: string;
  title: string;
  type: string;
  status: string;
  lastRespondedAt: Date;
  responseCount: number;
  pointsAwarded: number;
}

export interface FanCampaignHistory {
  /** Distinct campaigns the fan responded to in this org. */
  totalCampaigns: number;
  /** Total response rows (question-level). */
  responseCount: number;
  recent: FanCampaignParticipation[];
}

/**
 * Per-fan campaign history for the active organization.
 * Aggregates campaign_responses by campaign; never crosses org boundaries.
 */
export async function getFanCampaignHistory(
  organizationId: string,
  fanId: string,
  limit = 20,
): Promise<FanCampaignHistory> {
  const rows = await db
    .select({
      campaignId: campaigns.id,
      title: campaigns.title,
      type: campaigns.type,
      status: campaigns.status,
      lastRespondedAt: sql<Date>`max(${campaignResponses.createdAt})`.as(
        "last_responded_at",
      ),
      responseCount: sql<number>`count(*)::int`.as("response_count"),
      pointsAwarded: sql<number>`coalesce(sum(${campaignResponses.pointsAwarded}), 0)::int`.as(
        "points_awarded",
      ),
    })
    .from(campaignResponses)
    .innerJoin(
      campaigns,
      and(
        eq(campaigns.id, campaignResponses.campaignId),
        eq(campaigns.organizationId, organizationId),
      ),
    )
    .where(
      and(
        eq(campaignResponses.organizationId, organizationId),
        eq(campaignResponses.fanId, fanId),
      ),
    )
    .groupBy(
      campaigns.id,
      campaigns.title,
      campaigns.type,
      campaigns.status,
    )
    .orderBy(desc(sql`max(${campaignResponses.createdAt})`))
    .limit(limit);

  const recent: FanCampaignParticipation[] = rows.map((row) => ({
    campaignId: row.campaignId,
    title: row.title,
    type: row.type,
    status: row.status,
    lastRespondedAt: new Date(row.lastRespondedAt),
    responseCount: Number(row.responseCount ?? 0),
    pointsAwarded: Number(row.pointsAwarded ?? 0),
  }));

  const [totals] = await db
    .select({
      responseCount: sql<number>`count(*)::int`,
      totalCampaigns: sql<number>`count(distinct ${campaignResponses.campaignId})::int`,
    })
    .from(campaignResponses)
    .where(
      and(
        eq(campaignResponses.organizationId, organizationId),
        eq(campaignResponses.fanId, fanId),
      ),
    );

  return {
    totalCampaigns: Number(totals?.totalCampaigns ?? 0),
    responseCount: Number(totals?.responseCount ?? 0),
    recent,
  };
}

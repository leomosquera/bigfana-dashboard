/**
 * Fan-facing eligibility reads — active campaigns/sponsor creatives routed by segment rules.
 * Delegates segment matching to campaign-submissions so rules stay single-sourced.
 */

import { db } from "@/db";
import {
  campaigns,
  sponsorAds,
  campaignResponses,
} from "@/db/schema";
import { eq, and, lte, gte, desc, asc } from "drizzle-orm";
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

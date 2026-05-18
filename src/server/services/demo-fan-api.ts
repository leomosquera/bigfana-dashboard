/**
 * Demo Fan Experience API — orchestrates existing queries/services only.
 * Route handlers stay thin; business rules live in imported modules.
 */

import { db } from "@/db";
import { fanSegmentRules } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type { FanLevel } from "@/db/schema";
import { getFanByEmail, getFanById } from "@/server/queries/fans";
import {
  getFanBehavioralProfile,
  getEngagementVelocity,
  getFanEligibleExperiences,
} from "@/server/queries/engagement-intelligence";
import {
  computeLevelForScore,
  getOrgLevels,
  getFanLedger,
} from "@/server/queries/gamification";
import {
  listEligibleActiveCampaignsForFan,
  listEligibleActiveSponsorAdsForFan,
  loadFanFacingCampaignQuestionsByCampaignIds,
} from "@/server/queries/fan-facing-eligibility";
import type {
  DemoFanLoginSnapshot,
  DemoFanExperienceResponse,
  DemoFanExperienceFan,
  DemoFanExperienceSegment,
  DemoFanExperienceLevel,
  DemoFanExperienceCampaign,
  DemoFanExperienceSponsor,
  DemoFanExperienceStats,
  DemoFanExperienceIntelligence,
  DemoBehavioralSnapshot,
  DemoVelocitySnapshot,
  DemoEligibleExperienceSurface,
} from "@/lib/demo-fan-api-contract";

function fanCampaignPresentation(
  campaignType: string,
  metadata:     unknown,
): { image: string | null; ctaLabel: string } {
  const m =
    metadata && typeof metadata === "object"
      ? (metadata as Record<string, unknown>)
      : {};

  const rawImage =
    typeof m.imageUrl === "string" && m.imageUrl.trim()
      ? m.imageUrl.trim()
      : typeof m.image === "string" && m.image.trim()
        ? m.image.trim()
        : null;

  const fromMeta =
    typeof m.ctaLabel === "string" && m.ctaLabel.trim()
      ? m.ctaLabel.trim()
      : typeof m.cta === "string" && m.cta.trim()
        ? m.cta.trim()
        : null;

  if (fromMeta) {
    return { image: rawImage, ctaLabel: fromMeta };
  }

  const defaults: Record<string, string> = {
    survey:     "Responder encuesta",
    poll:       "Votar",
    trivia:     "Jugar trivia",
    prediction: "Hacer pronóstico",
    raffle:     "Participar",
    reward:     "Ver recompensa",
  };

  return {
    image: rawImage,
    ctaLabel: defaults[campaignType] ?? "Participar",
  };
}

function pickNextLevel(score: number, levels: FanLevel[]): FanLevel | null {
  const sorted = [...levels].sort((a, b) => a.minPoints - b.minPoints);
  const current = computeLevelForScore(score, sorted);
  if (!current) {
    return sorted[0] ?? null;
  }
  const idx = sorted.findIndex((l) => l.id === current.id);
  return sorted[idx + 1] ?? null;
}

function mapLedgerPreview(rows: Awaited<ReturnType<typeof getFanLedger>>) {
  return rows.slice(0, 8).map((e) => ({
    id:           e.id,
    points:       e.points,
    balanceAfter: e.balanceAfter,
    eventType:    e.eventType,
    reason:       e.reason,
    createdAt:    e.createdAt.toISOString(),
  }));
}

function mapBehavioral(b: Awaited<ReturnType<typeof getFanBehavioralProfile>>): DemoBehavioralSnapshot {
  return {
    totalEvents:   b.totalEvents,
    topEventTypes: b.topEventTypes,
    lastEventAt:   b.lastEventAt ? b.lastEventAt.toISOString() : null,
    daysSinceLast: b.daysSinceLast,
    activityScore: b.activityScore,
  };
}

function mapVelocity(v: Awaited<ReturnType<typeof getEngagementVelocity>>): DemoVelocitySnapshot {
  return {
    points30d: v.points30d,
    events30d: v.events30d,
    points7d:  v.points7d,
    events7d:  v.events7d,
    trend:     v.trend,
  };
}

function mapExperiences(
  rows: Awaited<ReturnType<typeof getFanEligibleExperiences>>,
): DemoEligibleExperienceSurface[] {
  return rows.map((r) => ({
    id:              r.id,
    type:            r.type,
    title:           r.title,
    description:     r.description,
    sponsorAffinity: r.sponsorAffinity,
    segmentName:     r.segmentName,
    segmentColor:    r.segmentColor,
  }));
}

function fanSurface(fan: NonNullable<Awaited<ReturnType<typeof getFanById>>>): DemoFanExperienceFan {
  return {
    id:               fan.id,
    displayName:      fan.displayName,
    email:            fan.email,
    segment:          fan.segment,
    tier:             fan.tier,
    engagementScore:  fan.engagementScore,
    status:           fan.status,
  };
}

async function resolveSegmentDetail(
  organizationId: string,
  segmentLabel:   string | null,
): Promise<DemoFanExperienceSegment> {
  if (!segmentLabel) {
    return { key: null, rule: null };
  }

  const [rule] = await db
    .select({
      id:          fanSegmentRules.id,
      name:        fanSegmentRules.name,
      color:       fanSegmentRules.color,
      description: fanSegmentRules.description,
      priority:    fanSegmentRules.priority,
      isActive:    fanSegmentRules.isActive,
    })
    .from(fanSegmentRules)
    .where(
      and(
        eq(fanSegmentRules.organizationId, organizationId),
        eq(fanSegmentRules.name, segmentLabel),
      ),
    )
    .limit(1);

  return {
    key: segmentLabel,
    rule: rule
      ? {
          id:          rule.id,
          name:        rule.name,
          color:       rule.color,
          description: rule.description,
          priority:    rule.priority,
          isActive:    rule.isActive,
        }
      : null,
  };
}

export async function demoFanLoginByEmail(
  organizationId: string,
  email: string,
): Promise<DemoFanLoginSnapshot | null> {
  const fan = await getFanByEmail(organizationId, email);
  if (!fan) return null;

  const levels = await getOrgLevels(organizationId);
  const sorted = [...levels].sort((a, b) => a.minPoints - b.minPoints);
  const level    = computeLevelForScore(fan.engagementScore ?? 0, sorted);

  return {
    fanId:             fan.id,
    displayName:       fan.displayName,
    segment:           fan.segment,
    level:             level?.name ?? null,
    engagementScore:   fan.engagementScore ?? 0,
    status:            fan.status,
  };
}

export async function buildDemoFanExperiencePayload(
  organizationId: string,
  fanId:          string,
): Promise<DemoFanExperienceResponse | null> {
  const fan = await getFanById(organizationId, fanId);
  if (!fan) return null;

  const score = fan.engagementScore ?? 0;

  const [
    levels,
    behavioral,
    velocity,
    ledgerHead,
    campaigns,
    sponsors,
    segmentBlock,
    experiencesRows,
  ] = await Promise.all([
    getOrgLevels(organizationId),
    getFanBehavioralProfile(organizationId, fanId),
    getEngagementVelocity(organizationId, fanId),
    getFanLedger(organizationId, fanId, 8),
    listEligibleActiveCampaignsForFan(organizationId, fanId),
    listEligibleActiveSponsorAdsForFan(organizationId, fanId),
    resolveSegmentDetail(organizationId, fan.segment),
    getFanEligibleExperiences(organizationId, fan.segment),
  ]);

  const sortedLevels = [...levels].sort((a, b) => a.minPoints - b.minPoints);
  const currentLevel = computeLevelForScore(score, sortedLevels);
  const nextLevel    = pickNextLevel(score, sortedLevels);

  const levelPayload: DemoFanExperienceLevel = {
    current: currentLevel
      ? {
          id:        currentLevel.id,
          name:      currentLevel.name,
          color:     currentLevel.color,
          minPoints: currentLevel.minPoints,
          sortOrder: currentLevel.sortOrder,
        }
      : null,
    next: nextLevel
      ? {
          id:        nextLevel.id,
          name:      nextLevel.name,
          color:     nextLevel.color,
          minPoints: nextLevel.minPoints,
          sortOrder: nextLevel.sortOrder,
        }
      : null,
    pointsToNextLevel:
      nextLevel !== null ? Math.max(0, nextLevel.minPoints - score) : null,
  };

  const questionBuckets = await loadFanFacingCampaignQuestionsByCampaignIds(
    organizationId,
    campaigns.map((c) => c.id),
  );

  const campaignsPayload: DemoFanExperienceCampaign[] = campaigns.map((c) => {
    const { image, ctaLabel } = fanCampaignPresentation(c.type, c.metadata);
    return {
      id:               c.id,
      type:             c.type,
      title:            c.title,
      description:      c.description,
      image,
      pointsReward:     c.pointsReward,
      startsAt:         c.startsAt.toISOString(),
      endsAt:           c.endsAt.toISOString(),
      status:           c.status,
      ctaLabel,
      alreadyResponded: c.alreadyResponded,
      questions:        questionBuckets.get(c.id) ?? [],
    };
  });

  const sponsorsPayload: DemoFanExperienceSponsor[] = sponsors.map((s) => ({
    id:             s.id,
    sponsorName:    s.sponsorName,
    title:          s.title,
    description:    s.description,
    imageUrl:       s.imageUrl,
    destinationUrl: s.destinationUrl,
    priority:       s.priority,
  }));

  const statsPayload: DemoFanExperienceStats = {
    engagementScore: score,
    velocityTrend:   velocity.trend,
    points30d:       velocity.points30d,
    events30d:       velocity.events30d,
    activityScore:   behavioral.activityScore,
    ledgerPreview:   mapLedgerPreview(ledgerHead),
  };

  const intelligencePayload: DemoFanExperienceIntelligence = {
    behavioral: mapBehavioral(behavioral),
    velocity:   mapVelocity(velocity),
  };

  return {
    fan:          fanSurface(fan),
    segment:      segmentBlock,
    level:        levelPayload,
    campaigns:    campaignsPayload,
    experiences:  mapExperiences(experiencesRows),
    sponsors:     sponsorsPayload,
    stats:        statsPayload,
    intelligence: intelligencePayload,
  };
}

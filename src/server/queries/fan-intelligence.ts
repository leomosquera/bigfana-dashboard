/**
 * Fan Intelligence V1 query contracts (F1 list + F2 Fan 360).
 *
 * Ownership SoT: fan_organizations (ADR-009).
 * Geography SoT: fans.country_code.
 * List default cohort: PRIMARY, non-archived.
 * Fan 360 access: ANY membership (PRIMARY | FOLLOWING).
 */

import { db } from "@/db";
import { fanEvents, fanOrganizations } from "@/db/schema";
import type {
  EepSyncStatus,
  FanEvent,
  FanLevel,
  FanPointsLedger,
  FanView,
} from "@/db/schema";
import { and, eq, inArray, max } from "drizzle-orm";
import { getFansByOrg, getFanById } from "./fans";
import { hasFanOrgMembership } from "./fan-organizations";
import { getFanEventsByFan } from "./fan-events";
import {
  computeLevelForScore,
  getFanLedger,
  getOrgLevels,
} from "./gamification";
import {
  getEngagementVelocity,
  getFanBehavioralProfile,
  getFanEligibleExperiences,
  type BehavioralProfile,
  type EligibleExperience,
  type EngagementVelocity,
} from "./engagement-intelligence";
import {
  getFanCampaignHistory,
  type FanCampaignHistory,
} from "./fan-campaigns";
import {
  buildFanActivitySummary,
  isLoyaltyEligible,
  mergeLastActivityAt,
  normalizeRelationshipType,
  type FanActivitySummaryView,
  type FanRelationshipType,
} from "@/lib/fan-intelligence";

export type { FanCampaignHistory };
export { buildFanActivitySummary, normalizeRelationshipType };

// ─── List types ───────────────────────────────────────────────────────────────

export type FanIntelligenceListRow = FanView & {
  lastActivityAt: Date | null;
};

// ─── Fan 360 types ────────────────────────────────────────────────────────────

export interface FanOrgRelationshipView {
  type: FanRelationshipType;
  joinedAt: Date | null;
  isPrimary: boolean;
}

export type FanActivitySummary = FanActivitySummaryView;

export interface Fan360Gamification {
  eligible: boolean;
  score: number | null;
  level: FanLevel | null;
  ledger: FanPointsLedger[];
  velocity: EngagementVelocity | null;
}

export interface Fan360EepState {
  syncStatus: EepSyncStatus;
  contactId: string | null;
  lastSyncAt: Date | null;
  lastError: string | null;
}

export interface Fan360Profile {
  fan: FanView;
  relationship: FanOrgRelationshipView;
  activity: {
    events: FanEvent[];
    summary: FanActivitySummary;
    behavioral: BehavioralProfile;
  };
  gamification: Fan360Gamification;
  segmentation: {
    localSegment: string | null;
    experiences: EligibleExperience[];
  };
  campaigns: FanCampaignHistory;
  eep: Fan360EepState;
  orgLevels: FanLevel[];
}

// ─── Last activity (org-scoped, batched) ──────────────────────────────────────

/**
 * MAX(occurred_at) per fan for the organization.
 * Single grouped query — avoids N+1 on the Fans list.
 */
export async function getLastActivityByFanIds(
  organizationId: string,
  fanIds: string[],
): Promise<Map<string, Date>> {
  const map = new Map<string, Date>();
  if (fanIds.length === 0) return map;

  const rows = await db
    .select({
      fanId: fanEvents.fanId,
      lastActivityAt: max(fanEvents.occurredAt).as("last_activity_at"),
    })
    .from(fanEvents)
    .where(
      and(
        eq(fanEvents.organizationId, organizationId),
        inArray(fanEvents.fanId, fanIds),
      ),
    )
    .groupBy(fanEvents.fanId);

  for (const row of rows) {
    if (row.lastActivityAt) {
      map.set(row.fanId, new Date(row.lastActivityAt));
    }
  }

  return map;
}

// ─── F1 — Fans Intelligence List ──────────────────────────────────────────────

/**
 * PRIMARY non-archived fans for the CRM list, enriched with last activity.
 * FOLLOWING fans are intentionally excluded (default CRM cohort).
 */
export async function getFansIntelligenceList(
  organizationId: string,
): Promise<FanIntelligenceListRow[]> {
  const fansList = await getFansByOrg(organizationId);
  const lastActivity = await getLastActivityByFanIds(
    organizationId,
    fansList.map((f) => f.id),
  );
  return mergeLastActivityAt(fansList, lastActivity);
}

// ─── Relationship ─────────────────────────────────────────────────────────────

/**
 * fan_organizations row for (fan, org). Null when no relationship.
 */
export async function getFanOrgRelationship(
  organizationId: string,
  fanId: string,
): Promise<FanOrgRelationshipView | null> {
  const [row] = await db
    .select({
      relationshipType: fanOrganizations.relationshipType,
      isPrimary: fanOrganizations.isPrimary,
      joinedAt: fanOrganizations.joinedAt,
    })
    .from(fanOrganizations)
    .where(
      and(
        eq(fanOrganizations.organizationId, organizationId),
        eq(fanOrganizations.fanId, fanId),
      ),
    )
    .limit(1);

  if (!row) return null;

  return {
    type: normalizeRelationshipType(row.relationshipType, row.isPrimary),
    isPrimary: row.isPrimary,
    joinedAt: row.joinedAt ? new Date(row.joinedAt) : null,
  };
}

// ─── F2 — Fan 360 Profile ─────────────────────────────────────────────────────

/**
 * Full Fan 360 payload for the active organization.
 * Returns null when the fan has no fan_organizations relationship with the org.
 * Allows PRIMARY and FOLLOWING; denies no-relationship.
 */
export async function getFan360Profile(
  organizationId: string,
  fanId: string,
): Promise<Fan360Profile | null> {
  const related = await hasFanOrgMembership(fanId, organizationId, "any");
  if (!related) return null;

  const [fan, relationship] = await Promise.all([
    getFanById(organizationId, fanId),
    getFanOrgRelationship(organizationId, fanId),
  ]);

  if (!fan || !relationship) return null;

  const loyaltyEligible = isLoyaltyEligible(relationship.type);

  const [
    events,
    ledger,
    behavioral,
    velocity,
    experiences,
    orgLevels,
    campaigns,
  ] = await Promise.all([
    getFanEventsByFan(organizationId, fanId),
    loyaltyEligible
      ? getFanLedger(organizationId, fanId)
      : Promise.resolve([] as FanPointsLedger[]),
    getFanBehavioralProfile(organizationId, fanId),
    getEngagementVelocity(organizationId, fanId),
    getFanEligibleExperiences(organizationId, fan.segment),
    getOrgLevels(organizationId),
    getFanCampaignHistory(organizationId, fanId),
  ]);

  const score = fan.engagementScore ?? 0;

  return {
    fan,
    relationship,
    activity: {
      events,
      summary: buildFanActivitySummary(behavioral, velocity),
      behavioral,
    },
    gamification: loyaltyEligible
      ? {
          eligible: true,
          score,
          level: computeLevelForScore(score, orgLevels),
          ledger,
          velocity,
        }
      : {
          eligible: false,
          score: null,
          level: null,
          ledger: [],
          velocity: null,
        },
    segmentation: {
      localSegment: fan.segment,
      experiences,
    },
    campaigns,
    eep: {
      syncStatus: fan.eepSyncStatus,
      contactId: fan.eepContactId,
      lastSyncAt: fan.eepLastSyncAt ? new Date(fan.eepLastSyncAt) : null,
      lastError: fan.eepLastError,
    },
    orgLevels,
  };
}

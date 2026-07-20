"use server";

import { db } from "@/db";
import { fans } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getDashboardContext } from "@/server/queries/session";
import { hasFanOrgMembership } from "@/server/queries/fan-organizations";
import { getFanEventsByFan } from "@/server/queries/fan-events";
import { getFanLedger, getOrgLevels } from "@/server/queries/gamification";
import {
  getFanBehavioralProfile,
  getEngagementVelocity,
  getFanEligibleExperiences,
} from "@/server/queries/engagement-intelligence";
import type {
  FanEvent,
  FanPointsLedger,
  FanLevel,
} from "@/db/schema";
import type {
  BehavioralProfile,
  EngagementVelocity,
  EligibleExperience,
} from "@/server/queries/engagement-intelligence";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FanIntelligence {
  /** Behavioral fingerprint: event type breakdown + activity score */
  behavioral:  BehavioralProfile;
  /** Short-term engagement momentum */
  velocity:    EngagementVelocity;
  /** Experiences + campaigns the fan is currently eligible for */
  experiences: EligibleExperience[];
  /** Level tiers for this org (used for next-level progress bar) */
  orgLevels:   FanLevel[];
}

export interface FanProfileData {
  events:       FanEvent[];
  ledger:       FanPointsLedger[];
  intelligence: FanIntelligence;
}

export type FanProfileResult =
  | { success: true;  data: FanProfileData }
  | { success: false; error: string };

// ─── Action ───────────────────────────────────────────────────────────────────

/**
 * Fetches the complete profile data for a single fan:
 *   - Behavioral events timeline
 *   - Points ledger history
 *   - Intelligence: behavioral fingerprint, velocity, eligible experiences
 *
 * Org-scoped via session. Called from FanProfileDrawer on open.
 * All sub-queries run in parallel for performance.
 */
export async function getFanProfile(fanId: string): Promise<FanProfileResult> {
  try {
    const { org } = await getDashboardContext();

    // ANY membership via fan_organizations (ADR-009 Phase C)
    const related = await hasFanOrgMembership(fanId, org.id, "any");
    if (!related) {
      return { success: false, error: "Fan no encontrado." };
    }

    // Resolve the fan's current segment (written by the segmentation service)
    const [fanRow] = await db
      .select({ segment: fans.segment })
      .from(fans)
      .where(eq(fans.id, fanId))
      .limit(1);

    if (!fanRow) {
      return { success: false, error: "Fan no encontrado." };
    }

    const [events, ledger, behavioral, velocity, experiences, orgLevels] =
      await Promise.all([
        getFanEventsByFan(org.id, fanId),
        getFanLedger(org.id, fanId),
        getFanBehavioralProfile(org.id, fanId),
        getEngagementVelocity(org.id, fanId),
        getFanEligibleExperiences(org.id, fanRow.segment),
        getOrgLevels(org.id),
      ]);

    return {
      success: true,
      data: {
        events,
        ledger,
        intelligence: { behavioral, velocity, experiences, orgLevels },
      },
    };
  } catch (err) {
    console.error("[getFanProfile]", err);
    return { success: false, error: "No se pudo cargar el perfil del fan." };
  }
}

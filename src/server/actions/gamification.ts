"use server";

import { getDashboardContext } from "@/server/queries/session";
import { awardPoints } from "@/server/services/points";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminAwardPointsInput {
  fanId:   string;
  /** Positive = award, negative = deduction. */
  points:  number;
  /** Human-readable reason shown in admin UIs and fan history. */
  reason:  string;
}

export type GamificationActionResult =
  | { success: true;  newBalance: number }
  | { success: false; error: string };

// ─── Actions ──────────────────────────────────────────────────────────────────

/**
 * Manually awards or deducts points for a fan.
 * Scoped to the current admin's organization — cannot award across orgs.
 * Records the awarding admin's userId for audit.
 */
export async function adminAwardPoints(
  input: AdminAwardPointsInput,
): Promise<GamificationActionResult> {
  try {
    const { org, userId } = await getDashboardContext();

    if (input.points === 0) {
      return { success: false, error: "Los puntos no pueden ser cero." };
    }

    if (!input.reason.trim()) {
      return { success: false, error: "El motivo es obligatorio." };
    }

    const { newBalance } = await awardPoints({
      organizationId: org.id,
      fanId:          input.fanId,
      points:         input.points,
      eventType:      input.points > 0 ? "manual_award" : "admin_deduction",
      reason:         input.reason.trim(),
      source:         "admin",
      awardedBy:      userId,
    });

    return { success: true, newBalance };
  } catch (err) {
    console.error("[adminAwardPoints]", err);
    return {
      success: false,
      error: "No se pudo registrar la operación de puntos.",
    };
  }
}

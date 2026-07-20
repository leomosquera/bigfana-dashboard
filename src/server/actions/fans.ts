"use server";

import { db } from "@/db";
import { fans } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  isInvalidCountryCodeInput,
  normalizeCountryCode,
} from "@/lib/country-codes";
import { getDashboardContext } from "@/server/queries/session";
import { assertFanOrgMembership } from "@/server/queries/fan-organizations";
import {
  createOrganizationFan,
  enqueueFanEepJob,
} from "@/server/services/fans";

// ─── Input types ──────────────────────────────────────────────────────────────

export interface CreateFanInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  city?: string;
  /** ISO 3166-1 alpha-2 or empty. Maps to fans.country_code. */
  countryCode?: string;
}

export interface UpdateFanInput {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
  city?: string;
  /** ISO 3166-1 alpha-2 or empty. Maps to fans.country_code. */
  countryCode?: string;
}

// ─── Result type ──────────────────────────────────────────────────────────────

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verifies ANY fan_organizations membership before mutation (ADR-009 Phase C).
 * Does not use the deprecated legacy ownership column.
 */
async function assertFanOwnership(
  organizationId: string,
  fanId: string,
): Promise<void> {
  await assertFanOrgMembership(fanId, organizationId, "any");
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createFan(input: CreateFanInput): Promise<ActionResult> {
  try {
    const { org } = await getDashboardContext();

    const result = await createOrganizationFan({
      organizationId: org.id,
      firstName:      input.firstName,
      lastName:       input.lastName,
      email:          input.email,
      phone:          input.phone,
      birthDate:      input.birthDate,
      gender:         input.gender,
      city:           input.city,
      countryCode:    input.countryCode,
    });

    if (!result.ok) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err) {
    console.error("[createFan]", err);
    return { success: false, error: "No se pudo crear el fan." };
  }
}

export async function updateFan(input: UpdateFanInput): Promise<ActionResult> {
  try {
    const { org } = await getDashboardContext();

    await assertFanOwnership(org.id, input.id);

    if (isInvalidCountryCodeInput(input.countryCode)) {
      return {
        success: false,
        error: "El país debe ser un código ISO de 2 letras (ej. AR, MX).",
      };
    }

    const displayName = `${input.firstName} ${input.lastName}`.trim();
    const countryCode = normalizeCountryCode(input.countryCode);

    // Membership already asserted; update by fan id only (no legacy ownership column).
    await db
      .update(fans)
      .set({
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        email: input.email || null,
        phone: input.phone || null,
        birthDate: input.birthDate || null,
        gender: input.gender || null,
        city: input.city || null,
        countryCode,
        eepSyncStatus: "pending",
        updatedAt: new Date(),
      })
      .where(eq(fans.id, input.id));

    await enqueueFanEepJob(org.id, input.id, "update");

    return { success: true };
  } catch (err) {
    console.error("[updateFan]", err);
    return { success: false, error: "No se pudo actualizar el fan." };
  }
}

export async function suspendFan(fanId: string): Promise<ActionResult> {
  try {
    const { org } = await getDashboardContext();

    await assertFanOwnership(org.id, fanId);

    await db
      .update(fans)
      .set({ status: "suspended", eepSyncStatus: "pending", updatedAt: new Date() })
      .where(eq(fans.id, fanId));

    await enqueueFanEepJob(org.id, fanId, "update");

    return { success: true };
  } catch (err) {
    console.error("[suspendFan]", err);
    return { success: false, error: "No se pudo suspender el fan." };
  }
}

export async function reactivateFan(fanId: string): Promise<ActionResult> {
  try {
    const { org } = await getDashboardContext();

    await assertFanOwnership(org.id, fanId);

    await db
      .update(fans)
      .set({ status: "active", eepSyncStatus: "pending", updatedAt: new Date() })
      .where(eq(fans.id, fanId));

    await enqueueFanEepJob(org.id, fanId, "update");

    return { success: true };
  } catch (err) {
    console.error("[reactivateFan]", err);
    return { success: false, error: "No se pudo reactivar el fan." };
  }
}

export async function archiveFan(fanId: string): Promise<ActionResult> {
  try {
    const { org } = await getDashboardContext();

    await assertFanOwnership(org.id, fanId);

    await db
      .update(fans)
      .set({ status: "archived", eepSyncStatus: "pending", updatedAt: new Date() })
      .where(eq(fans.id, fanId));

    await enqueueFanEepJob(org.id, fanId, "delete");

    return { success: true };
  } catch (err) {
    console.error("[archiveFan]", err);
    return { success: false, error: "No se pudo archivar el fan." };
  }
}

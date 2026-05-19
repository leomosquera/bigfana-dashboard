"use server";

import { db } from "@/db";
import { fans } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDashboardContext } from "@/server/queries/session";
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
  country?: string;
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
  country?: string;
}

// ─── Result type ──────────────────────────────────────────────────────────────

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verifies the fan belongs to the current org before mutation.
 * Returns the fan row or throws if not found / wrong org.
 */
async function assertFanOwnership(
  organizationId: string,
  fanId: string,
): Promise<void> {
  const result = await db
    .select({ id: fans.id })
    .from(fans)
    .where(and(eq(fans.id, fanId), eq(fans.organizationId, organizationId)))
    .limit(1);

  if (!result[0]) {
    throw new Error("Fan not found or access denied");
  }
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
      country:        input.country,
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

    const displayName = `${input.firstName} ${input.lastName}`.trim();

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
        country: input.country || null,
        eepSyncStatus: "pending",
        updatedAt: new Date(),
      })
      .where(and(eq(fans.id, input.id), eq(fans.organizationId, org.id)));

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
      .where(and(eq(fans.id, fanId), eq(fans.organizationId, org.id)));

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
      .where(and(eq(fans.id, fanId), eq(fans.organizationId, org.id)));

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
      .where(and(eq(fans.id, fanId), eq(fans.organizationId, org.id)));

    await enqueueFanEepJob(org.id, fanId, "delete");

    return { success: true };
  } catch (err) {
    console.error("[archiveFan]", err);
    return { success: false, error: "No se pudo archivar el fan." };
  }
}

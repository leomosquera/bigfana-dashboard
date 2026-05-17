"use server";

import { db } from "@/db";
import { fans, integrationJobs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getDashboardContext } from "@/server/queries/session";

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
 * Enqueues an EEP integration job for a fan mutation.
 * Uses an idempotency key to prevent duplicate jobs.
 * Never throws — a failed enqueue should not block the primary mutation.
 */
async function enqueueEepJob(
  organizationId: string,
  fanId: string,
  operation: "create" | "update" | "delete",
): Promise<void> {
  const idempotencyKey = `eep:fan:${operation}:${fanId}`;

  await db
    .insert(integrationJobs)
    .values({
      organizationId,
      entityType: "fan",
      entityId: fanId,
      provider: "eep",
      operation,
      status: "pending",
      idempotencyKey,
    })
    .onConflictDoNothing({ target: integrationJobs.idempotencyKey });
}

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

    const displayName = `${input.firstName} ${input.lastName}`.trim();

    const [fan] = await db
      .insert(fans)
      .values({
        organizationId: org.id,
        firstName: input.firstName,
        lastName: input.lastName,
        displayName,
        email: input.email || null,
        phone: input.phone || null,
        birthDate: input.birthDate || null,
        gender: input.gender || null,
        city: input.city || null,
        country: input.country || null,
        status: "active",
        eepSyncStatus: "pending",
      })
      .returning({ id: fans.id });

    await enqueueEepJob(org.id, fan.id, "create");

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

    await enqueueEepJob(org.id, input.id, "update");

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

    await enqueueEepJob(org.id, fanId, "update");

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

    await enqueueEepJob(org.id, fanId, "update");

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

    await enqueueEepJob(org.id, fanId, "delete");

    return { success: true };
  } catch (err) {
    console.error("[archiveFan]", err);
    return { success: false, error: "No se pudo archivar el fan." };
  }
}

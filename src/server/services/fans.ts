/**
 * Organization-scoped fan mutations — shared by dashboard actions and public demo APIs.
 */

import { db } from "@/db";
import { fans, integrationJobs } from "@/db/schema";
import { getFanByEmail } from "@/server/queries/fans";
import { recomputeFanSegment } from "@/server/services/segmentation";

export interface CreateOrganizationFanInput {
  organizationId: string;
  firstName:      string;
  lastName:       string;
  email?:         string | null;
  phone?:         string | null;
  birthDate?:     string | null;
  gender?:        string | null;
  city?:          string | null;
  country?:       string | null;
}

export type CreateOrganizationFanErrorCode = "duplicate_email" | "validation";

export type CreateOrganizationFanResult =
  | { ok: true; fanId: string }
  | { ok: false; error: string; code: CreateOrganizationFanErrorCode };

/**
 * Enqueues an EEP integration job for a fan mutation.
 * Uses an idempotency key to prevent duplicate jobs.
 * Never throws — a failed enqueue should not block the primary mutation.
 */
export async function enqueueFanEepJob(
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
 * Creates a fan scoped to an organization, enqueues EEP sync, and recomputes segment.
 * Rejects duplicate email within the same org (case-insensitive).
 */
export async function createOrganizationFan(
  input: CreateOrganizationFanInput,
): Promise<CreateOrganizationFanResult> {
  const firstName = input.firstName.trim();
  const lastName  = input.lastName.trim();

  if (!firstName || !lastName) {
    return {
      ok:    false,
      code:  "validation",
      error: "Nombre y apellido son obligatorios.",
    };
  }

  const email =
    typeof input.email === "string" && input.email.trim()
      ? input.email.trim()
      : null;

  if (email) {
    const existing = await getFanByEmail(input.organizationId, email);
    if (existing) {
      return {
        ok:    false,
        code:  "duplicate_email",
        error: "Ya existe un fan con este email en el club.",
      };
    }
  }

  const displayName = `${firstName} ${lastName}`.trim();

  try {
    const [fan] = await db
      .insert(fans)
      .values({
        organizationId: input.organizationId,
        firstName,
        lastName,
        displayName,
        email,
        phone:     input.phone?.trim()     || null,
        birthDate: input.birthDate?.trim() || null,
        gender:    input.gender?.trim()    || null,
        city:      input.city?.trim()      || null,
        country:   input.country?.trim()   || null,
        status:        "active",
        eepSyncStatus: "pending",
      })
      .returning({ id: fans.id });

    await enqueueFanEepJob(input.organizationId, fan.id, "create");

    try {
      await recomputeFanSegment(input.organizationId, fan.id);
    } catch (segErr) {
      console.error("[createOrganizationFan] segment recompute:", segErr);
    }

    return { ok: true, fanId: fan.id };
  } catch (err) {
    console.error("[createOrganizationFan]", err);
    return {
      ok:    false,
      code:  "validation",
      error: "No se pudo crear el fan.",
    };
  }
}

/** Demo registration: approximate birth year from age (Jan 1). */
export function birthDateFromAge(age: number): string {
  const year = new Date().getFullYear() - age;
  return `${year}-01-01`;
}

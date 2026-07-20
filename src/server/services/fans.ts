/**
 * Organization-scoped fan mutations — shared by dashboard actions and public demo APIs.
 *
 * ADR-009 Phase F2: createOrganizationFan writes identity + PRIMARY fan_organizations
 * only. No compatibility projection onto fans.organization_id.
 */

import { db } from "@/db";
import { fans, fanOrganizations, integrationJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
import {
  isInvalidCountryCodeInput,
  normalizeCountryCode,
} from "@/lib/country-codes";
import { findFanByNormalizedEmail } from "@/server/queries/fans";
import { recomputeFanSegment } from "@/server/services/segmentation";

export interface CreateOrganizationFanInput {
  /**
   * Command/tenant context — organization in which the create executes.
   * Authoritative relationship is written to fan_organizations as PRIMARY.
   * Does NOT mean the fan entity "belongs to" this org as ownership SoT.
   * Does NOT write fans.organization_id (legacy column unmapped after Phase F2).
   */
  organizationId: string;
  firstName:      string;
  lastName:       string;
  email?:         string | null;
  phone?:         string | null;
  birthDate?:     string | null;
  gender?:        string | null;
  city?:          string | null;
  /** ISO 3166-1 alpha-2 or empty/null. Writes fans.country_code only. */
  countryCode?:   string | null;
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

function isUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; cause?: { code?: string } };
  return e.code === "23505" || e.cause?.code === "23505";
}

/**
 * Creates a global fan identity and a PRIMARY organization relationship (R04 / ADR-009).
 *
 * 1. Reject if normalized email already exists globally (no second fan, no auto-link).
 * 2. INSERT fans (identity only — no legacy organization_id projection).
 * 3. INSERT fan_organizations PRIMARY for organizationId (authoritative).
 * 4. Enqueue EEP sync and recompute segment.
 *
 * neon-http has no interactive transactions — if the relationship insert fails after
 * the fan insert, the fan row is deleted as best-effort cleanup.
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

  if (isInvalidCountryCodeInput(input.countryCode)) {
    return {
      ok:    false,
      code:  "validation",
      error: "El país debe ser un código ISO de 2 letras (ej. AR, MX).",
    };
  }

  const countryCode = normalizeCountryCode(input.countryCode);

  const email =
    typeof input.email === "string" && input.email.trim()
      ? input.email.trim()
      : null;

  // R04 Option A — global identity uniqueness (includes archived)
  if (email) {
    const existing = await findFanByNormalizedEmail(email);
    if (existing) {
      return {
        ok:    false,
        code:  "duplicate_email",
        error: "Ya existe un fan con este email en la plataforma.",
      };
    }
  }

  const displayName = `${firstName} ${lastName}`.trim();
  const now = new Date();

  try {
    // Global fan identity only — relationship SoT is fan_organizations below
    const [fan] = await db
      .insert(fans)
      .values({
        firstName,
        lastName,
        displayName,
        email,
        phone:       input.phone?.trim()     || null,
        birthDate:   input.birthDate?.trim() || null,
        gender:      input.gender?.trim()    || null,
        city:        input.city?.trim()      || null,
        countryCode,
        status:        "active",
        eepSyncStatus: "pending",
      })
      .returning({ id: fans.id });

    try {
      // Authoritative PRIMARY relationship (ADR-001 / ADR-002 / ADR-009)
      await db.insert(fanOrganizations).values({
        fanId:            fan.id,
        organizationId:   input.organizationId,
        relationshipType: "PRIMARY",
        isPrimary:        true,
        joinedAt:         now,
      });
    } catch (relErr) {
      console.error("[createOrganizationFan] fan_organizations insert:", relErr);
      // Best-effort cleanup — avoid orphan identity without PRIMARY
      try {
        await db.delete(fans).where(eq(fans.id, fan.id));
      } catch (cleanupErr) {
        console.error("[createOrganizationFan] cleanup after FO failure:", cleanupErr);
      }
      return {
        ok:    false,
        code:  "validation",
        error: "No se pudo crear el fan.",
      };
    }

    await enqueueFanEepJob(input.organizationId, fan.id, "create");

    try {
      await recomputeFanSegment(input.organizationId, fan.id);
    } catch (segErr) {
      console.error("[createOrganizationFan] segment recompute:", segErr);
    }

    return { ok: true, fanId: fan.id };
  } catch (err) {
    console.error("[createOrganizationFan]", err);
    if (isUniqueViolation(err)) {
      return {
        ok:    false,
        code:  "duplicate_email",
        error: "Ya existe un fan con este email en la plataforma.",
      };
    }
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

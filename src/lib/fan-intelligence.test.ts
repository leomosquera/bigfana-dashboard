/**
 * Pure Fan Intelligence helpers.
 * Run: npx tsx --test src/lib/fan-intelligence.test.ts
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildFanActivitySummary,
  canAccessFan360,
  collectCountryFilterOptions,
  collectSegmentFilterOptions,
  filterFanIntelligenceRows,
  getEepSyncStatusLabel,
  getLocalSegmentLabel,
  isLoyaltyEligible,
  isPrimaryRelationship,
  matchesFanIntelligenceFilters,
  mergeLastActivityAt,
  normalizeRelationshipType,
  resolveFanCountryLabel,
  UNCLASSIFIED_SEGMENT_FILTER,
  UNCLASSIFIED_SEGMENT_LABEL,
} from "./fan-intelligence";

const here = dirname(fileURLToPath(import.meta.url));

const baseRow = {
  status: "active" as const,
  segment: "VIP",
  countryCode: "AR",
  eepSyncStatus: "synced" as const,
  displayName: "Ana Fan",
  email: "ana@example.com",
  firstName: "Ana",
  lastName: "Fan",
};

describe("PRIMARY vs FOLLOWING access / loyalty", () => {
  it("allows Fan 360 for PRIMARY and FOLLOWING only", () => {
    assert.equal(canAccessFan360("PRIMARY"), true);
    assert.equal(canAccessFan360("FOLLOWING"), true);
    assert.equal(canAccessFan360(null), false);
    assert.equal(canAccessFan360(undefined), false);
  });

  it("loyalty eligibility is PRIMARY-only", () => {
    assert.equal(isLoyaltyEligible("PRIMARY"), true);
    assert.equal(isLoyaltyEligible("FOLLOWING"), false);
    assert.equal(isPrimaryRelationship("FOLLOWING"), false);
  });

  it("FOLLOWING loyalty state does not imply PRIMARY loyalty semantics", () => {
    assert.equal(isLoyaltyEligible("FOLLOWING"), false);
    assert.equal(normalizeRelationshipType("FOLLOWING", false), "FOLLOWING");
    assert.equal(normalizeRelationshipType("FOLLOWING", true), "PRIMARY");
  });
});

describe("normalizeRelationshipType", () => {
  it("maps is_primary / relationship_type to PRIMARY | FOLLOWING", () => {
    assert.equal(normalizeRelationshipType("PRIMARY", true), "PRIMARY");
    assert.equal(normalizeRelationshipType("FOLLOWING", true), "PRIMARY");
    assert.equal(normalizeRelationshipType("FOLLOWING", false), "FOLLOWING");
    assert.equal(normalizeRelationshipType("PRIMARY", false), "PRIMARY");
  });
});

describe("last activity merge", () => {
  it("merges lastActivityAt without inventing timestamps", () => {
    const at = new Date("2026-07-01T12:00:00.000Z");
    const map = new Map([["fan-1", at]]);
    const rows = mergeLastActivityAt(
      [{ id: "fan-1" }, { id: "fan-2" }],
      map,
    );
    assert.equal(rows[0].lastActivityAt?.toISOString(), at.toISOString());
    assert.equal(rows[1].lastActivityAt, null);
  });
});

describe("buildFanActivitySummary", () => {
  it("derives honest summary from behavioral + velocity", () => {
    const last = new Date("2026-07-10T10:00:00.000Z");
    const summary = buildFanActivitySummary(
      {
        totalEvents: 12,
        topEventTypes: [
          { eventType: "match_attended" },
          { eventType: "login" },
        ],
        lastEventAt: last,
      },
      { events30d: 7 },
    );
    assert.equal(summary.totalInteractions, 12);
    assert.equal(summary.interactionsLast30d, 7);
    assert.equal(summary.mostFrequentEventType, "match_attended");
    assert.equal(summary.lastActivityAt?.toISOString(), last.toISOString());
  });

  it("handles empty activity without inventing values", () => {
    const summary = buildFanActivitySummary(
      { totalEvents: 0, topEventTypes: [], lastEventAt: null },
      { events30d: 0 },
    );
    assert.equal(summary.totalInteractions, 0);
    assert.equal(summary.interactionsLast30d, 0);
    assert.equal(summary.mostFrequentEventType, null);
    assert.equal(summary.lastActivityAt, null);
  });
});

describe("country / segment labels", () => {
  it("resolves countryCode via getCountryLabel and handles null", () => {
    assert.equal(resolveFanCountryLabel(null), null);
    assert.equal(resolveFanCountryLabel(undefined), null);
    const label = resolveFanCountryLabel("AR");
    assert.ok(label === null || typeof label === "string");
    if (label) assert.match(label, /Argentina|AR/i);
  });

  it("local segment empty → Sin clasificar", () => {
    assert.equal(getLocalSegmentLabel(null), UNCLASSIFIED_SEGMENT_LABEL);
    assert.equal(getLocalSegmentLabel("  "), UNCLASSIFIED_SEGMENT_LABEL);
    assert.equal(getLocalSegmentLabel("Core"), "Core");
  });
});

describe("EEP status derivation", () => {
  it("uses approved vocabulary and honest empty label", () => {
    assert.equal(getEepSyncStatusLabel("pending"), "Pendiente");
    assert.equal(getEepSyncStatusLabel("synced"), "Sincronizado");
    assert.equal(getEepSyncStatusLabel("failed"), "Error");
    assert.equal(getEepSyncStatusLabel("retrying"), "Reintentando");
    assert.equal(getEepSyncStatusLabel(null), "Sin sincronizar");
  });
});

describe("list filters / PRIMARY list isolation contract", () => {
  it("combines status, segment, country, and EEP filters", () => {
    const rows = [
      baseRow,
      {
        ...baseRow,
        status: "suspended" as const,
        segment: null,
        countryCode: "UY",
        eepSyncStatus: "failed" as const,
        displayName: "Bob",
      },
    ];

    assert.equal(
      filterFanIntelligenceRows(rows, { status: "active" }).length,
      1,
    );
    assert.equal(
      filterFanIntelligenceRows(rows, {
        segment: UNCLASSIFIED_SEGMENT_FILTER,
      }).length,
      1,
    );
    assert.equal(
      filterFanIntelligenceRows(rows, { countryCode: "AR" }).length,
      1,
    );
    assert.equal(
      filterFanIntelligenceRows(rows, { eepSyncStatus: "failed" }).length,
      1,
    );
    assert.equal(
      matchesFanIntelligenceFilters(baseRow, {
        status: "active",
        segment: "VIP",
        countryCode: "AR",
        eepSyncStatus: "synced",
      }),
      true,
    );
  });

  it("builds segment and country filter options including unclassified", () => {
    const segments = collectSegmentFilterOptions([
      { segment: "VIP" },
      { segment: null },
      { segment: "VIP" },
    ]);
    assert.ok(
      segments.some((o) => o.value === UNCLASSIFIED_SEGMENT_FILTER),
    );
    assert.ok(segments.some((o) => o.value === "VIP"));

    const countries = collectCountryFilterOptions([
      { countryCode: "AR" },
      { countryCode: null },
      { countryCode: "ar" },
    ]);
    assert.equal(countries.length, 1);
    assert.equal(countries[0].value, "AR");
  });

  it("documents CRM list = PRIMARY; Fan 360 = ANY; campaigns = org+fan scoped", () => {
    // getFansIntelligenceList → getFansByOrg → listFansForOrganization(..., "primary")
    // getFan360Profile → hasFanOrgMembership(..., "any")
    // getFanCampaignHistory(organizationId, fanId) filters both columns
    assert.equal(canAccessFan360("PRIMARY"), true);
    assert.equal(canAccessFan360("FOLLOWING"), true);
    assert.equal(canAccessFan360(null), false);
  });
});

describe("Fan Intelligence source contracts", () => {
  it("query modules stay org-scoped and avoid legacy geography/ownership columns", () => {
    const roots = [
      resolve(here, "../server/queries/fan-intelligence.ts"),
      resolve(here, "../server/queries/fan-campaigns.ts"),
    ];

    for (const path of roots) {
      const code = readFileSync(path, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");

      assert.equal(
        /fans\.organizationId|fans\.organization_id/.test(code),
        false,
        `${path} must not read legacy fans.organization_id`,
      );
      assert.equal(
        /fans\.country(?!Code)/.test(code),
        false,
        `${path} must not read legacy fans.country`,
      );
    }

    const listSource = readFileSync(
      resolve(here, "../server/queries/fan-intelligence.ts"),
      "utf8",
    );
    assert.match(listSource, /getFansByOrg/);
    assert.match(listSource, /hasFanOrgMembership\(fanId, organizationId, "any"\)/);

    const campaignSource = readFileSync(
      resolve(here, "../server/queries/fan-campaigns.ts"),
      "utf8",
    );
    assert.match(
      campaignSource,
      /eq\(campaignResponses\.organizationId, organizationId\)/,
    );
    assert.match(
      campaignSource,
      /eq\(campaignResponses\.fanId, fanId\)/,
    );
  });
});

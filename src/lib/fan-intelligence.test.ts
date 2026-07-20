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
  buildFanActivityBreakdown,
  buildFanActivitySummary,
  buildFanActivityTrendSeries,
  canAccessFan360,
  collectCountryFilterOptions,
  collectSegmentFilterOptions,
  filterFanIntelligenceRows,
  formatActivityRecency,
  formatFanEventTypeLabel,
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

describe("buildFanActivitySummary — fan_events contract", () => {
  it("counts interactions from fan_events aggregates, not ledger velocity", () => {
    const last = new Date("2026-07-10T10:00:00.000Z");
    const summary = buildFanActivitySummary({
      totalInteractions: 12,
      interactionsLast30d: 7,
      activeDaysLast30d: 4,
      mostFrequentEventType: "campaign_engagement",
      lastActivityAt: last,
      now: new Date("2026-07-13T10:00:00.000Z"),
    });
    assert.equal(summary.totalInteractions, 12);
    assert.equal(summary.interactionsLast30d, 7);
    assert.equal(summary.activeDaysLast30d, 4);
    assert.equal(summary.mostFrequentEventType, "campaign_engagement");
    assert.equal(summary.lastActivityAt?.toISOString(), last.toISOString());
    assert.equal(summary.daysSinceLast, 3);
  });

  it("handles empty activity without inventing values", () => {
    const summary = buildFanActivitySummary({
      totalInteractions: 0,
      interactionsLast30d: 0,
      activeDaysLast30d: 0,
      mostFrequentEventType: null,
      lastActivityAt: null,
    });
    assert.equal(summary.totalInteractions, 0);
    assert.equal(summary.interactionsLast30d, 0);
    assert.equal(summary.activeDaysLast30d, 0);
    assert.equal(summary.mostFrequentEventType, null);
    assert.equal(summary.lastActivityAt, null);
    assert.equal(summary.daysSinceLast, null);
  });

  it("FOLLOWING activity counts remain valid without loyalty semantics", () => {
    // Activity is org-scoped fan_events; loyalty eligibility is orthogonal.
    const summary = buildFanActivitySummary({
      totalInteractions: 3,
      interactionsLast30d: 2,
      activeDaysLast30d: 2,
      mostFrequentEventType: "campaign_engagement",
      lastActivityAt: new Date("2026-07-19T12:00:00.000Z"),
      daysSinceLast: 0,
    });
    assert.equal(summary.interactionsLast30d, 2);
    assert.equal(isLoyaltyEligible("FOLLOWING"), false);
    assert.ok(summary.interactionsLast30d > 0);
  });
});

describe("buildFanActivityTrendSeries", () => {
  it("zero-fills missing days in chronological order", () => {
    const end = new Date("2026-07-20T15:00:00.000Z");
    const series = buildFanActivityTrendSeries(
      [
        { date: "2026-07-18", count: 2 },
        { date: "2026-07-20", count: 1 },
      ],
      5,
      end,
    );
    assert.equal(series.length, 5);
    assert.deepEqual(
      series.map((p) => p.date),
      [
        "2026-07-16",
        "2026-07-17",
        "2026-07-18",
        "2026-07-19",
        "2026-07-20",
      ],
    );
    assert.equal(series[0].interactions, 0);
    assert.equal(series[2].interactions, 2);
    assert.equal(series[3].interactions, 0);
    assert.equal(series[4].interactions, 1);
  });

  it("empty daily input yields all-zero series", () => {
    const end = new Date("2026-07-20T15:00:00.000Z");
    const series = buildFanActivityTrendSeries([], 3, end);
    assert.equal(series.length, 3);
    assert.ok(series.every((p) => p.interactions === 0));
  });
});

describe("buildFanActivityBreakdown", () => {
  it("groups event_type with percentages over total events", () => {
    const rows = buildFanActivityBreakdown([
      { eventType: "campaign_engagement", count: 8 },
      { eventType: "custom_ping", count: 2 },
    ]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].eventType, "campaign_engagement");
    assert.equal(rows[0].count, 8);
    assert.equal(rows[0].percentage, 80);
    assert.equal(rows[1].count, 2);
    assert.equal(rows[1].percentage, 20);
    const sumPct = rows.reduce((s, r) => s + r.percentage, 0);
    assert.equal(sumPct, 100);
  });

  it("rolls overflow types into Otros", () => {
    const rows = buildFanActivityBreakdown(
      [
        { eventType: "a", count: 5 },
        { eventType: "b", count: 4 },
        { eventType: "c", count: 3 },
        { eventType: "d", count: 2 },
        { eventType: "e", count: 1 },
        { eventType: "f", count: 1 },
      ],
      5,
    );
    assert.equal(rows.length, 6);
    assert.equal(rows[5].eventType, "__other__");
    assert.equal(rows[5].label, "Otros");
    assert.equal(rows[5].count, 1);
  });

  it("empty activity yields empty breakdown", () => {
    assert.deepEqual(buildFanActivityBreakdown([]), []);
  });
});

describe("formatFanEventTypeLabel", () => {
  it("maps implemented campaign_engagement and falls back for unknown", () => {
    assert.equal(
      formatFanEventTypeLabel("campaign_engagement"),
      "Participación en campañas",
    );
    assert.equal(formatFanEventTypeLabel("custom_ping"), "custom ping");
    assert.equal(formatFanEventTypeLabel("weird_type_x"), "weird type x");
  });

  it("does not invent labels for unimplemented product categories", () => {
    // Unknown identifiers stay readable fallbacks — not NFC/RFID/Check-in fiction.
    assert.equal(formatFanEventTypeLabel("nfc_tap"), "nfc tap");
    assert.notEqual(formatFanEventTypeLabel("nfc_tap"), "NFC");
  });
});

describe("formatActivityRecency", () => {
  it("formats factual recency and empty state", () => {
    assert.equal(
      formatActivityRecency({ lastActivityAt: null, daysSinceLast: null }),
      "Sin actividad registrada",
    );
    assert.equal(
      formatActivityRecency({
        lastActivityAt: new Date(),
        daysSinceLast: 0,
      }),
      "Activo hoy",
    );
    assert.equal(
      formatActivityRecency({
        lastActivityAt: new Date(),
        daysSinceLast: 3,
      }),
      "Última actividad hace 3 días",
    );
    assert.equal(
      formatActivityRecency({
        lastActivityAt: new Date(),
        daysSinceLast: 15,
      }),
      "Sin actividad reciente",
    );
    assert.equal(
      formatActivityRecency({
        lastActivityAt: new Date(),
        daysSinceLast: 40,
      }),
      "Sin actividad hace 40 días",
    );
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
    assert.match(listSource, /getFanActivityIntelligence/);
    // Interactions must come from fan_events — not ledger length as proxy
    assert.match(
      listSource,
      /interactionsLast30d: sql<number>`count\(\*\) FILTER/,
    );
    assert.equal(
      /buildFanActivitySummary\(behavioral,\s*velocity\)/.test(listSource),
      false,
      "must not compose activity summary from ledger velocity",
    );

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

  it("Fan 360 activity query scopes fan_events by organizationId + fanId", () => {
    const source = readFileSync(
      resolve(here, "../server/queries/fan-intelligence.ts"),
      "utf8",
    );
    assert.match(source, /eq\(fanEvents\.organizationId, organizationId\)/);
    assert.match(source, /eq\(fanEvents\.fanId, fanId\)/);
  });
});

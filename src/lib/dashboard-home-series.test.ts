/**
 * Pure series / geography / integration transforms for Dashboard Home.
 * Run: npx tsx --test src/lib/dashboard-home-series.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildActivitySeries,
  buildDateKeys,
  buildFanGrowthSeries,
  buildGeographySummary,
  buildIntegrationHealth,
} from "./dashboard-home-series";

describe("dashboard-home series transforms", () => {
  const end = new Date("2026-07-20T15:00:00.000Z");

  it("buildDateKeys returns continuous UTC days of requested length", () => {
    const keys = buildDateKeys(3, end);
    assert.deepEqual(keys, ["2026-07-18", "2026-07-19", "2026-07-20"]);
  });

  it("buildFanGrowthSeries zero-fills missing days and starts from baseBeforeWindow", () => {
    const series = buildFanGrowthSeries(
      [
        { date: "2026-07-19", count: 2 },
        { date: "2026-07-20", count: 1 },
      ],
      10,
      3,
      end,
    );

    assert.equal(series.length, 3);
    assert.deepEqual(series[0], {
      date: "2026-07-18",
      newFans: 0,
      cumulativeFans: 10,
    });
    assert.deepEqual(series[1], {
      date: "2026-07-19",
      newFans: 2,
      cumulativeFans: 12,
    });
    assert.deepEqual(series[2], {
      date: "2026-07-20",
      newFans: 1,
      cumulativeFans: 13,
    });
  });

  it("buildFanGrowthSeries does not start at zero when base exists", () => {
    const series = buildFanGrowthSeries([], 7, 2, end);
    assert.equal(series[0].cumulativeFans, 7);
    assert.equal(series[1].cumulativeFans, 7);
  });

  it("buildActivitySeries zero-fills missing days", () => {
    const series = buildActivitySeries(
      [{ date: "2026-07-20", interactions: 5, engagedFans: 3 }],
      3,
      end,
    );
    assert.equal(series.length, 3);
    assert.deepEqual(series[0], {
      date: "2026-07-18",
      interactions: 0,
      engagedFans: 0,
    });
    assert.deepEqual(series[2], {
      date: "2026-07-20",
      interactions: 5,
      engagedFans: 3,
    });
  });

  it("buildGeographySummary percentages use known denominator only", () => {
    const summary = buildGeographySummary(
      [
        { countryCode: "AR", fanCount: 4 },
        { countryCode: "MX", fanCount: 1 },
        { countryCode: null, fanCount: 3 },
      ],
      (code) => (code === "AR" ? "Argentina" : code === "MX" ? "México" : code),
      5,
    );

    assert.equal(summary.knownGeographyCount, 5);
    assert.equal(summary.unknownGeographyCount, 3);
    assert.equal(summary.totalFans, 8);
    assert.equal(summary.countries[0].countryCode, "AR");
    assert.equal(summary.countries[0].percentage, 80);
    assert.equal(summary.countries[1].percentage, 20);
  });

  it("buildIntegrationHealth flags failed/retrying as requires_attention", () => {
    const health = buildIntegrationHealth([
      { status: "synced", count: 4 },
      { status: "failed", count: 1 },
    ]);
    assert.equal(health.attention, "requires_attention");
    assert.equal(health.total, 5);
    assert.equal(health.byStatus.failed, 1);
  });

  it("buildIntegrationHealth returns no_jobs when empty", () => {
    assert.equal(buildIntegrationHealth([]).attention, "no_jobs");
  });

  it("buildIntegrationHealth treats pending-only backlog as pending (not operational)", () => {
    const health = buildIntegrationHealth([{ status: "pending", count: 8 }]);
    assert.equal(health.attention, "pending");
    assert.equal(health.byStatus.pending, 8);
    assert.equal(health.total, 8);
  });

  it("buildIntegrationHealth prefers processing over pending", () => {
    const health = buildIntegrationHealth([
      { status: "pending", count: 3 },
      { status: "processing", count: 1 },
    ]);
    assert.equal(health.attention, "processing");
  });

  it("buildIntegrationHealth prefers attention over processing/pending", () => {
    const health = buildIntegrationHealth([
      { status: "pending", count: 2 },
      { status: "processing", count: 1 },
      { status: "retrying", count: 1 },
    ]);
    assert.equal(health.attention, "requires_attention");
  });

  it("buildIntegrationHealth is operational only when jobs exist without backlog/errors", () => {
    const health = buildIntegrationHealth([{ status: "synced", count: 5 }]);
    assert.equal(health.attention, "operational");
  });
});


/**
 * Pure helper tests for Dashboard Home formatting/name resolution.
 * Run: npx tsx --test src/server/queries/dashboard-home.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatEventTypeLabel,
  formatRelativeTimeEs,
  resolveFanDisplayName,
} from "../../lib/dashboard-home-format";

describe("dashboard-home pure helpers", () => {
  it("resolveFanDisplayName prefers displayName", () => {
    assert.equal(
      resolveFanDisplayName({
        displayName: "  Juan P.  ",
        firstName: "Juan",
        lastName: "Pérez",
      }),
      "Juan P.",
    );
  });

  it("resolveFanDisplayName falls back to first + last name", () => {
    assert.equal(
      resolveFanDisplayName({
        displayName: null,
        firstName: "María",
        lastName: "López",
      }),
      "María López",
    );
  });

  it("resolveFanDisplayName returns null when no identity fields", () => {
    assert.equal(
      resolveFanDisplayName({
        displayName: "   ",
        firstName: null,
        lastName: null,
      }),
      null,
    );
  });

  it("formatEventTypeLabel replaces underscores without inventing copy", () => {
    assert.equal(formatEventTypeLabel("trivia_completed"), "trivia completed");
    assert.equal(formatEventTypeLabel("match_attended"), "match attended");
    assert.equal(formatEventTypeLabel("login"), "login");
  });

  it("formatRelativeTimeEs returns Spanish relative wording for recent times", () => {
    const now = new Date("2026-07-20T12:00:00.000Z");
    const fiveMinAgo = new Date("2026-07-20T11:55:00.000Z");
    const label = formatRelativeTimeEs(fiveMinAgo, now);
    assert.match(label, /minuto/i);
  });
});

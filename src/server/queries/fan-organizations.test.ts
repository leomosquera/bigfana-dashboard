/**
 * Focused semantic tests for ADR-009 Phase B membership primitives.
 * Run: npx tsx --test src/server/queries/fan-organizations.test.ts
 *
 * Pure predicate tests only — no Neon / no runtime caller migration.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fanOrgRowMatchesMembership,
  fanOrgRowMatchesScope,
} from "./fan-org-membership";

const here = dirname(fileURLToPath(import.meta.url));

const ORG_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const FAN_1 = "11111111-1111-1111-1111-111111111111";

describe("fan_organizations membership semantics (ADR-009 Phase B)", () => {
  const primaryInA = {
    fanId: FAN_1,
    organizationId: ORG_A,
    isPrimary: true,
  };

  const followingInA = {
    fanId: FAN_1,
    organizationId: ORG_A,
    isPrimary: false,
  };

  const primaryInB = {
    fanId: FAN_1,
    organizationId: ORG_B,
    isPrimary: true,
  };

  it("PRIMARY membership returns true for canonical primary relation", () => {
    assert.equal(
      fanOrgRowMatchesMembership(primaryInA, FAN_1, ORG_A, "primary"),
      true,
    );
    assert.equal(fanOrgRowMatchesScope(primaryInA, "primary"), true);
  });

  it("FOLLOWING membership satisfies ANY membership", () => {
    assert.equal(
      fanOrgRowMatchesMembership(followingInA, FAN_1, ORG_A, "any"),
      true,
    );
    assert.equal(fanOrgRowMatchesScope(followingInA, "any"), true);
  });

  it("FOLLOWING membership does not satisfy PRIMARY membership", () => {
    assert.equal(
      fanOrgRowMatchesMembership(followingInA, FAN_1, ORG_A, "primary"),
      false,
    );
    assert.equal(fanOrgRowMatchesScope(followingInA, "primary"), false);
  });

  it("cross-organization membership returns false", () => {
    assert.equal(
      fanOrgRowMatchesMembership(primaryInA, FAN_1, ORG_B, "any"),
      false,
    );
    assert.equal(
      fanOrgRowMatchesMembership(primaryInA, FAN_1, ORG_B, "primary"),
      false,
    );
    assert.equal(
      fanOrgRowMatchesMembership(primaryInB, FAN_1, ORG_A, "primary"),
      false,
    );
  });

  it("getPrimaryOrganization semantics: only isPrimary identifies PRIMARY", () => {
    assert.equal(fanOrgRowMatchesScope(primaryInA, "primary"), true);
    assert.equal(fanOrgRowMatchesScope(followingInA, "primary"), false);
  });

  it("missing PRIMARY is explicit (false / no match)", () => {
    assert.equal(
      fanOrgRowMatchesMembership(followingInA, FAN_1, ORG_A, "primary"),
      false,
    );
  });

  it("listFansForOrganization can distinguish ANY vs PRIMARY via scope", () => {
    const rows = [primaryInA, followingInA];
    const anyMatches = rows.filter((r) =>
      fanOrgRowMatchesMembership(r, r.fanId, ORG_A, "any"),
    );
    const primaryMatches = rows.filter((r) =>
      fanOrgRowMatchesMembership(r, r.fanId, ORG_A, "primary"),
    );
    assert.equal(anyMatches.length, 2);
    assert.equal(primaryMatches.length, 1);
    assert.equal(primaryMatches[0]?.isPrimary, true);
  });

  it("helper modules do not query the deprecated legacy ownership column", () => {
    for (const name of ["fan-organizations.ts", "fan-org-membership.ts"]) {
      const source = readFileSync(resolve(here, name), "utf8");
      // Strip comments so docs mentioning the legacy column do not false-positive.
      const code = source
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\/\/.*$/gm, "");
      assert.equal(
        /fans\.organizationId/.test(code),
        false,
        `${name} must not read fans.organizationId`,
      );
      assert.equal(
        /fans\.organization_id/.test(code),
        false,
        `${name} must not read fans.organization_id`,
      );
    }
  });
});

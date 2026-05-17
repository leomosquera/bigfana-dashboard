import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";

/**
 * Gamification v1 migration.
 *
 * Creates:
 *   - fan_points_ledger  (immutable append-only points economy table)
 *   - fan_levels         (per-org configurable level tier table)
 *
 * Seeds default level tiers for every existing organization that has no levels.
 *
 * Idempotent: all steps check before applying.
 */

const DEFAULT_LEVELS = [
  { name: "Hincha",     minPoints: 0,    color: "#8888AA", sortOrder: 1 },
  { name: "Fanático",   minPoints: 100,  color: "#3B82F6", sortOrder: 2 },
  { name: "Embajador",  minPoints: 500,  color: "#C97B2E", sortOrder: 3 },
  { name: "Leyenda",    minPoints: 2000, color: "#FF2D55", sortOrder: 4 },
];

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Running gamification v1 migration...\n");

  // ── 1. fan_points_ledger ─────────────────────────────────────────────────
  console.log("1. Creating fan_points_ledger table...");
  await sql`
    CREATE TABLE IF NOT EXISTS fan_points_ledger (
      id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id  uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      fan_id           uuid        NOT NULL REFERENCES fans(id) ON DELETE RESTRICT,
      fan_event_id     uuid        REFERENCES fan_events(id) ON DELETE SET NULL,

      points           integer     NOT NULL,
      balance_after    integer     NOT NULL,

      event_type       text        NOT NULL,
      source           text        NOT NULL DEFAULT 'system',
      reason           text        NOT NULL,
      metadata         jsonb,
      awarded_by       uuid,

      created_at       timestamptz NOT NULL DEFAULT now()
    )
  `;

  console.log("   Creating fan_points_ledger indexes...");
  await sql`
    CREATE INDEX IF NOT EXISTS fan_points_ledger_fan_idx
      ON fan_points_ledger (fan_id, created_at)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS fan_points_ledger_org_idx
      ON fan_points_ledger (organization_id, created_at)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS fan_points_ledger_org_type_idx
      ON fan_points_ledger (organization_id, event_type)
  `;

  // ── 2. fan_levels ────────────────────────────────────────────────────────
  console.log("\n2. Creating fan_levels table...");
  await sql`
    CREATE TABLE IF NOT EXISTS fan_levels (
      id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id  uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name             text        NOT NULL,
      min_points       integer     NOT NULL DEFAULT 0,
      color            text,
      sort_order       integer     NOT NULL DEFAULT 0,
      created_at       timestamptz NOT NULL DEFAULT now(),
      updated_at       timestamptz NOT NULL DEFAULT now()
    )
  `;

  console.log("   Creating fan_levels indexes...");
  await sql`
    CREATE INDEX IF NOT EXISTS fan_levels_org_points_idx
      ON fan_levels (organization_id, min_points)
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS fan_levels_org_name_idx
      ON fan_levels (organization_id, name)
  `;

  // ── 3. Seed default levels for existing orgs that have none ─────────────
  console.log("\n3. Seeding default fan levels for organizations...");

  const orgs = await sql`
    SELECT o.id, o.name
    FROM organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM fan_levels fl WHERE fl.organization_id = o.id
    )
  `;

  if (orgs.length === 0) {
    console.log("   All organizations already have fan levels — skipping seed.");
  } else {
    for (const org of orgs) {
      console.log(`   Seeding levels for: ${org.name} (${org.id})`);
      for (const level of DEFAULT_LEVELS) {
        await sql`
          INSERT INTO fan_levels (organization_id, name, min_points, color, sort_order)
          VALUES (${org.id}, ${level.name}, ${level.minPoints}, ${level.color}, ${level.sortOrder})
          ON CONFLICT (organization_id, name) DO NOTHING
        `;
      }
    }
    console.log(`   Seeded ${DEFAULT_LEVELS.length} levels for ${orgs.length} organization(s).`);
  }

  // ── 4. Verify ────────────────────────────────────────────────────────────
  console.log("\n4. Verification...");

  const [ledgerInfo] = await sql`
    SELECT COUNT(*) AS row_count
    FROM fan_points_ledger
  `;
  console.log(`   fan_points_ledger: exists, ${ledgerInfo.row_count} rows`);

  const levels = await sql`
    SELECT o.name AS org_name, fl.name AS level_name, fl.min_points, fl.color
    FROM fan_levels fl
    JOIN organizations o ON o.id = fl.organization_id
    ORDER BY o.name, fl.sort_order
  `;
  console.log(`   fan_levels: exists, ${levels.length} total rows`);
  levels.forEach((l) => {
    console.log(`     [${l.org_name}] ${l.level_name.padEnd(12)} ${l.min_points}+ pts  ${l.color ?? ""}`);
  });

  console.log("\nGamification v1 migration complete.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

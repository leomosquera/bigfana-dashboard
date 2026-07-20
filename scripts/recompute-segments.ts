import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";

/**
 * Batch-recomputes fan segments for all organizations using raw SQL.
 *
 * Segment rule evaluation logic mirrors segmentation.ts:
 *   - Rules ordered by priority DESC (highest wins first)
 *   - Conditions evaluated with AND logic
 *   - First matching rule sets fans.segment
 *   - No match → fans.segment = null
 *
 * Run after:
 *   - Initial EIL migration (migrate-eil-v1.ts)
 *   - Changing segment rule conditions
 *   - Importing fan event or points data
 */

interface SegmentConditions {
  minScore?:              number;
  maxScore?:              number;
  levelNames?:            string[];
  minEventsTotal?:        number;
  minEventsLast30d?:      number;
  minEventsLast90d?:      number;
  requiredEventTypes?:    string[];
  maxDaysSinceLastEvent?: number;
  fanStatuses?:           string[];
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Recomputing fan segments for all organizations...\n");

  const orgs = await sql`SELECT id, name FROM organizations ORDER BY name`;

  for (const org of orgs) {
    console.log(`\n[${org.name}]`);

    // Load all active segment rules for this org ordered by priority DESC
    const rules = await sql`
      SELECT id, name, conditions, priority
      FROM fan_segment_rules
      WHERE organization_id = ${org.id} AND is_active = true
      ORDER BY priority DESC
    `;

    // Load all levels for this org ordered by min_points ASC
    const levels = await sql`
      SELECT name, min_points
      FROM fan_levels
      WHERE organization_id = ${org.id}
      ORDER BY min_points ASC
    `;

    // Load non-archived PRIMARY fans via fan_organizations (ADR-009 / R05)
    const orgFans = await sql`
      SELECT f.id, f.engagement_score, f.status, f.segment
      FROM fan_organizations fo
      INNER JOIN fans f ON f.id = fo.fan_id
      WHERE fo.organization_id = ${org.id}
        AND fo.is_primary = TRUE
        AND f.status != 'archived'
    `;

    console.log(`  ${orgFans.length} fans to process, ${rules.length} active rules`);

    // Load event summary per fan (total count, last date, 30d count, 90d count, types)
    const eventSummaries = await sql`
      SELECT
        fan_id,
        COUNT(*)                                           AS total_events,
        MAX(occurred_at)                                   AS last_event_at,
        COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '30 days') AS events_30d,
        COUNT(*) FILTER (WHERE occurred_at >= NOW() - INTERVAL '90 days') AS events_90d,
        ARRAY_AGG(DISTINCT event_type)                     AS event_types
      FROM fan_events
      WHERE organization_id = ${org.id}
      GROUP BY fan_id
    `;

    const eventMap = new Map<string, typeof eventSummaries[0]>();
    for (const row of eventSummaries) {
      eventMap.set(row.fan_id as string, row);
    }

    let changed  = 0;
    let errors   = 0;

    for (const fan of orgFans) {
      try {
        // Compute level name
        let levelName: string | null = null;
        for (const level of levels) {
          if ((fan.engagement_score as number) >= (level.min_points as number)) {
            levelName = level.name as string;
          }
        }

        const eventData = eventMap.get(fan.id as string);
        const totalEvents  = Number(eventData?.total_events  ?? 0);
        const events30d    = Number(eventData?.events_30d    ?? 0);
        const events90d    = Number(eventData?.events_90d    ?? 0);
        const lastEventAt  = eventData?.last_event_at ? new Date(eventData.last_event_at as string) : null;
        const eventTypes   = new Set<string>(
          (eventData?.event_types as string[] | null) ?? [],
        );

        const fanStatus    = fan.status as string;
        const score        = fan.engagement_score as number;

        // Evaluate rules
        let matchedSegment: string | null = null;
        for (const rule of rules) {
          const cond = rule.conditions as SegmentConditions;

          if (cond.minScore !== undefined && score < cond.minScore)      continue;
          if (cond.maxScore !== undefined && score > cond.maxScore)      continue;

          if (cond.levelNames?.length) {
            if (!levelName || !cond.levelNames.includes(levelName))      continue;
          }

          if (cond.minEventsTotal  !== undefined && totalEvents < cond.minEventsTotal)  continue;
          if (cond.minEventsLast30d !== undefined && events30d  < cond.minEventsLast30d) continue;
          if (cond.minEventsLast90d !== undefined && events90d  < cond.minEventsLast90d) continue;

          if (cond.requiredEventTypes?.length) {
            if (!cond.requiredEventTypes.every((t) => eventTypes.has(t)))              continue;
          }

          if (cond.maxDaysSinceLastEvent !== undefined) {
            if (!lastEventAt)                                                           continue;
            const daysSince = Math.floor((Date.now() - lastEventAt.getTime()) / 86400000);
            if (daysSince > cond.maxDaysSinceLastEvent)                                continue;
          }

          if (cond.fanStatuses?.length) {
            if (!cond.fanStatuses.includes(fanStatus))                                 continue;
          }

          matchedSegment = rule.name as string;
          break;
        }

        if (matchedSegment !== fan.segment) {
          await sql`
            UPDATE fans
            SET segment = ${matchedSegment}, tier = ${levelName}, updated_at = NOW()
            WHERE id = ${fan.id}
          `;
          changed++;
        }
      } catch (err) {
        errors++;
        console.error(`  Error processing fan ${fan.id}:`, err);
      }
    }

    console.log(`  ✓ processed=${orgFans.length}  changed=${changed}  errors=${errors}`);
  }

  // Summary
  console.log("\nVerification:");
  const dist = await sql`
    SELECT
      o.name AS org,
      f.segment,
      COUNT(*) AS fan_count
    FROM fan_organizations fo
    INNER JOIN fans f ON f.id = fo.fan_id
    INNER JOIN organizations o ON o.id = fo.organization_id
    WHERE fo.is_primary = TRUE
      AND f.status != 'archived'
    GROUP BY o.name, f.segment
    ORDER BY o.name, fan_count DESC
  `;

  let currentOrg = "";
  for (const row of dist) {
    if (row.org !== currentOrg) {
      currentOrg = row.org as string;
      console.log(`\n  [${currentOrg}]`);
    }
    console.log(
      `    ${String(row.segment ?? "(null)").padEnd(22)} ${String(row.fan_count).padStart(4)} fans`,
    );
  }

  console.log("\nSegment recomputation complete.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

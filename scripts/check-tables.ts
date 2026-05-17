import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const memberships = await sql`
    SELECT m.id, m.user_id, m.organization_id, m.role, m.status,
           u.email AS user_email, u.first_name, u.last_name,
           o.name AS org_name, o.slug AS org_slug
    FROM memberships m
    JOIN users u ON u.id = m.user_id
    JOIN organizations o ON o.id = m.organization_id
    ORDER BY m.created_at
  `;

  console.log(`\nMemberships (${memberships.length}):`);
  memberships.forEach((m) => {
    console.log(`  ${m.user_email} (${m.first_name} ${m.last_name})`);
    console.log(`  → ${m.org_name} [${m.org_slug}] | role=${m.role} status=${m.status}`);
    console.log(`  user_id=${m.user_id}`);
    console.log();
  });

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

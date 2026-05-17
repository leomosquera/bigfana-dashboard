import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";

/**
 * Engagement Intelligence Layer — v1 migration.
 *
 * Creates:
 *   - fan_segment_rules   per-org configurable segment definitions
 *   - fan_experiences     per-org experience / campaign / offer definitions
 *
 * Seeds default segment rules for every organization that has none.
 * Seeds default experiences per segment for demo readiness.
 *
 * Idempotent: all steps use CREATE TABLE IF NOT EXISTS and
 * INSERT ... ON CONFLICT DO NOTHING.
 */

// ─── Default segment rules ────────────────────────────────────────────────────
//
// These are seeded per org. Admins can later modify or add rules.
// Priority is evaluated descending — highest priority wins first.

const DEFAULT_SEGMENT_RULES = [
  {
    name:        "Ultra VIP",
    description: "Fans de élite: máximo compromiso, asistencia habitual y gasto premium.",
    color:       "#FF2D55",
    priority:    100,
    conditions:  JSON.stringify({
      minScore:        2000,
      levelNames:      ["Leyenda"],
      minEventsLast90d: 3,
    }),
  },
  {
    name:        "Fan Comprometido",
    description: "Fans activos con interacción regular y score alto.",
    color:       "#3B82F6",
    priority:    80,
    conditions:  JSON.stringify({
      minScore:         500,
      minEventsLast30d: 1,
    }),
  },
  {
    name:        "Fan Core",
    description: "Hincha regular con actividad constante pero moderada.",
    color:       "#8888AA",
    priority:    50,
    conditions:  JSON.stringify({
      minScore:      100,
      minEventsTotal: 1,
    }),
  },
  {
    name:        "Casual",
    description: "Fan con baja interacción y potencial de activación.",
    color:       "#C97B2E",
    priority:    20,
    conditions:  JSON.stringify({
      minScore: 1,
      maxScore: 99,
    }),
  },
  {
    name:        "Nuevo",
    description: "Fan recién registrado, sin puntos ni eventos aún.",
    color:       "#00D4A8",
    priority:    10,
    conditions:  JSON.stringify({
      maxScore:      0,
      minEventsTotal: 0,
    }),
  },
  {
    name:        "Inactivo",
    description: "Fan que no ha interactuado en los últimos 60 días.",
    color:       "#55556A",
    priority:    5,
    conditions:  JSON.stringify({
      maxDaysSinceLastEvent: 60,
    }),
  },
];

// ─── Default experiences per segment ─────────────────────────────────────────
//
// Keys here match DEFAULT_SEGMENT_RULES names.
// Each segment gets seeded experiences for demo purposes.

const DEFAULT_EXPERIENCES: Record<string, {
  type: string;
  title: string;
  description: string;
  sponsorAffinity: string[];
}[]> = {
  "Ultra VIP": [
    {
      type:            "vip_access",
      title:           "Acceso VIP pre-partido",
      description:     "Acceso exclusivo al estadio 90 minutos antes del partido con zona premium.",
      sponsorAffinity: ["premium", "hospitality"],
    },
    {
      type:            "reward",
      title:           "Pack Embajador exclusivo",
      description:     "Camiseta firmada + foto con plantel + entrada de temporada.",
      sponsorAffinity: ["sports_gear", "premium"],
    },
    {
      type:            "sponsor_offer",
      title:           "Oferta exclusiva — Sponsor Premium",
      description:     "Acceso a productos y descuentos de patrocinadores premium del club.",
      sponsorAffinity: ["premium", "alcohol", "luxury"],
    },
  ],
  "Fan Comprometido": [
    {
      type:            "challenge",
      title:           "Trivia Premium Semanal",
      description:     "Acceso a rondas de trivia exclusivas con premios de alto valor.",
      sponsorAffinity: ["sports_gear", "premium"],
    },
    {
      type:            "campaign",
      title:           "Campaña de lealtad — Doble puntos",
      description:     "Gana el doble de puntos en todos tus eventos durante 30 días.",
      sponsorAffinity: ["sports_gear"],
    },
    {
      type:            "reward",
      title:           "Descuento en tienda oficial",
      description:     "20% de descuento en toda la tienda oficial del club.",
      sponsorAffinity: ["sports_gear", "merchandise"],
    },
  ],
  "Fan Core": [
    {
      type:            "challenge",
      title:           "Trivia del partido",
      description:     "Participá en la trivia oficial del próximo partido y ganás puntos.",
      sponsorAffinity: ["sports_gear", "beverage"],
    },
    {
      type:            "campaign",
      title:           "Descuento en abono de temporada",
      description:     "Comprá tu abono con descuento especial para fans Core.",
      sponsorAffinity: ["hospitality"],
    },
  ],
  "Casual": [
    {
      type:            "campaign",
      title:           "Campaña de activación",
      description:     "Completá tu primer desafío y desbloqueá recompensas.",
      sponsorAffinity: ["youth", "beverage"],
    },
    {
      type:            "challenge",
      title:           "Primer desafío — Bienvenida",
      description:     "Presentate al club: completá tu perfil y ganá tus primeros 50 puntos.",
      sponsorAffinity: [],
    },
  ],
  "Nuevo": [
    {
      type:            "campaign",
      title:           "Onboarding de bienvenida",
      description:     "Descubrí el club, completá tu perfil y sumate a la comunidad.",
      sponsorAffinity: [],
    },
    {
      type:            "challenge",
      title:           "Desafío de inicio — 100 puntos gratis",
      description:     "Completá los pasos de activación y recibí tus primeros 100 puntos.",
      sponsorAffinity: [],
    },
  ],
  "Inactivo": [
    {
      type:            "campaign",
      title:           "Campaña de re-engagement",
      description:     "Te extrañamos. Volvé a interactuar y recuperá tu lugar en el ranking.",
      sponsorAffinity: [],
    },
    {
      type:            "reward",
      title:           "Bonus de reactivación — 200 puntos",
      description:     "Completá 1 acción esta semana y recibís 200 puntos bonus.",
      sponsorAffinity: [],
    },
  ],
};

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Running Engagement Intelligence Layer v1 migration...\n");

  // ── 1. fan_segment_rules ──────────────────────────────────────────────────
  console.log("1. Creating fan_segment_rules table...");
  await sql`
    CREATE TABLE IF NOT EXISTS fan_segment_rules (
      id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id  uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name             text        NOT NULL,
      description      text,
      color            text,
      priority         integer     NOT NULL DEFAULT 0,
      conditions       jsonb       NOT NULL,
      is_active        boolean     NOT NULL DEFAULT true,
      created_at       timestamptz NOT NULL DEFAULT now(),
      updated_at       timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS fan_segment_rules_org_priority_idx
      ON fan_segment_rules (organization_id, priority DESC)
  `;

  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS fan_segment_rules_org_name_idx
      ON fan_segment_rules (organization_id, name)
  `;

  // ── 2. fan_experiences ────────────────────────────────────────────────────
  console.log("2. Creating fan_experiences table...");
  await sql`
    CREATE TABLE IF NOT EXISTS fan_experiences (
      id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id  uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      segment_rule_id  uuid        REFERENCES fan_segment_rules(id) ON DELETE SET NULL,
      type             text        NOT NULL,
      title            text        NOT NULL,
      description      text,
      sponsor_affinity jsonb,
      metadata         jsonb,
      is_active        boolean     NOT NULL DEFAULT true,
      starts_at        timestamptz,
      ends_at          timestamptz,
      created_at       timestamptz NOT NULL DEFAULT now(),
      updated_at       timestamptz NOT NULL DEFAULT now()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS fan_experiences_org_active_idx
      ON fan_experiences (organization_id, is_active)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS fan_experiences_segment_idx
      ON fan_experiences (segment_rule_id)
  `;

  // ── 3. Seed default segment rules ─────────────────────────────────────────
  console.log("\n3. Seeding default segment rules for organizations...");

  const orgs = await sql`
    SELECT o.id, o.name
    FROM organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM fan_segment_rules sr WHERE sr.organization_id = o.id
    )
  `;

  if (orgs.length === 0) {
    console.log("   All organizations already have segment rules — skipping.");
  } else {
    for (const org of orgs) {
      console.log(`   Seeding segments for: ${org.name} (${org.id})`);

      for (const rule of DEFAULT_SEGMENT_RULES) {
        const [inserted] = await sql`
          INSERT INTO fan_segment_rules
            (organization_id, name, description, color, priority, conditions, is_active)
          VALUES
            (${org.id}, ${rule.name}, ${rule.description}, ${rule.color},
             ${rule.priority}, ${rule.conditions}::jsonb, true)
          ON CONFLICT (organization_id, name) DO NOTHING
          RETURNING id, name
        `;

        if (!inserted) {
          console.log(`     [${rule.name}] already exists — skipped`);
          continue;
        }

        console.log(`     [${rule.name}] created (${inserted.id})`);

        // Seed experiences for this segment
        const experiences = DEFAULT_EXPERIENCES[rule.name] ?? [];
        for (const exp of experiences) {
          await sql`
            INSERT INTO fan_experiences
              (organization_id, segment_rule_id, type, title, description,
               sponsor_affinity, is_active)
            VALUES
              (${org.id}, ${inserted.id}, ${exp.type}, ${exp.title},
               ${exp.description}, ${JSON.stringify(exp.sponsorAffinity)}::jsonb, true)
          `;
        }
        if (experiences.length > 0) {
          console.log(`       → Seeded ${experiences.length} experience(s)`);
        }
      }
    }
  }

  // ── 4. Verify ────────────────────────────────────────────────────────────
  console.log("\n4. Verification...");

  const [ruleCount] = await sql`SELECT COUNT(*) AS n FROM fan_segment_rules`;
  const [expCount]  = await sql`SELECT COUNT(*) AS n FROM fan_experiences`;

  console.log(`   fan_segment_rules : ${ruleCount.n} rows`);
  console.log(`   fan_experiences   : ${expCount.n} rows`);

  const rules = await sql`
    SELECT o.name AS org_name, sr.name AS rule_name,
           sr.priority, sr.color
    FROM fan_segment_rules sr
    JOIN organizations o ON o.id = sr.organization_id
    ORDER BY o.name, sr.priority DESC
  `;

  rules.forEach((r) => {
    console.log(
      `     [${r.org_name}] P${String(r.priority).padStart(3)} ${r.rule_name.padEnd(20)} ${r.color ?? ""}`,
    );
  });

  console.log("\nEIL v1 migration complete.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

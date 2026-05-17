import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

import { neon } from "@neondatabase/serverless";

/**
 * Campaign engine demo — foundation migration.
 *
 * Creates (idempotent): campaigns, campaign_questions, campaign_options,
 * campaign_responses, sponsor_ads, campaign_ads.
 *
 * Seeds three demo engagements per organization that currently has ZERO rows
 * in `campaigns` (trivia + player-of-match poll + prediction).
 */

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Running campaign engine v1 migration...\n");

  // ── 1. sponsor_ads (referenced by campaign_ads) ─────────────────────────
  console.log("1. Creating sponsor_ads table...");
  await sql`
    CREATE TABLE IF NOT EXISTS sponsor_ads (
      id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      sponsor_name      text NOT NULL,
      title             text NOT NULL,
      description       text,
      image_url         text,
      destination_url   text,
      priority          integer NOT NULL DEFAULT 0,
      segment_rules     jsonb,
      status            text NOT NULL DEFAULT 'draft',
      metadata          jsonb,
      created_at        timestamptz NOT NULL DEFAULT now(),
      updated_at        timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS sponsor_ads_org_status_idx
      ON sponsor_ads (organization_id, status)
  `;

  // ── 2. campaigns ─────────────────────────────────────────────────────────
  console.log("2. Creating campaigns table...");
  await sql`
    CREATE TABLE IF NOT EXISTS campaigns (
      id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      title             text NOT NULL,
      description       text,
      type              text NOT NULL,
      status            text NOT NULL DEFAULT 'draft',
      points_reward     integer NOT NULL DEFAULT 0,
      starts_at         timestamptz NOT NULL,
      ends_at           timestamptz NOT NULL,
      segment_rules     jsonb NOT NULL DEFAULT '{"mode":"all"}'::jsonb,
      metadata          jsonb,
      created_at        timestamptz NOT NULL DEFAULT now(),
      updated_at        timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS campaigns_org_status_idx
      ON campaigns (organization_id, status)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS campaigns_org_type_idx
      ON campaigns (organization_id, type)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS campaigns_org_dates_idx
      ON campaigns (organization_id, starts_at, ends_at)
  `;

  // ── 3. campaign_questions ─────────────────────────────────────────────────
  console.log("3. Creating campaign_questions table...");
  await sql`
    CREATE TABLE IF NOT EXISTS campaign_questions (
      id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id   uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      question      text NOT NULL,
      type          text NOT NULL,
      sort_order    integer NOT NULL DEFAULT 0,
      metadata      jsonb,
      created_at    timestamptz NOT NULL DEFAULT now(),
      updated_at    timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS campaign_questions_campaign_sort_idx
      ON campaign_questions (campaign_id, sort_order)
  `;

  // ── 4. campaign_options ──────────────────────────────────────────────────
  console.log("4. Creating campaign_options table...");
  await sql`
    CREATE TABLE IF NOT EXISTS campaign_options (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      question_id  uuid NOT NULL REFERENCES campaign_questions(id) ON DELETE CASCADE,
      label        text NOT NULL,
      value        text NOT NULL,
      is_correct   boolean,
      sort_order   integer NOT NULL DEFAULT 0,
      metadata     jsonb,
      created_at   timestamptz NOT NULL DEFAULT now(),
      updated_at   timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS campaign_options_question_sort_idx
      ON campaign_options (question_id, sort_order)
  `;

  // ── 5. campaign_ads ───────────────────────────────────────────────────────
  console.log("5. Creating campaign_ads table...");
  await sql`
    CREATE TABLE IF NOT EXISTS campaign_ads (
      id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id    uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      sponsor_ad_id  uuid NOT NULL REFERENCES sponsor_ads(id) ON DELETE CASCADE,
      priority       integer NOT NULL DEFAULT 0,
      metadata       jsonb,
      created_at     timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS campaign_ads_campaign_idx ON campaign_ads (campaign_id)
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS campaign_ads_campaign_sponsor_uidx
      ON campaign_ads (campaign_id, sponsor_ad_id)
  `;

  // ── 6. campaign_responses ─────────────────────────────────────────────────
  console.log("6. Creating campaign_responses table...");
  await sql`
    CREATE TABLE IF NOT EXISTS campaign_responses (
      id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id   uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      campaign_id       uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      question_id       uuid NOT NULL REFERENCES campaign_questions(id) ON DELETE CASCADE,
      option_id         uuid REFERENCES campaign_options(id) ON DELETE SET NULL,
      fan_id            uuid NOT NULL REFERENCES fans(id) ON DELETE CASCADE,
      value             jsonb,
      is_correct        boolean,
      points_awarded    integer NOT NULL DEFAULT 0,
      created_at        timestamptz NOT NULL DEFAULT now()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS campaign_responses_fan_question_uidx
      ON campaign_responses (campaign_id, question_id, fan_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS campaign_responses_campaign_idx
      ON campaign_responses (campaign_id)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS campaign_responses_fan_idx
      ON campaign_responses (organization_id, fan_id)
  `;

  // ── 7. Demo seed (orgs with zero campaigns only) ─────────────────────────
  console.log("\n7. Seeding demo campaigns (only orgs without any campaign)...");

  const eligibleOrgs = await sql`
    SELECT o.id, o.name
    FROM organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM campaigns c WHERE c.organization_id = o.id
    )
  `;

  if (eligibleOrgs.length === 0) {
    console.log("   All organizations already have ≥1 campaign — skipping seed.");
  } else {
    for (const org of eligibleOrgs) {
      console.log(`   Seeding demos for ${org.name} (${org.id})`);

      /* 1 · Trivia */
      const triviaSegJson = JSON.stringify({ mode: "all" });
      const triviaMetaJson = JSON.stringify({ demoSeed: true, key: "trivia_intro" });
      const [triviaCampaign] = await sql`
        INSERT INTO campaigns (
          organization_id, title, description, type, status, points_reward,
          starts_at, ends_at, segment_rules, metadata
        )
        VALUES (
          ${org.id},
          ${"Trivia del club — temporada en curso"},
          ${"Pregunta rápida para fans: demostración de trivia con puntos."},
          ${"trivia"},
          ${"active"},
          ${80},
          now() - interval '2 days',
          now() + interval '30 days',
          ${triviaSegJson}::jsonb,
          ${triviaMetaJson}::jsonb
        )
        RETURNING id
      `;

      const [tq] = await sql`
        INSERT INTO campaign_questions (
          campaign_id, question, type, sort_order, metadata
        )
        VALUES (
          ${triviaCampaign.id},
          ${"¿Cuántas veces coronó mundialmente nuestra institución hasta 2026?"},
          ${"multiple_choice"},
          0,
          null::jsonb
        )
        RETURNING id
      `;

      await sql`
        INSERT INTO campaign_options (question_id, label, value, is_correct, sort_order)
        VALUES
          (${tq.id}, ${"Nunca"},         ${"never"},  false, 0),
          (${tq.id}, ${"Una vez"},       ${"one"},    true,  1),
          (${tq.id}, ${"Más de una"},   ${"many"},   false, 2),
          (${tq.id}, ${"No lo sé"},     ${"dunno"}, false, 3)
      `;

      /* 2 · Votación figura del partido */
      const [pollCampaign] = await sql`
        INSERT INTO campaigns (
          organization_id, title, description, type, status, points_reward,
          starts_at, ends_at, segment_rules, metadata
        )
        VALUES (
          ${org.id},
          ${"Votación figura del partido"},
          ${"Elegí a la mejor actuación de la fecha — encuesta rápida estilo MVP."},
          ${"poll"},
          ${"active"},
          ${50},
          now() - interval '1 day',
          now() + interval '45 days',
          ${triviaSegJson}::jsonb,
          ${JSON.stringify({ demoSeed: true, key: "motm_poll" })}::jsonb
        )
        RETURNING id
      `;

      const [pq] = await sql`
        INSERT INTO campaign_questions (
          campaign_id, question, type, sort_order, metadata
        )
        VALUES (
          ${pollCampaign.id},
          ${"¿Quién fue la figura del último encuentro oficial?"},
          ${"multiple_choice"},
          0,
          null::jsonb
        )
        RETURNING id
      `;

      await sql`
        INSERT INTO campaign_options (question_id, label, value, sort_order)
        VALUES
          (${pq.id}, ${"#10 · Mediocampo motor"}, ${"mvp_10"}, 0),
          (${pq.id}, ${"#9 · Goleador clave"},   ${"mvp_9"},  1),
          (${pq.id}, ${"#1 · Aguante bajo los palos"}, ${"mvp_1"},  2),
          (${pq.id}, ${"Otro / empate táctico"},  ${"mvp_other"}, 3)
      `;

      /* 3 · Predicción resultado */
      const [predCampaign] = await sql`
        INSERT INTO campaigns (
          organization_id, title, description, type, status, points_reward,
          starts_at, ends_at, segment_rules, metadata
        )
        VALUES (
          ${org.id},
          ${"Predicción resultado — próximo clásico"},
          ${"Prototipo de prediction: marcá cómo ves el encuentro próximo."},
          ${"prediction"},
          ${"active"},
          ${120},
          now(),
          now() + interval '14 days',
          ${triviaSegJson}::jsonb,
          ${JSON.stringify({ demoSeed: true, key: "score_prediction_demo" })}::jsonb
        )
        RETURNING id
      `;

      const [kq] = await sql`
        INSERT INTO campaign_questions (
          campaign_id, question, type, sort_order, metadata
        )
        VALUES (
          ${predCampaign.id},
          ${"¿Cuál será el resultado de nuestro próximo encuentro clave?"},
          ${"multiple_choice"},
          0,
          null::jsonb
        )
        RETURNING id
      `;

      await sql`
        INSERT INTO campaign_options (question_id, label, value, sort_order)
        VALUES
          (${kq.id}, ${"Victoria local"}, ${"home_win"},    0),
          (${kq.id}, ${"Empate"},       ${"draw"},       1),
          (${kq.id}, ${"Victoria rival"}, ${"away_win"},  2)
      `;
    }

    console.log(`   Finished seed for ${eligibleOrgs.length} organization(s).`);
  }

  console.log("\nCampaign engine v1 migration complete.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

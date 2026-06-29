import { loadEnv } from "./load-env";
loadEnv();

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false });

async function main() {
  const companies = await sql`
    SELECT 
      c.id, c.name, c.slug, c.website, c.website_domain, c.hq_city, c.hq_country,
      c.funding_round, c.funding_amount_usd, c.funding_date,
      c.discovery_sources, c.discovery_confidence, c.paris_presence_score,
      c.paris_presence_breakdown, c.ai_category, c.description, c.sources,
      c.created_at, c.updated_at
    FROM companies c
    WHERE NOT (c.discovery_sources = '["seed"]'::jsonb)
    ORDER BY c.created_at ASC
  `;

  for (const c of companies) {
    const rawItems = await sql`
      SELECT source_name, raw_data, fetched_at
      FROM raw_funding_items
      WHERE company_id = ${c.id}
      ORDER BY fetched_at ASC
    `;

    console.log("=== COMPANY ===");
    console.log(JSON.stringify({ ...c, rawItems }, null, 2));
  }

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

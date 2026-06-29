import { loadEnv } from "./load-env";
loadEnv();

import postgres from "postgres";

const url = process.env.DATABASE_URL!;
const sql = postgres(url, { max: 1, prepare: false });

async function main() {
  const runs = await sql`
    SELECT source_name, status, items_processed, items_created, items_updated, error_message, started_at, completed_at
    FROM ingestion_runs
    WHERE job_name = 'ingest_funding_news'
    ORDER BY started_at DESC
    LIMIT 30
  `;
  console.log("=== RECENT INGESTION RUNS ===");
  console.log(JSON.stringify(runs, null, 2));

  const totals = await sql`
    SELECT 
      COUNT(*)::int as total_runs,
      COUNT(*) FILTER (WHERE status = 'completed')::int as completed,
      COUNT(*) FILTER (WHERE status = 'failed')::int as failed,
      SUM(items_created)::int as total_created,
      SUM(items_updated)::int as total_updated,
      MIN(started_at) as first_run,
      MAX(started_at) as last_run
    FROM ingestion_runs
    WHERE job_name = 'ingest_funding_news'
  `;
  console.log("=== TOTALS ===");
  console.log(JSON.stringify(totals[0], null, 2));

  const lastDayRuns = await sql`
    SELECT source_name, status, items_processed, items_created, items_updated, started_at
    FROM ingestion_runs
    WHERE job_name = 'ingest_funding_news'
      AND started_at >= NOW() - INTERVAL '2 days'
    ORDER BY started_at DESC
  `;
  console.log("=== LAST 2 DAYS RUNS ===");
  console.log(JSON.stringify(lastDayRuns, null, 2));

  const companiesByDate = await sql`
    SELECT DATE(created_at) as day, COUNT(*)::int as created
    FROM companies
    GROUP BY DATE(created_at)
    ORDER BY day DESC
    LIMIT 15
  `;
  console.log("=== COMPANIES BY CREATION DATE ===");
  console.log(JSON.stringify(companiesByDate, null, 2));

  const discoverySources = await sql`
    SELECT discovery_sources, COUNT(*)::int as cnt
    FROM companies
    GROUP BY discovery_sources
    ORDER BY cnt DESC
    LIMIT 10
  `;
  console.log("=== DISCOVERY SOURCES ===");
  console.log(JSON.stringify(discoverySources, null, 2));

  const rawStats = await sql`
    SELECT source_name, COUNT(*)::int as total, 
      COUNT(*) FILTER (WHERE processed = true)::int as processed,
      COUNT(*) FILTER (WHERE company_id IS NOT NULL)::int as linked
    FROM raw_funding_items
    GROUP BY source_name
    ORDER BY total DESC
  `;
  console.log("=== RAW FUNDING ITEMS ===");
  console.log(JSON.stringify(rawStats, null, 2));

  const allJobs = await sql`
    SELECT job_name, COUNT(*)::int as cnt, MAX(started_at) as last_run
    FROM ingestion_runs
    GROUP BY job_name
    ORDER BY last_run DESC
  `;
  console.log("=== ALL JOB TYPES ===");
  console.log(JSON.stringify(allJobs, null, 2));

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

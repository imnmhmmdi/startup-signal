import { loadEnv } from "./load-env";
loadEnv();
import { ensureDatabaseReady } from "../src/lib/db/bootstrap";
import { upsertSeedCompany } from "../src/lib/ingestion/ingest-service";
import { computeAllScores } from "../src/lib/scoring/compute-scores";
import { backfillCompanyLogos } from "../src/lib/company-logo-backfill";
import { queryCompanies } from "../src/lib/queries/companies";
import { PRODUCT } from "../src/config/product";
import { db } from "../src/db";
import { companies } from "../src/db/schema";
import { SEED_COMPANIES } from "../src/lib/db/seed-data";
import { STRATEGIC_SEED_COMPANIES } from "../src/lib/db/strategic-seed-data";
import { STRATEGIC_SEED_SOURCE } from "../src/lib/scoring/strategic-relevance";
import { sql } from "drizzle-orm";

async function main() {
  await ensureDatabaseReady({ seedIfEmpty: false });

  console.log(`Seeding ${SEED_COMPANIES.length} EU companies (safe merge)...\n`);

  let created = 0;
  let updated = 0;

  for (const company of SEED_COMPANIES) {
    const result = await upsertSeedCompany(company);
    if (result.status === "created") created++;
    if (result.status === "updated") updated++;
  }

  console.log(`EU seed complete: ${created} created, ${updated} updated\n`);

  console.log(`Seeding ${STRATEGIC_SEED_COMPANIES.length} strategic target companies...\n`);

  let strategicCreated = 0;
  let strategicUpdated = 0;
  const mergedStrategic: string[] = [];

  for (const company of STRATEGIC_SEED_COMPANIES) {
    const result = await upsertSeedCompany(company);
    if (result.status === "created") strategicCreated++;
    if (result.status === "updated") {
      strategicUpdated++;
      if (result.changes.some((c) => c.field === "discoverySources")) {
        mergedStrategic.push(result.name);
      }
    }
  }

  console.log(
    `Strategic seed complete: ${strategicCreated} created, ${strategicUpdated} updated`
  );

  const logosUpdated = await backfillCompanyLogos(db);
  console.log(`Logo backfill: ${logosUpdated} companies updated`);

  const scored = await computeAllScores(db);
  console.log(`Scored ${scored} companies\n`);

  const [strategicCountRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(companies)
    .where(sql`${companies.discoverySources} @> ${JSON.stringify([STRATEGIC_SEED_SOURCE])}::jsonb`);

  const ranked = await queryCompanies({
    minParisPresenceScore: PRODUCT.minParisPresenceScore,
    sortBy: "default",
    limit: 10,
  });

  const allVisible = await queryCompanies({
    minParisPresenceScore: PRODUCT.minParisPresenceScore,
    sortBy: "default",
    limit: 200,
  });
  const sierraInList = allVisible.find((c) => c.name.toLowerCase() === "sierra");

  console.log("=== Strategic seed diagnostics ===");
  console.log(`Total strategic-seed companies: ${strategicCountRow.count}`);
  console.log(
    `Merged into existing rows: ${mergedStrategic.length > 0 ? mergedStrategic.join(", ") : "none detected this run"}`
  );
  console.log(`Sierra visible in /companies: ${sierraInList ? "yes" : "no"}`);

  if (sierraInList) {
    console.log("Sierra scores:");
    console.log(`  parisPresenceScore: ${sierraInList.parisPresenceScore}`);
    console.log(`  pmFitScore: ${sierraInList.pmFitScore}`);
    console.log(`  aiHiringScore: ${sierraInList.aiHiringScore}`);
    console.log(`  strategicRelevanceScore: ${sierraInList.strategicRelevanceScore}`);
    console.log(`  discoveryConfidence: ${sierraInList.discoveryConfidence}`);
    console.log(`  discoverySources: ${JSON.stringify(sierraInList.discoverySources)}`);
  }

  console.log("\nTop 10 companies (composite ranking):");
  for (const [index, company] of ranked.entries()) {
    console.log(
      `  ${index + 1}. ${company.name} — paris=${company.parisPresenceScore}, pmFit=${company.pmFitScore}, hiring=${company.aiHiringScore}, strategic=${company.strategicRelevanceScore ?? "—"}`
    );
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

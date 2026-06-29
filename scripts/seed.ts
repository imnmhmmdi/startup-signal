import { loadEnv } from "./load-env";
loadEnv();
import { ensureDatabaseReady } from "../src/lib/db/bootstrap";
import { upsertSeedCompany } from "../src/lib/ingestion/ingest-service";
import { computeAllScores } from "../src/lib/scoring/compute-scores";
import { backfillCompanyLogos } from "../src/lib/company-logo-backfill";
import { db } from "../src/db";
import { SEED_COMPANIES } from "../src/lib/db/seed-data";

async function main() {
  await ensureDatabaseReady({ seedIfEmpty: false });

  console.log(`Seeding ${SEED_COMPANIES.length} companies...`);

  let created = 0;
  let updated = 0;

  for (const company of SEED_COMPANIES) {
    const result = await upsertSeedCompany(company);
    if (result.status === "created") created++;
    if (result.status === "updated") updated++;
  }

  console.log(`Seed complete: ${created} created, ${updated} updated`);

  const logosUpdated = await backfillCompanyLogos(db);
  console.log(`Logo backfill: ${logosUpdated} companies updated`);

  const scored = await computeAllScores(db);
  console.log(`Scored ${scored} companies`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

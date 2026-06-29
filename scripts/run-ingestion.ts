import { loadEnv } from "./load-env";
loadEnv();

import { ingestAllSources } from "../src/lib/ingestion/ingest-service";
import { runDatabaseMigrations } from "../src/lib/db/bootstrap";

async function main() {
  console.log("Running migrations...");
  await runDatabaseMigrations();

  console.log("Starting full RSS ingestion (production DB)...\n");
  const results = await ingestAllSources();

  let totalProcessed = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const result of results) {
    console.log(
      `${result.source}: fetched=${result.itemsProcessed} created=${result.itemsCreated} updated=${result.itemsUpdated} skipped=${result.itemsSkipped}`
    );
    totalProcessed += result.itemsProcessed;
    totalCreated += result.itemsCreated;
    totalUpdated += result.itemsUpdated;
    totalSkipped += result.itemsSkipped;
  }

  console.log("\n=== TOTALS ===");
  console.log(`Articles fetched: ${totalProcessed}`);
  console.log(`Companies inserted: ${totalCreated}`);
  console.log(`Companies updated: ${totalUpdated}`);
  console.log(`Companies skipped: ${totalSkipped}`);
}

main().catch((error) => {
  console.error("[run-ingestion] Failed:", error);
  process.exit(1);
});

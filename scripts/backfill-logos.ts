import { loadEnv } from "./load-env";
loadEnv();
import { ensureDatabaseReady } from "../src/lib/db/bootstrap";
import { backfillCompanyLogos } from "../src/lib/company-logo-backfill";
import { db } from "../src/db";

async function main() {
  await ensureDatabaseReady({ seedIfEmpty: false });
  const updated = await backfillCompanyLogos(db);
  console.log(`Logo backfill complete: ${updated} companies updated`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Logo backfill failed:", err);
  process.exit(1);
});

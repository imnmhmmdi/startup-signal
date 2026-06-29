import { loadEnv } from "./load-env";
loadEnv();
import { ensureDatabaseReady } from "../src/lib/db/bootstrap";

async function main() {
  console.log("[bootstrap-db] Starting database bootstrap...");
  await ensureDatabaseReady();
  console.log("[bootstrap-db] Database ready.");
}

main().catch((error) => {
  console.error("[bootstrap-db] Failed:", error);
  process.exit(1);
});

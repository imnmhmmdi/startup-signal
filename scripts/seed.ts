import { loadEnv } from "./load-env";
loadEnv();
import { ensureDatabaseReady } from "../src/lib/db/bootstrap";
import { upsertSeedCompany } from "../src/lib/ingestion/ingest-service";
import { computeAllScores } from "../src/lib/scoring/compute-scores";
import { backfillCompanyLogos } from "../src/lib/company-logo-backfill";
import { queryCompanies } from "../src/lib/queries/companies";
import { PRODUCT } from "../src/config/product";
import { db } from "../src/db";
import { SEED_COMPANIES } from "../src/lib/db/seed-data";

async function main() {
  await ensureDatabaseReady({ seedIfEmpty: false });

  console.log(`Seeding ${SEED_COMPANIES.length} companies (safe merge)...\n`);

  let created = 0;
  let updated = 0;
  const changedCompanies: Array<{
    name: string;
    status: "created" | "updated";
    changes: string[];
    previousParisPresenceScore?: number | null;
    parisPresenceScore?: number;
  }> = [];

  for (const company of SEED_COMPANIES) {
    const result = await upsertSeedCompany(company);
    if (result.status === "created") created++;
    if (result.status === "updated") updated++;

    if (result.changes.length > 0) {
      changedCompanies.push({
        name: result.name,
        status: result.status,
        changes: result.changes.map(
          (change) => `${change.field}: ${JSON.stringify(change.from)} -> ${JSON.stringify(change.to)}`
        ),
        previousParisPresenceScore: result.previousParisPresenceScore,
        parisPresenceScore: result.parisPresenceScore,
      });
    }
  }

  console.log(`Seed complete: ${created} created, ${updated} updated`);
  console.log(`Companies with field changes: ${changedCompanies.length}\n`);

  if (changedCompanies.length > 0) {
    for (const company of changedCompanies) {
      console.log(
        `- ${company.name} [${company.status}] paris ${company.previousParisPresenceScore ?? "—"} -> ${company.parisPresenceScore ?? "—"}`
      );
      for (const change of company.changes) {
        console.log(`    ${change}`);
      }
    }
    console.log("");
  }

  const logosUpdated = await backfillCompanyLogos(db);
  console.log(`Logo backfill: ${logosUpdated} companies updated`);

  const scored = await computeAllScores(db);
  console.log(`Scored ${scored} companies`);

  const ecosystem = await queryCompanies({
    minParisPresenceScore: PRODUCT.minParisPresenceScore,
    sortBy: "pmFitScore",
    sortOrder: "desc",
  });
  const elevenLabs = ecosystem.find((company) =>
    company.name.toLowerCase().includes("elevenlabs")
  );

  console.log("\nVerification:");
  console.log(
    `- Ecosystem companies (paris >= ${PRODUCT.minParisPresenceScore}): ${ecosystem.length}`
  );
  if (elevenLabs) {
    console.log(
      `- ElevenLabs visible: yes (parisPresenceScore=${elevenLabs.parisPresenceScore})`
    );
  } else {
    console.log("- ElevenLabs visible: no");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

import { loadEnv } from "./load-env";
loadEnv();

import { getAdapterByName } from "../src/lib/ingestion/adapters";
import { hasConfirmedDomain } from "../src/lib/ingestion/article-enricher";
import { evaluateCompanyNameFromTitle } from "../src/lib/ingestion/company-name";
import { computeDiscoveryConfidence } from "../src/lib/scoring/discovery-confidence";
import { computeParisPresenceScore } from "../src/lib/scoring/paris-presence";
import type { NormalizedCompany } from "../src/lib/ingestion/types";
import type { Company } from "../src/db/schema";

const TARGET_SOURCES = ["sifted", "tech.eu", "eu-startups", "maddyness"] as const;

type DryRunSample = {
  title: string;
  name: string;
  discoveryConfidence: number;
  parisPresenceScore: number;
};

type RejectedSample = {
  title: string;
  candidate: string;
  reason: string;
};

function previewScores(normalized: NormalizedCompany, sourceName: string) {
  const discoverySources = normalized.discoverySources ?? [sourceName];
  const discoveryConfidence = computeDiscoveryConfidence(
    { discoverySources },
    {
      sourceKind: normalized.sourceKind ?? "rss",
      hasConfirmedDomain: hasConfirmedDomain(normalized.website, normalized.websiteDomain),
    }
  );

  const parisPresence = computeParisPresenceScore({
    name: normalized.name,
    hqCity: normalized.hqCity ?? null,
    hqCountry: normalized.hqCountry ?? null,
    description: normalized.description ?? null,
    pmRoles: normalized.pmRoles ?? 0,
    discoverySources,
    sources: normalized.sources,
  } as Company);

  return {
    discoveryConfidence,
    parisPresenceScore: parisPresence.score,
  };
}

async function runSourceDryRun(sourceName: string) {
  const adapter = getAdapterByName(sourceName);
  if (!adapter) {
    console.error(`No adapter found for source "${sourceName}"`);
    return;
  }

  if ("fetchArticlePages" in adapter) {
    adapter.fetchArticlePages = false;
  }

  console.log(`=== ${sourceName} ===`);
  const rawItems = await adapter.fetchFundingItems();
  let normalizedCount = 0;
  let skippedCount = 0;
  const acceptedSamples: DryRunSample[] = [];
  const rejectedSamples: RejectedSample[] = [];

  for (const rawItem of rawItems) {
    const normalized = await adapter.normalize(rawItem);
    if (!normalized) {
      skippedCount++;
      if (rejectedSamples.length < 5) {
        const evaluation = evaluateCompanyNameFromTitle(rawItem.title);
        const topRejection = evaluation.rejected[0];
        rejectedSamples.push({
          title: rawItem.title,
          candidate: topRejection?.candidate ?? rawItem.title,
          reason: topRejection?.reason ?? "normalization failed",
        });
      }
      continue;
    }

    normalizedCount++;
    const preview = previewScores(normalized, adapter.sourceName);
    if (acceptedSamples.length < 5) {
      acceptedSamples.push({
        title: rawItem.title,
        name: normalized.name,
        discoveryConfidence: preview.discoveryConfidence,
        parisPresenceScore: preview.parisPresenceScore,
      });
    }
  }

  console.log(`Fetched: ${rawItems.length}`);
  console.log(`Normalized: ${normalizedCount}`);
  console.log(`Skipped: ${skippedCount}`);

  if (acceptedSamples.length === 0) {
    console.log("Accepted samples: none");
  } else {
    console.log("Accepted samples:");
    for (const sample of acceptedSamples) {
      console.log(
        `  + ${sample.name} | confidence=${sample.discoveryConfidence} paris=${sample.parisPresenceScore}`
      );
    }
  }

  if (rejectedSamples.length === 0) {
    console.log("Rejected samples: none");
  } else {
    console.log("Rejected samples:");
    for (const sample of rejectedSamples) {
      console.log(`  - ${sample.candidate} | ${sample.reason}`);
      console.log(`    title: ${sample.title}`);
    }
  }

  console.log("");
}

async function runDryRun() {
  console.log("Startup Signal — RSS name validation dry run (no database writes)\n");

  for (const source of TARGET_SOURCES) {
    await runSourceDryRun(source);
  }
}

const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
const sourceFilter = sourceArg?.split("=")[1];

if (sourceFilter) {
  runSourceDryRun(sourceFilter).catch((error) => {
    console.error("[ingest-dry-run] Failed:", error);
    process.exit(1);
  });
} else {
  runDryRun().catch((error) => {
    console.error("[ingest-dry-run] Failed:", error);
    process.exit(1);
  });
}

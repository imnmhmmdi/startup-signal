import type { Company } from "@/db/schema";
import type { SourceKind } from "@/lib/ingestion/types";
import {
  isStrategicSeedSource,
  STRATEGIC_SEED_SOURCE,
} from "@/lib/scoring/strategic-relevance";

const BASE_SCORES: Record<SourceKind, number> = {
  seed: 85,
  api: 90,
  rss: 40,
};

const STRATEGIC_SEED_CONFIDENCE = 85;

export function getRssBaseConfidence(hasConfirmedDomain: boolean): number {
  return hasConfirmedDomain ? 70 : 40;
}

export function resolveDiscoverySourceKind(
  discoverySources: string[] | null | undefined
): SourceKind {
  const sources = discoverySources ?? [];
  if (sources.includes(STRATEGIC_SEED_SOURCE) || sources.includes("seed")) {
    return "seed";
  }
  return "rss";
}

export function computeDiscoveryConfidence(
  company: Pick<Company, "discoverySources">,
  options: {
    sourceKind: SourceKind;
    hasConfirmedDomain: boolean;
  }
): number {
  const sources = company.discoverySources ?? [];
  const uniqueSources = [...new Set(sources.filter(Boolean))];

  if (isStrategicSeedSource(sources)) {
    const crossSourceBoost = Math.min(10, Math.max(0, uniqueSources.length - 1) * 5);
    return Math.min(95, STRATEGIC_SEED_CONFIDENCE + crossSourceBoost);
  }

  let base: number;
  if (options.sourceKind === "rss") {
    base = getRssBaseConfidence(options.hasConfirmedDomain);
  } else {
    base = BASE_SCORES[options.sourceKind];
  }

  const crossSourceBoost = Math.min(10, Math.max(0, uniqueSources.length - 1) * 5);
  return Math.min(95, base + crossSourceBoost);
}

import { gte, or, sql, type SQL } from "drizzle-orm";
import { companies } from "@/db/schema";
import { PRODUCT } from "@/config/product";
import { STRATEGIC_SEED_SOURCE } from "@/lib/scoring/strategic-relevance";

export function parisEcosystemCondition(
  minScore: number = PRODUCT.minParisPresenceScore
): SQL {
  return or(
    gte(companies.parisPresenceScore, minScore),
    sql`${companies.discoverySources} @> ${JSON.stringify([STRATEGIC_SEED_SOURCE])}::jsonb`
  )!;
}

export function isStrategicSeedCompany(discoverySources: string[] | null | undefined): boolean {
  return (discoverySources ?? []).includes(STRATEGIC_SEED_SOURCE);
}

import { gte, type SQL } from "drizzle-orm";
import { companies } from "@/db/schema";
import { PRODUCT } from "@/config/product";

export function parisEcosystemCondition(
  minScore: number = PRODUCT.minParisPresenceScore
): SQL {
  return gte(companies.parisPresenceScore, minScore);
}

import { isNull, or, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "@/db/schema";
import { companies } from "@/db/schema";
import { buildLogoUrlFromDomain, getCompanyDomain } from "@/lib/company-logo";

type DB = PostgresJsDatabase<typeof schema>;

export async function backfillCompanyLogos(db: DB): Promise<number> {
  const rows = await db
    .select()
    .from(companies)
    .where(or(isNull(companies.logoUrl), eq(companies.logoUrl, "")));

  let updated = 0;

  for (const company of rows) {
    const domain = getCompanyDomain(company);
    if (!domain) continue;

    await db
      .update(companies)
      .set({
        logoUrl: buildLogoUrlFromDomain(domain),
        websiteDomain: company.websiteDomain ?? domain,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, company.id));

    updated++;
  }

  return updated;
}

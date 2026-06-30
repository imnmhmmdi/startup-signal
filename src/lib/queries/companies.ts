import { and, asc, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { normalizeCompany } from "@/lib/company/normalize-company";
import { withQueryTimeout } from "@/lib/db/with-query-timeout";
import { parisEcosystemCondition } from "@/lib/queries/ecosystem-filter";
import { companies, savedCompanies } from "@/db/schema";

export type CompanySortField =
  | "default"
  | "pmFitScore"
  | "aiHiringScore"
  | "fundingDate"
  | "fundingAmountUsd"
  | "name"
  | "parisPresenceScore"
  | "strategicRelevanceScore";

export type CompanyFilters = {
  country?: string;
  minParisPresenceScore?: number;
  fundingRound?: string;
  fundingDateFrom?: string;
  fundingDateTo?: string;
  aiCategory?: string;
  minPmFitScore?: number;
  minAiHiringScore?: number;
  search?: string;
  savedOnly?: boolean;
  userId?: string;
  sortBy?: CompanySortField;
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

function buildOrderBy(filters: CompanyFilters) {
  const sortBy = filters.sortBy ?? "default";
  const orderFn = filters.sortOrder === "asc" ? asc : desc;

  if (sortBy === "default") {
    return [
      desc(companies.parisPresenceScore),
      desc(companies.pmFitScore),
      desc(companies.aiHiringScore),
      desc(companies.fundingAmountUsd),
      desc(companies.strategicRelevanceScore),
      desc(companies.name),
    ];
  }

  const sortColumn = {
    pmFitScore: companies.pmFitScore,
    aiHiringScore: companies.aiHiringScore,
    fundingDate: companies.fundingDate,
    fundingAmountUsd: companies.fundingAmountUsd,
    name: companies.name,
    parisPresenceScore: companies.parisPresenceScore,
    strategicRelevanceScore: companies.strategicRelevanceScore,
  }[sortBy];

  return [orderFn(sortColumn)];
}

export async function queryCompanies(filters: CompanyFilters = {}) {
  return withQueryTimeout(
    (async () => {
  const conditions: SQL[] = [];

  if (filters.country) {
    conditions.push(eq(companies.hqCountry, filters.country));
  }
  if (filters.minParisPresenceScore !== undefined) {
    conditions.push(parisEcosystemCondition(filters.minParisPresenceScore));
  }
  if (filters.fundingRound) {
    conditions.push(eq(companies.fundingRound, filters.fundingRound));
  }
  if (filters.fundingDateFrom) {
    conditions.push(gte(companies.fundingDate, new Date(filters.fundingDateFrom)));
  }
  if (filters.fundingDateTo) {
    conditions.push(lte(companies.fundingDate, new Date(filters.fundingDateTo)));
  }
  if (filters.aiCategory) {
    conditions.push(eq(companies.aiCategory, filters.aiCategory));
  }
  if (filters.minPmFitScore !== undefined) {
    conditions.push(gte(companies.pmFitScore, filters.minPmFitScore));
  }
  if (filters.minAiHiringScore !== undefined) {
    conditions.push(gte(companies.aiHiringScore, filters.minAiHiringScore));
  }
  if (filters.search) {
    conditions.push(
      sql`(${companies.name} ILIKE ${"%" + filters.search + "%"} OR ${companies.description} ILIKE ${"%" + filters.search + "%"})`
    );
  }

  if (filters.savedOnly && filters.userId) {
    conditions.push(sql`${savedCompanies.id} IS NOT NULL`);
  }

  let query = db
    .select({
      company: companies,
      saved: savedCompanies,
    })
    .from(companies)
    .leftJoin(
      savedCompanies,
      filters.userId
        ? and(
            eq(savedCompanies.companyId, companies.id),
            eq(savedCompanies.userId, filters.userId)
          )
        : sql`false`
    )
    .$dynamic();

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const results = await query
    .orderBy(...buildOrderBy(filters))
    .limit(filters.limit ?? 100)
    .offset(filters.offset ?? 0);

  return results.map((r) => ({
    ...normalizeCompany(r.company),
    saved: r.saved
      ? { id: r.saved.id, notes: r.saved.notes, status: r.saved.status }
      : null,
  }));
    })(),
    "Companies query"
  );
}

export async function getCompanyById(id: string, userId?: string) {
  return withQueryTimeout(
    (async () => {
  const [result] = await db
    .select({
      company: companies,
      saved: savedCompanies,
    })
    .from(companies)
    .leftJoin(
      savedCompanies,
      userId
        ? and(eq(savedCompanies.companyId, companies.id), eq(savedCompanies.userId, userId))
        : sql`false`
    )
    .where(eq(companies.id, id))
    .limit(1);

  if (!result) return null;

  return {
    ...normalizeCompany(result.company),
    saved: result.saved
      ? { id: result.saved.id, notes: result.saved.notes, status: result.saved.status }
      : null,
  };
    })(),
    "Company detail"
  );
}

export async function getFilterOptions() {
  return withQueryTimeout(
    (async () => {
      const [row] = await db
        .select({
          countries: sql<string[]>`coalesce(array_agg(distinct ${companies.hqCountry} order by ${companies.hqCountry}) filter (where ${companies.hqCountry} is not null), '{}')`,
          fundingRounds: sql<string[]>`coalesce(array_agg(distinct ${companies.fundingRound} order by ${companies.fundingRound}) filter (where ${companies.fundingRound} is not null), '{}')`,
          aiCategories: sql<string[]>`coalesce(array_agg(distinct ${companies.aiCategory} order by ${companies.aiCategory}) filter (where ${companies.aiCategory} is not null), '{}')`,
        })
        .from(companies);

      return {
        countries: row?.countries ?? [],
        fundingRounds: row?.fundingRounds ?? [],
        aiCategories: row?.aiCategories ?? [],
      };
    })(),
    "Filter options"
  );
}

export async function getCompanyCount() {
  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(companies);
  return result.count;
}

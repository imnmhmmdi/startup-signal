import { and, asc, desc, eq, gte, lte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { companies, savedCompanies } from "@/db/schema";

export type CompanyFilters = {
  country?: string;
  fundingRound?: string;
  fundingDateFrom?: string;
  fundingDateTo?: string;
  aiCategory?: string;
  minPmFitScore?: number;
  minAiHiringScore?: number;
  search?: string;
  savedOnly?: boolean;
  userId?: string;
  sortBy?: "pmFitScore" | "aiHiringScore" | "fundingDate" | "fundingAmountUsd" | "name";
  sortOrder?: "asc" | "desc";
  limit?: number;
  offset?: number;
};

export async function queryCompanies(filters: CompanyFilters = {}) {
  const conditions: SQL[] = [];

  if (filters.country) {
    conditions.push(eq(companies.hqCountry, filters.country));
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

  const sortColumn = {
    pmFitScore: companies.pmFitScore,
    aiHiringScore: companies.aiHiringScore,
    fundingDate: companies.fundingDate,
    fundingAmountUsd: companies.fundingAmountUsd,
    name: companies.name,
  }[filters.sortBy ?? "pmFitScore"];

  const orderFn = filters.sortOrder === "asc" ? asc : desc;

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
    .orderBy(orderFn(sortColumn))
    .limit(filters.limit ?? 100)
    .offset(filters.offset ?? 0);

  return results.map((r) => ({
    ...r.company,
    saved: r.saved
      ? { id: r.saved.id, notes: r.saved.notes, status: r.saved.status }
      : null,
  }));
}

export async function getCompanyById(id: string, userId?: string) {
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
    ...result.company,
    saved: result.saved
      ? { id: result.saved.id, notes: result.saved.notes, status: result.saved.status }
      : null,
  };
}

export async function getFilterOptions() {
  const [countries, rounds, categories] = await Promise.all([
    db
      .selectDistinct({ value: companies.hqCountry })
      .from(companies)
      .where(sql`${companies.hqCountry} IS NOT NULL`)
      .orderBy(asc(companies.hqCountry)),
    db
      .selectDistinct({ value: companies.fundingRound })
      .from(companies)
      .where(sql`${companies.fundingRound} IS NOT NULL`)
      .orderBy(asc(companies.fundingRound)),
    db
      .selectDistinct({ value: companies.aiCategory })
      .from(companies)
      .where(sql`${companies.aiCategory} IS NOT NULL`)
      .orderBy(asc(companies.aiCategory)),
  ]);

  return {
    countries: countries.map((c) => c.value).filter(Boolean) as string[],
    fundingRounds: rounds.map((r) => r.value).filter(Boolean) as string[],
    aiCategories: categories.map((c) => c.value).filter(Boolean) as string[],
  };
}

export async function getCompanyCount() {
  const [result] = await db.select({ count: sql<number>`count(*)::int` }).from(companies);
  return result.count;
}

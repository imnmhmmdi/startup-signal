import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, savedCompanies } from "@/db/schema";
import { PRODUCT } from "@/config/product";

const SIX_MONTHS_AGO = new Date();
SIX_MONTHS_AGO.setMonth(SIX_MONTHS_AGO.getMonth() - 6);

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

export async function getOverviewStats(userId?: string) {
  const frenchCondition = eq(companies.hqCountry, PRODUCT.defaultCountry);
  const recentFunding = gte(companies.fundingDate, SIX_MONTHS_AGO);

  const oneWeekAgo = daysAgo(7);

  const [
    frenchCount,
    recentFundingCount,
    highPmFit,
    openPmRoles,
    pipelineCount,
    recentHighPmFit,
  ] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(companies)
      .where(frenchCondition)
      .then((r) => r[0].count),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(companies)
      .where(and(frenchCondition, recentFunding))
      .then((r) => r[0].count),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(companies)
      .where(and(frenchCondition, gte(companies.pmFitScore, 70)))
      .then((r) => r[0].count),
    db
      .select({ total: sql<number>`coalesce(sum(${companies.pmRoles}), 0)::int` })
      .from(companies)
      .where(frenchCondition)
      .then((r) => r[0].total),
    userId
      ? db
          .select({ count: sql<number>`count(*)::int` })
          .from(savedCompanies)
          .where(eq(savedCompanies.userId, userId))
          .then((r) => r[0].count)
      : Promise.resolve(0),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(companies)
      .where(
        and(
          frenchCondition,
          gte(companies.pmFitScore, 70),
          gte(companies.fundingDate, oneWeekAgo)
        )
      )
      .then((r) => r[0].count),
  ]);

  return {
    frenchStartups: frenchCount,
    recentFundingEvents: recentFundingCount,
    highPmFitCompanies: highPmFit,
    openPmRoles,
    pipelineCount,
    recentHighPmFit,
  };
}

export async function getTopPmFitCompanies(limit = 5) {
  return db
    .select()
    .from(companies)
    .where(eq(companies.hqCountry, PRODUCT.defaultCountry))
    .orderBy(desc(companies.pmFitScore))
    .limit(limit);
}

export async function getRecentFundingEvents(limit = 10) {
  return queryFundingEvents({}, limit);
}

export type FundingQueryFilters = {
  fundingDateFrom?: string;
  fundingDateTo?: string;
  minPmFitScore?: number;
  fundingRound?: string;
};

export async function queryFundingEvents(
  filters: FundingQueryFilters = {},
  limit = 100
) {
  const conditions = [
    eq(companies.hqCountry, PRODUCT.defaultCountry),
    sql`${companies.fundingDate} IS NOT NULL`,
  ];

  if (filters.fundingDateFrom) {
    conditions.push(gte(companies.fundingDate, new Date(filters.fundingDateFrom)));
  }
  if (filters.fundingDateTo) {
    conditions.push(lte(companies.fundingDate, new Date(filters.fundingDateTo)));
  }
  if (filters.minPmFitScore !== undefined) {
    conditions.push(gte(companies.pmFitScore, filters.minPmFitScore));
  }
  if (filters.fundingRound) {
    conditions.push(eq(companies.fundingRound, filters.fundingRound));
  }

  return db
    .select()
    .from(companies)
    .where(and(...conditions))
    .orderBy(desc(companies.fundingDate))
    .limit(limit);
}

export function computeFundingStats(events: { fundingDate: Date | null; pmFitScore: number | null; fundingAmountUsd: number | null }[]) {
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const eventsThisMonth = events.filter(
    (e) => e.fundingDate && new Date(e.fundingDate) >= thisMonthStart
  ).length;

  const highPmFit = events.filter((e) => (e.pmFitScore ?? 0) >= 70).length;

  return {
    totalEvents: events.length,
    eventsThisMonth,
    highPmFit,
  };
}

export async function getStrongHiringSignals(limit = 5) {
  return db
    .select()
    .from(companies)
    .where(
      and(
        eq(companies.hqCountry, PRODUCT.defaultCountry),
        gte(companies.aiHiringScore, 60)
      )
    )
    .orderBy(desc(companies.aiHiringScore))
    .limit(limit);
}

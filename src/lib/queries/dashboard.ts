import { and, desc, eq, gte, sql } from "drizzle-orm";
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
  return db
    .select()
    .from(companies)
    .where(
      and(
        eq(companies.hqCountry, PRODUCT.defaultCountry),
        sql`${companies.fundingDate} IS NOT NULL`
      )
    )
    .orderBy(desc(companies.fundingDate))
    .limit(limit);
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

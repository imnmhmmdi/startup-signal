import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { companies, rawFundingItems, ingestionRuns } from "@/db/schema";
import type { DataSourceAdapter, NormalizedCompany } from "./types";
import { getAllAdapters } from "./adapters";
import { extractDomain, slugify } from "./utils";
import { buildLogoUrlFromDomain, getCompanyDomain } from "@/lib/company-logo";

export async function ingestFromAdapter(adapter: DataSourceAdapter) {
  const run = await db
    .insert(ingestionRuns)
    .values({
      jobName: "ingest_funding_news",
      sourceName: adapter.sourceName,
      status: "running",
    })
    .returning();

  let itemsProcessed = 0;
  let itemsCreated = 0;
  let itemsUpdated = 0;

  try {
    const rawItems = await adapter.fetchFundingItems();

    for (const rawItem of rawItems) {
      itemsProcessed++;

      await db
        .insert(rawFundingItems)
        .values({
          sourceName: adapter.sourceName,
          externalId: rawItem.externalId,
          rawData: rawItem.raw,
        })
        .onConflictDoNothing();

      const normalized = await adapter.normalize(rawItem);
      if (!normalized) continue;

      const result = await upsertCompany(normalized, adapter.sourceName);
      if (result === "created") itemsCreated++;
      if (result === "updated") itemsUpdated++;
    }

    await db
      .update(ingestionRuns)
      .set({
        status: "completed",
        itemsProcessed,
        itemsCreated,
        itemsUpdated,
        completedAt: new Date(),
      })
      .where(eq(ingestionRuns.id, run[0].id));
  } catch (error) {
    await db
      .update(ingestionRuns)
      .set({
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        completedAt: new Date(),
      })
      .where(eq(ingestionRuns.id, run[0].id));
    throw error;
  }

  return { itemsProcessed, itemsCreated, itemsUpdated };
}

export async function ingestAllSources() {
  const adapters = getAllAdapters();
  const results = [];

  for (const adapter of adapters) {
    const result = await ingestFromAdapter(adapter);
    results.push({ source: adapter.sourceName, ...result });
  }

  return results;
}

async function upsertCompany(
  normalized: NormalizedCompany,
  sourceName: string
): Promise<"created" | "updated" | "skipped"> {
  const domain = extractDomain(normalized.website);
  const slug = slugify(normalized.name);
  const resolvedLogoUrl =
    normalized.logoUrl ??
    (domain ? buildLogoUrlFromDomain(domain) : undefined);

  const existing = domain
    ? await db
        .select()
        .from(companies)
        .where(or(eq(companies.websiteDomain, domain), eq(companies.slug, slug)))
        .limit(1)
    : await db.select().from(companies).where(eq(companies.slug, slug)).limit(1);

  const dataHash = computeDataHash({
    name: normalized.name,
    fundingAmountUsd: normalized.fundingAmountUsd,
    fundingRound: normalized.fundingRound,
    fundingDate: normalized.fundingDate?.toISOString(),
    openRolesTotal: normalized.openRolesTotal,
  });

  if (existing.length > 0) {
    const company = existing[0];
    const mergedSources = { ...company.sources, ...normalized.sources };

    const effectiveDomain = domain ?? getCompanyDomain(company);
    const logoUrl =
      company.logoUrl ??
      resolvedLogoUrl ??
      (effectiveDomain ? buildLogoUrlFromDomain(effectiveDomain) : undefined);

    await db
      .update(companies)
      .set({
        fundingAmountUsd: normalized.fundingAmountUsd ?? company.fundingAmountUsd,
        fundingRound: normalized.fundingRound ?? company.fundingRound,
        fundingDate: normalized.fundingDate ?? company.fundingDate,
        hqCountry: normalized.hqCountry ?? company.hqCountry,
        hqCity: normalized.hqCity ?? company.hqCity,
        aiCategory: normalized.aiCategory ?? company.aiCategory,
        businessModel: normalized.businessModel ?? company.businessModel,
        description: normalized.description ?? company.description,
        website: normalized.website ?? company.website,
        websiteDomain: effectiveDomain ?? company.websiteDomain,
        logoUrl,
        sources: mergedSources,
        dataHash,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, company.id));

    return "updated";
  }

  await db.insert(companies).values({
    name: normalized.name,
    slug,
    website: normalized.website,
    websiteDomain: domain,
    linkedinUrl: normalized.linkedinUrl,
    logoUrl: resolvedLogoUrl,
    hqCity: normalized.hqCity,
    hqCountry: normalized.hqCountry,
    fundingAmountUsd: normalized.fundingAmountUsd,
    fundingRound: normalized.fundingRound,
    fundingDate: normalized.fundingDate,
    investors: normalized.investors ?? [],
    industry: normalized.industry,
    subcategory: normalized.subcategory,
    aiCategory: normalized.aiCategory,
    businessModel: normalized.businessModel,
    isOpenSource: normalized.isOpenSource ?? false,
    githubStars: normalized.githubStars,
    hiringPageUrl: normalized.hiringPageUrl,
    openRolesTotal: normalized.openRolesTotal ?? 0,
    pmRoles: normalized.pmRoles ?? 0,
    aiRoles: normalized.aiRoles ?? 0,
    engRoles: normalized.engRoles ?? 0,
    workMode: normalized.workMode,
    visaSponsorship: normalized.visaSponsorship,
    languagesRequired: normalized.languagesRequired ?? [],
    sources: normalized.sources,
    description: normalized.description,
    dataHash,
  });

  return "created";
}

export async function upsertSeedCompany(normalized: NormalizedCompany) {
  return upsertCompany(normalized, "seed");
}

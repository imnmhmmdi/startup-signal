import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, rawFundingItems, ingestionRuns } from "@/db/schema";
import type { DataSourceAdapter, NormalizedCompany, SourceKind } from "./types";
import { getAllAdapters } from "./adapters";
import { hasConfirmedDomain } from "./article-enricher";
import { buildDedupKeys, findExistingCompany } from "./dedup";
import { computeDataHash, extractDomain, normalizeCompanyName, slugify } from "./utils";
import { buildLogoUrlFromDomain, getCompanyDomain } from "@/lib/company-logo";
import { computeDiscoveryConfidence } from "@/lib/scoring/discovery-confidence";
import { computeParisPresenceScore } from "@/lib/scoring/paris-presence";

function mergeDiscoverySources(existing: string[] | null | undefined, incoming: string[]): string[] {
  return [...new Set([...(existing ?? []), ...incoming])];
}

function resolveSourceKind(
  sourceName: string,
  normalized: NormalizedCompany
): SourceKind {
  return normalized.sourceKind ?? (sourceName === "seed" ? "seed" : "rss");
}

function buildCompanySnapshot(
  normalized: NormalizedCompany,
  sourceName: string,
  existing?: typeof companies.$inferSelect
) {
  const domain = extractDomain(normalized.website) ?? normalized.websiteDomain;
  const slug = slugify(normalized.name);
  const normalizedName = normalized.normalizedName ?? normalizeCompanyName(normalized.name);
  const discoverySources = mergeDiscoverySources(
    existing?.discoverySources,
    normalized.discoverySources ?? [sourceName]
  );
  const mergedSources = { ...(existing?.sources ?? {}), ...normalized.sources };

  const website = normalized.website ?? existing?.website;
  const websiteDomain = domain ?? existing?.websiteDomain;
  const linkedinUrl = normalized.linkedinUrl ?? existing?.linkedinUrl;
  const effectiveDomain = websiteDomain ?? getCompanyDomain(existing ?? { website, websiteDomain });

  const draft = {
    name: existing?.name ?? normalized.name,
    slug,
    normalizedName,
    website,
    websiteDomain: effectiveDomain,
    linkedinUrl,
    logoUrl:
      normalized.logoUrl ??
      existing?.logoUrl ??
      (effectiveDomain ? buildLogoUrlFromDomain(effectiveDomain) : undefined),
    hqCity: normalized.hqCity ?? existing?.hqCity,
    hqCountry: normalized.hqCountry ?? existing?.hqCountry,
    fundingAmountUsd: normalized.fundingAmountUsd ?? existing?.fundingAmountUsd,
    fundingRound: normalized.fundingRound ?? existing?.fundingRound,
    fundingDate: normalized.fundingDate ?? existing?.fundingDate,
    investors: normalized.investors ?? existing?.investors ?? [],
    industry: normalized.industry ?? existing?.industry,
    subcategory: normalized.subcategory ?? existing?.subcategory,
    aiCategory: normalized.aiCategory ?? existing?.aiCategory,
    businessModel: normalized.businessModel ?? existing?.businessModel,
    isOpenSource: normalized.isOpenSource ?? existing?.isOpenSource ?? false,
    githubStars: normalized.githubStars ?? existing?.githubStars,
    hiringPageUrl: normalized.hiringPageUrl ?? existing?.hiringPageUrl,
    openRolesTotal: normalized.openRolesTotal ?? existing?.openRolesTotal ?? 0,
    pmRoles: normalized.pmRoles ?? existing?.pmRoles ?? 0,
    aiRoles: normalized.aiRoles ?? existing?.aiRoles ?? 0,
    engRoles: normalized.engRoles ?? existing?.engRoles ?? 0,
    workMode: normalized.workMode ?? existing?.workMode,
    visaSponsorship: normalized.visaSponsorship ?? existing?.visaSponsorship,
    languagesRequired: normalized.languagesRequired ?? existing?.languagesRequired ?? [],
    description: normalized.description ?? existing?.description,
    sources: mergedSources,
    discoverySources,
    dataHash: computeDataHash({
      name: normalized.name,
      fundingAmountUsd: normalized.fundingAmountUsd ?? existing?.fundingAmountUsd,
      fundingRound: normalized.fundingRound ?? existing?.fundingRound,
      fundingDate: (normalized.fundingDate ?? existing?.fundingDate)?.toISOString(),
      openRolesTotal: normalized.openRolesTotal ?? existing?.openRolesTotal,
    }),
  };

  const sourceKind = resolveSourceKind(sourceName, normalized);
  const discoveryConfidence = computeDiscoveryConfidence(
    { discoverySources },
    {
      sourceKind,
      hasConfirmedDomain: hasConfirmedDomain(draft.website, draft.websiteDomain),
    }
  );

  const parisPresence = computeParisPresenceScore({
    ...existing,
    ...draft,
    discoverySources,
    sources: mergedSources,
  } as typeof companies.$inferSelect);

  return {
    ...draft,
    discoveryConfidence,
    parisPresenceScore: parisPresence.score,
    parisPresenceBreakdown: parisPresence.breakdown,
  };
}

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

      const [insertedRaw] = await db
        .insert(rawFundingItems)
        .values({
          sourceName: adapter.sourceName,
          externalId: rawItem.externalId,
          rawData: rawItem.raw,
        })
        .onConflictDoNothing()
        .returning({ id: rawFundingItems.id });

      const normalized = await adapter.normalize(rawItem);
      if (!normalized) continue;

      const result = await upsertCompany(normalized, adapter.sourceName);

      if (insertedRaw?.id && result.companyId) {
        await db
          .update(rawFundingItems)
          .set({ companyId: result.companyId, processed: true })
          .where(eq(rawFundingItems.id, insertedRaw.id));
      }

      if (result.status === "created") itemsCreated++;
      if (result.status === "updated") itemsUpdated++;
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
): Promise<{ status: "created" | "updated" | "skipped"; companyId?: string }> {
  const slug = slugify(normalized.name);
  const domain = extractDomain(normalized.website) ?? normalized.websiteDomain;

  const existing = await findExistingCompany(
    buildDedupKeys({
      name: normalized.name,
      website: normalized.website,
      websiteDomain: domain,
      linkedinUrl: normalized.linkedinUrl,
      slug,
    })
  );

  const snapshot = buildCompanySnapshot(normalized, sourceName, existing ?? undefined);

  if (existing) {
    await db
      .update(companies)
      .set({
        ...snapshot,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, existing.id));

    return { status: "updated", companyId: existing.id };
  }

  const [created] = await db
    .insert(companies)
    .values({
      ...snapshot,
    })
    .returning({ id: companies.id });

  return { status: "created", companyId: created.id };
}

export async function upsertSeedCompany(normalized: NormalizedCompany) {
  return upsertCompany(
    {
      ...normalized,
      discoverySources: normalized.discoverySources ?? ["seed"],
      sourceKind: "seed",
    },
    "seed"
  );
}

export async function backfillDiscoveryScores() {
  const allCompanies = await db.select().from(companies);

  for (const company of allCompanies) {
    const discoverySources = company.discoverySources ?? [];
    const sourceKind: SourceKind = discoverySources.includes("seed") ? "seed" : "rss";
    const discoveryConfidence = computeDiscoveryConfidence(
      { discoverySources },
      {
        sourceKind,
        hasConfirmedDomain: hasConfirmedDomain(company.website, company.websiteDomain),
      }
    );
    const parisPresence = computeParisPresenceScore(company);

    await db
      .update(companies)
      .set({
        normalizedName: company.normalizedName ?? normalizeCompanyName(company.name),
        discoverySources: discoverySources.length > 0 ? discoverySources : ["seed"],
        discoveryConfidence,
        parisPresenceScore: parisPresence.score,
        parisPresenceBreakdown: parisPresence.breakdown,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, company.id));
  }

  return allCompanies.length;
}

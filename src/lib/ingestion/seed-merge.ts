import type { Company } from "@/db/schema";
import type { NormalizedCompany } from "./types";
import {
  resolveStrategicRelevanceScore,
} from "@/lib/scoring/strategic-relevance";

export type SeedMergeChange = {
  field: string;
  from: unknown;
  to: unknown;
};

const GENERIC_DESCRIPTION_PATTERN =
  /^(?:an?\s+)?(?:ai|artificial intelligence)[\w\s,-]{0,80}(?:platform|company|startup|tool|solution)\.?$/i;

export function isWeakDescription(description: string | null | undefined): boolean {
  const text = description?.trim();
  if (!text) return true;
  if (text.length < 80) return true;
  if (GENERIC_DESCRIPTION_PATTERN.test(text)) return true;
  return false;
}

export function descriptionRichness(description: string): number {
  const text = description.trim();
  let score = text.length;
  const signals = text.match(
    /paris|france|office|hiring|pm\b|product team|engineering team|funding|series|europe/gi
  );
  if (signals) score += signals.length * 25;
  return score;
}

export function pickSeedDescription(
  existing: string | null | undefined,
  seed: string | null | undefined
): string | undefined {
  const seedText = seed?.trim();
  if (!seedText) return existing?.trim() || undefined;

  const existingText = existing?.trim();
  if (!existingText) return seedText;

  if (
    isWeakDescription(existingText) &&
    descriptionRichness(seedText) > descriptionRichness(existingText)
  ) {
    return seedText;
  }

  return existingText;
}

function fillString(
  existing: string | null | undefined,
  seed: string | undefined
): string | undefined {
  const existingText = existing?.trim();
  if (existingText) return existingText;
  return seed?.trim() || undefined;
}

function keepExistingNumber(
  existing: number | null | undefined,
  seed: number | undefined
): number | undefined {
  if (existing != null) return existing;
  return seed;
}

function fillHiringCount(
  existing: number | null | undefined,
  seed: number | undefined
): number | undefined {
  if ((existing ?? 0) > 0) return existing ?? 0;
  if ((seed ?? 0) > 0) return seed;
  return existing ?? seed ?? 0;
}

function recordChange(
  changes: SeedMergeChange[],
  field: string,
  from: unknown,
  to: unknown
): void {
  const fromEmpty = from == null || (Array.isArray(from) && from.length === 0);
  const toEmpty = to == null || (Array.isArray(to) && to.length === 0);
  if (fromEmpty && toEmpty) return;
  if (Object.is(from, to)) return;
  changes.push({ field, from, to });
}

export function mergeSeedIntoExisting(
  existing: Company,
  seed: NormalizedCompany
): { merged: NormalizedCompany; changes: SeedMergeChange[] } {
  const changes: SeedMergeChange[] = [];

  const pick = <TOut>(
    field: string,
    existingValue: unknown,
    nextValue: TOut
  ): TOut => {
    recordChange(changes, field, existingValue, nextValue);
    return nextValue;
  };

  const description = pick(
    "description",
    existing.description,
    pickSeedDescription(existing.description, seed.description) ?? existing.description ?? undefined
  );

  const merged: NormalizedCompany = {
    name: existing.name,
    normalizedName: existing.normalizedName ?? seed.normalizedName,
    website: pick("website", existing.website, fillString(existing.website, seed.website)),
    websiteDomain: pick(
      "websiteDomain",
      existing.websiteDomain,
      fillString(existing.websiteDomain, seed.websiteDomain)
    ),
    linkedinUrl: pick(
      "linkedinUrl",
      existing.linkedinUrl,
      fillString(existing.linkedinUrl, seed.linkedinUrl) ?? existing.linkedinUrl ?? undefined
    ),
    logoUrl: pick("logoUrl", existing.logoUrl, fillString(existing.logoUrl, seed.logoUrl)),
    hqCity: pick("hqCity", existing.hqCity, fillString(existing.hqCity, seed.hqCity)),
    hqCountry: pick(
      "hqCountry",
      existing.hqCountry,
      fillString(existing.hqCountry, seed.hqCountry)
    ),
    fundingAmountUsd: pick(
      "fundingAmountUsd",
      existing.fundingAmountUsd,
      keepExistingNumber(existing.fundingAmountUsd, seed.fundingAmountUsd)
    ),
    fundingRound: pick(
      "fundingRound",
      existing.fundingRound,
      fillString(existing.fundingRound, seed.fundingRound)
    ),
    fundingDate: pick(
      "fundingDate",
      existing.fundingDate,
      existing.fundingDate ?? seed.fundingDate
    ),
    investors: pick(
      "investors",
      existing.investors,
      ((existing.investors?.length ?? 0) > 0
        ? existing.investors
        : seed.investors ?? existing.investors) ?? []
    ),
    industry: pick("industry", existing.industry, fillString(existing.industry, seed.industry)),
    subcategory: pick(
      "subcategory",
      existing.subcategory,
      fillString(existing.subcategory, seed.subcategory)
    ),
    aiCategory: pick(
      "aiCategory",
      existing.aiCategory,
      fillString(existing.aiCategory, seed.aiCategory)
    ),
    businessModel: pick(
      "businessModel",
      existing.businessModel,
      fillString(existing.businessModel, seed.businessModel)
    ),
    isOpenSource: pick(
      "isOpenSource",
      existing.isOpenSource,
      existing.isOpenSource || seed.isOpenSource || false
    ),
    githubStars: pick(
      "githubStars",
      existing.githubStars,
      keepExistingNumber(existing.githubStars, seed.githubStars)
    ),
    hiringPageUrl: pick(
      "hiringPageUrl",
      existing.hiringPageUrl,
      fillString(existing.hiringPageUrl, seed.hiringPageUrl)
    ),
    openRolesTotal: pick(
      "openRolesTotal",
      existing.openRolesTotal,
      fillHiringCount(existing.openRolesTotal, seed.openRolesTotal)
    ),
    pmRoles: pick("pmRoles", existing.pmRoles, fillHiringCount(existing.pmRoles, seed.pmRoles)),
    aiRoles: pick("aiRoles", existing.aiRoles, fillHiringCount(existing.aiRoles, seed.aiRoles)),
    engRoles: pick("engRoles", existing.engRoles, fillHiringCount(existing.engRoles, seed.engRoles)),
    workMode: pick("workMode", existing.workMode, fillString(existing.workMode, seed.workMode)),
    visaSponsorship: pick(
      "visaSponsorship",
      existing.visaSponsorship,
      existing.visaSponsorship ?? seed.visaSponsorship
    ),
    languagesRequired: pick(
      "languagesRequired",
      existing.languagesRequired,
      ((existing.languagesRequired?.length ?? 0) > 0
        ? existing.languagesRequired
        : seed.languagesRequired ?? existing.languagesRequired) ?? []
    ),
    description,
    strategicRelevanceScore: pick(
      "strategicRelevanceScore",
      existing.strategicRelevanceScore,
      resolveStrategicRelevanceScore(
        existing.strategicRelevanceScore,
        seed.strategicRelevanceScore
      )
    ),
    discoverySources: [
      ...new Set([
        ...(existing.discoverySources ?? []),
        ...(seed.discoverySources ?? ["seed"]),
      ]),
    ],
    sourceKind: "seed",
    sources: { ...(existing.sources ?? {}), ...seed.sources },
  };

  return { merged, changes };
}

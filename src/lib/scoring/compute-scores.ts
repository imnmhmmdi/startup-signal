import type { Company } from "@/db/schema";
import {
  AI_HIRING_SCORE_WEIGHTS,
  CATEGORY_BONUS_CATEGORIES,
  FUNDING_RECENCY_DAYS,
  PM_FIT_NEGATIVE_RULES,
  PM_FIT_POSITIVE_RULES,
  BASE_PM_FIT_SCORE,
} from "@/config/scoring";
import { hasConfirmedDomain } from "@/lib/ingestion/article-enricher";
import { computeDiscoveryConfidence } from "@/lib/scoring/discovery-confidence";
import { computeParisPresenceScore } from "@/lib/scoring/paris-presence";
import type { SourceKind } from "@/lib/ingestion/types";

export type ScoreBreakdown = Record<string, number>;

export function computeAiHiringScore(company: Company): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const breakdown: ScoreBreakdown = {};
  const w = AI_HIRING_SCORE_WEIGHTS;

  if (company.fundingDate) {
    const daysSince = Math.floor(
      (Date.now() - new Date(company.fundingDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    const recencyScore = Math.max(0, 100 - (daysSince / FUNDING_RECENCY_DAYS) * 100);
    breakdown.fundingRecency = Math.round(recencyScore * w.fundingRecency);
  } else {
    breakdown.fundingRecency = 0;
  }

  if (company.fundingAmountUsd) {
    const amountScore = Math.min(100, Math.log10(company.fundingAmountUsd + 1) * 20);
    breakdown.fundingAmount = Math.round(amountScore * w.fundingAmount);
  } else {
    breakdown.fundingAmount = 0;
  }

  const roleScore = Math.min(100, (company.openRolesTotal ?? 0) * 10);
  breakdown.openRoleCount = Math.round(roleScore * w.openRoleCount);

  const aiRoleRatio =
    company.openRolesTotal && company.openRolesTotal > 0
      ? ((company.aiRoles ?? 0) / company.openRolesTotal) * 100
      : company.aiCategory ? 60 : 20;
  breakdown.aiFocus = Math.round(Math.min(100, aiRoleRatio) * w.aiFocus);

  let categoryBonus = 0;
  const categoryText = [
    company.aiCategory,
    company.businessModel,
    company.industry,
    company.subcategory,
  ]
    .filter(Boolean)
    .join(" ");

  for (const cat of CATEGORY_BONUS_CATEGORIES) {
    if (categoryText.toLowerCase().includes(cat.toLowerCase())) {
      categoryBonus = 80;
      break;
    }
  }
  if (categoryBonus === 0 && company.aiCategory) categoryBonus = 40;
  breakdown.categoryBonus = Math.round(categoryBonus * w.categoryBonus);

  const score = Math.min(
    100,
    Math.max(0, Object.values(breakdown).reduce((a, b) => a + b, 0))
  );

  return { score, breakdown };
}

export function computePmFitScore(company: Company): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const breakdown: ScoreBreakdown = {};
  let score = BASE_PM_FIT_SCORE;
  const rules = PM_FIT_POSITIVE_RULES;
  const negatives = PM_FIT_NEGATIVE_RULES;

  const text = [
    company.name,
    company.aiCategory,
    company.businessModel,
    company.industry,
    company.subcategory,
    company.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if ((company.pmRoles ?? 0) > 0) {
    breakdown.seniorPmRoleOpen = rules.seniorPmRoleOpen;
    score += rules.seniorPmRoleOpen;
  }

  if (/ai product|ai infrastructure|ai infra/.test(text)) {
    breakdown.aiProductOrInfra = rules.aiProductOrInfra;
    score += rules.aiProductOrInfra;
  }

  if (/b2b saas|enterprise saas|b2b/.test(text)) {
    breakdown.b2bSaasOrEnterprise = rules.b2bSaasOrEnterprise;
    score += rules.b2bSaasOrEnterprise;
  }

  if (/healthcare|medtech|clinical/.test(text)) {
    breakdown.healthcareAi = rules.healthcareAi;
    score += rules.healthcareAi;
  }

  if (/agentic|llm|data platform/.test(text)) {
    breakdown.agenticAiLlmDataPlatform = rules.agenticAiLlmDataPlatform;
    score += rules.agenticAiLlmDataPlatform;
  }

  if (/marketplace/.test(text)) {
    breakdown.marketplace = rules.marketplace;
    score += rules.marketplace;
  }

  if (/series b|series c|series d|growth/.test(text.toLowerCase()) ||
      ["Series B", "Series C", "Series D+", "Growth"].includes(company.fundingRound ?? "")) {
    breakdown.seriesBOrLater = rules.seriesBOrLater;
    score += rules.seriesBOrLater;
  }

  if (/industrial simulation|simulation software/.test(text)) {
    breakdown.industrialSimulation = negatives.industrialSimulation;
    score += negatives.industrialSimulation;
  }

  if (/embedded|hardware|chip|semiconductor/.test(text)) {
    breakdown.embeddedHardware = negatives.embeddedHardware;
    score += negatives.embeddedHardware;
  }

  if (/defense|military|defence/.test(text)) {
    breakdown.defense = negatives.defense;
    score += negatives.defense;
  }

  if (/consulting|professional services/.test(text) && !/saas|platform/.test(text)) {
    breakdown.pureConsulting = negatives.pureConsulting;
    score += negatives.pureConsulting;
  }

  const langs = company.languagesRequired ?? [];
  if (langs.some((l) => l.toLowerCase().includes("french") && !l.toLowerCase().includes("english"))) {
    breakdown.nativeFrenchRequired = negatives.nativeFrenchRequired;
    score += negatives.nativeFrenchRequired;
  }

  if ((company.openRolesTotal ?? 0) > 0 && (company.pmRoles ?? 0) === 0 &&
      (company.aiRoles ?? 0) > 0 && /research|scientist|phd/.test(text)) {
    breakdown.onlyResearchRoles = negatives.onlyResearchRoles;
    score += negatives.onlyResearchRoles;
  }

  return { score: Math.min(100, Math.max(0, score)), breakdown };
}

export async function computeAllScores(db: typeof import("@/db").db) {
  const { companies } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  const allCompanies = await db.select().from(companies);

  for (const company of allCompanies) {
    const aiHiring = computeAiHiringScore(company);
    const pmFit = computePmFitScore(company);
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
        aiHiringScore: aiHiring.score,
        pmFitScore: pmFit.score,
        aiHiringScoreBreakdown: aiHiring.breakdown,
        pmFitScoreBreakdown: pmFit.breakdown,
        discoveryConfidence,
        parisPresenceScore: parisPresence.score,
        parisPresenceBreakdown: parisPresence.breakdown,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, company.id));
  }

  return allCompanies.length;
}

export const AI_HIRING_SCORE_WEIGHTS = {
  fundingRecency: 0.25,
  fundingAmount: 0.15,
  openRoleCount: 0.2,
  aiFocus: 0.2,
  categoryBonus: 0.2,
} as const;

export const PM_FIT_POSITIVE_RULES = {
  seniorPmRoleOpen: 20,
  aiProductOrInfra: 15,
  b2bSaasOrEnterprise: 12,
  healthcareAi: 10,
  agenticAiLlmDataPlatform: 10,
  marketplace: 8,
  seriesBOrLater: 5,
} as const;

export const PM_FIT_NEGATIVE_RULES = {
  industrialSimulation: -20,
  embeddedHardware: -20,
  defense: -20,
  pureConsulting: -15,
  nativeFrenchRequired: -15,
  onlyResearchRoles: -10,
} as const;

export const CATEGORY_BONUS_CATEGORIES = [
  "B2B",
  "Infrastructure",
  "Developer Tools",
  "Healthcare",
  "Marketplace",
] as const;

export const FUNDING_RECENCY_DAYS = 180;

export const BASE_PM_FIT_SCORE = 50;

export const SCORE_BREAKDOWN_LABELS: Record<string, string> = {
  fundingRecency: "Funding recency",
  fundingAmount: "Funding amount",
  openRoleCount: "Open roles",
  aiFocus: "AI focus",
  categoryBonus: "Sector bonus",
  seniorPmRoleOpen: "Senior PM role open",
  aiProductOrInfra: "AI product / infrastructure",
  b2bSaasOrEnterprise: "B2B / enterprise SaaS",
  healthcareAi: "Healthcare AI",
  agenticAiLlmDataPlatform: "Agentic AI / LLM / data platform",
  marketplace: "Marketplace",
  seriesBOrLater: "Series B or later",
  industrialSimulation: "Industrial simulation",
  embeddedHardware: "Embedded / hardware",
  defense: "Defense sector",
  pureConsulting: "Pure consulting",
  nativeFrenchRequired: "Native French required",
  onlyResearchRoles: "Research-only roles",
};

export function getBreakdownLabel(key: string): string {
  return SCORE_BREAKDOWN_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").trim();
}

export function getTopPmFitReason(
  breakdown: Record<string, number> | null | undefined
): string | null {
  if (!breakdown) return null;

  const top = Object.entries(breakdown)
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])[0];

  if (!top) return null;

  const label = getBreakdownLabel(top[0]);
  const maxLength = 60;
  if (label.length <= maxLength) return label;
  return `${label.slice(0, maxLength - 1).trim()}…`;
}

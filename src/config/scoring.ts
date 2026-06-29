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

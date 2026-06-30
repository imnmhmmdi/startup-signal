import type { Company, CompanyBriefContent } from "@/db/schema";

export function coerceStringArray(value: unknown, field = "array"): string[] {
  if (value == null) return [];

  if (Array.isArray(value)) {
    const strings = value.filter((item): item is string => typeof item === "string");
    if (strings.length !== value.length) {
      logMalformedField(field, "non-string entries removed");
    }
    return strings;
  }

  if (typeof value === "string") {
    try {
      return coerceStringArray(JSON.parse(value), field);
    } catch {
      logMalformedField(field, "string value is not valid JSON array");
      return [];
    }
  }

  logMalformedField(field, `expected array, got ${typeof value}`);
  return [];
}

export function coerceScoreBreakdown(
  value: unknown,
  field = "breakdown"
): Record<string, number> | null {
  if (value == null) return null;

  let record: Record<string, unknown>;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        logMalformedField(field, "parsed JSON is not an object");
        return null;
      }
      record = parsed as Record<string, unknown>;
    } catch {
      logMalformedField(field, "string value is not valid JSON object");
      return null;
    }
  } else if (typeof value === "object" && !Array.isArray(value)) {
    record = value as Record<string, unknown>;
  } else {
    logMalformedField(field, `expected object, got ${typeof value}`);
    return null;
  }

  const result: Record<string, number> = {};
  for (const [key, raw] of Object.entries(record)) {
    if (typeof raw === "number" && Number.isFinite(raw)) {
      result[key] = raw;
    }
  }

  return Object.keys(result).length > 0 ? result : null;
}

function coerceScore(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function logMalformedField(field: string, detail: string): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      event: "malformed_company_field",
      field,
      detail,
      timestamp: new Date().toISOString(),
    })
  );
}

export function normalizeCompany(company: Company): Company {
  return {
    ...company,
    name: typeof company.name === "string" && company.name.trim() ? company.name : "Unknown company",
    slug: typeof company.slug === "string" ? company.slug : company.id,
    investors: coerceStringArray(company.investors, "investors"),
    languagesRequired: coerceStringArray(company.languagesRequired, "languagesRequired"),
    discoverySources: coerceStringArray(company.discoverySources, "discoverySources"),
    parisPresenceBreakdown: coerceScoreBreakdown(
      company.parisPresenceBreakdown,
      "parisPresenceBreakdown"
    ),
    pmFitScoreBreakdown: coerceScoreBreakdown(company.pmFitScoreBreakdown, "pmFitScoreBreakdown"),
    aiHiringScoreBreakdown: coerceScoreBreakdown(
      company.aiHiringScoreBreakdown,
      "aiHiringScoreBreakdown"
    ),
    pmFitScore: coerceScore(company.pmFitScore),
    aiHiringScore: coerceScore(company.aiHiringScore),
    parisPresenceScore: coerceScore(company.parisPresenceScore),
    discoveryConfidence: coerceScore(company.discoveryConfidence),
    openRolesTotal: coerceScore(company.openRolesTotal),
    pmRoles: coerceScore(company.pmRoles),
    aiRoles: coerceScore(company.aiRoles),
    engRoles: coerceScore(company.engRoles),
  };
}

export function normalizeCompanies(companies: Company[]): Company[] {
  return companies.map(normalizeCompany);
}

const EMPTY_BRIEF: CompanyBriefContent = {
  whyNow: "Brief unavailable — company data may still be loading.",
  whyThisCompany: "Review the company profile for the latest details.",
  whyTheyMayHirePMs: "Hiring signals are shown in the score breakdown when available.",
  suggestedOutreachStrategy: "Connect with product leadership on LinkedIn.",
  linkedinMessage: "",
  resumeFocus: "Emphasize relevant product leadership experience.",
  interviewPrepTopics: ["Product strategy", "Team scaling"],
  risks: ["Limited brief data available"],
};

export function normalizeCompanyBrief(brief: unknown): CompanyBriefContent {
  if (!brief || typeof brief !== "object" || Array.isArray(brief)) {
    logMalformedField("brief", "expected object");
    return EMPTY_BRIEF;
  }

  const source = brief as Record<string, unknown>;

  return {
    whyNow: coerceString(source.whyNow, EMPTY_BRIEF.whyNow),
    whyThisCompany: coerceString(source.whyThisCompany, EMPTY_BRIEF.whyThisCompany),
    whyTheyMayHirePMs: coerceString(source.whyTheyMayHirePMs, EMPTY_BRIEF.whyTheyMayHirePMs),
    suggestedOutreachStrategy: coerceString(
      source.suggestedOutreachStrategy,
      EMPTY_BRIEF.suggestedOutreachStrategy
    ),
    linkedinMessage: coerceString(source.linkedinMessage, EMPTY_BRIEF.linkedinMessage),
    resumeFocus: coerceString(source.resumeFocus, EMPTY_BRIEF.resumeFocus),
    interviewPrepTopics: coerceStringArray(source.interviewPrepTopics, "interviewPrepTopics"),
    risks: coerceStringArray(source.risks, "risks"),
  };
}

function coerceString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

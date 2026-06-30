import { eq } from "drizzle-orm";
import { db } from "@/db";
import { companies, companyBriefs, type Company, type CompanyBriefContent } from "@/db/schema";
import { normalizeCompanyBrief } from "@/lib/company/normalize-company";
import { withQueryTimeout } from "@/lib/db/with-query-timeout";
import { IMAN_PROFILE } from "@/config/pm-profile";
import { computeDataHash } from "@/lib/ingestion/utils";

export async function generateCompanyBrief(company: Company): Promise<CompanyBriefContent> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildBriefPrompt(company);

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from LLM");
  }

  return parseBriefResponse(textBlock.text);
}

function buildBriefPrompt(company: Company): string {
  return `You are a career advisor for an experienced Product Manager evaluating European AI startups.

## Candidate Profile
${IMAN_PROFILE.background}

Target roles: ${IMAN_PROFILE.targetRoles.join(", ")}
Preferred categories: ${IMAN_PROFILE.preferredCategories.join(", ")}

## Company Data
Name: ${company.name}
Country: ${company.hqCountry ?? "Unknown"} (${company.hqCity ?? ""})
Website: ${company.website ?? "Unknown"}
Industry: ${company.industry ?? "AI"}
AI Category: ${company.aiCategory ?? "Unknown"}
Business Model: ${company.businessModel ?? "Unknown"}
Funding: ${company.fundingRound ?? "Unknown"} - $${company.fundingAmountUsd?.toLocaleString() ?? "Unknown"} on ${company.fundingDate ? new Date(company.fundingDate).toLocaleDateString() : "Unknown"}
Investors: ${(company.investors ?? []).join(", ") || "Unknown"}

## Hiring Data
Open roles: ${company.openRolesTotal ?? 0} (PM: ${company.pmRoles ?? 0}, AI: ${company.aiRoles ?? 0}, Eng: ${company.engRoles ?? 0})
Work mode: ${company.workMode ?? "Unknown"}
Visa sponsorship: ${company.visaSponsorship ? "Yes" : "Unknown"}

## Scores
AI Hiring Score: ${company.aiHiringScore}/100
PM Fit Score: ${company.pmFitScore}/100
AI Hiring breakdown: ${JSON.stringify(company.aiHiringScoreBreakdown ?? {})}
PM Fit breakdown: ${JSON.stringify(company.pmFitScoreBreakdown ?? {})}

## Description
${company.description ?? "No description available"}

Respond with ONLY valid JSON in this exact structure:
{
  "whyNow": "2-3 sentences on timing",
  "whyThisCompany": "2-3 sentences on company fit",
  "whyTheyMayHirePMs": "2-3 sentences on PM hiring likelihood",
  "suggestedOutreachStrategy": "2-3 sentences on how to approach",
  "linkedinMessage": "Under 300 characters, personalized outreach message",
  "resumeFocus": "2-3 bullet points on what to emphasize",
  "interviewPrepTopics": ["topic1", "topic2", "topic3", "topic4", "topic5"],
  "risks": ["risk1", "risk2", "risk3"]
}`;
}

function parseBriefResponse(text: string): CompanyBriefContent {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse LLM response as JSON");
  }
  return JSON.parse(jsonMatch[0]) as CompanyBriefContent;
}

export async function getCompanyBrief(
  companyId: string
): Promise<CompanyBriefContent | null> {
  const meta = await getCompanyBriefMeta(companyId);
  return meta.brief;
}

export async function getCompanyBriefMeta(companyId: string): Promise<{
  brief: CompanyBriefContent | null;
  updatedAt: Date | null;
  isAiGenerated: boolean;
}> {
  const [existingBrief] = await withQueryTimeout(
    db
      .select()
      .from(companyBriefs)
      .where(eq(companyBriefs.companyId, companyId))
      .limit(1),
    "Company brief meta"
  );

  return {
    brief: existingBrief?.brief ? normalizeCompanyBrief(existingBrief.brief) : null,
    updatedAt: existingBrief?.updatedAt ?? null,
    isAiGenerated: !!existingBrief,
  };
}

export function getStaticBrief(company: Company): CompanyBriefContent {
  return getFallbackBrief(company);
}

export async function generateBriefIfNeeded(companyId: string): Promise<CompanyBriefContent | null> {
  const [company] = await db.select().from(companies).where(eq(companies.id, companyId)).limit(1);
  if (!company) return null;

  const currentHash = company.dataHash ?? computeDataHash({
    fundingAmountUsd: company.fundingAmountUsd,
    fundingDate: company.fundingDate?.toISOString(),
    openRolesTotal: company.openRolesTotal,
    pmRoles: company.pmRoles,
  });

  const [existingBrief] = await db
    .select()
    .from(companyBriefs)
    .where(eq(companyBriefs.companyId, companyId))
    .limit(1);

  if (existingBrief && existingBrief.dataHash === currentHash) {
    return existingBrief.brief;
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return getFallbackBrief(company);
  }

  try {
    const brief = await generateCompanyBrief(company);

    if (existingBrief) {
      await db
        .update(companyBriefs)
        .set({ brief, dataHash: currentHash, updatedAt: new Date() })
        .where(eq(companyBriefs.companyId, companyId));
    } else {
      await db.insert(companyBriefs).values({
        companyId,
        brief,
        dataHash: currentHash,
      });
    }

    return brief;
  } catch (error) {
    console.error(`Brief generation failed for ${company.name}:`, error);
    return getFallbackBrief(company);
  }
}

function getFallbackBrief(company: Company): CompanyBriefContent {
  return {
    whyNow: `${company.name} recently raised ${company.fundingRound ?? "funding"}, signaling growth and potential PM hiring.`,
    whyThisCompany: `A ${company.aiCategory ?? "AI"} company in ${company.hqCountry ?? "Europe"} with ${company.businessModel ?? "a strong"} business model.`,
    whyTheyMayHirePMs: `With ${company.openRolesTotal ?? 0} open roles (${company.pmRoles ?? 0} PM), post-funding scaling typically requires senior product leadership.`,
    suggestedOutreachStrategy: `Connect with the Head of Product or CEO on LinkedIn. Reference their recent funding and your relevant experience.`,
    linkedinMessage: `Hi — congrats on the ${company.fundingRound ?? "recent"} round. Former CEO/CPO with AI & marketplace experience (HEC EMBA). Would love to discuss how I could help scale product at ${company.name}.`,
    resumeFocus: "Emphasize AI product leadership, marketplace experience, and scaling post-funding teams.",
    interviewPrepTopics: [
      "Product strategy post-funding",
      "AI product roadmap",
      "Team scaling",
      "Go-to-market",
      "Competitive landscape",
    ],
    risks: [
      "Funding stage may mean lean team",
      "Competition for PM roles",
      "Unclear product-market fit",
    ],
  };
}

export async function generateAllBriefs() {
  const allCompanies = await db.select().from(companies);
  let generated = 0;

  for (const company of allCompanies) {
    const brief = await generateBriefIfNeeded(company.id);
    if (brief) generated++;
  }

  return generated;
}

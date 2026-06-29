import { createHash } from "crypto";

export function extractDomain(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return undefined;
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function computeDataHash(data: Record<string, unknown>): string {
  return createHash("sha256").update(JSON.stringify(data)).digest("hex").slice(0, 16);
}

export function parseFundingAmount(text: string): number | undefined {
  const normalized = text.toLowerCase().replace(/,/g, "");
  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(m|b|k|million|billion|thousand)?/);
  if (!match) return undefined;

  const value = parseFloat(match[1]);
  const unit = match[2];

  if (unit === "b" || unit === "billion") return Math.round(value * 1_000_000_000);
  if (unit === "m" || unit === "million") return Math.round(value * 1_000_000);
  if (unit === "k" || unit === "thousand") return Math.round(value * 1_000);
  return Math.round(value);
}

export function parseFundingRound(text: string): string | undefined {
  const normalized = text.toLowerCase();
  if (/series\s*d\+?|series\s*d\s*and\s*beyond/i.test(text)) return "Series D+";
  if (/series\s*c/i.test(normalized)) return "Series C";
  if (/series\s*b/i.test(normalized)) return "Series B";
  if (/series\s*a/i.test(normalized)) return "Series A";
  if (/pre-?seed/i.test(normalized)) return "Pre-Seed";
  if (/\bseed\b/i.test(normalized)) return "Seed";
  if (/growth/i.test(normalized)) return "Growth";
  if (/grant/i.test(normalized)) return "Grant";
  return undefined;
}

export function extractCompanyName(title: string): string | undefined {
  const patterns = [
    /^(.+?)\s+(?:raises|raised|secures|bags|lands|closes|gets|snags)\s/i,
    /^(.+?)\s+(?:funding|investment|round)/i,
    /(?:funding for|investment in)\s+(.+?)(?:\s*[,.]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match?.[1]) {
      return match[1].trim().replace(/['"]/g, "");
    }
  }

  const firstPart = title.split(/[,:–—-]/)[0]?.trim();
  if (firstPart && firstPart.length < 60) return firstPart;
  return undefined;
}

export function isAiRelated(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes("ai") ||
    lower.includes("artificial intelligence") ||
    lower.includes("machine learning") ||
    lower.includes("llm") ||
    lower.includes("generative") ||
    lower.includes("deep learning") ||
    lower.includes("agentic") ||
    lower.includes("copilot") ||
    lower.includes("foundation model")
  );
}

export function inferAiCategory(text: string): string {
  const lower = text.toLowerCase();
  if (/healthcare|medtech|clinical|diagnostic/.test(lower)) return "Healthcare AI";
  if (/agentic|agent/.test(lower)) return "Agentic AI";
  if (/llm|language model|gpt|claude/.test(lower)) return "LLM Platform";
  if (/data platform|data infra/.test(lower)) return "Data Platform";
  if (/developer|devtool|api|sdk/.test(lower)) return "Developer Tools";
  if (/computer vision|vision/.test(lower)) return "Computer Vision";
  if (/nlp|natural language/.test(lower)) return "NLP";
  if (/robot/.test(lower)) return "Robotics";
  if (/marketplace/.test(lower)) return "Marketplace";
  if (/enterprise|b2b|saas/.test(lower)) return "Enterprise AI";
  if (/consumer|b2c/.test(lower)) return "Consumer AI";
  if (/infra|infrastructure|gpu|inference/.test(lower)) return "AI Infrastructure";
  return "AI Product";
}

export function inferCountry(text: string): string | undefined {
  const countryMap: Record<string, string> = {
    france: "France",
    paris: "France",
    germany: "Germany",
    berlin: "Germany",
    munich: "Germany",
    uk: "United Kingdom",
    "united kingdom": "United Kingdom",
    london: "United Kingdom",
    spain: "Spain",
    barcelona: "Spain",
    madrid: "Spain",
    netherlands: "Netherlands",
    amsterdam: "Netherlands",
    sweden: "Sweden",
    stockholm: "Sweden",
    ireland: "Ireland",
    dublin: "Ireland",
    switzerland: "Switzerland",
    zurich: "Switzerland",
    italy: "Italy",
    milan: "Italy",
    belgium: "Belgium",
    brussels: "Belgium",
    austria: "Austria",
    vienna: "Austria",
    finland: "Finland",
    helsinki: "Finland",
    denmark: "Denmark",
    copenhagen: "Denmark",
    norway: "Norway",
    oslo: "Norway",
    poland: "Poland",
    warsaw: "Poland",
    portugal: "Portugal",
    lisbon: "Portugal",
    estonia: "Estonia",
    tallinn: "Estonia",
    czech: "Czech Republic",
    prague: "Czech Republic",
  };

  const lower = text.toLowerCase();
  for (const [key, country] of Object.entries(countryMap)) {
    if (lower.includes(key)) return country;
  }
  return undefined;
}

export function inferBusinessModel(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (/b2b2c/.test(lower)) return "B2B2C";
  if (/b2b|enterprise|saas/.test(lower)) return "B2B SaaS";
  if (/b2c|consumer/.test(lower)) return "B2C";
  if (/marketplace/.test(lower)) return "Marketplace";
  if (/open.?source/.test(lower)) return "Open Source";
  return undefined;
}

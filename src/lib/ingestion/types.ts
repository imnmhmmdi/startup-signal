export type RawFundingItem = {
  externalId: string;
  title: string;
  description: string;
  url: string;
  publishedAt: Date;
  raw: Record<string, unknown>;
};

export type SourceKind = "rss" | "seed" | "api";

export type NormalizedCompany = {
  name: string;
  website?: string;
  websiteDomain?: string;
  linkedinUrl?: string;
  logoUrl?: string;
  hqCity?: string;
  hqCountry?: string;
  fundingAmountUsd?: number;
  fundingRound?: string;
  fundingDate?: Date;
  investors?: string[];
  industry?: string;
  subcategory?: string;
  aiCategory?: string;
  businessModel?: string;
  isOpenSource?: boolean;
  githubStars?: number;
  hiringPageUrl?: string;
  openRolesTotal?: number;
  pmRoles?: number;
  aiRoles?: number;
  engRoles?: number;
  workMode?: string;
  visaSponsorship?: boolean;
  languagesRequired?: string[];
  description?: string;
  normalizedName?: string;
  discoverySources?: string[];
  sourceKind?: SourceKind;
  strategicRelevanceScore?: number | null;
  sources: Record<string, { value: unknown; source: string; fetchedAt: string }>;
};

export interface DataSourceAdapter {
  sourceName: string;
  fetchFundingItems(): Promise<RawFundingItem[]>;
  normalize(item: RawFundingItem): Promise<NormalizedCompany | null>;
}

export const EU_COUNTRIES = [
  "Austria",
  "Belgium",
  "Bulgaria",
  "Croatia",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Ireland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Poland",
  "Portugal",
  "Romania",
  "Slovakia",
  "Slovenia",
  "Spain",
  "Sweden",
  "Switzerland",
  "Norway",
  "United Kingdom",
  "UK",
] as const;

export const AI_KEYWORDS = [
  "ai",
  "artificial intelligence",
  "machine learning",
  "ml",
  "llm",
  "generative",
  "deep learning",
  "neural",
  "agentic",
  "copilot",
  "foundation model",
  "computer vision",
  "nlp",
  "natural language",
] as const;

export const FUNDING_ROUNDS = [
  "Pre-Seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "Growth",
  "Grant",
  "Undisclosed",
] as const;

export const AI_CATEGORIES = [
  "AI Infrastructure",
  "AI Product",
  "Agentic AI",
  "LLM Platform",
  "Data Platform",
  "Healthcare AI",
  "Developer Tools",
  "Computer Vision",
  "NLP",
  "Robotics",
  "Enterprise AI",
  "Consumer AI",
  "Marketplace",
  "Other",
] as const;

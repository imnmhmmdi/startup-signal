import {
  extractDomain,
  extractLinkedInCompanyUrl,
  extractWebsiteFromText,
} from "./utils";

const USER_AGENT = "Startup-Signal/1.0 (PM job discovery tool)";

export type ArticleEnrichment = {
  website?: string;
  linkedinUrl?: string;
};

export async function enrichFromArticleUrl(
  url: string,
  companyName?: string
): Promise<ArticleEnrichment> {
  if (!url) return {};

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
    });

    if (!response.ok) return {};

    const html = await response.text();
    return enrichFromArticleHtml(html);
  } catch (error) {
    console.warn(`[article-enricher] Failed to fetch ${url}:`, error);
    return {};
  }
}

export function enrichFromArticleHtml(html: string): ArticleEnrichment {
  const linkedinUrl = extractLinkedInCompanyUrl(html);
  const website = extractWebsiteFromText(html);

  return {
    website: website ? normalizeWebsite(website) : undefined,
    linkedinUrl: linkedinUrl ? normalizeLinkedInUrl(linkedinUrl) : undefined,
  };
}

function normalizeWebsite(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return url;
  }
}

function normalizeLinkedInUrl(url: string): string {
  const slugMatch = url.match(/linkedin\.com\/company\/([^/?#]+)/i);
  if (!slugMatch) return url;
  return `https://www.linkedin.com/company/${slugMatch[1].toLowerCase()}/`;
}

export function hasConfirmedDomain(website?: string | null, websiteDomain?: string | null): boolean {
  return Boolean(extractDomain(website) ?? websiteDomain);
}

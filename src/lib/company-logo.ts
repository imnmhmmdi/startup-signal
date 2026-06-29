import { extractDomain } from "@/lib/ingestion/utils";

type CompanyLogoFields = {
  logoUrl?: string | null;
  website?: string | null;
  websiteDomain?: string | null;
};

const CLEARBIT_HOST = "logo.clearbit.com";

export function getCompanyDomain(company: CompanyLogoFields): string | undefined {
  if (company.websiteDomain) return company.websiteDomain;
  return extractDomain(company.website);
}

export function isClearbitLogoUrl(url: string): boolean {
  try {
    return new URL(url).hostname === CLEARBIT_HOST;
  } catch {
    return url.includes(CLEARBIT_HOST);
  }
}

/** Fast favicon CDN — Clearbit Logo API is deprecated and often times out. */
export function buildLogoUrlFromDomain(domain: string): string {
  return buildFaviconUrlFromDomain(domain);
}

export function buildFaviconUrlFromDomain(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

export function buildLogoFallbackUrlFromDomain(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${encodeURIComponent(domain)}.ico`;
}

function normalizeStoredLogoUrl(
  logoUrl: string,
  domain: string | undefined
): string | null {
  if (isClearbitLogoUrl(logoUrl)) {
    return domain ? buildLogoUrlFromDomain(domain) : null;
  }
  return logoUrl;
}

export function getCompanyLogoSources(company: CompanyLogoFields): {
  primary: string | null;
  fallback: string | null;
  domain: string | undefined;
} {
  const domain = getCompanyDomain(company);

  if (company.logoUrl) {
    const primary = normalizeStoredLogoUrl(company.logoUrl, domain);
    if (primary) {
      return {
        primary,
        fallback: domain ? buildLogoFallbackUrlFromDomain(domain) : null,
        domain,
      };
    }
  }

  if (domain) {
    return {
      primary: buildLogoUrlFromDomain(domain),
      fallback: buildLogoFallbackUrlFromDomain(domain),
      domain,
    };
  }

  return { primary: null, fallback: null, domain: undefined };
}

export function getCompanyLogoCandidates(company: CompanyLogoFields): string[] {
  const { primary, fallback } = getCompanyLogoSources(company);
  const candidates: string[] = [];

  if (primary) candidates.push(primary);
  if (fallback && fallback !== primary) candidates.push(fallback);

  return candidates;
}

export function resolveCompanyLogoUrl(company: CompanyLogoFields): string | undefined {
  const { primary } = getCompanyLogoSources(company);
  return primary ?? undefined;
}

export function getCompanyInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

import { extractDomain } from "@/lib/ingestion/utils";

type CompanyLogoFields = {
  logoUrl?: string | null;
  website?: string | null;
  websiteDomain?: string | null;
};

export function getCompanyDomain(company: CompanyLogoFields): string | undefined {
  if (company.websiteDomain) return company.websiteDomain;
  return extractDomain(company.website);
}

export function buildLogoUrlFromDomain(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

export function buildFaviconUrlFromDomain(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export function getCompanyLogoSources(company: CompanyLogoFields): {
  primary: string | null;
  fallback: string | null;
  domain: string | undefined;
} {
  const domain = getCompanyDomain(company);

  if (company.logoUrl) {
    return {
      primary: company.logoUrl,
      fallback: domain ? buildFaviconUrlFromDomain(domain) : null,
      domain,
    };
  }

  if (domain) {
    return {
      primary: buildLogoUrlFromDomain(domain),
      fallback: buildFaviconUrlFromDomain(domain),
      domain,
    };
  }

  return { primary: null, fallback: null, domain: undefined };
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

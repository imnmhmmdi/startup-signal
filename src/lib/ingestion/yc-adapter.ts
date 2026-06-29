import type { DataSourceAdapter, NormalizedCompany, RawFundingItem } from "./types";
import { EU_COUNTRIES } from "./types";
import {
  extractDomain,
  inferAiCategory,
  inferBusinessModel,
  normalizeCompanyName,
} from "./utils";

/**
 * Public, community-maintained JSON mirror of YC's company directory.
 * Source: https://github.com/yc-oss/api — refreshed daily from YC's public Algolia index.
 * No scraping of protected YC pages; standard HTTP fetch of a publicly hosted JSON file.
 */
export const YC_COMPANIES_URL =
  "https://yc-oss.github.io/api/companies/all.json";

export type YcCompany = {
  id: number;
  name: string;
  slug: string;
  website?: string;
  all_locations?: string;
  long_description?: string;
  one_liner?: string;
  batch?: string;
  tags?: string[];
  industries?: string[];
  industry?: string;
  subindustry?: string;
  regions?: string[];
  status?: string;
  isHiring?: boolean;
  url?: string;
  small_logo_thumb_url?: string;
  stage?: string;
};

const EU_LOCATION_PATTERN = new RegExp(
  [
    "paris",
    "île-de-france",
    "ile-de-france",
    "france",
    "french",
    "london",
    "england",
    "united kingdom",
    "uk",
    "germany",
    "berlin",
    "munich",
    "spain",
    "barcelona",
    "madrid",
    "netherlands",
    "amsterdam",
    "sweden",
    "stockholm",
    "ireland",
    "dublin",
    "switzerland",
    "zurich",
    "geneva",
    "italy",
    "milan",
    "rome",
    "belgium",
    "brussels",
    "austria",
    "vienna",
    "finland",
    "helsinki",
    "denmark",
    "copenhagen",
    "norway",
    "oslo",
    "poland",
    "warsaw",
    "portugal",
    "lisbon",
    "estonia",
    "tallinn",
    "czech",
    "prague",
    "luxembourg",
    "latvia",
    "lithuania",
    "slovenia",
    "slovakia",
    "romania",
    "bulgaria",
    "croatia",
    "cyprus",
    "malta",
    "hungary",
    "budapest",
    "athens",
    "greece",
  ].join("|"),
  "i"
);

const PARIS_FRANCE_PATTERN =
  /paris|île-de-france|ile-de-france|\bfrance\b|french/i;

function regionIncludesRemote(regions: string[]): boolean {
  return regions.some((region) => /remote/i.test(region));
}

function regionIncludesEurope(regions: string[]): boolean {
  return regions.some((region) => /^europe$/i.test(region.trim()));
}

export function isYcCompanyRelevant(company: YcCompany): boolean {
  const locations = company.all_locations ?? "";
  const regions = company.regions ?? [];

  if (PARIS_FRANCE_PATTERN.test(locations)) return true;
  if (regions.some((region) => /^france$/i.test(region.trim()))) return true;

  if (EU_LOCATION_PATTERN.test(locations)) return true;

  const hasRemote = regionIncludesRemote(regions);
  const hasEurope = regionIncludesEurope(regions);
  if (hasRemote && hasEurope) return true;

  return false;
}

function parsePrimaryLocation(allLocations: string | undefined): {
  hqCity?: string;
  hqCountry?: string;
} {
  if (!allLocations) return {};

  const segments = allLocations.split(";").map((segment) => segment.trim());
  const parisSegment = segments.find((segment) => PARIS_FRANCE_PATTERN.test(segment));
  const primary = parisSegment ?? segments[0];
  const parts = primary.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length === 0) return {};
  if (parts.length === 1) {
    return { hqCity: parts[0] };
  }

  const hqCountry = parts[parts.length - 1];
  const hqCity = parts.slice(0, -1).join(", ");
  return { hqCity, hqCountry };
}

function normalizeCountry(country: string | undefined): string | undefined {
  if (!country) return undefined;
  const normalized = country.trim();
  if (/^uk$/i.test(normalized) || /united kingdom/i.test(normalized)) {
    return "United Kingdom";
  }
  if (/^usa$/i.test(normalized) || /united states/i.test(normalized)) {
    return "United States";
  }

  const euMatch = EU_COUNTRIES.find(
    (countryName) => countryName.toLowerCase() === normalized.toLowerCase()
  );
  return euMatch ?? normalized;
}

function inferWorkMode(regions: string[] | undefined): string | undefined {
  if (!regions?.length) return undefined;
  const joined = regions.join(" ").toLowerCase();
  if (/fully remote/.test(joined)) return "Remote";
  if (/partly remote/.test(joined)) return "Hybrid";
  if (/remote/.test(joined)) return "Remote";
  return undefined;
}

function mapYcStageToFundingRound(stage: string | undefined, batch: string | undefined): string {
  if (stage?.toLowerCase() === "growth") return "Series A";
  if (batch) return "Seed";
  return "Seed";
}

export class YcAdapter implements DataSourceAdapter {
  sourceName = "yc";

  async fetchFundingItems(): Promise<RawFundingItem[]> {
    try {
      const response = await fetch(YC_COMPANIES_URL, {
        headers: {
          "User-Agent": "Startup-Signal/1.0 (PM job discovery tool)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        console.error(`[yc] Fetch failed: HTTP ${response.status}`);
        return [];
      }

      const companies = (await response.json()) as YcCompany[];

      return companies
        .filter((company) => isYcCompanyRelevant(company))
        .filter((company) => Boolean(company.name?.trim()))
        .map((company) => ({
          externalId: company.slug || String(company.id),
          title: company.name,
          description: company.one_liner ?? company.long_description ?? "",
          url: company.url ?? `https://www.ycombinator.com/companies/${company.slug}`,
          publishedAt: new Date(),
          raw: company as unknown as Record<string, unknown>,
        }));
    } catch (error) {
      console.error("[yc] Company directory fetch failed:", error);
      return [];
    }
  }

  async normalize(item: RawFundingItem): Promise<NormalizedCompany | null> {
    const company = item.raw as unknown as YcCompany;
    const name = company.name?.trim();
    if (!name) return null;

    const website = company.website?.trim();
    if (!website) return null;

    const websiteDomain = extractDomain(website);
    if (!websiteDomain) return null;

    const { hqCity, hqCountry: rawCountry } = parsePrimaryLocation(company.all_locations);
    const hqCountry = normalizeCountry(rawCountry);
    const tags = company.tags ?? [];
    const descriptionText = [
      company.one_liner,
      company.long_description,
      tags.join(" "),
      company.industry,
      company.subindustry,
    ]
      .filter(Boolean)
      .join(" ");
    const fetchedAt = new Date().toISOString();

    const sources: NormalizedCompany["sources"] = {
      name: { value: name, source: this.sourceName, fetchedAt },
      website: { value: website, source: this.sourceName, fetchedAt },
      ycBatch: { value: company.batch ?? null, source: this.sourceName, fetchedAt },
      ycTags: { value: tags, source: this.sourceName, fetchedAt },
      ycUrl: { value: item.url, source: this.sourceName, fetchedAt },
      ycStatus: { value: company.status ?? null, source: this.sourceName, fetchedAt },
      ycRegions: { value: company.regions ?? [], source: this.sourceName, fetchedAt },
    };

    if (company.all_locations) {
      sources.allLocations = {
        value: company.all_locations,
        source: this.sourceName,
        fetchedAt,
      };
    }
    if (hqCity) {
      sources.hqCity = { value: hqCity, source: this.sourceName, fetchedAt };
    }
    if (hqCountry) {
      sources.hqCountry = { value: hqCountry, source: this.sourceName, fetchedAt };
    }
    if (company.isHiring) {
      sources.isHiring = { value: true, source: this.sourceName, fetchedAt };
    }

    const workMode = inferWorkMode(company.regions);
    const aiCategory = inferAiCategory(descriptionText);

    return {
      name,
      normalizedName: normalizeCompanyName(name),
      website: website.startsWith("http") ? website : `https://${website}`,
      websiteDomain,
      hqCity,
      hqCountry,
      industry: company.industry ?? company.industries?.[0],
      subcategory: company.subindustry,
      aiCategory,
      businessModel: inferBusinessModel(descriptionText),
      fundingRound: mapYcStageToFundingRound(company.stage, company.batch),
      description: (company.one_liner ?? company.long_description ?? "").slice(0, 500),
      workMode,
      openRolesTotal: company.isHiring ? 1 : 0,
      discoverySources: [this.sourceName],
      sourceKind: "api",
      sources,
    };
  }
}

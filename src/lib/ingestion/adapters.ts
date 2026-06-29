import Parser from "rss-parser";
import type { DataSourceAdapter, RawFundingItem, NormalizedCompany } from "./types";
import { YcAdapter } from "./yc-adapter";
import {
  enrichFromArticleHtml,
  enrichFromArticleUrl,
  hasConfirmedDomain,
} from "./article-enricher";
import {
  extractCompanyName,
  extractDomain,
  inferAiCategory,
  inferBusinessModel,
  inferCountry,
  isAiRelated,
  normalizeCompanyName,
  parseFundingAmount,
  parseFundingRound,
} from "./utils";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Startup-Signal/1.0 (PM job discovery tool)",
  },
});

const PARIS_PRESENCE_PATTERN =
  /paris|france|french|station\s+f|bpifrance|french\s+tech|la\s+french\s+tech|île-de-france|ile-de-france/i;

abstract class RssFundingAdapter implements DataSourceAdapter {
  abstract sourceName: string;
  abstract feedUrl: string;
  enrichArticles = true;
  fetchArticlePages = true;

  async fetchFundingItems(): Promise<RawFundingItem[]> {
    try {
      const feed = await parser.parseURL(this.feedUrl);
      return (feed.items ?? [])
        .filter((item) => {
          const text = `${item.title ?? ""} ${item.contentSnippet ?? ""} ${item.content ?? ""}`;
          return isAiRelated(text) || /fund|raise|invest|series|seed|round/i.test(text);
        })
        .map((item) => ({
          externalId: item.guid ?? item.link ?? item.title ?? "",
          title: item.title ?? "",
          description: item.contentSnippet ?? item.content ?? "",
          url: item.link ?? "",
          publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
          raw: item as unknown as Record<string, unknown>,
        }))
        .filter((item) => item.externalId.length > 0);
    } catch (error) {
      console.error(`[${this.sourceName}] RSS fetch failed:`, error);
      return [];
    }
  }

  async normalize(item: RawFundingItem): Promise<NormalizedCompany | null> {
    const combined = `${item.title} ${item.description}`;
    if (!isAiRelated(combined) && !/fund|raise|invest|series|seed/i.test(combined)) {
      return null;
    }

    let website: string | undefined;
    let linkedinUrl: string | undefined;

    const htmlContent = [
      item.description,
      typeof item.raw?.content === "string" ? item.raw.content : "",
    ].join("\n");
    const inlineEnrichment = enrichFromArticleHtml(htmlContent);
    website = inlineEnrichment.website;
    linkedinUrl = inlineEnrichment.linkedinUrl;

    if (
      this.enrichArticles &&
      this.fetchArticlePages &&
      item.url &&
      (!website || !linkedinUrl) &&
      !/https?:\/\//.test(htmlContent)
    ) {
      const fetchedEnrichment = await enrichFromArticleUrl(item.url);
      website = website ?? fetchedEnrichment.website;
      linkedinUrl = linkedinUrl ?? fetchedEnrichment.linkedinUrl;
    }

    const name =
      extractCompanyName(item.title, { website, linkedinUrl }) ??
      extractCompanyName(item.title);
    if (!name) return null;

    const country = inferCountry(combined);
    const fundingAmount = parseFundingAmount(combined);
    const fundingRound = parseFundingRound(combined);
    const fetchedAt = new Date().toISOString();
    const aiCategory = inferAiCategory(combined);
    const websiteDomain = extractDomain(website);

    const sources: NormalizedCompany["sources"] = {
      name: { value: name, source: this.sourceName, fetchedAt },
      fundingDate: { value: item.publishedAt.toISOString(), source: this.sourceName, fetchedAt },
      aiCategory: { value: aiCategory, source: this.sourceName, fetchedAt },
      articleUrl: { value: item.url, source: this.sourceName, fetchedAt },
    };

    if (fundingAmount) {
      sources.fundingAmountUsd = { value: fundingAmount, source: this.sourceName, fetchedAt };
    }
    if (fundingRound) {
      sources.fundingRound = { value: fundingRound, source: this.sourceName, fetchedAt };
    }
    if (country) {
      sources.hqCountry = { value: country, source: this.sourceName, fetchedAt };
    }
    if (website) {
      sources.website = { value: website, source: this.sourceName, fetchedAt };
    }
    if (linkedinUrl) {
      sources.linkedinUrl = { value: linkedinUrl, source: this.sourceName, fetchedAt };
    }

    return {
      name,
      normalizedName: normalizeCompanyName(name),
      website,
      websiteDomain,
      linkedinUrl,
      hqCountry: country,
      fundingAmountUsd: fundingAmount,
      fundingRound: fundingRound ?? "Undisclosed",
      fundingDate: item.publishedAt,
      aiCategory,
      businessModel: inferBusinessModel(combined),
      industry: "Artificial Intelligence",
      description: item.description.slice(0, 500),
      discoverySources: [this.sourceName],
      sourceKind: "rss",
      sources,
    };
  }
}

export class SiftedAdapter extends RssFundingAdapter {
  sourceName = "sifted";
  feedUrl = "https://sifted.eu/feed/";
}

export class TechEuAdapter extends RssFundingAdapter {
  sourceName = "tech.eu";
  feedUrl = "https://tech.eu/feed/";
}

export class EuStartupsAdapter extends RssFundingAdapter {
  sourceName = "eu-startups";
  feedUrl = "https://www.eu-startups.com/feed/";
}

export class MaddynessAdapter extends RssFundingAdapter {
  sourceName = "maddyness";
  feedUrl = "https://www.maddyness.com/feed/";
}

export class TechCrunchAdapter extends RssFundingAdapter {
  sourceName = "techcrunch";
  feedUrl = "https://techcrunch.com/feed/";
}

export class CrunchbaseNewsAdapter extends RssFundingAdapter {
  sourceName = "crunchbase-news";
  feedUrl = "https://news.crunchbase.com/feed/";

  async fetchFundingItems(): Promise<RawFundingItem[]> {
    const items = await super.fetchFundingItems();
    return items.filter((item) => {
      const text = `${item.title} ${item.description}`;
      return (
        PARIS_PRESENCE_PATTERN.test(text) || inferCountry(text) !== undefined
      );
    });
  }
}

const STATION_F_FEED_CANDIDATES = [
  "https://stationf.co/feed/",
  "https://www.stationf.co/feed/",
  "https://stationf.co/news/feed/",
];

export class StationFNewsAdapter extends RssFundingAdapter {
  sourceName = "station-f";
  feedUrl = STATION_F_FEED_CANDIDATES[0];
  private resolvedFeedUrl: string | null = null;

  async fetchFundingItems(): Promise<RawFundingItem[]> {
    if (this.resolvedFeedUrl) {
      this.feedUrl = this.resolvedFeedUrl;
      return super.fetchFundingItems();
    }

    for (const candidate of STATION_F_FEED_CANDIDATES) {
      try {
        const feed = await parser.parseURL(candidate);
        if ((feed.items?.length ?? 0) > 0) {
          this.resolvedFeedUrl = candidate;
          this.feedUrl = candidate;
          return (feed.items ?? [])
            .filter((item) => {
              const text = `${item.title ?? ""} ${item.contentSnippet ?? ""} ${item.content ?? ""}`;
              return isAiRelated(text) || /fund|raise|invest|series|seed|round|office|hiring|pm|product/i.test(text);
            })
            .map((item) => ({
              externalId: item.guid ?? item.link ?? item.title ?? "",
              title: item.title ?? "",
              description: item.contentSnippet ?? item.content ?? "",
              url: item.link ?? "",
              publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
              raw: item as unknown as Record<string, unknown>,
            }))
            .filter((item) => item.externalId.length > 0);
        }
      } catch {
        continue;
      }
    }

    console.warn("[station-f] No RSS feed available — skipping source");
    return [];
  }
}

export function getAllAdapters(): DataSourceAdapter[] {
  return [
    new SiftedAdapter(),
    new TechEuAdapter(),
    new EuStartupsAdapter(),
    new MaddynessAdapter(),
    new TechCrunchAdapter(),
    new CrunchbaseNewsAdapter(),
    new StationFNewsAdapter(),
    new YcAdapter(),
  ];
}

export { YcAdapter } from "./yc-adapter";

export function getAdapterByName(sourceName: string): DataSourceAdapter | undefined {
  return getAllAdapters().find((adapter) => adapter.sourceName === sourceName);
}

export { hasConfirmedDomain };

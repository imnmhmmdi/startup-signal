import Parser from "rss-parser";
import type { DataSourceAdapter, RawFundingItem, NormalizedCompany } from "./types";
import {
  extractCompanyName,
  extractDomain,
  inferAiCategory,
  inferBusinessModel,
  inferCountry,
  isAiRelated,
  parseFundingAmount,
  parseFundingRound,
} from "./utils";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "Startup-Signal/1.0 (PM job discovery tool)",
  },
});

abstract class RssFundingAdapter implements DataSourceAdapter {
  abstract sourceName: string;
  abstract feedUrl: string;

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

    const name = extractCompanyName(item.title);
    if (!name) return null;

    const country = inferCountry(combined);
    const fundingAmount = parseFundingAmount(combined);
    const fundingRound = parseFundingRound(combined);
    const fetchedAt = new Date().toISOString();
    const aiCategory = inferAiCategory(combined);

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

    return {
      name,
      hqCountry: country,
      fundingAmountUsd: fundingAmount,
      fundingRound: fundingRound ?? "Undisclosed",
      fundingDate: item.publishedAt,
      aiCategory,
      businessModel: inferBusinessModel(combined),
      industry: "Artificial Intelligence",
      description: item.description.slice(0, 500),
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

export class CrunchbaseNewsAdapter extends RssFundingAdapter {
  sourceName = "crunchbase-news";
  feedUrl = "https://news.crunchbase.com/feed/";

  async fetchFundingItems(): Promise<RawFundingItem[]> {
    const items = await super.fetchFundingItems();
    return items.filter((item) => {
      const text = `${item.title} ${item.description}`.toLowerCase();
      const isEuropean =
        /europe|european|france|germany|uk|london|paris|berlin|amsterdam|stockholm|dublin|spain|italy|netherlands|sweden|switzerland|nordic|cee/.test(
          text
        );
      return isEuropean || inferCountry(`${item.title} ${item.description}`) !== undefined;
    });
  }
}

export function getAllAdapters(): DataSourceAdapter[] {
  return [
    new SiftedAdapter(),
    new TechEuAdapter(),
    new EuStartupsAdapter(),
    new CrunchbaseNewsAdapter(),
  ];
}

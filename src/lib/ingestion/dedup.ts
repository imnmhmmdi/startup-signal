import { eq, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies } from "@/db/schema";
import type { Company } from "@/db/schema";
import { normalizeCompanyName, normalizeLinkedInSlug } from "./utils";

export type DedupKeys = {
  name: string;
  website?: string | null;
  websiteDomain?: string | null;
  linkedinUrl?: string | null;
  slug: string;
  normalizedName: string;
};

export function buildDedupKeys(input: {
  name: string;
  website?: string | null;
  websiteDomain?: string | null;
  linkedinUrl?: string | null;
  slug: string;
}): DedupKeys {
  return {
    ...input,
    normalizedName: normalizeCompanyName(input.name),
  };
}

export async function findExistingCompany(keys: DedupKeys): Promise<Company | null> {
  const linkedinSlug = normalizeLinkedInSlug(keys.linkedinUrl);

  if (keys.websiteDomain) {
    const [byDomain] = await db
      .select()
      .from(companies)
      .where(eq(companies.websiteDomain, keys.websiteDomain))
      .limit(1);
    if (byDomain) return byDomain;
  }

  if (linkedinSlug) {
    const [byLinkedIn] = await db
      .select()
      .from(companies)
      .where(
        sql`${companies.linkedinUrl} ILIKE ${`%linkedin.com/company/${linkedinSlug}%`}`
      )
      .limit(1);
    if (byLinkedIn) return byLinkedIn;
  }

  if (keys.normalizedName) {
    const [byName] = await db
      .select()
      .from(companies)
      .where(eq(companies.normalizedName, keys.normalizedName))
      .limit(1);
    if (byName) return byName;
  }

  const [bySlug] = await db
    .select()
    .from(companies)
    .where(eq(companies.slug, keys.slug))
    .limit(1);

  return bySlug ?? null;
}

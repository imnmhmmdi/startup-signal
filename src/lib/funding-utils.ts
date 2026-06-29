import type { Company } from "@/db/schema";

export function groupFundingEventsByMonth(events: Company[]): [string, Company[]][] {
  const groups = new Map<string, Company[]>();

  for (const event of events) {
    const key = event.fundingDate
      ? new Date(event.fundingDate).toLocaleDateString("en-GB", {
          month: "long",
          year: "numeric",
          timeZone: "UTC",
        })
      : "Unknown date";

    const existing = groups.get(key) ?? [];
    existing.push(event);
    groups.set(key, existing);
  }

  return Array.from(groups.entries());
}

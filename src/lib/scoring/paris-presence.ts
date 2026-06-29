import type { Company } from "@/db/schema";

const FRENCH_ECOSYSTEM_SOURCES = new Set([
  "maddyness",
  "station-f",
  "sifted",
  "eu-startups",
  "tech.eu",
]);

const PARIS_OFFICE_PATTERN =
  /paris\s+(office|hub|team|lab|site|campus|headquarters|hq)|office\s+in\s+paris|based\s+in\s+paris|paris-based|station\s+f|bpifrance|french\s+tech|la\s+french\s+tech|société\s+française|entité\s+juridique\s+française|registered\s+in\s+france|legal\s+entity\s+in\s+france/i;

const FRANCE_OFFICE_PATTERN =
  /france\s+(office|hub|team|lab|site|campus|engineering|product|r&d|rd)|office\s+in\s+france|engineering\s+team\s+in\s+france|product\s+team\s+in\s+france|french\s+entity|entité\s+en\s+france/i;

function isParisCity(city: string | null | undefined): boolean {
  if (!city) return false;
  return /paris|boulogne|levallois|neuilly|la\s+défense|defense/i.test(city);
}

function isFranceCountry(country: string | null | undefined): boolean {
  if (!country) return false;
  return /france|french/i.test(country);
}

function collectText(company: Company): string {
  const sourceValues = Object.values(company.sources ?? {})
    .map((entry) => String(entry.value ?? ""))
    .join(" ");

  return [
    company.name,
    company.description,
    company.hqCity,
    company.hqCountry,
    sourceValues,
  ]
    .filter(Boolean)
    .join(" ");
}

export function computeParisPresenceScore(company: Company): {
  score: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};
  const text = collectText(company).toLowerCase();
  const sources = company.discoverySources ?? [];

  if (isFranceCountry(company.hqCountry)) {
    breakdown.hqInFrance = 20;
  }

  if (isParisCity(company.hqCity)) {
    breakdown.hqInParis = 15;
  }

  if (PARIS_OFFICE_PATTERN.test(text)) {
    breakdown.parisOfficeMention = 15;
  }

  if (FRANCE_OFFICE_PATTERN.test(text)) {
    breakdown.franceOfficeMention = 10;
  }

  if (!isFranceCountry(company.hqCountry) && PARIS_OFFICE_PATTERN.test(text)) {
    breakdown.internationalHqParisOps = 25;
  }

  if ((company.pmRoles ?? 0) > 0) {
    breakdown.pmHiringActivity = 15;
  }

  if (sources.some((source) => FRENCH_ECOSYSTEM_SOURCES.has(source))) {
    breakdown.frenchEcosystemSource = 10;
  }

  if (/station\s+f|bpifrance|french\s+tech|next\s?40|ft120|la\s+french\s+tech/i.test(text)) {
    breakdown.ecosystemParticipation = 10;
  }

  const score = Math.min(
    100,
    Object.values(breakdown).reduce((total, value) => total + value, 0)
  );

  return { score, breakdown };
}

export const STRATEGIC_SEED_SOURCE = "strategic-seed" as const;

export type StrategicTier = 1 | 2 | 3;
export type EuropePmRelevance = "high" | "medium" | "low";

export type StrategicSeedMeta = {
  strategicTier?: StrategicTier;
  europePmRelevance?: EuropePmRelevance;
};

const TIER_BASE: Record<StrategicTier, number> = {
  1: 85,
  2: 75,
  3: 65,
};

const EUROPE_BOOST: Record<EuropePmRelevance, number> = {
  high: 10,
  medium: 5,
  low: 0,
};

export function isStrategicSeedSource(discoverySources: string[] | null | undefined): boolean {
  return (discoverySources ?? []).includes(STRATEGIC_SEED_SOURCE);
}

export function computeStrategicRelevanceScore(meta: StrategicSeedMeta): number {
  const tier = meta.strategicTier ?? 2;
  const europe = meta.europePmRelevance ?? "medium";
  return Math.min(100, TIER_BASE[tier] + EUROPE_BOOST[europe]);
}

export function resolveStrategicRelevanceScore(
  existing: number | null | undefined,
  incoming: number | null | undefined
): number | null {
  if (existing == null && incoming == null) return null;
  return Math.max(existing ?? 0, incoming ?? 0);
}

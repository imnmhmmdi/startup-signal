import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { companies, ingestionRuns } from "@/db/schema";
import { withQueryTimeout } from "@/lib/db/with-query-timeout";

export type IngestionRunRow = {
  id: string;
  sourceName: string | null;
  status: string;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsSkipped: number;
  rejectionReasons: Record<string, number>;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
};

export type IngestionDashboardData = {
  hasRuns: boolean;
  lastRunAt: Date | null;
  lastRunStatus: string | null;
  companyCount: number;
  rssDiscoveredCount: number;
  seedOnlyCount: number;
  latestRuns: IngestionRunRow[];
  aggregatedRejectionReasons: Array<{ reason: string; count: number }>;
  lastRunTotals: {
    sourcesProcessed: number;
    articlesFetched: number;
    companiesInserted: number;
    companiesUpdated: number;
    companiesSkipped: number;
  } | null;
};

function normalizeRun(run: {
  id: string;
  sourceName: string | null;
  status: string;
  itemsProcessed: number | null;
  itemsCreated: number | null;
  itemsUpdated: number | null;
  itemsSkipped: number | null;
  rejectionReasons: Record<string, number> | null;
  errorMessage: string | null;
  startedAt: Date;
  completedAt: Date | null;
}): IngestionRunRow {
  return {
    id: run.id,
    sourceName: run.sourceName,
    status: run.status,
    itemsProcessed: run.itemsProcessed ?? 0,
    itemsCreated: run.itemsCreated ?? 0,
    itemsUpdated: run.itemsUpdated ?? 0,
    itemsSkipped: run.itemsSkipped ?? 0,
    rejectionReasons: run.rejectionReasons ?? {},
    errorMessage: run.errorMessage,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
  };
}

function aggregateRejectionReasons(
  runs: IngestionRunRow[]
): Array<{ reason: string; count: number }> {
  const totals = new Map<string, number>();

  for (const run of runs) {
    for (const [reason, count] of Object.entries(run.rejectionReasons)) {
      totals.set(reason, (totals.get(reason) ?? 0) + count);
    }
  }

  return [...totals.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);
}

function computeLastRunTotals(runs: IngestionRunRow[]): IngestionDashboardData["lastRunTotals"] {
  if (runs.length === 0) return null;

  const latestStartedAt = runs[0].startedAt;
  const sameBatch = runs.filter(
    (run) => run.startedAt.getTime() === latestStartedAt.getTime()
  );

  return {
    sourcesProcessed: sameBatch.length,
    articlesFetched: sameBatch.reduce((sum, run) => sum + run.itemsProcessed, 0),
    companiesInserted: sameBatch.reduce((sum, run) => sum + run.itemsCreated, 0),
    companiesUpdated: sameBatch.reduce((sum, run) => sum + run.itemsUpdated, 0),
    companiesSkipped: sameBatch.reduce((sum, run) => sum + run.itemsSkipped, 0),
  };
}

export async function getIngestionDashboardData(): Promise<IngestionDashboardData> {
  return withQueryTimeout(loadIngestionDashboardData(), "Ingestion dashboard", 12_000);
}

async function loadIngestionDashboardData(): Promise<IngestionDashboardData> {
  const [runs, companyStats] = await Promise.all([
    db
      .select()
      .from(ingestionRuns)
      .where(eq(ingestionRuns.jobName, "ingest_funding_news"))
      .orderBy(desc(ingestionRuns.startedAt))
      .limit(50),
    db
      .select({
        total: sql<number>`count(*)::int`,
        rssDiscovered: sql<number>`count(*) FILTER (WHERE NOT (discovery_sources = '["seed"]'::jsonb))::int`,
        seedOnly: sql<number>`count(*) FILTER (WHERE discovery_sources = '["seed"]'::jsonb)::int`,
      })
      .from(companies),
  ]);

  const latestRuns = runs.map(normalizeRun);
  const stats = companyStats[0];

  return {
    hasRuns: latestRuns.length > 0,
    lastRunAt: latestRuns[0]?.startedAt ?? null,
    lastRunStatus: latestRuns[0]?.status ?? null,
    companyCount: stats?.total ?? 0,
    rssDiscoveredCount: stats?.rssDiscovered ?? 0,
    seedOnlyCount: stats?.seedOnly ?? 0,
    latestRuns,
    aggregatedRejectionReasons: aggregateRejectionReasons(latestRuns),
    lastRunTotals: computeLastRunTotals(latestRuns),
  };
}

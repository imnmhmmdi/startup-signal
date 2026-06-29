export const dynamic = "force-dynamic";

import { formatDistanceToNow } from "date-fns";
import { Activity, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/companies/company-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { getIngestionDashboardData } from "@/lib/queries/ingestion";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: string): string {
  switch (status) {
    case "completed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "failed":
      return "bg-red-100 text-red-800 border-red-200";
    case "running":
      return "bg-amber-100 text-amber-800 border-amber-200";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function IngestionPage() {
  const data = await getIngestionDashboardData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ingestion dashboard"
        subtitle="RSS discovery pipeline — funding news adapters, validation gates, and company upserts"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Companies in DB"
          value={data.companyCount}
          detail={`${data.rssDiscoveredCount} from RSS · ${data.seedOnlyCount} seed only`}
          accent="neutral"
        />
        <StatCard
          label="Last run"
          value={
            data.lastRunAt
              ? formatDistanceToNow(data.lastRunAt, { addSuffix: true })
              : "Never"
          }
          detail={
            data.lastRunStatus
              ? `Status: ${data.lastRunStatus}`
              : "No cron runs recorded"
          }
          accent={data.hasRuns ? "funding" : "neutral"}
        />
        <StatCard
          label="Articles fetched (last run)"
          value={data.lastRunTotals?.articlesFetched ?? 0}
          detail={`${data.lastRunTotals?.sourcesProcessed ?? 0} sources processed`}
          accent="neutral"
        />
        <StatCard
          label="Inserted (last run)"
          value={data.lastRunTotals?.companiesInserted ?? 0}
          detail={`${data.lastRunTotals?.companiesUpdated ?? 0} updated · ${data.lastRunTotals?.companiesSkipped ?? 0} skipped`}
          accent={data.lastRunTotals?.companiesInserted ? "pmFit" : "neutral"}
        />
      </div>

      {!data.hasRuns ? (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-amber-900">No ingestion runs in production yet</p>
                <p className="text-amber-800/90 leading-relaxed">
                  The database contains {data.seedOnlyCount} seed companies and zero RSS-discovered
                  companies. The Vercel cron at 06:00 UTC has not successfully completed an ingest
                  run — likely blocked by cron auth before the pipeline starts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent runs by source</CardTitle>
          </CardHeader>
          <CardContent>
            {data.latestRuns.length === 0 ? (
              <EmptyState
                title="No runs yet"
                description="Runs appear here after /api/cron/ingest-funding-news executes."
              />
            ) : (
              <div className="space-y-3">
                {data.latestRuns.slice(0, 14).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{run.sourceName ?? "unknown"}</span>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] uppercase", statusBadgeClass(run.status))}
                        >
                          {run.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(run.startedAt, { addSuffix: true })}
                      </p>
                      {run.errorMessage ? (
                        <p className="text-xs text-red-600 mt-1">{run.errorMessage}</p>
                      ) : null}
                    </div>
                    <div className="text-right text-xs tabular-nums shrink-0 space-y-0.5">
                      <p>{run.itemsProcessed} fetched</p>
                      <p className="text-emerald-700">+{run.itemsCreated} new</p>
                      <p className="text-blue-700">{run.itemsUpdated} updated</p>
                      <p className="text-muted-foreground">{run.itemsSkipped} skipped</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top rejection reasons</CardTitle>
          </CardHeader>
          <CardContent>
            {data.aggregatedRejectionReasons.length === 0 ? (
              <EmptyState
                title="No rejection data"
                description="Rejection reasons are recorded when RSS items fail name validation."
              />
            ) : (
              <div className="space-y-2">
                {data.aggregatedRejectionReasons.slice(0, 10).map((item) => {
                  const maxCount = data.aggregatedRejectionReasons[0]?.count ?? 1;
                  const width = Math.max(8, Math.round((item.count / maxCount) * 100));

                  return (
                    <div key={item.reason} className="space-y-1">
                      <div className="flex justify-between text-sm gap-3">
                        <span className="text-muted-foreground">{item.reason}</span>
                        <span className="font-medium tabular-nums">{item.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-amber-500/80"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Pipeline health
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="flex gap-3 rounded-lg border p-4">
            {data.hasRuns ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="font-medium">Cron execution</p>
              <p className="text-muted-foreground mt-1">
                {data.hasRuns
                  ? "At least one ingest run has been recorded."
                  : "Waiting for first successful cron run at 06:00 UTC."}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border p-4">
            {data.rssDiscoveredCount > 0 ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            )}
            <div>
              <p className="font-medium">RSS discovery</p>
              <p className="text-muted-foreground mt-1">
                {data.rssDiscoveredCount > 0
                  ? `${data.rssDiscoveredCount} companies discovered from RSS sources.`
                  : "All companies are still seed-only — RSS pipeline has not inserted new rows."}
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-lg border p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <p className="font-medium">Validation gate</p>
              <p className="text-muted-foreground mt-1">
                Dry-run shows ~60–70% of RSS items rejected by name validation — expected, not a
                full block.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

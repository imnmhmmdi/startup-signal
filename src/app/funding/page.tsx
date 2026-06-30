export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { FundingEventCard } from "@/components/funding/funding-event-card";
import { FundingSidebar } from "@/components/funding/funding-sidebar";
import { FundingFilters } from "@/components/funding/funding-filters";
import { QueryErrorBanner } from "@/components/query-error-banner";
import { DEFAULT_FILTER_OPTIONS } from "@/lib/queries/defaults";
import { safeQuery } from "@/lib/queries/safe-query";
import { computeFundingStats, queryFundingEvents } from "@/lib/queries/dashboard";
import { getFilterOptions } from "@/lib/queries/companies";
import { groupFundingEventsByMonth } from "@/lib/funding-utils";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT } from "@/config/product";
import { PageHeader } from "@/components/layout/page-header";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function FundingPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const filters = {
    fundingDateFrom: params.fundingDateFrom,
    fundingDateTo: params.fundingDateTo,
    minPmFitScore: params.minPmFitScore ? parseInt(params.minPmFitScore) : undefined,
    fundingRound: params.fundingRound,
  };

  const route = "/funding";

  const [eventsResult, filterOptionsResult] = await Promise.all([
    safeQuery(route, "queryFundingEvents", () => queryFundingEvents(filters, 100), []),
    safeQuery(route, "getFilterOptions", () => getFilterOptions(), DEFAULT_FILTER_OPTIONS),
  ]);

  const events = eventsResult.data;
  const filterOptions = filterOptionsResult.data;
  const loadErrors = [eventsResult, filterOptionsResult]
    .filter((result) => !result.ok)
    .map((result) => result.error!);

  const stats = computeFundingStats(events);
  const groupedEvents = groupFundingEventsByMonth(events);

  return (
    <div className="space-y-6">
      <QueryErrorBanner errors={loadErrors} />
      <PageHeader
        title="Funding events"
        subtitle={`Recent rounds across ${PRODUCT.focusRegion} — each event is a potential PM hiring trigger`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<Skeleton className="h-36 w-full rounded-xl" />}>
            <FundingFilters fundingRounds={filterOptions.fundingRounds} />
          </Suspense>

          {events.length === 0 ? (
            <EmptyState
              title="No funding events match your filters"
              description="Try widening the date range or lowering the PM fit threshold."
            />
          ) : (
            groupedEvents.map(([month, monthEvents]) => (
              <section key={month}>
                <div className="mb-4 flex items-baseline gap-3">
                  <h2 className="text-group-label">{month}</h2>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {monthEvents.length} {monthEvents.length === 1 ? "event" : "events"}
                  </span>
                </div>
                <div className="space-y-4">
                  {monthEvents.map((company) => (
                    <FundingEventCard key={company.id} company={company} />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>

        <div>
          <div className="sticky top-6">
            <FundingSidebar stats={stats} />
          </div>
        </div>
      </div>
    </div>
  );
}

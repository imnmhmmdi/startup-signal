export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { FundingEventCard } from "@/components/funding/funding-event-card";
import { FundingSidebar } from "@/components/funding/funding-sidebar";
import { FundingFilters } from "@/components/funding/funding-filters";
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

  const [events, filterOptions] = await Promise.all([
    queryFundingEvents(filters, 100),
    getFilterOptions(),
  ]);

  const stats = computeFundingStats(events);
  const groupedEvents = groupFundingEventsByMonth(events);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funding events"
        subtitle={`Recent rounds across ${PRODUCT.focusRegion} — each event is a potential PM hiring trigger`}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Suspense fallback={<Skeleton className="h-36 w-full" />}>
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
                <h2 className="text-sm font-semibold text-muted-foreground mb-3">{month}</h2>
                <div className="space-y-3">
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

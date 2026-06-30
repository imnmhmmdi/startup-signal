export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { QueryErrorBanner } from "@/components/query-error-banner";
import { DEFAULT_FILTER_OPTIONS } from "@/lib/queries/defaults";
import { safeQuery } from "@/lib/queries/safe-query";
import { queryCompanies, getFilterOptions, type CompanySortField } from "@/lib/queries/companies";
import { getUser } from "@/lib/supabase/server";
import { DashboardFilters } from "@/components/dashboard/filters";
import { CompaniesResults, CompaniesViewToggle } from "@/components/dashboard/companies-results";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT } from "@/config/product";
import { PageHeader } from "@/components/layout/page-header";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getUser();

  const view = params.view === "table" ? "table" : "cards";

  const filters = {
    minParisPresenceScore: params.minParisPresenceScore
      ? parseInt(params.minParisPresenceScore)
      : PRODUCT.minParisPresenceScore,
    country: params.country,
    fundingRound: params.fundingRound,
    fundingDateFrom: params.fundingDateFrom,
    fundingDateTo: params.fundingDateTo,
    aiCategory: params.aiCategory,
    minPmFitScore: params.minPmFitScore ? parseInt(params.minPmFitScore) : undefined,
    minAiHiringScore: params.minAiHiringScore ? parseInt(params.minAiHiringScore) : undefined,
    search: params.search,
    userId: user?.id,
    sortBy: (params.sortBy as CompanySortField | undefined) ?? "default",
    sortOrder: (params.sortOrder as "asc" | "desc") ?? "desc",
  };

  const route = "/companies";

  const [companiesResult, filterOptionsResult] = await Promise.all([
    safeQuery(route, "queryCompanies", () => queryCompanies(filters), []),
    safeQuery(route, "getFilterOptions", () => getFilterOptions(), DEFAULT_FILTER_OPTIONS),
  ]);

  const companies = companiesResult.data;
  const filterOptions = filterOptionsResult.data;
  const loadErrors = [companiesResult, filterOptionsResult]
    .filter((result) => !result.ok)
    .map((result) => result.error!);

  return (
    <div className="space-y-6">
      <QueryErrorBanner errors={loadErrors} />
      <PageHeader
        title="Companies"
        subtitle={`${companies.length} opportunities — Paris ecosystem and strategic AI targets, ranked by presence and PM fit`}
      />

          <Suspense fallback={<Skeleton className="h-48 w-full rounded-xl" />}>
        <DashboardFilters filterOptions={filterOptions} />
      </Suspense>

      <div className="flex justify-end">
        <Suspense fallback={<Skeleton className="h-9 w-40 rounded-xl" />}>
          <CompaniesViewToggle />
        </Suspense>
      </div>

      <CompaniesResults companies={companies} isAuthenticated={!!user} view={view} />
    </div>
  );
}

export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { queryCompanies, getFilterOptions } from "@/lib/queries/companies";
import { getUser } from "@/lib/supabase/server";
import { DashboardFilters } from "@/components/dashboard/filters";
import { CompanyTable } from "@/components/dashboard/company-table";
import { Skeleton } from "@/components/ui/skeleton";
import { PRODUCT } from "@/config/product";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function CompaniesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const user = await getUser();

  const filters = {
    country: params.country ?? PRODUCT.defaultCountry,
    fundingRound: params.fundingRound,
    fundingDateFrom: params.fundingDateFrom,
    fundingDateTo: params.fundingDateTo,
    aiCategory: params.aiCategory,
    minPmFitScore: params.minPmFitScore ? parseInt(params.minPmFitScore) : undefined,
    minAiHiringScore: params.minAiHiringScore ? parseInt(params.minAiHiringScore) : undefined,
    search: params.search,
    userId: user?.id,
    sortBy: (params.sortBy as "pmFitScore" | "aiHiringScore" | "fundingDate") ?? "pmFitScore",
    sortOrder: (params.sortOrder as "asc" | "desc") ?? "desc",
  };

  const [companies, filterOptions] = await Promise.all([
    queryCompanies(filters),
    getFilterOptions(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Companies</h1>
        <p className="text-muted-foreground mt-1">
          {companies.length} {PRODUCT.focusRegion} startups — ranked by PM fit and hiring signal
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <DashboardFilters filterOptions={filterOptions} defaultCountry={PRODUCT.defaultCountry} />
      </Suspense>

      <CompanyTable companies={companies} isAuthenticated={!!user} />
    </div>
  );
}

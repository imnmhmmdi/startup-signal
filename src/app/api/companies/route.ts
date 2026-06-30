import { NextRequest, NextResponse } from "next/server";
import { queryCompanies, getFilterOptions, type CompanySortField } from "@/lib/queries/companies";
import { getUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const user = await getUser();

  const filters = {
    country: searchParams.get("country") ?? undefined,
    fundingRound: searchParams.get("fundingRound") ?? undefined,
    fundingDateFrom: searchParams.get("fundingDateFrom") ?? undefined,
    fundingDateTo: searchParams.get("fundingDateTo") ?? undefined,
    aiCategory: searchParams.get("aiCategory") ?? undefined,
    minPmFitScore: searchParams.get("minPmFitScore")
      ? parseInt(searchParams.get("minPmFitScore")!)
      : undefined,
    minAiHiringScore: searchParams.get("minAiHiringScore")
      ? parseInt(searchParams.get("minAiHiringScore")!)
      : undefined,
    search: searchParams.get("search") ?? undefined,
    savedOnly: searchParams.get("savedOnly") === "true",
    userId: user?.id,
    sortBy: (searchParams.get("sortBy") as CompanySortField | null) ?? "default",
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") ?? "desc",
    limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 100,
    offset: searchParams.get("offset") ? parseInt(searchParams.get("offset")!) : 0,
  };

  const [companies, filterOptions] = await Promise.all([
    queryCompanies(filters),
    getFilterOptions(),
  ]);

  return NextResponse.json({ companies, filterOptions });
}

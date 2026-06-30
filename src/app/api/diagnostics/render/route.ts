import { getUser } from "@/lib/supabase/server";
import { queryCompanies, getFilterOptions } from "@/lib/queries/companies";
import { DEFAULT_FILTER_OPTIONS } from "@/lib/queries/defaults";
import {
  DEFAULT_OVERVIEW_STATS,
  computeFundingStats,
  getOverviewStats,
  getRecentFundingEvents,
  getStrongHiringSignals,
  getTopPmFitCompanies,
  queryFundingEvents,
} from "@/lib/queries/dashboard";
import { getCompanyById } from "@/lib/queries/companies";
import { getCompanyBriefMeta } from "@/lib/llm/company-brief";
import { formatQueryErrorForUser } from "@/lib/db/query-errors";
import { getDatabaseStatus } from "@/lib/db/bootstrap";
import { normalizeCompany, normalizeCompanyBrief } from "@/lib/company/normalize-company";
import { logServerError } from "@/lib/server-log";
import { PRODUCT } from "@/config/product";

export const dynamic = "force-dynamic";

type QueryCheck = {
  queryName: string;
  ok: boolean;
  durationMs: number;
  error?: string;
  sampleCount?: number;
  normalizationWarnings?: string[];
};

type RouteCheck = {
  route: string;
  ok: boolean;
  queries: QueryCheck[];
};

function checkNormalizationWarnings(value: unknown, field: string): string[] {
  const warnings: string[] = [];

  if (field.endsWith("Breakdown") || field === "sources") {
    if (value != null && (typeof value !== "object" || Array.isArray(value))) {
      warnings.push(`${field} is not an object`);
    }
  }

  if (field === "discoverySources" || field === "investors" || field === "languagesRequired") {
    if (value != null && !Array.isArray(value)) {
      warnings.push(`${field} is not an array`);
    }
  }

  return warnings;
}

async function runQueryCheck(
  route: string,
  queryName: string,
  fn: () => Promise<unknown>
): Promise<QueryCheck> {
  const started = Date.now();

  try {
    const result = await fn();
    const durationMs = Date.now() - started;
    const normalizationWarnings: string[] = [];

    if (Array.isArray(result)) {
      for (const item of result.slice(0, 3)) {
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          for (const field of [
            "discoverySources",
            "parisPresenceBreakdown",
            "pmFitScoreBreakdown",
            "aiHiringScoreBreakdown",
          ]) {
            normalizationWarnings.push(
              ...checkNormalizationWarnings(record[field], field)
            );
          }
          normalizeCompany(record as never);
        }
      }

      return {
        queryName,
        ok: true,
        durationMs,
        sampleCount: result.length,
        normalizationWarnings:
          normalizationWarnings.length > 0 ? [...new Set(normalizationWarnings)] : undefined,
      };
    }

    if (result && typeof result === "object" && "brief" in (result as object)) {
      const meta = result as { brief: unknown };
      if (meta.brief) normalizeCompanyBrief(meta.brief);
    }

    return { queryName, ok: true, durationMs };
  } catch (error) {
    logServerError({ route, queryName, error });
    return {
      queryName,
      ok: false,
      durationMs: Date.now() - started,
      error: formatQueryErrorForUser(error, queryName),
    };
  }
}

export async function GET() {
  const user = await getUser();
  const database = await getDatabaseStatus();
  const routes: RouteCheck[] = [];

  const overviewQueries = await Promise.all([
    runQueryCheck("/", "getOverviewStats", () => getOverviewStats(user?.id)),
    runQueryCheck("/", "getTopPmFitCompanies", () => getTopPmFitCompanies(4)),
    runQueryCheck("/", "getRecentFundingEvents", () => getRecentFundingEvents(6)),
    runQueryCheck("/", "getStrongHiringSignals", () => getStrongHiringSignals(4)),
  ]);
  routes.push({
    route: "/",
    ok: overviewQueries.every((query) => query.ok),
    queries: overviewQueries,
  });

  const companiesQueries = await Promise.all([
    runQueryCheck("/companies", "queryCompanies", () =>
      queryCompanies({
        minParisPresenceScore: PRODUCT.minParisPresenceScore,
        sortBy: "pmFitScore",
        sortOrder: "desc",
      })
    ),
    runQueryCheck("/companies", "getFilterOptions", () => getFilterOptions()),
  ]);
  routes.push({
    route: "/companies",
    ok: companiesQueries.every((query) => query.ok),
    queries: companiesQueries,
  });

  let sampleCompanyId: string | null = null;
  try {
    const sampleCompanies = await queryCompanies({ limit: 1 });
    sampleCompanyId = sampleCompanies[0]?.id ?? null;
  } catch (error) {
    logServerError({ route: "/companies/[id]", queryName: "sampleCompanyLookup", error });
  }

  const companyDetailQueries: QueryCheck[] = [];
  if (sampleCompanyId) {
    companyDetailQueries.push(
      await runQueryCheck("/companies/[id]", "getCompanyById", () =>
        getCompanyById(sampleCompanyId!, user?.id)
      ),
      await runQueryCheck("/companies/[id]", "getCompanyBriefMeta", () =>
        getCompanyBriefMeta(sampleCompanyId!)
      )
    );
  } else {
    companyDetailQueries.push({
      queryName: "getCompanyById",
      ok: false,
      durationMs: 0,
      error: "No sample company available to test detail queries",
    });
  }
  routes.push({
    route: "/companies/[id]",
    ok: companyDetailQueries.every((query) => query.ok),
    queries: companyDetailQueries,
  });

  const fundingEvents = await runQueryCheck("/funding", "queryFundingEvents", () =>
    queryFundingEvents({}, 100)
  );
  const fundingQueries: QueryCheck[] = [
    fundingEvents,
    await runQueryCheck("/funding", "getFilterOptions", () => getFilterOptions()),
  ];

  if (fundingEvents.ok) {
    try {
      const events = await queryFundingEvents({}, 100);
      computeFundingStats(events);
      fundingQueries.push({
        queryName: "computeFundingStats",
        ok: true,
        durationMs: 0,
        sampleCount: events.length,
      });
    } catch (error) {
      logServerError({ route: "/funding", queryName: "computeFundingStats", error });
      fundingQueries.push({
        queryName: "computeFundingStats",
        ok: false,
        durationMs: 0,
        error: formatQueryErrorForUser(error, "computeFundingStats"),
      });
    }
  }

  routes.push({
    route: "/funding",
    ok: fundingQueries.every((query) => query.ok),
    queries: fundingQueries,
  });

  routes.push({
    route: "/pipeline",
    ok: true,
    queries: [
      {
        queryName: "clientFetchSaved",
        ok: true,
        durationMs: 0,
        error: undefined,
      },
    ],
  });

  routes.push({
    route: "/login",
    ok: true,
    queries: [
      {
        queryName: "clientAuthForm",
        ok: true,
        durationMs: 0,
      },
    ],
  });

  routes.push({
    route: "/saved",
    ok: true,
    queries: [
      {
        queryName: "redirectToPipeline",
        ok: true,
        durationMs: 0,
      },
    ],
  });

  const failingQueries = routes.flatMap((route) =>
    route.queries
      .filter((query) => !query.ok)
      .map((query) => ({
        route: route.route,
        queryName: query.queryName,
        error: query.error,
      }))
  );

  const normalizationWarnings = routes.flatMap((route) =>
    route.queries.flatMap((query) =>
      (query.normalizationWarnings ?? []).map((warning) => ({
        route: route.route,
        queryName: query.queryName,
        warning,
      }))
    )
  );

  return Response.json({
    ok: failingQueries.length === 0 && database.ready,
    checkedAt: new Date().toISOString(),
    sampleCompanyId,
    database,
    defaults: {
      overviewStats: DEFAULT_OVERVIEW_STATS,
      filterOptions: DEFAULT_FILTER_OPTIONS,
    },
    routes,
    failingQueries,
    normalizationWarnings,
    hint:
      !database.ready
        ? "Database schema is not ready. Redeploy to run migrations, or run npm run db:bootstrap against production DATABASE_URL."
        : failingQueries.length > 0
          ? "Inspect failingQueries and server logs (event=server_render_failure) for root cause."
          : "All render queries succeeded. If a page still fails, check component-level render errors.",
  });
}

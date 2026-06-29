export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import {
  getOverviewStats,
  getTopPmFitCompanies,
  getRecentFundingEvents,
  getStrongHiringSignals,
} from "@/lib/queries/dashboard";
import { StatCard, CompanyCard } from "@/components/companies/company-card";
import { FundingEventRow } from "@/components/funding/funding-event-row";
import { OverviewHero } from "@/components/overview/overview-hero";
import { RecommendedCompanyCard } from "@/components/overview/recommended-company-card";
import { SectionHeader } from "@/components/layout/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PRODUCT } from "@/config/product";
import { getSectionEyebrowClass } from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

function buildBriefingLine(stats: {
  recentHighPmFit: number;
  highPmFitCompanies: number;
  recentFundingEvents: number;
}): string {
  if (stats.recentHighPmFit > 0) {
    const noun = stats.recentHighPmFit === 1 ? "company" : "companies";
    return `${stats.recentHighPmFit} high-fit ${noun} funded in the last 7 days — ${stats.highPmFitCompanies} total matches for your profile`;
  }
  if (stats.highPmFitCompanies > 0) {
    return `${stats.highPmFitCompanies} companies match your profile at 70+ PM fit — ${stats.recentFundingEvents} funding events to review`;
  }
  return `${PRODUCT.tagline} — focused on ${PRODUCT.focusRegion} startups`;
}

export default async function OverviewPage() {
  const user = await getUser();

  const [stats, topPmFit, recentFunding, hiringSignals] = await Promise.all([
    getOverviewStats(user?.id),
    getTopPmFitCompanies(4),
    getRecentFundingEvents(6),
    getStrongHiringSignals(4),
  ]);

  const briefingLine = buildBriefingLine(stats);

  return (
    <div className="space-y-12">
      <OverviewHero briefingLine={briefingLine} />

      {topPmFit.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className={cn(
                  "mb-1.5 text-xs font-semibold uppercase tracking-widest",
                  getSectionEyebrowClass("pmFit")
                )}
              >
                AI-curated picks
              </p>
              <h2 className="text-section-title mt-1.5">Recommended for you today</h2>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Top matches ranked by PM fit, hiring signal, and funding momentum — start here
                before browsing the full market.
              </p>
            </div>
            <Link
              href="/companies?sortBy=pmFitScore&minPmFitScore=70"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "shrink-0")}
            >
              View all matches
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {topPmFit.map((company, index) => (
              <RecommendedCompanyCard key={company.id} company={company} rank={index + 1} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-section-title">Market snapshot</h2>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            Live counts across the {PRODUCT.focusRegion} startup landscape
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="French startups tracked"
            value={stats.frenchStartups}
            detail="Funded AI & tech companies"
            href="/companies"
          />
          <StatCard
            label="Funding events (6 mo)"
            value={stats.recentFundingEvents}
            detail="Recent rounds to act on"
            href="/funding"
            accent="funding"
          />
          <StatCard
            label="High PM fit (70+)"
            value={stats.highPmFitCompanies}
            detail="Strong matches for your profile"
            href="/companies?minPmFitScore=70"
            accent="pmFit"
          />
          <StatCard
            label="Open PM roles"
            value={stats.openPmRoles}
            detail={
              user
                ? `${stats.pipelineCount} in your pipeline`
                : "Sign in to track applications"
            }
            href="/pipeline"
            accent="hiring"
          />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <SectionHeader
              title="Strong hiring signals"
              href="/companies?sortBy=aiHiringScore&minAiHiringScore=60"
              linkLabel="Browse signals"
              accent="hiring"
              eyebrow="Active hiring"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {hiringSignals.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </section>
        </div>

        <aside>
          <Card className="sticky top-6 overflow-hidden border-blue-200/25 bg-blue-500/[0.02] dark:border-blue-900/25">
            <CardHeader className="flex flex-row items-start justify-between gap-2 border-b border-blue-200/20 pb-4 dark:border-blue-900/30">
              <div>
                <p
                  className={cn(
                    "mb-1.5 text-xs font-semibold uppercase tracking-widest",
                    getSectionEyebrowClass("funding")
                  )}
                >
                  Funding radar
                </p>
                <CardTitle className="text-base font-semibold">Recent funding</CardTitle>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  Funded in last 30 days — PM hiring likely within 90 days
                </p>
              </div>
              <Link
                href="/funding"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "shrink-0 -mr-2")}
              >
                All
              </Link>
            </CardHeader>
            <CardContent className="space-y-1 px-2 py-2">
              {recentFunding.length === 0 ? (
                <p className="px-2 py-4 text-sm text-muted-foreground">No funding events yet.</p>
              ) : (
                recentFunding.map((company) => (
                  <FundingEventRow key={company.id} company={company} />
                ))
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

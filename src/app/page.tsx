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
import { StatCard, CompanyCard, FundingEventRow } from "@/components/companies/company-card";
import { ProfileChip } from "@/components/profile-chip";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/layout/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PRODUCT } from "@/config/product";
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
    <div className="space-y-8">
      <PageHeader
        title="Overview"
        subtitle={briefingLine}
        actions={<ProfileChip />}
      />

      {topPmFit.length > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-semibold">
              {topPmFit.length} top {topPmFit.length === 1 ? "match" : "matches"} ready to review
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {stats.highPmFitCompanies} companies score 70+ PM fit for your profile — start with the strongest opportunities
            </p>
          </div>
          <Link
            href="/companies?sortBy=pmFitScore&minPmFitScore=70"
            className={cn(buttonVariants({ size: "sm" }))}
          >
            Review top matches
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        />
        <StatCard
          label="High PM fit (70+)"
          value={stats.highPmFitCompanies}
          detail="Strong matches for your profile"
          href="/companies?minPmFitScore=70"
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
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section>
            <SectionHeader title="Top PM fit companies" href="/companies?sortBy=pmFitScore" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topPmFit.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeader
              title="Strong hiring signals"
              href="/companies?sortBy=aiHiringScore&minAiHiringScore=60"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hiringSignals.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </section>
        </div>

        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Recent funding</CardTitle>
              <Link href="/funding" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                All events
              </Link>
            </CardHeader>
            <CardContent>
              {recentFunding.length === 0 ? (
                <p className="text-sm text-muted-foreground">No funding events yet.</p>
              ) : (
                recentFunding.map((company) => (
                  <FundingEventRow key={company.id} company={company} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PRODUCT } from "@/config/product";
import { cn } from "@/lib/utils";

export default async function OverviewPage() {
  const user = await getUser();

  const [stats, topPmFit, recentFunding, hiringSignals] = await Promise.all([
    getOverviewStats(user?.id),
    getTopPmFitCompanies(4),
    getRecentFundingEvents(6),
    getStrongHiringSignals(4),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1">
          {PRODUCT.tagline} — focused on {PRODUCT.focusRegion} startups
        </p>
      </div>

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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Top PM fit companies</h2>
              <Link
                href="/companies?sortBy=pmFitScore"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {topPmFit.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Strong hiring signals</h2>
              <Link
                href="/companies?sortBy=aiHiringScore&minAiHiringScore=60"
                className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
              >
                View all <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
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

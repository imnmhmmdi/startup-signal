export const dynamic = "force-dynamic";

import Link from "next/link";
import { getRecentFundingEvents } from "@/lib/queries/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { getHiringPrediction, PRODUCT } from "@/config/product";

export default async function FundingPage() {
  const events = await getRecentFundingEvents(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Funding events</h1>
        <p className="text-muted-foreground mt-1">
          Recent rounds across {PRODUCT.focusRegion} — each event is a potential PM hiring trigger
        </p>
      </div>

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No funding events loaded yet. Run the seed script or wait for ingestion.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((company) => {
            const prediction = getHiringPrediction(company.aiHiringScore ?? 0);
            return (
              <Link key={company.id} href={`/companies/${company.id}`}>
                <Card className="hover:border-primary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{company.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {formatDate(company.fundingDate)} · {company.hqCity ?? "France"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{company.fundingRound ?? "Round"}</Badge>
                        <span className="font-semibold tabular-nums">
                          {formatFundingAmount(company.fundingAmountUsd)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center gap-4 text-sm">
                      {company.aiCategory && (
                        <Badge variant="secondary">{company.aiCategory}</Badge>
                      )}
                      <span className="text-muted-foreground">
                        Hiring prediction: <strong>{prediction.label}</strong>
                      </span>
                      <span className="text-muted-foreground">
                        {company.pmRoles ?? 0} PM · {company.openRolesTotal ?? 0} total roles
                      </span>
                      <div className="ml-auto flex gap-3">
                        <ScoreBadge score={company.pmFitScore ?? 0} label="PM fit" showTier />
                        <ScoreBadge score={company.aiHiringScore ?? 0} label="Hiring signal" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

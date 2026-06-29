import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyLogo } from "@/components/company-logo";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { getHiringPrediction } from "@/config/product";
import type { Company } from "@/db/schema";

type FundingEventCardProps = {
  company: Company;
};

export function FundingEventCard({ company }: FundingEventCardProps) {
  const prediction = getHiringPrediction(company.aiHiringScore ?? 0);

  return (
    <Link href={`/companies/${company.id}`} className="block cursor-pointer">
      <Card className="hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <CompanyLogo
                name={company.name}
                logoUrl={company.logoUrl}
                website={company.website}
                websiteDomain={company.websiteDomain}
                size="md"
              />
              <div>
                <CardTitle className="text-base">{company.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {formatDate(company.fundingDate)} · {company.hqCity ?? "France"}
                </p>
              </div>
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
            {company.aiCategory && <Badge variant="secondary">{company.aiCategory}</Badge>}
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
}

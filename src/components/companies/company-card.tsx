import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { getHiringPrediction } from "@/config/product";
import type { Company } from "@/db/schema";

type CompanyCardProps = {
  company: Company;
  showPrediction?: boolean;
};

export function CompanyCard({ company, showPrediction = true }: CompanyCardProps) {
  const prediction = getHiringPrediction(company.aiHiringScore ?? 0);

  return (
    <Link href={`/companies/${company.id}`}>
      <Card className="hover:border-primary/30 transition-colors h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{company.name}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {company.hqCity ? `${company.hqCity}, ` : ""}
                {company.hqCountry ?? "France"}
              </p>
            </div>
            <ScoreBadge score={company.pmFitScore ?? 0} label="PM Fit" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            {company.fundingRound && (
              <Badge variant="outline" className="text-xs">{company.fundingRound}</Badge>
            )}
            {company.aiCategory && (
              <Badge variant="secondary" className="text-xs">{company.aiCategory}</Badge>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Raised</p>
              <p className="font-medium tabular-nums">
                {formatFundingAmount(company.fundingAmountUsd)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">PM roles</p>
              <p className="font-medium tabular-nums">{company.pmRoles ?? 0}</p>
            </div>
          </div>
          {showPrediction && (
            <div className="flex items-center justify-between pt-1 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Hiring prediction</p>
                <p className="text-sm font-medium">{prediction.label}</p>
              </div>
              <ScoreBadge score={company.aiHiringScore ?? 0} label="Signal" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
};

export function StatCard({ label, value, detail, href }: StatCardProps) {
  const content = (
    <Card className={href ? "hover:border-primary/30 transition-colors" : ""}>
      <CardContent className="pt-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-bold tabular-nums mt-1">{value}</p>
        {detail && <p className="text-xs text-muted-foreground mt-1">{detail}</p>}
        {href && (
          <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">
            View <ArrowRight className="h-3 w-3" />
          </span>
        )}
      </CardContent>
    </Card>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

type FundingEventRowProps = {
  company: Company;
};

export function FundingEventRow({ company }: FundingEventRowProps) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="flex items-center justify-between gap-4 py-3 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
    >
      <div className="min-w-0">
        <p className="font-medium truncate">{company.name}</p>
        <p className="text-sm text-muted-foreground">
          {company.fundingRound ?? "Funding"} · {formatDate(company.fundingDate)}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="font-semibold tabular-nums text-sm">
          {formatFundingAmount(company.fundingAmountUsd)}
        </p>
        <p className="text-xs text-muted-foreground">{company.aiCategory ?? "Tech"}</p>
      </div>
    </Link>
  );
}

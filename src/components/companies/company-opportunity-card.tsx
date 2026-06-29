import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, MapPin, TrendingUp } from "lucide-react";
import { CompanyLogo } from "@/components/company-logo";
import { PmFitRing } from "@/components/overview/pm-fit-ring";
import { CategoryBadge, FundingStageBadge } from "@/components/semantic-badges";
import { ScoreBadge, formatFundingAmount, getScoreTier } from "@/components/score-badge";
import { getHiringPrediction } from "@/config/product";
import { getTopPmFitReason } from "@/config/scoring";
import {
  getFundingAmountClasses,
  getHiringSignalInlineClasses,
  getPmFitBorderTint,
  getPmFitReasonTextClass,
} from "@/lib/semantic-colors";
import type { Company } from "@/db/schema";
import { cn } from "@/lib/utils";

export { CategoryBadge, FundingStageBadge } from "@/components/semantic-badges";

type CompanyOpportunityCardProps = {
  company: Company;
  rank?: number;
  showPrediction?: boolean;
  pmFitSize?: "sm" | "md";
};

export function CompanyOpportunityCard({
  company,
  rank,
  showPrediction = true,
  pmFitSize = "md",
}: CompanyOpportunityCardProps) {
  const pmScore = company.pmFitScore ?? 0;
  const hiringScore = company.aiHiringScore ?? 0;
  const hiringTier = getScoreTier(hiringScore);
  const prediction = getHiringPrediction(hiringScore);
  const fitReason = getTopPmFitReason(company.pmFitScoreBreakdown);
  const pmRoles = company.pmRoles ?? 0;
  const location = [company.hqCity, company.hqCountry ?? "France"].filter(Boolean).join(", ");

  return (
    <Link href={`/companies/${company.id}`} className="group block h-full">
      <article
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-xl border bg-card",
          "shadow-sm ring-1 ring-foreground/[0.04]",
          "transition-all duration-200 ease-out",
          "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md hover:shadow-primary/[0.06]",
          getPmFitBorderTint(pmScore)
        )}
      >
        {rank != null && (
          <span className="absolute right-4 top-4 z-10 rounded-full border border-border/60 bg-background/90 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground backdrop-blur-sm">
            #{rank}
          </span>
        )}

        <header className="space-y-3 p-5 pb-0">
          <div className="flex items-start gap-3 pr-10">
            <CompanyLogo
              name={company.name}
              logoUrl={company.logoUrl}
              website={company.website}
              websiteDomain={company.websiteDomain}
              size="md"
            />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-semibold tracking-tight transition-colors group-hover:text-primary">
                {company.name}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0 opacity-70" aria-hidden />
                <span className="truncate">{location}</span>
              </p>
            </div>
          </div>

          {(company.fundingRound || company.aiCategory) && (
            <div className="flex flex-wrap gap-1.5">
              <FundingStageBadge round={company.fundingRound} />
              <CategoryBadge category={company.aiCategory} />
            </div>
          )}

          {fitReason && (
            <p className={cn("line-clamp-2 text-xs leading-relaxed", getPmFitReasonTextClass())}>
              {fitReason}
            </p>
          )}
        </header>

        <div className="flex flex-1 gap-4 p-5 pt-4 sm:gap-5">
          <PmFitRing score={pmScore} size={pmFitSize} className="shrink-0" />

          <dl className="min-w-0 flex-1 space-y-3 self-center">
            <MetricRow label="Raised">
              <span className={getFundingAmountClasses()}>
                {formatFundingAmount(company.fundingAmountUsd)}
              </span>
            </MetricRow>

            <MetricRow label="PM roles">
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
                  pmRoles > 0 ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Briefcase className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                {pmRoles}
              </span>
            </MetricRow>

            <MetricRow label="Paris presence">
              <ScoreBadge score={company.parisPresenceScore ?? 0} label="Paris presence" size="sm" />
            </MetricRow>

            <MetricRow label="Confidence">
              <ScoreBadge score={company.discoveryConfidence ?? 0} label="Confidence" size="sm" />
            </MetricRow>

            <MetricRow label="Hiring signal">
              <span className={getHiringSignalInlineClasses(hiringScore)}>
                <TrendingUp className="h-3 w-3" aria-hidden />
                {hiringScore}
                <span className="font-normal opacity-80">{hiringTier.shortLabel}</span>
              </span>
            </MetricRow>

            {showPrediction && (
              <MetricRow label="Outlook">
                <span className="text-sm font-medium text-foreground">{prediction.label}</span>
              </MetricRow>
            )}
          </dl>
        </div>

        <footer className="mt-auto flex items-center justify-between border-t bg-muted/20 px-5 py-3 transition-colors group-hover:bg-muted/35">
          <span className="text-sm font-semibold transition-colors group-hover:text-primary">
            View company
          </span>
          <ArrowRight
            className="h-4 w-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </footer>
      </article>
    </Link>
  );
}

function MetricRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="m-0 text-right">{children}</dd>
    </div>
  );
}

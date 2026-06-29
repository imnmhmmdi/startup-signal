import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { CompanyLogo } from "@/components/company-logo";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { CategoryBadge, FundingStageBadge } from "@/components/semantic-badges";
import { HiringUrgencyDot } from "@/components/funding/hiring-urgency-dot";
import { getFundingAmountClasses, getFundingRowHoverClasses } from "@/lib/semantic-colors";
import type { Company } from "@/db/schema";
import { cn } from "@/lib/utils";

type FundingEventRowProps = {
  company: Company;
};

export function FundingEventRow({ company }: FundingEventRowProps) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className={cn(getFundingRowHoverClasses(), "-mx-1 px-3 py-3.5")}
    >
      <div className="flex items-start gap-3">
        <HiringUrgencyDot score={company.aiHiringScore ?? 0} className="mt-2" />
        <CompanyLogo
          name={company.name}
          logoUrl={company.logoUrl}
          website={company.website}
          websiteDomain={company.websiteDomain}
          size="xs"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate font-semibold leading-tight transition-colors group-hover:text-primary">
              {company.name}
            </p>
            <span className={cn(getFundingAmountClasses("sm"), "shrink-0")}>
              {formatFundingAmount(company.fundingAmountUsd)}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <FundingStageBadge round={company.fundingRound ?? "Funding"} />
            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground/80">
              <CalendarDays className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
              {formatDate(company.fundingDate)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              {company.aiCategory ? (
                <CategoryBadge category={company.aiCategory} />
              ) : (
                <CategoryBadge category="Tech" />
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ScoreBadge score={company.pmFitScore ?? 0} label="PM fit" align="start" />
              <ArrowRight
                className="h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

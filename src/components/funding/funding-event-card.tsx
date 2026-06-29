import Link from "next/link";
import { ArrowRight, Briefcase, CalendarDays, MapPin } from "lucide-react";
import { CompanyLogo } from "@/components/company-logo";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { CategoryBadge, FundingStageBadge } from "@/components/semantic-badges";
import { getHiringPrediction } from "@/config/product";
import {
  getFundingAmountClasses,
  getFundingCardHoverClasses,
  getHiringPredictionTextClass,
} from "@/lib/semantic-colors";
import type { Company } from "@/db/schema";

type FundingEventCardProps = {
  company: Company;
};

export function FundingEventCard({ company }: FundingEventCardProps) {
  const prediction = getHiringPrediction(company.aiHiringScore ?? 0);
  const location = [company.hqCity, company.hqCountry ?? "France"].filter(Boolean).join(", ");

  return (
    <Link href={`/companies/${company.id}`} className={getFundingCardHoverClasses()}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-blue-200/25 bg-blue-500/[0.04] px-5 py-3.5 dark:border-blue-900/30">
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className={getFundingAmountClasses("lg")}>
            {formatFundingAmount(company.fundingAmountUsd)}
          </span>
          <FundingStageBadge round={company.fundingRound} />
        </div>
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground/90">
          <CalendarDays className="h-4 w-4 text-blue-600/70 dark:text-blue-400/70" aria-hidden />
          {formatDate(company.fundingDate)}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
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

        {company.aiCategory && (
          <div>
            <CategoryBadge category={company.aiCategory} />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <span>
            Hiring prediction:{" "}
            <strong className={getHiringPredictionTextClass(prediction.label)}>
              {prediction.label}
            </strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" aria-hidden />
            {company.pmRoles ?? 0} PM · {company.openRolesTotal ?? 0} total roles
          </span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4 border-t pt-4">
          <div className="flex flex-wrap gap-4">
            <ScoreBadge score={company.pmFitScore ?? 0} label="PM fit" showTier align="start" />
            <ScoreBadge score={company.aiHiringScore ?? 0} label="Hiring signal" align="start" />
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">
            View company
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </Link>
  );
}

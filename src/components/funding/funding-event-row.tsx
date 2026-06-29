import Link from "next/link";
import { ScoreBadge, formatFundingAmount, formatDate } from "@/components/score-badge";
import { HiringUrgencyDot } from "@/components/funding/hiring-urgency-dot";
import type { Company } from "@/db/schema";

type FundingEventRowProps = {
  company: Company;
};

export function FundingEventRow({ company }: FundingEventRowProps) {
  return (
    <Link
      href={`/companies/${company.id}`}
      className="flex items-center justify-between gap-3 py-3 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded-md transition-colors"
    >
      <div className="flex items-start gap-2 min-w-0">
        <HiringUrgencyDot score={company.aiHiringScore ?? 0} className="mt-1.5" />
        <div className="min-w-0">
          <p className="font-medium truncate">{company.name}</p>
          <p className="text-sm text-muted-foreground">
            {company.fundingRound ?? "Funding"} · {formatDate(company.fundingDate)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <ScoreBadge score={company.pmFitScore ?? 0} label="PM fit" />
        <div className="text-right">
          <p className="font-semibold tabular-nums text-sm">
            {formatFundingAmount(company.fundingAmountUsd)}
          </p>
          <p className="text-xs text-muted-foreground">{company.aiCategory ?? "Tech"}</p>
        </div>
      </div>
    </Link>
  );
}

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  getCategoryBadgeClasses,
  getFundingAmountClasses,
  getFundingBadgeClasses,
} from "@/lib/semantic-colors";

export function FundingStageBadge({ round }: { round: string | null | undefined }) {
  if (!round) return null;

  return (
    <Badge variant="outline" className={getFundingBadgeClasses()}>
      {round}
    </Badge>
  );
}

export function CategoryBadge({ category }: { category: string | null | undefined }) {
  if (!category) return null;

  return (
    <Badge variant="outline" className={getCategoryBadgeClasses(category)}>
      {category}
    </Badge>
  );
}

export function StrategicTargetBadge() {
  return (
    <Badge
      variant="outline"
      className="border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
    >
      Strategic target
    </Badge>
  );
}

export function FundingAmount({ amount }: { amount: ReactNode }) {
  return <span className={getFundingAmountClasses()}>{amount}</span>;
}

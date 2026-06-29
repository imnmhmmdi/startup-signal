import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPmFitHighlightTextClass,
  getSectionEyebrowClass,
  getStatCardAccentClasses,
} from "@/lib/semantic-colors";
import { cn } from "@/lib/utils";

type FundingSidebarProps = {
  stats: {
    totalEvents: number;
    eventsThisMonth: number;
    highPmFit: number;
  };
};

function StatRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: number;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-lg font-bold tabular-nums tracking-tight", valueClassName)}>
        {value}
      </span>
    </div>
  );
}

export function FundingSidebar({ stats }: FundingSidebarProps) {
  return (
    <Card className={cn("overflow-hidden", getStatCardAccentClasses("funding"))}>
      <CardHeader className="border-b border-blue-200/20 pb-4 dark:border-blue-900/30">
        <p
          className={cn(
            "mb-1.5 text-xs font-semibold uppercase tracking-widest",
            getSectionEyebrowClass("funding")
          )}
        >
          At a glance
        </p>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" aria-hidden />
          Funding snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-blue-200/20 pt-1 dark:divide-blue-900/30">
        <StatRow label="Events shown" value={stats.totalEvents} />
        <StatRow label="This month" value={stats.eventsThisMonth} />
        <StatRow
          label="High PM fit (70+)"
          value={stats.highPmFit}
          valueClassName={getPmFitHighlightTextClass()}
        />
        <p className="pt-4 text-xs leading-relaxed text-muted-foreground">
          Post-funding windows are the strongest PM hiring triggers — prioritize high-fit
          companies funded in the last 90 days.
        </p>
      </CardContent>
    </Card>
  );
}

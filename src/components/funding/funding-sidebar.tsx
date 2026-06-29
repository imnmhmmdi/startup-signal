import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FundingSidebarProps = {
  stats: {
    totalEvents: number;
    eventsThisMonth: number;
    highPmFit: number;
  };
};

export function FundingSidebar({ stats }: FundingSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Funding snapshot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Events shown</span>
          <span className="font-semibold tabular-nums">{stats.totalEvents}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">This month</span>
          <span className="font-semibold tabular-nums">{stats.eventsThisMonth}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">High PM fit (70+)</span>
          <span className="font-semibold tabular-nums text-emerald-700">{stats.highPmFit}</span>
        </div>
        <p className="text-xs text-muted-foreground pt-2 border-t">
          Post-funding windows are the strongest PM hiring triggers — prioritize high-fit companies funded in the last 90 days.
        </p>
      </CardContent>
    </Card>
  );
}

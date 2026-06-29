export const dynamic = "force-dynamic";

import { FundingEventCard } from "@/components/funding/funding-event-card";
import { getRecentFundingEvents } from "@/lib/queries/dashboard";
import { Card, CardContent } from "@/components/ui/card";
import { PRODUCT } from "@/config/product";
import { PageHeader } from "@/components/layout/page-header";

export default async function FundingPage() {
  const events = await getRecentFundingEvents(50);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Funding events"
        subtitle={`Recent rounds across ${PRODUCT.focusRegion} — each event is a potential PM hiring trigger`}
      />

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No funding events loaded yet. Run the seed script or wait for ingestion.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((company) => (
            <FundingEventCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}

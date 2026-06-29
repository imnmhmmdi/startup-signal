import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyOpportunityCard } from "@/components/companies/company-opportunity-card";
import {
  getClickableCardHoverClasses,
  getStatCardAccentClasses,
  type StatCardAccent,
} from "@/lib/semantic-colors";
import type { Company } from "@/db/schema";
import { cn } from "@/lib/utils";

type CompanyCardProps = {
  company: Company;
  showPrediction?: boolean;
};

export function CompanyCard({ company, showPrediction = true }: CompanyCardProps) {
  return (
    <CompanyOpportunityCard
      company={company}
      showPrediction={showPrediction}
      pmFitSize="sm"
    />
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  detail?: string;
  href?: string;
  accent?: StatCardAccent;
};

export function StatCard({ label, value, detail, href, accent = "neutral" }: StatCardProps) {
  const content = (
    <Card
      className={cn(
        getStatCardAccentClasses(accent),
        href && cn("cursor-pointer", getClickableCardHoverClasses())
      )}
    >
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

  if (href) return <Link href={href} className="block h-full">{content}</Link>;
  return content;
}

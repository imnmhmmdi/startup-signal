import { CompanyOpportunityCard } from "@/components/companies/company-opportunity-card";
import type { Company } from "@/db/schema";

type RecommendedCompanyCardProps = {
  company: Company;
  rank?: number;
};

export function RecommendedCompanyCard({ company, rank }: RecommendedCompanyCardProps) {
  return (
    <CompanyOpportunityCard
      company={company}
      rank={rank}
      showPrediction
      pmFitSize="md"
    />
  );
}

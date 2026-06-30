export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { safeQuery } from "@/lib/queries/safe-query";
import { QueryErrorBanner } from "@/components/query-error-banner";
import { EmptyState } from "@/components/empty-state";
import { getCompanyById } from "@/lib/queries/companies";
import { getUser } from "@/lib/supabase/server";
import { getCompanyBriefMeta, getStaticBrief } from "@/lib/llm/company-brief";
import { CompanyProfile } from "@/components/company/company-profile";

type PageProps = {
  params: Promise<{ id: string }>;
};

const EMPTY_BRIEF_META = {
  brief: null,
  updatedAt: null,
  isAiGenerated: false,
} as const;

export default async function CompanyPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();
  const route = `/companies/${id}`;

  const companyResult = await safeQuery(
    route,
    "getCompanyById",
    () => getCompanyById(id, user?.id),
    null
  );

  if (!companyResult.ok && companyResult.data === null) {
    return (
      <div className="space-y-6">
        <QueryErrorBanner errors={[companyResult.error!]} />
        <EmptyState
          title="Unable to load company"
          description="The company profile could not be loaded. Please try again shortly."
        />
      </div>
    );
  }

  const company = companyResult.data;
  if (!company) notFound();

  const briefMetaResult = await safeQuery(
    route,
    "getCompanyBriefMeta",
    () => getCompanyBriefMeta(id),
    EMPTY_BRIEF_META
  );

  const briefMeta = briefMetaResult.data;
  const brief = briefMeta.brief ?? getStaticBrief(company);
  const loadErrors = [companyResult, briefMetaResult]
    .filter((result) => !result.ok)
    .map((result) => result.error!);

  return (
    <div className="space-y-6">
      <QueryErrorBanner errors={loadErrors} />
      <CompanyProfile
        company={company}
        brief={brief}
        briefUpdatedAt={briefMeta.updatedAt}
        isAiGenerated={briefMeta.isAiGenerated}
        isAuthenticated={!!user}
      />
    </div>
  );
}

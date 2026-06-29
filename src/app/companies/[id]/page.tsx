export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCompanyById } from "@/lib/queries/companies";
import { getUser } from "@/lib/supabase/server";
import { getCompanyBriefMeta, getStaticBrief } from "@/lib/llm/company-brief";
import { CompanyProfile } from "@/components/company/company-profile";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompanyPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();

  const company = await getCompanyById(id, user?.id);
  if (!company) notFound();

  const briefMeta = await getCompanyBriefMeta(id);
  const brief = briefMeta.brief ?? getStaticBrief(company);

  return (
    <CompanyProfile
      company={company}
      brief={brief}
      briefUpdatedAt={briefMeta.updatedAt}
      isAiGenerated={briefMeta.isAiGenerated}
      isAuthenticated={!!user}
    />
  );
}

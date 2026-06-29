export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCompanyById } from "@/lib/queries/companies";
import { getUser } from "@/lib/supabase/server";
import { generateBriefIfNeeded } from "@/lib/llm/company-brief";
import { CompanyProfile } from "@/components/company/company-profile";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompanyPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getUser();

  const [company, brief] = await Promise.all([
    getCompanyById(id, user?.id),
    generateBriefIfNeeded(id),
  ]);

  if (!company) notFound();

  return (
    <CompanyProfile
      company={company}
      brief={brief}
      isAuthenticated={!!user}
    />
  );
}

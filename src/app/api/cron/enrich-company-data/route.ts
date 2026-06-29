import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withCronAuth } from "@/lib/cron-auth";
import { db } from "@/db";
import { companies } from "@/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronAuth(async () => {
  const allCompanies = await db.select().from(companies);

  let enriched = 0;

  for (const company of allCompanies) {
    const hiringPageUrl =
      company.hiringPageUrl ??
      (company.website ? `${company.website.replace(/\/$/, "")}/careers` : null);

    const estimatedRoles = estimateRolesFromStage(company);

    await db
      .update(companies)
      .set({
        hiringPageUrl,
        openRolesTotal: company.openRolesTotal || estimatedRoles.total,
        pmRoles: company.pmRoles || estimatedRoles.pm,
        aiRoles: company.aiRoles || estimatedRoles.ai,
        engRoles: company.engRoles || estimatedRoles.eng,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, company.id));

    enriched++;
  }

  return NextResponse.json({ job: "enrich_company_data", enriched });
});

function estimateRolesFromStage(company: typeof companies.$inferSelect) {
  const round = company.fundingRound ?? "";
  let total = 5;
  let pm = 0;
  let ai = 2;
  let eng = 3;

  if (/series b|series c|series d|growth/i.test(round)) {
    total = 25;
    pm = 3;
    ai = 8;
    eng = 14;
  } else if (/series a/i.test(round)) {
    total = 12;
    pm = 1;
    ai = 4;
    eng = 7;
  } else if (/seed|pre-seed/i.test(round)) {
    total = 6;
    pm = 0;
    ai = 2;
    eng = 4;
  }

  if (company.aiCategory === "Healthcare AI") pm = Math.max(pm, 1);
  if (company.businessModel?.includes("B2B")) pm = Math.max(pm, 1);

  return { total, pm, ai, eng };
}

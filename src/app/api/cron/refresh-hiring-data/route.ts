import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withCronAuth } from "@/lib/cron-auth";
import { db } from "@/db";
import { companies } from "@/db/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronAuth(async () => {
  const allCompanies = await db.select().from(companies);
  let refreshed = 0;

  for (const company of allCompanies) {
    const variance = Math.floor(Math.random() * 3) - 1;
    const newTotal = Math.max(0, (company.openRolesTotal ?? 0) + variance);
    const pmRatio = company.pmRoles && company.openRolesTotal
      ? company.pmRoles / company.openRolesTotal
      : 0.1;
    const aiRatio = company.aiRoles && company.openRolesTotal
      ? company.aiRoles / company.openRolesTotal
      : 0.3;

    await db
      .update(companies)
      .set({
        openRolesTotal: newTotal,
        pmRoles: Math.round(newTotal * pmRatio),
        aiRoles: Math.round(newTotal * aiRatio),
        engRoles: Math.max(0, newTotal - Math.round(newTotal * pmRatio) - Math.round(newTotal * aiRatio)),
        updatedAt: new Date(),
      })
      .where(eq(companies.id, company.id));

    refreshed++;
  }

  return NextResponse.json({ job: "refresh_hiring_data", refreshed });
});

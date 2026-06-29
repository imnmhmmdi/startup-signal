import { NextResponse } from "next/server";
import { withCronAuth } from "@/lib/cron-auth";
import { generateAllBriefs } from "@/lib/llm/company-brief";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronAuth(async () => {
  const generated = await generateAllBriefs();
  return NextResponse.json({ job: "generate_company_briefs", generated });
});

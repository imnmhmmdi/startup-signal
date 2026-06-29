import { NextResponse } from "next/server";
import { withCronAuth } from "@/lib/cron-auth";
import { ingestAllSources } from "@/lib/ingestion/ingest-service";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronAuth(async () => {
  const results = await ingestAllSources();
  return NextResponse.json({ job: "ingest_funding_news", results });
});

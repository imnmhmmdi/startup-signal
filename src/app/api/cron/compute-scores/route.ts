import { NextResponse } from "next/server";
import { withCronAuth } from "@/lib/cron-auth";
import { computeAllScores } from "@/lib/scoring/compute-scores";
import { db } from "@/db";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const GET = withCronAuth(async () => {
  const count = await computeAllScores(db);
  return NextResponse.json({ job: "compute_scores", companiesScored: count });
});

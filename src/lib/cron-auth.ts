import { NextRequest, NextResponse } from "next/server";

function verifyCronAuth(request: NextRequest): boolean {
  if (process.env.NODE_ENV === "development") return true;

  // Vercel Cron sends this header on scheduled invocations.
  if (process.env.VERCEL === "1" && request.headers.get("x-vercel-cron") === "1") {
    return true;
  }

  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) {
    return true;
  }

  return false;
}

export function withCronAuth(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    if (!verifyCronAuth(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      return await handler(request);
    } catch (error) {
      console.error("Cron job failed:", error);
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Job failed" },
        { status: 500 }
      );
    }
  };
}

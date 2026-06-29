import { NAV_ITEMS, PRODUCT } from "@/config/product";
import { getDatabaseStatus } from "@/lib/db/bootstrap";
import { getEnvironmentStatus, verifyDatabaseDns } from "@/lib/db/validate-config";

export const dynamic = "force-dynamic";

export async function GET() {
  const environment = getEnvironmentStatus();
  const dns = await verifyDatabaseDns();
  const database = await getDatabaseStatus();

  return Response.json({
    app: PRODUCT.name,
    tagline: PRODUCT.tagline,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    deployment: process.env.VERCEL_URL ?? "local",
    routes: NAV_ITEMS.map((item) => item.href),
    environment,
    dns,
    database,
    legacyRedirects: ["/dashboard", "/signal-hunter", "/watchlist", "/saved"],
  });
}

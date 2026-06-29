import { NAV_ITEMS, PRODUCT } from "@/config/product";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    app: PRODUCT.name,
    tagline: PRODUCT.tagline,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local",
    deployment: process.env.VERCEL_URL ?? "local",
    routes: NAV_ITEMS.map((item) => item.href),
    legacyRedirects: ["/dashboard", "/signal-hunter", "/watchlist", "/saved"],
  });
}

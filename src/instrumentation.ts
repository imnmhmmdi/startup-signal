export async function register() {
  // Skip during `next build` — only bootstrap at runtime on server start.
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  const { ensureDatabaseReady } = await import("@/lib/db/bootstrap");
  await ensureDatabaseReady();
}

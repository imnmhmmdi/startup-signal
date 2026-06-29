export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  // Only bootstrap when explicitly requested — avoids blocking dev server startup
  // and exhausting DB connections on every cold start.
  // Run once: RUN_DB_BOOTSTRAP=true npm run dev  OR  npm run db:bootstrap
  if (process.env.RUN_DB_BOOTSTRAP !== "true") {
    return;
  }

  const { validateDatabaseConfig } = await import("@/lib/db/validate-config");
  const config = validateDatabaseConfig();

  if (!config.valid) {
    console.error("[db] Invalid database configuration:", config.error);
    return;
  }

  try {
    const { ensureDatabaseReady } = await import("@/lib/db/bootstrap");
    await ensureDatabaseReady();
  } catch (error) {
    const { formatDatabaseConnectionError } = await import("@/lib/db/validate-config");
    console.error("[db] Bootstrap failed:", formatDatabaseConnectionError(error));
  }
}

export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }

  const { validateDatabaseConfig } = await import("@/lib/db/validate-config");
  const config = validateDatabaseConfig();

  if (!config.valid) {
    console.error("[db] Invalid database configuration:", config.error);
    return;
  }

  const shouldRunMigrations =
    process.env.VERCEL === "1" || process.env.RUN_DB_BOOTSTRAP === "true";
  const shouldRunFullBootstrap = process.env.RUN_DB_BOOTSTRAP === "true";

  if (!shouldRunMigrations && !shouldRunFullBootstrap) {
    return;
  }

  try {
    const { ensureDatabaseReady, runDatabaseMigrations, getDatabaseStatus } = await import(
      "@/lib/db/bootstrap"
    );

    if (shouldRunFullBootstrap) {
      await ensureDatabaseReady();
      return;
    }

    await runDatabaseMigrations();

    const status = await getDatabaseStatus();
    if (!status.ready) {
      console.error(
        "[db] Schema not ready after migrations:",
        JSON.stringify({
          tables: status.tables,
          companyColumns: status.companyColumns,
          error: status.error,
        })
      );
    } else {
      console.log(
        `[db] Schema ready (${status.companyCount} companies, mode=${status.config.mode})`
      );
    }
  } catch (error) {
    const { formatDatabaseConnectionError } = await import("@/lib/db/validate-config");
    console.error("[db] Startup database setup failed:", formatDatabaseConnectionError(error));
  }
}

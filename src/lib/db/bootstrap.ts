import path from "node:path";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import { companies } from "@/db/schema";
import * as schema from "@/db/schema";
import { upsertSeedCompany, backfillDiscoveryScores } from "@/lib/ingestion/ingest-service";
import { computeAllScores } from "@/lib/scoring/compute-scores";
import { SEED_COMPANIES } from "@/lib/db/seed-data";
import {
  formatDatabaseConnectionError,
  validateDatabaseConfig,
} from "@/lib/db/validate-config";

const MIGRATION_LOCK_ID = 8347291;
const POOLER_HOST_PATTERN = /\.pooler\.supabase\.com$/;
const REQUIRED_TABLES = [
  "companies",
  "company_briefs",
  "saved_companies",
  "ingestion_runs",
  "raw_funding_items",
] as const;

let bootstrapPromise: Promise<void> | null = null;

export async function ensureDatabaseReady(options?: {
  seedIfEmpty?: boolean;
}): Promise<void> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = runBootstrap(options).catch((error) => {
    bootstrapPromise = null;
    throw error;
  });

  return bootstrapPromise;
}

async function runBootstrap(options?: { seedIfEmpty?: boolean }): Promise<void> {
  const config = validateDatabaseConfig();
  if (!config.valid) {
    throw new Error(config.error);
  }

  const connectionString = process.env.DATABASE_URL!;

  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
  });
  const db = drizzle(client, { schema });

  try {
    const useAdvisoryLock = !POOLER_HOST_PATTERN.test(config.hostname ?? "");

    if (useAdvisoryLock) {
      await client`SELECT pg_advisory_lock(${MIGRATION_LOCK_ID})`;
    }

    await migrate(db, {
      migrationsFolder: path.join(process.cwd(), "drizzle"),
    });

    await assertRequiredTables(client);

    const shouldSeed =
      options?.seedIfEmpty !== false &&
      process.env.SEED_ON_DEPLOY !== "false" &&
      (await isCompaniesTableEmpty(db));

    if (shouldSeed) {
      console.log(`[db] Seeding ${SEED_COMPANIES.length} companies...`);
      let created = 0;
      let updated = 0;

      for (const company of SEED_COMPANIES) {
        const result = await upsertSeedCompany(company);
        if (result.status === "created") created++;
        if (result.status === "updated") updated++;
      }

      const scored = await computeAllScores(db);
      console.log(
        `[db] Seed complete: ${created} created, ${updated} updated, ${scored} scored`
      );
    }

    const backfilled = await backfillDiscoveryScores();
    console.log(`[db] Discovery scores backfilled for ${backfilled} companies`);
  } catch (error) {
    throw new Error(formatDatabaseConnectionError(error), { cause: error });
  } finally {
    const useAdvisoryLock = !POOLER_HOST_PATTERN.test(config.hostname ?? "");
    if (useAdvisoryLock) {
      await client`SELECT pg_advisory_unlock(${MIGRATION_LOCK_ID})`.catch(() => undefined);
    }
    await client.end();
  }
}

async function isCompaniesTableEmpty(
  db: ReturnType<typeof drizzle>
): Promise<boolean> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(companies);
  return (result?.count ?? 0) === 0;
}

async function assertRequiredTables(
  client: postgres.Sql
): Promise<void> {
  const rows = await client<{ table_name: string }[]>`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name IN ${client(REQUIRED_TABLES)}
  `;

  const found = new Set(rows.map((row) => row.table_name));
  const missing = REQUIRED_TABLES.filter((table) => !found.has(table));

  if (missing.length > 0) {
    throw new Error(`Database bootstrap incomplete. Missing tables: ${missing.join(", ")}`);
  }
}

export async function getDatabaseStatus(): Promise<{
  ready: boolean;
  tables: Record<string, boolean>;
  companyCount: number;
  config: ReturnType<typeof validateDatabaseConfig>;
  error?: string;
}> {
  const config = validateDatabaseConfig();
  if (!config.valid) {
    return {
      ready: false,
      tables: {},
      companyCount: 0,
      config,
      error: config.error,
    };
  }

  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
  });

  try {
    const rows = await client<{ table_name: string }[]>`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ${client(REQUIRED_TABLES)}
    `;

    const found = new Set(rows.map((row) => row.table_name));
    const tables = Object.fromEntries(
      REQUIRED_TABLES.map((table) => [table, found.has(table)])
    ) as Record<(typeof REQUIRED_TABLES)[number], boolean>;

    let companyCount = 0;
    if (tables.companies) {
      const [result] = await client<{ count: number }[]>`
        SELECT count(*)::int AS count FROM companies
      `;
      companyCount = result?.count ?? 0;
    }

    return {
      ready: REQUIRED_TABLES.every((table) => tables[table]),
      tables,
      companyCount,
      config,
    };
  } catch (error) {
    return {
      ready: false,
      tables: {},
      companyCount: 0,
      config,
      error: formatDatabaseConnectionError(error),
    };
  } finally {
    await client.end();
  }
}

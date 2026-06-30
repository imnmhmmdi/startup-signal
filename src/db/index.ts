import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { getPostgresErrorCode, unwrapQueryError } from "@/lib/db/query-errors";
import { validateDatabaseConfig, formatDatabaseConnectionError } from "@/lib/db/validate-config";

type DB = PostgresJsDatabase<typeof schema>;

let _db: DB | null = null;

export function getDb(): DB {
  if (_db) return _db;

  const config = validateDatabaseConfig();
  if (!config.valid) {
    throw new Error(config.error ?? "Invalid database configuration");
  }

  const connectionString = process.env.DATABASE_URL!;
  const isServerless = process.env.VERCEL === "1";
  const client = postgres(connectionString, {
    prepare: false,
    connect_timeout: 10,
    idle_timeout: isServerless ? 5 : 20,
    // One connection per serverless instance — avoids exhausting Supabase pooler slots.
    max: isServerless ? 1 : 10,
  });
  _db = drizzle(client, { schema });
  return _db;
}

export async function withDatabase<T>(fn: (db: DB) => Promise<T>): Promise<T> {
  try {
    return await fn(getDb());
  } catch (error) {
    throw new Error(formatDatabaseConnectionError(error), { cause: error });
  }
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    return Reflect.get(getDb(), prop);
  },
});

let schemaRepairAttempted = false;

/** Attempt migrations once when queries fail due to missing tables/columns. */
export async function repairSchemaOnError(error: unknown): Promise<boolean> {
  if (schemaRepairAttempted) return false;

  const code = getPostgresErrorCode(error);
  const root = unwrapQueryError(error);
  const isSchemaIssue =
    code === "42703" ||
    code === "42P01" ||
    root.message.includes("does not exist");

  if (!isSchemaIssue) return false;

  schemaRepairAttempted = true;

  try {
    const { runDatabaseMigrations } = await import("@/lib/db/bootstrap");
    await runDatabaseMigrations();
    console.log("[db] Schema repair migrations completed after query failure");
    return true;
  } catch (repairError) {
    console.error(
      "[db] Schema repair failed:",
      formatDatabaseConnectionError(repairError)
    );
    return false;
  }
}

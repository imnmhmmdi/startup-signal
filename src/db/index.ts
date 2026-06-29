import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
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
  const client = postgres(connectionString, {
    prepare: false,
    connect_timeout: 5,
    idle_timeout: 10,
    max: 3,
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

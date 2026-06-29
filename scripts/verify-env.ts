#!/usr/bin/env tsx
/**
 * Verify env vars without masking failures.
 * Usage: npm run verify:env
 */
import "dotenv/config";
import { lookup } from "node:dns/promises";
import postgres from "postgres";
import {
  getSupabaseProjectRef,
  validateDatabaseConfig,
} from "../src/lib/db/validate-config";

const REQUIRED = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

function mask(value: string | undefined): string {
  if (!value) return "(not set)";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 6)}…${value.slice(-4)} (${value.length} chars)`;
}

async function verifySupabaseUrl(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  console.log("\n=== Layer 1: NEXT_PUBLIC_SUPABASE_URL ===");
  console.log("Value:", url ?? "(not set)");

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }

  const ref = getSupabaseProjectRef();
  if (!ref) {
    throw new Error(`Invalid format — expected https://[ref].supabase.co, got: ${url}`);
  }

  console.log("Project ref:", ref);

  const res = await fetch(`${url}/auth/v1/health`);
  console.log("Auth health:", res.status, res.statusText);

  if (res.status === 404) {
    throw new Error("Supabase project not found (404) — wrong URL or deleted project");
  }

  console.log("PASS: Supabase project host is reachable");
}

async function verifyAnonKey(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log("\n=== Layer 2: NEXT_PUBLIC_SUPABASE_ANON_KEY ===");
  console.log("Value:", mask(key));

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must both be set");
  }

  const res = await fetch(`${url}/auth/v1/settings`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });

  console.log("Auth settings:", res.status, res.statusText);

  if (res.status === 401 || res.status === 403) {
    throw new Error(
      "Anon key rejected (401/403) — copy the anon/public key from Supabase → Settings → API"
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Unexpected response: ${res.status} ${body.slice(0, 200)}`);
  }

  console.log("PASS: Anon key accepted by Supabase Auth");
}

async function verifyDatabaseDns(): Promise<void> {
  console.log("\n=== Layer 2: DATABASE_URL host DNS ===");

  const config = validateDatabaseConfig();
  if (!config.hostname) {
    throw new Error("Cannot resolve DATABASE_URL hostname — invalid or missing DATABASE_URL");
  }

  console.log("Hostname:", config.hostname);

  try {
    const records = await lookup(config.hostname, { all: true });
    const ipv4 = records.filter((r) => r.family === 4);
    const ipv6 = records.filter((r) => r.family === 6);
    console.log("IPv4 records:", ipv4.length ? ipv4.map((r) => r.address).join(", ") : "NONE");
    console.log("IPv6 records:", ipv6.length ? ipv6.map((r) => r.address).join(", ") : "NONE");

    if (ipv4.length === 0) {
      throw new Error(
        `Host "${config.hostname}" has no IPv4 (A) record. Vercel serverless requires IPv4 — use Shared Pooler (aws-0-[region].pooler.supabase.com:6543).`
      );
    }

    console.log("PASS: DATABASE_URL host resolves over IPv4");
  } catch (error) {
    if (error instanceof Error && error.message.includes("IPv4")) throw error;
    throw new Error(
      `DNS lookup failed for "${config.hostname}": ${error instanceof Error ? error.message : error}`
    );
  }
}

async function verifyDatabaseUrl(): Promise<void> {
  console.log("\n=== Layer 3–5: DATABASE_URL connection, schema, migrations ===");

  const config = validateDatabaseConfig();
  console.log("Hostname:", config.hostname ?? "(unknown)");
  console.log("Supabase ref:", config.supabaseRef ?? "(unknown)");

  if (!config.valid) {
    throw new Error(config.error ?? "Invalid DATABASE_URL");
  }

  const connectionString = process.env.DATABASE_URL!;
  console.log("URL shape: valid (password not printed)");

  const client = postgres(connectionString, {
    max: 1,
    prepare: false,
    connect_timeout: 10,
  });

  try {
    const [{ ok }] = await client`SELECT 1 AS ok`;
    console.log("Connection:", ok === 1 ? "OK" : "FAILED");

    const tables = await client<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;
    console.log("Tables:", tables.map((t) => t.table_name).join(", ") || "(none)");

    const hasCompanies = tables.some((t) => t.table_name === "companies");
    if (!hasCompanies) {
      throw new Error('Table "companies" missing — run npm run db:bootstrap');
    }

    const [migrationTable] = await client<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = '__drizzle_migrations'
      ) AS exists
    `;
    console.log("__drizzle_migrations:", migrationTable?.exists ? "present" : "missing (run db:bootstrap)");

    const [{ count }] = await client`SELECT count(*)::int AS count FROM companies`;
    console.log("Companies row count:", count);
    console.log("PASS: DATABASE_URL connects and schema is present");
  } finally {
    await client.end();
  }
}

async function main() {
  console.log("=== Environment variable check ===");

  for (const name of REQUIRED) {
    const set = Boolean(process.env[name]);
    console.log(`${name}: ${set ? "set" : "MISSING"}`);
  }

  await verifySupabaseUrl();
  await verifyAnonKey();
  await verifyDatabaseDns();
  await verifyDatabaseUrl();

  console.log("\nAll env layers passed.");
}

main().catch((error) => {
  console.error("\nFAILED:", error instanceof Error ? error.message : error);
  process.exit(1);
});

import { lookup } from "node:dns/promises";

export type DatabaseConfigStatus = {
  valid: boolean;
  error?: string;
  hostname?: string;
  supabaseRef?: string;
};

export function getSupabaseProjectRef(): string | undefined {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return undefined;
  return supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
}

export function validateDatabaseConfig(): DatabaseConfigStatus {
  const connectionString = process.env.DATABASE_URL;
  const supabaseRef = getSupabaseProjectRef();

  if (!connectionString) {
    return {
      valid: false,
      error:
        "DATABASE_URL is not set. Add your Supabase Postgres connection string in Vercel → Settings → Environment Variables.",
      supabaseRef,
    };
  }

  let hostname: string;
  let username: string | undefined;
  try {
    const parsed = new URL(connectionString.replace(/^postgresql:/, "http:"));
    hostname = parsed.hostname;
    username = parsed.username;
  } catch {
    return {
      valid: false,
      error: "DATABASE_URL is not a valid Postgres connection URL.",
      supabaseRef,
    };
  }

  const refMatches =
    !supabaseRef ||
    hostname.includes(supabaseRef) ||
    username === `postgres.${supabaseRef}`;

  if (supabaseRef && !refMatches) {
    return {
      valid: false,
      hostname,
      supabaseRef,
      error:
        `DATABASE_URL hostname "${hostname}" does not match Supabase project ref "${supabaseRef}" from NEXT_PUBLIC_SUPABASE_URL. ` +
        `Copy the connection string from Supabase → Project Settings → Database for project ${supabaseRef}.`,
    };
  }

  // db.[ref].supabase.co is often IPv6-only; Vercel serverless requires IPv4.
  if (/^db\.[^.]+\.supabase\.co$/.test(hostname)) {
    return {
      valid: false,
      hostname,
      supabaseRef,
      error:
        `DATABASE_URL uses "${hostname}" which is IPv6-only (Dedicated/Direct pooler). ` +
        "Vercel cannot resolve this — use the Shared Pooler connection string instead: " +
        "Supabase Dashboard → Connect → Connection pooling → Transaction pooler (port 6543). " +
        "It looks like: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres",
    };
  }

  return { valid: true, hostname, supabaseRef };
}

export function getEnvironmentStatus(): {
  DATABASE_URL: boolean;
  NEXT_PUBLIC_SUPABASE_URL: boolean;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
  supabaseRef?: string;
  databaseHostname?: string;
  databaseUsername?: string;
  configValid: boolean;
  configError?: string;
} {
  const config = validateDatabaseConfig();
  let databaseUsername: string | undefined;
  if (process.env.DATABASE_URL) {
    try {
      databaseUsername = new URL(
        process.env.DATABASE_URL.replace(/^postgresql:/, "http:")
      ).username;
    } catch {
      databaseUsername = undefined;
    }
  }

  return {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseRef: config.supabaseRef,
    databaseHostname: config.hostname,
    databaseUsername,
    configValid: config.valid,
    configError: config.error,
  };
}

export async function verifyDatabaseDns(): Promise<{
  hostname?: string;
  ok: boolean;
  ipv4: boolean;
  ipv6: boolean;
  error?: string;
}> {
  const config = validateDatabaseConfig();
  if (!config.valid || !config.hostname) {
    return {
      hostname: config.hostname,
      ok: false,
      ipv4: false,
      ipv6: false,
      error: config.error ?? "Invalid DATABASE_URL",
    };
  }

  try {
    const records = await lookup(config.hostname, { all: true });
    const ipv4 = records.some((r) => r.family === 4);
    const ipv6 = records.some((r) => r.family === 6);

    if (!ipv4) {
      return {
        hostname: config.hostname,
        ok: false,
        ipv4,
        ipv6,
        error: `No IPv4 DNS record for ${config.hostname}. Use Shared Pooler for Vercel.`,
      };
    }

    return { hostname: config.hostname, ok: true, ipv4, ipv6 };
  } catch (error) {
    return {
      hostname: config.hostname,
      ok: false,
      ipv4: false,
      ipv6: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export function formatDatabaseConnectionError(error: unknown): string {
  const config = validateDatabaseConfig();

  if (!config.valid && config.error) {
    return config.error;
  }

  if (error instanceof Error) {
    const cause = error.cause instanceof Error ? error.cause : error;
    const message = cause.message;

    if (message.includes("ENOTFOUND")) {
      const host =
        "hostname" in cause && typeof cause.hostname === "string"
          ? cause.hostname
          : config.hostname ?? "unknown host";
      return (
        `Cannot resolve database host "${host}". The Supabase project may be paused, deleted, or DATABASE_URL is wrong. ` +
        "Update DATABASE_URL in Vercel from Supabase → Project Settings → Database → Connection string (URI, direct, port 5432)."
      );
    }

    if (message.includes("ECONNREFUSED")) {
      return "Database connection refused. Check DATABASE_URL host, port, and that the Supabase project is active.";
    }

    if (message.includes("password authentication failed")) {
      return "Database password incorrect. Reset the database password in Supabase and update DATABASE_URL in Vercel.";
    }

    return message;
  }

  return "Unknown database connection error.";
}

import { lookup } from "node:dns/promises";
import { unwrapQueryError } from "@/lib/db/query-errors";

export type DatabaseConnectionMode =
  | "direct"
  | "dedicated-pooler"
  | "shared-pooler"
  | "unknown";

export type DatabaseConfigStatus = {
  valid: boolean;
  error?: string;
  hostname?: string;
  username?: string;
  port?: string;
  mode?: DatabaseConnectionMode;
  supabaseRef?: string;
};

export function detectConnectionMode(
  hostname: string,
  port: string
): DatabaseConnectionMode {
  if (/\.pooler\.supabase\.com$/.test(hostname)) {
    return "shared-pooler";
  }
  if (/^db\.[^.]+\.supabase\.co$/.test(hostname)) {
    return port === "6543" ? "dedicated-pooler" : "direct";
  }
  return "unknown";
}

function projectRefFromHostname(hostname: string): string | undefined {
  const match = hostname.match(/^db\.([^.]+)\.supabase\.co$/);
  return match?.[1];
}

function projectRefFromPoolerUsername(username: string): string | undefined {
  const match = username.match(/^postgres\.([^.]+)$/);
  return match?.[1];
}

function validateProjectRef(params: {
  supabaseRef?: string;
  hostname: string;
  username: string;
  mode: DatabaseConnectionMode;
}): { valid: boolean; error?: string } {
  const { supabaseRef, hostname, username, mode } = params;
  if (!supabaseRef) {
    return { valid: true };
  }

  if (mode === "shared-pooler") {
    const refFromUser = projectRefFromPoolerUsername(username);
    if (refFromUser === supabaseRef) {
      return { valid: true };
    }
    return {
      valid: false,
      error:
        `Shared Pooler DATABASE_URL must use username "postgres.${supabaseRef}" ` +
        `(got "${username}"). Copy the Transaction pooler URI from Supabase → Connect.`,
    };
  }

  if (mode === "direct" || mode === "dedicated-pooler") {
    const refFromHost = projectRefFromHostname(hostname);
    if (refFromHost === supabaseRef) {
      return { valid: true };
    }
    return {
      valid: false,
      error:
        `Direct/Dedicated DATABASE_URL must use host "db.${supabaseRef}.supabase.co" ` +
        `(got "${hostname}"). Copy the connection string from Supabase → Connect.`,
    };
  }

  const refFromHost = projectRefFromHostname(hostname);
  const refFromUser = projectRefFromPoolerUsername(username);
  if (refFromHost === supabaseRef || refFromUser === supabaseRef) {
    return { valid: true };
  }

  return {
    valid: false,
    error:
      `DATABASE_URL does not match Supabase project ref "${supabaseRef}". ` +
      `Use host db.${supabaseRef}.supabase.co (direct) or username postgres.${supabaseRef} (shared pooler).`,
  };
}

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
  let username: string;
  let port: string;
  try {
    const parsed = new URL(connectionString.replace(/^postgresql:/, "http:"));
    hostname = parsed.hostname;
    username = decodeURIComponent(parsed.username);
    port = parsed.port || "5432";
  } catch {
    return {
      valid: false,
      error: "DATABASE_URL is not a valid Postgres connection URL.",
      supabaseRef,
    };
  }

  const mode = detectConnectionMode(hostname, port);

  const refCheck = validateProjectRef({ supabaseRef, hostname, username, mode });
  if (!refCheck.valid) {
    return {
      valid: false,
      hostname,
      username,
      port,
      mode,
      supabaseRef,
      error: refCheck.error,
    };
  }

  // Dedicated/direct db.[ref].supabase.co is IPv6-only; Vercel serverless requires IPv4.
  if (mode === "direct" || mode === "dedicated-pooler") {
    return {
      valid: false,
      hostname,
      username,
      port,
      mode,
      supabaseRef,
      error:
        `DATABASE_URL uses "${hostname}" which is IPv6-only (Direct/Dedicated pooler). ` +
        "Vercel cannot resolve this — use the Shared Pooler connection string instead: " +
        "Supabase Dashboard → Connect → Connection pooling → Transaction pooler (port 6543). " +
        "It looks like: postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres",
    };
  }

  return { valid: true, hostname, username, port, mode, supabaseRef };
}

export function getEnvironmentStatus(): {
  DATABASE_URL: boolean;
  NEXT_PUBLIC_SUPABASE_URL: boolean;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: boolean;
  supabaseRef?: string;
  databaseHostname?: string;
  databaseUsername?: string;
  databaseMode?: DatabaseConnectionMode;
  configValid: boolean;
  configError?: string;
} {
  const config = validateDatabaseConfig();

  return {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    supabaseRef: config.supabaseRef,
    databaseHostname: config.hostname,
    databaseUsername: config.username,
    databaseMode: config.mode,
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

  const root = unwrapQueryError(error);
  const message = root.message;

  if (message.includes("ENOTFOUND")) {
    const host =
      "hostname" in root && typeof root.hostname === "string"
        ? root.hostname
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

  if (message.includes("does not exist")) {
    return `Database schema mismatch: ${message}. Redeploy or run npm run db:bootstrap.`;
  }

  return message || "Unknown database connection error.";
}

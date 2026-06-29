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
  try {
    hostname = new URL(connectionString.replace(/^postgresql:/, "http:")).hostname;
  } catch {
    return {
      valid: false,
      error: "DATABASE_URL is not a valid Postgres connection URL.",
      supabaseRef,
    };
  }

  if (supabaseRef && !hostname.includes(supabaseRef)) {
    return {
      valid: false,
      hostname,
      supabaseRef,
      error:
        `DATABASE_URL hostname "${hostname}" does not match Supabase project ref "${supabaseRef}" from NEXT_PUBLIC_SUPABASE_URL. ` +
        `Copy the connection string from Supabase → Project Settings → Database for project ${supabaseRef}.`,
    };
  }

  return { valid: true, hostname, supabaseRef };
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

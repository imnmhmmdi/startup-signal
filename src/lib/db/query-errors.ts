type PostgresErrorLike = Error & {
  code?: string;
  detail?: string;
  hint?: string;
  severity?: string;
};

const PG_CODE_HINTS: Record<string, string> = {
  "42703": "Database schema is outdated — a required column is missing. Redeploy or run npm run db:bootstrap.",
  "42P01": "Database table missing. Redeploy or run npm run db:bootstrap.",
  "53300": "Database connection limit reached. Retry in a moment.",
  "57P01": "Database is restarting or unavailable. Retry shortly.",
  "08006": "Database connection failed. Check DATABASE_URL and Supabase project status.",
  "28P01": "Database password incorrect. Update DATABASE_URL in your deployment environment.",
};

function isDrizzleQueryError(error: Error): boolean {
  return error.message.startsWith("Failed query:") || error.name === "DrizzleQueryError";
}

export function unwrapQueryError(error: unknown): PostgresErrorLike {
  let current: unknown = error;
  let depth = 0;

  while (current instanceof Error && depth < 6) {
    if (isDrizzleQueryError(current) && current.cause instanceof Error) {
      current = current.cause;
      depth++;
      continue;
    }
    if (current.cause instanceof Error && depth < 5) {
      current = current.cause;
      depth++;
      continue;
    }
    break;
  }

  if (current instanceof Error) {
    return current as PostgresErrorLike;
  }

  return new Error(String(current)) as PostgresErrorLike;
}

export function getPostgresErrorCode(error: unknown): string | undefined {
  const root = unwrapQueryError(error);
  return root.code;
}

export function formatQueryErrorForUser(error: unknown, queryName?: string): string {
  const root = unwrapQueryError(error);
  const prefix = queryName ? `${queryName}: ` : "";

  if (root.code && PG_CODE_HINTS[root.code]) {
    return `${prefix}${PG_CODE_HINTS[root.code]}`;
  }

  if (root.message.includes("ENOTFOUND")) {
    return `${prefix}Cannot reach the database host. Check DATABASE_URL and that your Supabase project is active.`;
  }

  if (root.message.includes("ECONNREFUSED")) {
    return `${prefix}Database connection refused. Verify DATABASE_URL host and port.`;
  }

  if (root.message.includes("password authentication failed")) {
    return `${prefix}Database authentication failed. Reset the Supabase password and update DATABASE_URL.`;
  }

  if (root.message.includes("timed out after")) {
    return `${prefix}${root.message}`;
  }

  if (root.message.includes("does not exist")) {
    return `${prefix}Database schema mismatch (${root.message}). Redeploy or run npm run db:bootstrap.`;
  }

  if (root.message.includes("too many clients")) {
    return `${prefix}Database connection pool exhausted. Retry shortly.`;
  }

  return `${prefix}${root.message}`;
}

export function formatQueryErrorForLog(error: unknown): {
  message: string;
  pgCode?: string;
  pgDetail?: string;
  pgHint?: string;
  drizzleQuery?: string;
  drizzleParams?: unknown;
} {
  const root = unwrapQueryError(error);
  const drizzle =
    error instanceof Error && isDrizzleQueryError(error)
      ? (error as Error & { query?: string; params?: unknown })
      : null;

  return {
    message: root.message,
    pgCode: root.code,
    pgDetail: root.detail,
    pgHint: root.hint,
    drizzleQuery: drizzle?.query,
    drizzleParams: drizzle?.params,
  };
}

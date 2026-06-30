import { formatQueryErrorForLog, formatQueryErrorForUser, unwrapQueryError } from "@/lib/db/query-errors";

type ServerLogContext = {
  route: string;
  queryName?: string;
  component?: string;
  digest?: string;
  error: unknown;
  extra?: Record<string, unknown>;
};

function getErrorMessage(error: unknown): string {
  const root = unwrapQueryError(error);
  return root.message;
}

function getErrorStack(error: unknown): string | undefined {
  const root = unwrapQueryError(error);
  return root.stack ?? (error instanceof Error ? error.stack : undefined);
}

export function logServerError(context: ServerLogContext): void {
  const details = formatQueryErrorForLog(context.error);
  const payload = {
    level: "error" as const,
    event: "server_render_failure",
    route: context.route,
    queryName: context.queryName,
    component: context.component,
    message: details.message,
    pgCode: details.pgCode,
    pgDetail: details.pgDetail,
    pgHint: details.pgHint,
    drizzleQuery: details.drizzleQuery,
    drizzleParams: details.drizzleParams,
    digest: context.digest,
    stack: getErrorStack(context.error),
    timestamp: new Date().toISOString(),
    ...context.extra,
  };

  console.error(JSON.stringify(payload));
}

export function logServerWarning(
  route: string,
  queryName: string,
  message: string,
  extra?: Record<string, unknown>
): void {
  console.warn(
    JSON.stringify({
      level: "warn",
      event: "server_render_degraded",
      route,
      queryName,
      message,
      timestamp: new Date().toISOString(),
      ...extra,
    })
  );
}

export { getErrorMessage };

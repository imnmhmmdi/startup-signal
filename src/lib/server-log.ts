type ServerLogContext = {
  route: string;
  queryName?: string;
  component?: string;
  digest?: string;
  error: unknown;
  extra?: Record<string, unknown>;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

export function logServerError(context: ServerLogContext): void {
  const message = getErrorMessage(context.error);
  const payload = {
    level: "error" as const,
    event: "server_render_failure",
    route: context.route,
    queryName: context.queryName,
    component: context.component,
    message,
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

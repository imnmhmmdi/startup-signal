import { formatQueryErrorForUser } from "@/lib/db/query-errors";
import { logServerError } from "@/lib/server-log";

export type SafeQueryResult<T> =
  | { ok: true; data: T; error?: undefined }
  | { ok: false; data: T; error: string };

export async function safeQuery<T>(
  route: string,
  queryName: string,
  fn: () => Promise<T>,
  fallback: T
): Promise<SafeQueryResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (error) {
    const { repairSchemaOnError } = await import("@/db");
    const repaired = await repairSchemaOnError(error);

    if (repaired) {
      try {
        const data = await fn();
        return { ok: true, data };
      } catch (retryError) {
        logServerError({ route, queryName, error: retryError, extra: { retriedAfterRepair: true } });
        return {
          ok: false,
          data: fallback,
          error: formatQueryErrorForUser(retryError, queryName),
        };
      }
    }

    logServerError({ route, queryName, error });
    return {
      ok: false,
      data: fallback,
      error: formatQueryErrorForUser(error, queryName),
    };
  }
}

export function collectQueryErrors(
  results: Array<{ ok: boolean; error?: string; queryName: string }>
): string[] {
  return results.filter((result) => !result.ok && result.error).map((result) => result.error!);
}

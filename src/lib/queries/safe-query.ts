import { getErrorMessage, logServerError } from "@/lib/server-log";

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
    logServerError({ route, queryName, error });
    return { ok: false, data: fallback, error: getErrorMessage(error) };
  }
}

export function collectQueryErrors(
  results: Array<{ ok: boolean; error?: string; queryName: string }>
): string[] {
  return results.filter((result) => !result.ok && result.error).map((result) => result.error!);
}

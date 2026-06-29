const DEFAULT_QUERY_TIMEOUT_MS = 12_000;

export async function withQueryTimeout<T>(
  promise: Promise<T>,
  label = "Database query",
  timeoutMs = DEFAULT_QUERY_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `${label} timed out after ${timeoutMs / 1000}s. Check DATABASE_URL — use Supabase Transaction pooler (port 6543) with username postgres.[project-ref].`
        )
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

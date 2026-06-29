import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const AUTH_TIMEOUT_MS = 8_000;

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — ignore
          }
        },
      },
    }
  );
}

export async function getUser() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    const supabase = await createClient();
    const authPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error("Auth session check timed out"));
      }, AUTH_TIMEOUT_MS);
    });

    const { data: { user } } = await Promise.race([authPromise, timeoutPromise]);
    return user;
  } catch (error) {
    console.error("[auth] getUser failed:", error);
    return null;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

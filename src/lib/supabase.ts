import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedAdmin: SupabaseClient | null = null;

/**
 * Server-only Supabase client with Service Role privileges.
 * Lazily initialized to avoid throwing errors during Next.js build-time evaluation
 * when production environment variables may not yet be injected.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedAdmin) return cachedAdmin;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://placeholder.supabase.co";

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder";

  try {
    cachedAdmin = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedAdmin;
  } catch (err) {
    console.warn("[Supabase Admin] Client initialization warning:", err);
    return createClient("https://placeholder.supabase.co", "placeholder");
  }
}

export const supabaseAdmin = typeof window === "undefined"
  ? getSupabaseAdmin()
  : (null as any);

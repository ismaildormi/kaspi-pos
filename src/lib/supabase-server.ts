import "server-only";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let cachedAdmin: SupabaseClient | null = null;

/**
 * Server-only Supabase client with Service Role privileges.
 * Lazily initialized to prevent any build-time evaluation crashes when environment variables are not yet injected.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (cachedAdmin) return cachedAdmin;

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://tqoqsgaymygmgqrzddvtu.supabase.co";

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "sb_publishable_jxn-4TT28_G7LtZG4FJXTQ_75JiaSBi";

  try {
    cachedAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    return cachedAdmin;
  } catch (err) {
    console.warn("[Supabase Server] Failed to initialize admin client:", err);
    return null;
  }
}

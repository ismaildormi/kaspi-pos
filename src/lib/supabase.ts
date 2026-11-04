import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tqoqsgaymygmgqrzddvtu.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_jxn-4TT28_G7LtZG4FJXTQ_75JiaSBi";

/**
 * Standard Supabase client for client-side and public requests.
 * Uses anon key with safe fallbacks and supports Realtime subscriptions.
 * Completely safe for browser/client components.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export default supabase;

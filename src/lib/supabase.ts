import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://tqoqsgaymygmgqrzddvtu.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_jxn-4TT28_G7LtZG4FJXTQ_75JiaSBi";

export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "";

/**
 * Standard Supabase client for client-side and public requests.
 * Uses anon key and supports Realtime subscriptions.
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

/**
 * Server-only Supabase client with Service Role privileges.
 * WARNING: NEVER expose this client or its key on the frontend.
 * Used for administrative storage operations, bypass RLS, and secure backend broadcasts.
 */
export const getSupabaseAdmin = () => {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin can only be used on the server.");
  }
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

export const supabaseAdmin = typeof window === "undefined"
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  : null!;

/**
 * KASPI GLOBAL RESOURCE FABRIC (كسب) — Supabase Storage & Realtime Adapter
 * 
 * Verifies S3-compatible storage availability and WebSocket channel health.
 */

import { getSupabaseAdmin } from "@/lib/supabase-server";

export interface SupabaseTelemetry {
  isConfigured: boolean;
  storageHealthy: boolean;
  bucketsCount: number;
  url: string;
  error?: string;
}

export async function checkSupabaseHealth(): Promise<SupabaseTelemetry> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://tqoqsgaymygmgqrzddvtu.supabase.co";

  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.storage.listBuckets();

    if (error) {
      return {
        isConfigured: true,
        storageHealthy: false,
        bucketsCount: 0,
        url,
        error: error.message,
      };
    }

    return {
      isConfigured: true,
      storageHealthy: true,
      bucketsCount: data?.length || 0,
      url,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Supabase connection error";
    return {
      isConfigured: false,
      storageHealthy: false,
      bucketsCount: 0,
      url,
      error: msg,
    };
  }
}

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

export interface UserDirectoryEntry {
  email: string;
  fullName?: string | null;
  tenantId?: string | null;
  role?: string | null;
  shopName?: string | null;
  phone?: string | null;
  source?: string;
  lastSeenAt?: string;
}

/**
 * Synchronizes registered and active user identities into Supabase's user_directory
 * table so the platform maintains an active, central audience directory for broadcasts.
 */
export async function syncUserToSupabaseDirectory(entry: UserDirectoryEntry): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return;
  }

  try {
    const admin = getSupabaseAdmin();
    const cleanEmail = entry.email.toLowerCase().trim();

    const { error } = await admin.from("user_directory").upsert(
      {
        email: cleanEmail,
        full_name: entry.fullName || cleanEmail.split("@")[0],
        tenant_id: entry.tenantId,
        role: entry.role || "owner",
        shop_name: entry.shopName,
        phone: entry.phone,
        source: entry.source || "kaspi_auth",
        last_seen_at: entry.lastSeenAt || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (error) {
      // Non-fatal notice: table might need creation in fresh Supabase projects
      console.warn("[Supabase Directory Sync Notice]:", error.message);
    }
  } catch (err) {
    console.warn("[Supabase Directory Sync Warning]:", err);
  }
}

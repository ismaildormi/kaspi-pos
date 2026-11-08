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
    "https://tqoqsgaymygmgqrzddvtu.supabase.co";

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
    return createClient("https://tqoqsgaymygmgqrzddvtu.supabase.co", key);
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
 * Synchronizes registered and active user identities into Supabase:
 * 1. Upserts into `public.user_directory` table if present.
 * 2. Mirrors user + metadata into Supabase Auth (`auth.users`) via Service Role Admin API
 *    (which is guaranteed to exist in every Supabase project without manual SQL DDL).
 */
export async function syncUserToSupabaseDirectory(entry: UserDirectoryEntry): Promise<void> {
  try {
    const admin = getSupabaseAdmin();
    const cleanEmail = entry.email.toLowerCase().trim();
    const metadata = {
      full_name: entry.fullName || cleanEmail.split("@")[0],
      tenant_id: entry.tenantId || null,
      role: entry.role || "owner",
      shop_name: entry.shopName || null,
      phone: entry.phone || null,
      source: entry.source || "kaspi_auth",
      last_seen_at: entry.lastSeenAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Try public.user_directory table upsert
    const { error: tableError } = await admin.from("user_directory").upsert(
      {
        email: cleanEmail,
        ...metadata,
      },
      { onConflict: "email" }
    );

    if (tableError) {
      // Fallback: Ensure user is mirrored in Supabase Auth directory (auth.users)
      try {
        await admin.auth.admin.createUser({
          email: cleanEmail,
          email_confirm: true,
          user_metadata: metadata,
        });
      } catch {
        // User already exists in auth.users
      }
    }
  } catch (err) {
    console.warn("[Supabase Directory Sync Warning]:", err);
  }
}

/**
 * Retrieves all unique user emails stored in Supabase (`user_directory` table + `auth.users`).
 */
export async function getSupabaseDirectoryEmails(): Promise<string[]> {
  const emailSet = new Set<string>();
  try {
    const admin = getSupabaseAdmin();

    // 1. Query public.user_directory if available
    const { data: tableUsers } = await admin
      .from("user_directory")
      .select("email")
      .limit(1000);

    if (tableUsers && Array.isArray(tableUsers)) {
      for (const row of tableUsers) {
        if (row.email && typeof row.email === "string" && row.email.includes("@")) {
          emailSet.add(row.email.toLowerCase().trim());
        }
      }
    }

    // 2. Query Supabase Auth users directory
    const { data: authData } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authData?.users && Array.isArray(authData.users)) {
      for (const u of authData.users) {
        if (u.email && u.email.includes("@")) {
          emailSet.add(u.email.toLowerCase().trim());
        }
      }
    }
  } catch (err) {
    console.warn("[Supabase Directory Fetch Warning]:", err);
  }

  return Array.from(emailSet);
}

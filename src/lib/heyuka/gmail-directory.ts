import { prisma } from "@/server/db/prisma";
import {
  getSupabaseDirectoryEmails,
  syncUserToSupabaseDirectory,
} from "@/lib/supabase";

const PROJECT_GMAIL_VAULT_KEY = "kaspi_project_gmail_directory_v1";

export interface ProjectGmailEntry {
  email: string;
  fullName?: string | null;
  source: string;
  tenantId?: string | null;
  locale?: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

async function readVaultEntries(): Promise<ProjectGmailEntry[]> {
  try {
    const row = await prisma.systemSetting.findUnique({
      where: { providerName: PROJECT_GMAIL_VAULT_KEY },
    });
    if (!row?.apiKey) return [];
    const parsed = JSON.parse(row.apiKey);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeVaultEntries(entries: ProjectGmailEntry[]): Promise<void> {
  await prisma.systemSetting.upsert({
    where: { providerName: PROJECT_GMAIL_VAULT_KEY },
    update: {
      apiKey: JSON.stringify(entries.slice(0, 5000)),
      isActive: true,
      baseUrl: "project_gmail_vault",
    },
    create: {
      providerName: PROJECT_GMAIL_VAULT_KEY,
      apiKey: JSON.stringify(entries.slice(0, 5000)),
      baseUrl: "project_gmail_vault",
      isActive: true,
    },
  });
}

/**
 * Records any email / Gmail captured across HEYUKA Chat, Share Links, API Keys,
 * Platform Feedback, or POS auth into:
 *  1) Central Neon PostgreSQL Vault (`kaspi_project_gmail_directory_v1`)
 *  2) Supabase User Directory (`public.user_directory` + `auth.users`)
 */
export async function recordProjectGmail(params: {
  email: string;
  fullName?: string | null;
  source: string;
  tenantId?: string | null;
  locale?: string | null;
  role?: string | null;
  shopName?: string | null;
}): Promise<void> {
  const cleanEmail = params.email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) return;

  const nowIso = new Date().toISOString();

  try {
    const existing = await readVaultEntries();
    const idx = existing.findIndex((x) => x.email === cleanEmail);
    const nextEntry: ProjectGmailEntry =
      idx >= 0
        ? {
            ...existing[idx],
            fullName: params.fullName || existing[idx].fullName || null,
            source: params.source || existing[idx].source,
            tenantId: params.tenantId ?? existing[idx].tenantId ?? null,
            locale: params.locale ?? existing[idx].locale ?? null,
            lastSeenAt: nowIso,
          }
        : {
            email: cleanEmail,
            fullName: params.fullName || cleanEmail.split("@")[0] || null,
            source: params.source,
            tenantId: params.tenantId || null,
            locale: params.locale || null,
            firstSeenAt: nowIso,
            lastSeenAt: nowIso,
          };

    const nextList =
      idx >= 0
        ? [nextEntry, ...existing.filter((_, i) => i !== idx)]
        : [nextEntry, ...existing];

    await writeVaultEntries(nextList);
  } catch (err) {
    console.warn("[Project Gmail Vault] DB persist notice:", err);
  }

  // Mirror cleanly into Supabase User Directory for unified broadcast & CRM outreach
  syncUserToSupabaseDirectory({
    email: cleanEmail,
    fullName: params.fullName || cleanEmail.split("@")[0],
    tenantId: params.tenantId || null,
    role: params.role || "developer",
    shopName: params.shopName || "HEYUKA Studio",
    source: params.source,
    lastSeenAt: nowIso,
  }).catch(() => {});
}

/**
 * Merges all collected emails across Neon Vault, Prisma Users, and Supabase User Directory.
 */
export async function listAllProjectGmails(): Promise<{
  entries: ProjectGmailEntry[];
  allEmails: string[];
}> {
  const map = new Map<string, ProjectGmailEntry>();

  const [vaultRows, dbUsers, supaEmails] = await Promise.all([
    readVaultEntries(),
    prisma.user
      .findMany({
        where: { isActive: true, email: { not: undefined } },
        select: {
          email: true,
          fullName: true,
          name: true,
          authProvider: true,
          defaultTenantId: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 2000,
      })
      .catch(() => []),
    getSupabaseDirectoryEmails().catch(() => [] as string[]),
  ]);

  for (const row of vaultRows) {
    const email = (row.email || "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    map.set(email, { ...row, email });
  }

  for (const u of dbUsers) {
    const email = (u.email || "").trim().toLowerCase();
    if (!email.includes("@")) continue;
    if (!map.has(email)) {
      const iso = u.createdAt.toISOString();
      map.set(email, {
        email,
        fullName: u.fullName || u.name || null,
        source: u.authProvider || "kaspi_user",
        tenantId: u.defaultTenantId || null,
        firstSeenAt: iso,
        lastSeenAt: iso,
      });
    }
  }

  const nowIso = new Date().toISOString();
  for (const email of supaEmails) {
    const clean = email.trim().toLowerCase();
    if (!clean.includes("@")) continue;
    if (!map.has(clean)) {
      map.set(clean, {
        email: clean,
        fullName: clean.split("@")[0],
        source: "supabase_directory",
        firstSeenAt: nowIso,
        lastSeenAt: nowIso,
      });
    }
  }

  const entries = Array.from(map.values()).sort(
    (a, b) => new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  );
  return {
    entries,
    allEmails: entries.map((e) => e.email),
  };
}

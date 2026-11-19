import { prisma } from "@/server/db/prisma";
import {
  decryptVaultSecrets,
  encryptVaultSecrets,
  maskCredentialValue,
} from "@/lib/security/integration-vault";

/**
 * HEYUKA AI — Strict Zero-Cost Financial Governance & Resource Priority Engine
 *
 * Guarantees the platform owner NEVER pays silently for third-party user workloads:
 * Priority Order:
 *  1. user_device        (Browser WebGPU / WASM / Web Speech / Canvas — $0.00 server cost)
 *  2. user_worker        (Authenticated user-connected local/remote server — $0.00 owner cost)
 *  3. user_byok          (Tenant's own encrypted provider API key — $0.00 owner cost)
 *  4. free_public_tier   (Verified zero-key public APIs / strictly free tiers — bounded quota)
 *  5. owner_internal     (Reserved strictly for authorized owner/internal POS operations)
 */

export type ComputeExecutionTier =
  | "user_device"
  | "user_worker"
  | "user_byok"
  | "free_public_tier"
  | "owner_internal"
  | "blocked_zero_cost";

export type ByokProviderKind =
  | "openai_compatible"
  | "groq"
  | "google"
  | "openrouter"
  | "mistral"
  | "local_ollama";

export interface TenantByokConfig {
  id: string;
  providerKind: ByokProviderKind;
  label: string;
  modelId: string;
  baseUrl?: string;
  maskedKey: string;
  isActive: boolean;
  updatedAt: string;
}

export interface ZeroCostDecision {
  allowed: boolean;
  tier: ComputeExecutionTier;
  estimatedOwnerCostUSD: 0;
  reason: string;
  dailyRequestsUsed: number;
  dailyRequestLimit: number;
}

const TENANT_BYOK_SCOPE = "heyuka_tenant_byok_v1";
const TENANT_BUDGET_SCOPE = "heyuka_zero_cost_daily_budget_v1";

const DEFAULT_PUBLIC_DAILY_FREE_LIMIT = 120;

export const PAID_OWNER_ENV_PROVIDERS = new Set([
  "custom",
  "together",
  "deepseek",
]);

const VALID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUsableTenantUuid(tenantId: string): boolean {
  return (
    Boolean(tenantId) &&
    tenantId !== "00000000-0000-0000-0000-000000000000" &&
    VALID_UUID_RE.test(tenantId)
  );
}

function getUtcDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function saveTenantByokProvider(params: {
  tenantId: string;
  providerKind: ByokProviderKind;
  label: string;
  apiKey: string;
  modelId: string;
  baseUrl?: string;
}): Promise<TenantByokConfig> {
  if (!isUsableTenantUuid(params.tenantId)) {
    throw new Error("AUTHENTICATED_TENANT_REQUIRED");
  }

  const key = params.providerKind;
  const cleanApiKey = params.apiKey.trim();
  const maskedKey = maskCredentialValue(cleanApiKey || "local", true);
  const envelope = encryptVaultSecrets(params.tenantId, {
    apiKey: cleanApiKey || "none",
  });

  const meta: TenantByokConfig & { encryptedEnvelope: string } = {
    id: `byok_${key}`,
    providerKind: params.providerKind,
    label: params.label.trim().slice(0, 64) || params.providerKind,
    modelId: params.modelId.trim().slice(0, 100),
    baseUrl: params.baseUrl?.trim() || undefined,
    maskedKey,
    isActive: true,
    updatedAt: new Date().toISOString(),
    encryptedEnvelope: envelope,
  };

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 3);
  await prisma.idempotencyRecord.upsert({
    where: {
      tenantId_scope_key: {
        tenantId: params.tenantId,
        scope: TENANT_BYOK_SCOPE,
        key: meta.id,
      },
    },
    create: {
      tenantId: params.tenantId,
      scope: TENANT_BYOK_SCOPE,
      key: meta.id,
      requestHash: meta.id,
      responseStatus: 200,
      responseBody: meta as any,
      expiresAt,
    },
    update: {
      responseBody: meta as any,
      expiresAt,
    },
  });

  const { encryptedEnvelope: _omit, ...publicMeta } = meta;
  return publicMeta;
}

export async function listTenantByokProviders(
  tenantId: string
): Promise<TenantByokConfig[]> {
  if (!isUsableTenantUuid(tenantId)) return [];
  try {
    const rows = await prisma.idempotencyRecord.findMany({
      where: { tenantId, scope: TENANT_BYOK_SCOPE },
      orderBy: { createdAt: "desc" },
    });
    return rows
      .map((r) => {
        const raw = r.responseBody as any;
        if (!raw || !raw.id) return null;
        const { encryptedEnvelope: _omit, ...clean } = raw;
        return clean as TenantByokConfig;
      })
      .filter((x): x is TenantByokConfig => Boolean(x));
  } catch {
    return [];
  }
}

export async function getDecryptedTenantByokCredentials(tenantId: string): Promise<
  Array<TenantByokConfig & { apiKey: string }>
> {
  if (!isUsableTenantUuid(tenantId)) return [];
  let rows: any[] = [];
  try {
    rows = await prisma.idempotencyRecord.findMany({
      where: { tenantId, scope: TENANT_BYOK_SCOPE },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
  const out: Array<TenantByokConfig & { apiKey: string }> = [];
  for (const r of rows) {
    const raw = r.responseBody as any;
    if (!raw?.isActive || !raw?.encryptedEnvelope) continue;
    try {
      const dec = decryptVaultSecrets(tenantId, raw.encryptedEnvelope);
      const { encryptedEnvelope: _omit, ...publicMeta } = raw;
      out.push({
        ...(publicMeta as TenantByokConfig),
        apiKey: String(dec.apiKey || "none"),
      });
    } catch {
      // Skip malformed secret envelopes safely
    }
  }
  return out;
}

export async function deleteTenantByokProvider(
  tenantId: string,
  byokId: string
): Promise<boolean> {
  if (!isUsableTenantUuid(tenantId) || !byokId) return false;
  const deleted = await prisma.idempotencyRecord.deleteMany({
    where: { tenantId, scope: TENANT_BYOK_SCOPE, key: byokId },
  });
  return deleted.count > 0;
}

export async function getTenantDailyFreeUsage(tenantId: string): Promise<{
  day: string;
  count: number;
  limit: number;
}> {
  const day = getUtcDayKey();
  if (!isUsableTenantUuid(tenantId)) {
    return { day, count: 0, limit: DEFAULT_PUBLIC_DAILY_FREE_LIMIT };
  }
  try {
    const row = await prisma.idempotencyRecord.findUnique({
      where: {
        tenantId_scope_key: {
          tenantId,
          scope: TENANT_BUDGET_SCOPE,
          key: day,
        },
      },
    });
    const count = Number((row?.responseBody as any)?.count || 0);
    return { day, count, limit: DEFAULT_PUBLIC_DAILY_FREE_LIMIT };
  } catch {
    return { day, count: 0, limit: DEFAULT_PUBLIC_DAILY_FREE_LIMIT };
  }
}

export async function recordTenantFreeTierUsage(tenantId: string): Promise<number> {
  if (!isUsableTenantUuid(tenantId)) return 0;
  const day = getUtcDayKey();
  const current = await getTenantDailyFreeUsage(tenantId);
  const nextCount = current.count + 1;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48);

  await prisma.idempotencyRecord.upsert({
    where: {
      tenantId_scope_key: { tenantId, scope: TENANT_BUDGET_SCOPE, key: day },
    },
    create: {
      tenantId,
      scope: TENANT_BUDGET_SCOPE,
      key: day,
      requestHash: day,
      responseStatus: 200,
      responseBody: { day, count: nextCount, costExposureUSD: 0 },
      expiresAt,
    },
    update: {
      responseBody: { day, count: nextCount, costExposureUSD: 0 },
      expiresAt,
    },
  });

  return nextCount;
}

/**
 * Evaluates whether a request may proceed under HEYUKA's zero-cost owner safeguard.
 */
export async function evaluateZeroCostPolicy(params: {
  tenantId: string;
  requiresPaidOwnerResource?: boolean;
  preferTier?: ComputeExecutionTier;
}): Promise<ZeroCostDecision> {
  if (params.preferTier === "user_device" || params.preferTier === "user_worker") {
    return {
      allowed: true,
      tier: params.preferTier,
      estimatedOwnerCostUSD: 0,
      reason: `Executed on ${params.preferTier} with $0.00 owner infrastructure exposure.`,
      dailyRequestsUsed: 0,
      dailyRequestLimit: DEFAULT_PUBLIC_DAILY_FREE_LIMIT,
    };
  }

  const tenantByoks = await getDecryptedTenantByokCredentials(params.tenantId);
  if (tenantByoks.length > 0) {
    return {
      allowed: true,
      tier: "user_byok",
      estimatedOwnerCostUSD: 0,
      reason: `Routed via tenant's own encrypted provider (${tenantByoks[0].label}).`,
      dailyRequestsUsed: 0,
      dailyRequestLimit: DEFAULT_PUBLIC_DAILY_FREE_LIMIT,
    };
  }

  if (params.requiresPaidOwnerResource) {
    return {
      allowed: false,
      tier: "blocked_zero_cost",
      estimatedOwnerCostUSD: 0,
      reason:
        "ZERO_COST_PROTECTION: This operation requires a user-connected worker or tenant BYOK key. Owner paid resources are locked.",
      dailyRequestsUsed: 0,
      dailyRequestLimit: DEFAULT_PUBLIC_DAILY_FREE_LIMIT,
    };
  }

  const budget = await getTenantDailyFreeUsage(params.tenantId);
  if (budget.count >= budget.limit) {
    return {
      allowed: false,
      tier: "blocked_zero_cost",
      estimatedOwnerCostUSD: 0,
      reason: `Daily zero-cost quota (${budget.limit} req/day) reached for shared free gateways. Connect your own local worker or BYOK API key to continue without limits.`,
      dailyRequestsUsed: budget.count,
      dailyRequestLimit: budget.limit,
    };
  }

  return {
    allowed: true,
    tier: "free_public_tier",
    estimatedOwnerCostUSD: 0,
    reason: "Authorized within strict zero-cost free tier limits.",
    dailyRequestsUsed: budget.count,
    dailyRequestLimit: budget.limit,
  };
}

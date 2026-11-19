import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";

/**
 * HEYUKA (KASPI Sovereign AI) — Tenant-Isolated Developer API Key & Key ID Auth (v12.0)
 * Keys use `hk-live-...` (and backward-compatible `zx-live-...`) tokens paired with
 * explicit verifiable Key IDs (`hk_...` / `zk_...`), stored strictly as SHA-256 hashes inside
 * `prisma.idempotencyRecord` (`scope: "kaspi_zebra_x_api_keys_v1"`).
 */

export const X_ZEBRA_KEY_SCOPE = "kaspi_zebra_x_api_keys_v1";

export type XZebraKeyScope =
  | "vision:remove-bg"
  | "3d:generate"
  | "3d:assets"
  | "audio:transcribe"
  | "audio:separate"
  | "chat:universal"
  | "connector:discover"
  | "public-apis:query"
  | "images:generate"
  | "sandbox:execute"
  | "web:research";

export const ALL_X_ZEBRA_SCOPES: XZebraKeyScope[] = [
  "chat:universal",
  "public-apis:query",
  "images:generate",
  "sandbox:execute",
  "web:research",
  "vision:remove-bg",
  "3d:generate",
  "3d:assets",
  "audio:transcribe",
  "audio:separate",
  "connector:discover",
];

export interface StoredApiKeyMeta {
  id: string; // Explicit verifiable Key ID (e.g. hk_... or zk_...)
  label: string;
  prefix: string;
  last4: string;
  scopes: XZebraKeyScope[];
  createdAt: string;
  lastUsedAt?: string;
  usageCount?: number;
  createdByUserId?: string;
  revoked: boolean;
}

export function hashApiKeyToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim(), "utf8").digest("hex");
}

export function isDeveloperApiToken(raw: string): boolean {
  const clean = raw.trim().toLowerCase();
  return clean.startsWith("hk-") || clean.startsWith("hyk-") || clean.startsWith("zx-");
}

export function buildHashedApiKeyArtifacts(params: {
  label?: string;
  scopes?: XZebraKeyScope[];
  createdByUserId?: string;
  tokenPrefix?: "hk-live" | "zx-live";
}): {
  rawKey: string;
  keyHash: string;
  meta: StoredApiKeyMeta;
} {
  const tokenPrefix = params.tokenPrefix === "zx-live" ? "zx-live" : "hk-live";
  const idPrefix = tokenPrefix === "zx-live" ? "zk" : "hk";
  const randomSecret = crypto.randomBytes(24).toString("hex");
  const rawKey = `${tokenPrefix}-${randomSecret}`;
  const keyHash = hashApiKeyToken(rawKey);
  const cleanLabel =
    String(params.label || "HEYUKA Production Key").trim().slice(0, 64) ||
    "HEYUKA Production Key";
  const scopes =
    Array.isArray(params.scopes) && params.scopes.length > 0
      ? params.scopes
      : [...ALL_X_ZEBRA_SCOPES];

  return {
    rawKey,
    keyHash,
    meta: {
      id: `${idPrefix}_${crypto.randomBytes(8).toString("hex")}`,
      label: cleanLabel,
      prefix: rawKey.slice(0, 14),
      last4: rawKey.slice(-4),
      scopes,
      createdAt: new Date().toISOString(),
      usageCount: 0,
      createdByUserId: params.createdByUserId,
      revoked: false,
    },
  };
}

export async function createTenantXZebraApiKey(params: {
  tenantId: string;
  userId?: string;
  label?: string;
  scopes?: XZebraKeyScope[];
  tokenPrefix?: "hk-live" | "zx-live";
}): Promise<{ secretKeyOnce: string; keyId: string; meta: StoredApiKeyMeta }> {
  if (!params.tenantId || params.tenantId === "00000000-0000-0000-0000-000000000000") {
    throw new Error("AUTHENTICATED_TENANT_REQUIRED");
  }
  const { rawKey, keyHash, meta } = buildHashedApiKeyArtifacts({
    label: params.label,
    scopes: params.scopes,
    createdByUserId: params.userId,
    tokenPrefix: params.tokenPrefix,
  });

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5);
  await prisma.idempotencyRecord.create({
    data: {
      tenantId: params.tenantId,
      scope: X_ZEBRA_KEY_SCOPE,
      key: keyHash,
      requestHash: meta.id,
      responseStatus: 200,
      responseBody: meta as any,
      expiresAt,
    },
  });

  return { secretKeyOnce: rawKey, keyId: meta.id, meta };
}

export async function listTenantXZebraApiKeys(tenantId: string): Promise<StoredApiKeyMeta[]> {
  if (!tenantId || tenantId === "00000000-0000-0000-0000-000000000000") return [];
  const rows = await prisma.idempotencyRecord.findMany({
    where: { tenantId, scope: X_ZEBRA_KEY_SCOPE },
    orderBy: { createdAt: "desc" },
  });
  return rows
    .map((r) => r.responseBody as unknown as StoredApiKeyMeta)
    .filter((m) => m && typeof m.id === "string" && !m.revoked);
}

export async function revokeTenantXZebraApiKey(
  tenantId: string,
  keyId: string
): Promise<boolean> {
  if (!tenantId || !keyId) return false;
  const row = await prisma.idempotencyRecord.findFirst({
    where: { tenantId, scope: X_ZEBRA_KEY_SCOPE, requestHash: keyId },
  });
  if (!row) return false;
  const current = (row.responseBody as unknown as StoredApiKeyMeta) || ({} as StoredApiKeyMeta);
  await prisma.idempotencyRecord.update({
    where: { id: row.id },
    data: {
      responseBody: {
        ...current,
        revoked: true,
      } as any,
    },
  });
  return true;
}

export type XZebraAuthResult =
  | {
      ok: true;
      tenantId: string;
      authMode: "api_key" | "session";
      keyId?: string;
      keyMeta?: StoredApiKeyMeta;
    }
  | {
      ok: false;
      status: 401 | 403;
      error: string;
    };

export async function authenticateXZebraRequest(
  req: NextRequest,
  requiredScope?: XZebraKeyScope
): Promise<XZebraAuthResult> {
  const authHeader = req.headers.get("authorization") || "";
  const apiKeyHeader = req.headers.get("x-api-key") || "";
  const keyIdHeader = (req.headers.get("x-api-key-id") || "").trim();
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const rawToken = bearerToken || apiKeyHeader.trim();

  if (isDeveloperApiToken(rawToken)) {
    const keyHash = hashApiKeyToken(rawToken);
    const record = await prisma.idempotencyRecord.findFirst({
      where: {
        scope: X_ZEBRA_KEY_SCOPE,
        key: keyHash,
        expiresAt: { gt: new Date() },
      },
    });
    const meta = record?.responseBody as unknown as StoredApiKeyMeta | undefined;
    if (!record || !meta || meta.revoked) {
      return {
        ok: false,
        status: 401,
        error: "Invalid, expired, or revoked HEYUKA API key.",
      };
    }

    if (keyIdHeader && keyIdHeader !== meta.id) {
      return {
        ok: false,
        status: 401,
        error: "Provided X-API-Key-Id does not match the secret API key.",
      };
    }

    // Legacy keys issued before v12 retain broad access; hk_ keys enforce exact requested scopes
    const isLegacyUniversalKey =
      meta.id.startsWith("zk_") &&
      Array.isArray(meta.scopes) &&
      meta.scopes.includes("vision:remove-bg") &&
      meta.scopes.length <= 6;

    if (
      requiredScope &&
      Array.isArray(meta.scopes) &&
      !meta.scopes.includes(requiredScope) &&
      !isLegacyUniversalKey
    ) {
      return {
        ok: false,
        status: 403,
        error: `API key missing required scope '${requiredScope}'.`,
      };
    }

    // Track real usage count & last used timestamp durably on Serverless
    await prisma.idempotencyRecord
      .update({
        where: { id: record.id },
        data: {
          responseBody: {
            ...meta,
            usageCount: (meta.usageCount || 0) + 1,
            lastUsedAt: new Date().toISOString(),
          } as any,
        },
      })
      .catch(() => {});

    return {
      ok: true,
      tenantId: record.tenantId,
      authMode: "api_key",
      keyId: meta.id,
      keyMeta: meta,
    };
  }

  try {
    const ctx = await getRequestContext();
    return {
      ok: true,
      tenantId: ctx.tenantId,
      authMode: "session",
    };
  } catch {
    return {
      ok: false,
      status: 401,
      error:
        "Authentication required. Sign in on KASPI POS or send 'Authorization: Bearer hk-live-...' (or 'zx-live-...').",
    };
  }
}

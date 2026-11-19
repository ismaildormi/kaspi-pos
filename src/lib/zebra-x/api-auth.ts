import crypto from "node:crypto";
import type { NextRequest } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getRequestContext } from "@/server/auth/context";

/**
 * X × Zebra — Tenant-Isolated Developer API Key Auth & Management (v7.5)
 * Keys use `zx-live-...` format, stored strictly as SHA-256 hashes inside
 * `prisma.idempotencyRecord` (`scope: "kaspi_zebra_x_api_keys_v1"`) so
 * Kaspi POS Prisma schema remains 100% immutable and secrets never persist in plaintext.
 */

export const X_ZEBRA_KEY_SCOPE = "kaspi_zebra_x_api_keys_v1";

export type XZebraKeyScope =
  | "vision:remove-bg"
  | "3d:generate"
  | "3d:assets"
  | "audio:transcribe"
  | "audio:separate"
  | "chat:universal"
  | "connector:discover";

export const ALL_X_ZEBRA_SCOPES: XZebraKeyScope[] = [
  "vision:remove-bg",
  "3d:generate",
  "3d:assets",
  "audio:transcribe",
  "audio:separate",
  "chat:universal",
  "connector:discover",
];

export interface StoredApiKeyMeta {
  id: string;
  label: string;
  prefix: string;
  last4: string;
  scopes: XZebraKeyScope[];
  createdAt: string;
  lastUsedAt?: string;
  createdByUserId?: string;
  revoked: boolean;
}

export function hashApiKeyToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken.trim(), "utf8").digest("hex");
}

export function buildHashedApiKeyArtifacts(params: {
  label?: string;
  scopes?: XZebraKeyScope[];
  createdByUserId?: string;
}): {
  rawKey: string;
  keyHash: string;
  meta: StoredApiKeyMeta;
} {
  const randomSecret = crypto.randomBytes(24).toString("hex");
  const rawKey = `zx-live-${randomSecret}`;
  const keyHash = hashApiKeyToken(rawKey);
  const cleanLabel = String(params.label || "Production App Key").trim().slice(0, 64) || "Production App Key";
  const scopes =
    Array.isArray(params.scopes) && params.scopes.length > 0
      ? params.scopes
      : [...ALL_X_ZEBRA_SCOPES];

  return {
    rawKey,
    keyHash,
    meta: {
      id: `zk_${crypto.randomBytes(8).toString("hex")}`,
      label: cleanLabel,
      prefix: rawKey.slice(0, 14),
      last4: rawKey.slice(-4),
      scopes,
      createdAt: new Date().toISOString(),
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
}): Promise<{ secretKeyOnce: string; meta: StoredApiKeyMeta }> {
  if (!params.tenantId || params.tenantId === "00000000-0000-0000-0000-000000000000") {
    throw new Error("AUTHENTICATED_TENANT_REQUIRED");
  }
  const { rawKey, keyHash, meta } = buildHashedApiKeyArtifacts({
    label: params.label,
    scopes: params.scopes,
    createdByUserId: params.userId,
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

  return { secretKeyOnce: rawKey, meta };
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
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const rawToken = bearerToken || apiKeyHeader.trim();

  if (rawToken.startsWith("zx-")) {
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

    if (
      requiredScope &&
      Array.isArray(meta.scopes) &&
      !meta.scopes.includes(requiredScope)
    ) {
      return {
        ok: false,
        status: 403,
        error: `API key missing required scope '${requiredScope}'.`,
      };
    }

    // Best-effort async touch without adding latency
    void prisma.idempotencyRecord
      .update({
        where: { id: record.id },
        data: {
          responseBody: {
            ...meta,
            lastUsedAt: new Date().toISOString(),
          } as any,
        },
      })
      .catch(() => {});

    return {
      ok: true,
      tenantId: record.tenantId,
      authMode: "api_key",
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
      error: "Authentication required. Sign in on KASPI POS or send 'Authorization: Bearer zx-live-...'.",
    };
  }
}

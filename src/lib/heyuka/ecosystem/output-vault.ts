import crypto from "node:crypto";
import { prisma } from "@/server/db/prisma";

/**
 * HEYUKA Real Output Vault (Section 6)
 *
 * Central persistent repository separating REAL verified outputs from previews, examples,
 * in-progress jobs, and failed attempts. Strict tenant isolation guaranteed.
 */

export type OutputTruthClass =
  | "real_output"
  | "preview"
  | "example"
  | "failed"
  | "in_progress";

export interface VaultOutputRecord {
  id: string;
  tenantId: string;
  taskName: string;
  productId: string;
  actualModel: string;
  actualEngine: string;
  executedAt: string;
  status: "completed" | "partial" | "failed" | "worker_required";
  truthClass: OutputTruthClass;
  durationMs: number;
  byteSize: number;
  sha256: string;
  format: string;
  dimensions?: string;
  accessUrl?: string;
  inlineTextPreview?: string;
  errorLog?: string;
  verified: boolean;
}

const OUTPUT_VAULT_SCOPE = "heyuka_real_output_vault_v1";

export function computePayloadSha256(content: string | Buffer | Uint8Array): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function saveVaultOutput(params: {
  tenantId: string;
  taskName: string;
  productId: string;
  actualModel: string;
  actualEngine: string;
  status: VaultOutputRecord["status"];
  truthClass: OutputTruthClass;
  durationMs: number;
  format: string;
  byteSize?: number;
  rawPayloadForHash?: string;
  dimensions?: string;
  accessUrl?: string;
  inlineTextPreview?: string;
  errorLog?: string;
}): Promise<VaultOutputRecord> {
  if (!params.tenantId || params.tenantId === "00000000-0000-0000-0000-000000000000") {
    throw new Error("AUTHENTICATED_TENANT_REQUIRED");
  }

  const outputId = `out_${crypto.randomBytes(8).toString("hex")}`;
  const hashInput =
    params.rawPayloadForHash ||
    params.inlineTextPreview ||
    params.accessUrl ||
    params.errorLog ||
    outputId;
  const computedSize =
    typeof params.byteSize === "number"
      ? params.byteSize
      : Buffer.byteLength(hashInput, "utf8");

  const record: VaultOutputRecord = {
    id: outputId,
    tenantId: params.tenantId,
    taskName: params.taskName.trim().slice(0, 120),
    productId: params.productId,
    actualModel: params.actualModel,
    actualEngine: params.actualEngine,
    executedAt: new Date().toISOString(),
    status: params.status,
    truthClass: params.truthClass,
    durationMs: Math.max(0, Math.round(params.durationMs)),
    byteSize: Math.max(0, computedSize),
    sha256: computePayloadSha256(hashInput),
    format: params.format.toLowerCase(),
    dimensions: params.dimensions,
    accessUrl: params.accessUrl,
    inlineTextPreview: params.inlineTextPreview?.slice(0, 12000),
    errorLog: params.errorLog?.slice(0, 1500),
    verified: params.status === "completed" && params.truthClass === "real_output",
  };

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 180);
  await prisma.idempotencyRecord.create({
    data: {
      tenantId: params.tenantId,
      scope: OUTPUT_VAULT_SCOPE,
      key: outputId,
      requestHash: outputId,
      responseStatus: params.status === "failed" ? 500 : 200,
      responseBody: record as any,
      expiresAt,
    },
  });

  return record;
}

export async function listVaultOutputs(params: {
  tenantId: string;
  productId?: string;
  truthClass?: OutputTruthClass;
  limit?: number;
}): Promise<VaultOutputRecord[]> {
  if (!params.tenantId || params.tenantId === "00000000-0000-0000-0000-000000000000") {
    return [];
  }
  const rows = await prisma.idempotencyRecord.findMany({
    where: { tenantId: params.tenantId, scope: OUTPUT_VAULT_SCOPE },
    orderBy: { createdAt: "desc" },
    take: Math.min(params.limit || 60, 120),
  });
  return rows
    .map((r) => r.responseBody as unknown as VaultOutputRecord)
    .filter((o) => {
      if (!o || typeof o.id !== "string") return false;
      if (params.productId && o.productId !== params.productId) return false;
      if (params.truthClass && o.truthClass !== params.truthClass) return false;
      return true;
    });
}

export async function deleteVaultOutput(
  tenantId: string,
  outputId: string
): Promise<boolean> {
  if (!tenantId || !outputId) return false;
  const res = await prisma.idempotencyRecord.deleteMany({
    where: { tenantId, scope: OUTPUT_VAULT_SCOPE, key: outputId },
  });
  return res.count > 0;
}

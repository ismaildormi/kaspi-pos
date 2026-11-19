import crypto from "node:crypto";
import { prisma } from "@/server/db/prisma";
import { isSafePublicHttpUrl } from "@/lib/zebra-x/arsenal-vault";
import {
  decryptVaultSecrets,
  encryptVaultSecrets,
} from "@/lib/security/integration-vault";

/**
 * HEYUKA Distributed Compute & Revocable Worker Agent Registry
 *
 * Security & Honesty Rules:
 * - Strict tenant isolation via `prisma.idempotencyRecord` scoped to `tenantId`.
 * - Never claims hardware specs that were not actually reported by a real `/health` probe.
 * - Worker tokens are SHA-256 hashed + AES-256-GCM envelope stored.
 * - Revoking/disconnecting a worker immediately invalidates future job dispatch.
 */

export type WorkerOsTarget =
  | "windows"
  | "linux"
  | "macos"
  | "docker"
  | "android"
  | "ios"
  | "cloud_gpu";

export interface MeasuredWorkerHardware {
  os?: string;
  cpuCores?: number;
  ramTotalMB?: number;
  ramFreeMB?: number;
  diskFreeGB?: number;
  gpuName?: string;
  gpuVramMB?: number;
  installedEngines?: string[];
  ffmpegAvailable?: boolean;
}

export interface DistributedWorkerRecord {
  id: string;
  tenantId: string;
  name: string;
  osTarget: WorkerOsTarget;
  endpointUrl: string;
  tokenHint: string;
  status: "connected_verified" | "registered_unprobed" | "unreachable" | "revoked";
  explicitConsentAccepted: boolean;
  capabilities: string[];
  measuredHardware: MeasuredWorkerHardware;
  lastProbedAt?: string;
  lastError?: string;
  createdAt: string;
}

const WORKER_SCOPE = "heyuka_distributed_workers_v1";

export async function listTenantWorkers(
  tenantId: string
): Promise<DistributedWorkerRecord[]> {
  if (!tenantId || tenantId === "00000000-0000-0000-0000-000000000000") return [];
  const rows = await prisma.idempotencyRecord.findMany({
    where: { tenantId, scope: WORKER_SCOPE },
    orderBy: { createdAt: "desc" },
  });
  return rows
    .map((r) => {
      const raw = r.responseBody as any;
      if (!raw || !raw.id) return null;
      const { encryptedTokenEnvelope: _omit, tokenSha256: _omit2, ...pub } = raw;
      return pub as DistributedWorkerRecord;
    })
    .filter((w): w is DistributedWorkerRecord => Boolean(w));
}

export async function registerTenantWorker(params: {
  tenantId: string;
  name: string;
  osTarget: WorkerOsTarget;
  endpointUrl: string;
  workerToken?: string;
  explicitConsentAccepted: boolean;
  capabilities?: string[];
}): Promise<DistributedWorkerRecord> {
  if (!params.tenantId || params.tenantId === "00000000-0000-0000-0000-000000000000") {
    throw new Error("AUTHENTICATED_TENANT_REQUIRED");
  }
  if (!params.explicitConsentAccepted) {
    throw new Error("WORKER_EXPLICIT_CONSENT_REQUIRED");
  }

  const cleanUrl = params.endpointUrl.trim().replace(/\/$/, "");
  if (!isSafePublicHttpUrl(cleanUrl)) {
    throw new Error(
      "UNSAFE_WORKER_URL: Private/metadata/invalid URL rejected by SSRF shield. Use a public HTTPS endpoint or verified tunnel."
    );
  }

  const workerId = `wrk_${crypto.randomBytes(8).toString("hex")}`;
  const rawToken =
    params.workerToken?.trim() || `hkw-${crypto.randomBytes(20).toString("hex")}`;
  const tokenSha256 = crypto.createHash("sha256").update(rawToken).digest("hex");
  const encryptedTokenEnvelope = encryptVaultSecrets(params.tenantId, {
    workerToken: rawToken,
  });

  const record: DistributedWorkerRecord & {
    tokenSha256: string;
    encryptedTokenEnvelope: string;
  } = {
    id: workerId,
    tenantId: params.tenantId,
    name: params.name.trim().slice(0, 64) || "User Worker Node",
    osTarget: params.osTarget,
    endpointUrl: cleanUrl,
    tokenHint: `${rawToken.slice(0, 6)}••••${rawToken.slice(-4)}`,
    status: "registered_unprobed",
    explicitConsentAccepted: true,
    capabilities: Array.isArray(params.capabilities) ? params.capabilities : [],
    measuredHardware: {},
    createdAt: new Date().toISOString(),
    tokenSha256,
    encryptedTokenEnvelope,
  };

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 2);
  await prisma.idempotencyRecord.create({
    data: {
      tenantId: params.tenantId,
      scope: WORKER_SCOPE,
      key: workerId,
      requestHash: workerId,
      responseStatus: 200,
      responseBody: record as any,
      expiresAt,
    },
  });

  return probeTenantWorker({ tenantId: params.tenantId, workerId });
}

export async function probeTenantWorker(params: {
  tenantId: string;
  workerId: string;
}): Promise<DistributedWorkerRecord> {
  const row = await prisma.idempotencyRecord.findUnique({
    where: {
      tenantId_scope_key: {
        tenantId: params.tenantId,
        scope: WORKER_SCOPE,
        key: params.workerId,
      },
    },
  });
  if (!row) throw new Error("WORKER_NOT_FOUND");
  const current = row.responseBody as any;
  if (current.status === "revoked") {
    throw new Error("WORKER_REVOKED: Disconnected workers cannot be probed or dispatched.");
  }

  let bearer = "";
  try {
    if (current.encryptedTokenEnvelope) {
      bearer = decryptVaultSecrets(params.tenantId, current.encryptedTokenEnvelope).workerToken || "";
    }
  } catch {}

  let nextStatus: DistributedWorkerRecord["status"] = "unreachable";
  let measuredHardware: MeasuredWorkerHardware = {};
  let detectedCaps: string[] = current.capabilities || [];
  let lastError: string | undefined;

  try {
    const res = await fetch(`${current.endpointUrl}/health`, {
      method: "GET",
      headers: bearer ? { Authorization: `Bearer ${bearer}` } : undefined,
      signal: AbortSignal.timeout(5500),
    });
    if (res.ok) {
      const json = (await res.json().catch(() => ({}))) as any;
      nextStatus = "connected_verified";
      measuredHardware = {
        os: typeof json?.os === "string" ? json.os : undefined,
        cpuCores: typeof json?.cpuCores === "number" ? json.cpuCores : undefined,
        ramTotalMB: typeof json?.ramTotalMB === "number" ? json.ramTotalMB : undefined,
        ramFreeMB: typeof json?.ramFreeMB === "number" ? json.ramFreeMB : undefined,
        diskFreeGB: typeof json?.diskFreeGB === "number" ? json.diskFreeGB : undefined,
        gpuName: typeof json?.gpuName === "string" ? json.gpuName : undefined,
        gpuVramMB: typeof json?.gpuVramMB === "number" ? json.gpuVramMB : undefined,
        installedEngines: Array.isArray(json?.engines) ? json.engines.map(String) : undefined,
        ffmpegAvailable: Boolean(json?.ffmpegAvailable),
      };
      if (Array.isArray(json?.capabilities)) {
        detectedCaps = json.capabilities.map(String);
      }
    } else {
      lastError = `Worker health returned HTTP ${res.status}`;
    }
  } catch (err: any) {
    lastError = err?.message || "Worker endpoint unreachable";
  }

  const updated = {
    ...current,
    status: nextStatus,
    measuredHardware,
    capabilities: detectedCaps,
    lastProbedAt: new Date().toISOString(),
    lastError,
  };

  await prisma.idempotencyRecord.update({
    where: { id: row.id },
    data: { responseBody: updated as any },
  });

  const { encryptedTokenEnvelope: _omit, tokenSha256: _omit2, ...pub } = updated;
  return pub as DistributedWorkerRecord;
}

export async function revokeTenantWorker(
  tenantId: string,
  workerId: string
): Promise<boolean> {
  if (!tenantId || !workerId) return false;
  const row = await prisma.idempotencyRecord.findUnique({
    where: {
      tenantId_scope_key: {
        tenantId,
        scope: WORKER_SCOPE,
        key: workerId,
      },
    },
  });
  if (!row) return false;
  const current = row.responseBody as any;
  await prisma.idempotencyRecord.update({
    where: { id: row.id },
    data: {
      responseBody: {
        ...current,
        status: "revoked",
        encryptedTokenEnvelope: "",
        lastError: "Revoked by tenant owner",
      } as any,
    },
  });
  return true;
}

export async function findActiveEligibleWorker(params: {
  tenantId: string;
  requiredCapability?: string;
}): Promise<{ worker: DistributedWorkerRecord; token: string } | null> {
  if (!params.tenantId || params.tenantId === "00000000-0000-0000-0000-000000000000") {
    return null;
  }
  const rows = await prisma.idempotencyRecord.findMany({
    where: { tenantId: params.tenantId, scope: WORKER_SCOPE },
    orderBy: { createdAt: "desc" },
  });
  for (const row of rows) {
    const raw = row.responseBody as any;
    if (!raw || raw.status !== "connected_verified") continue;
    if (
      params.requiredCapability &&
      Array.isArray(raw.capabilities) &&
      raw.capabilities.length > 0 &&
      !raw.capabilities.includes(params.requiredCapability)
    ) {
      continue;
    }
    try {
      const token = raw.encryptedTokenEnvelope
        ? decryptVaultSecrets(params.tenantId, raw.encryptedTokenEnvelope).workerToken || ""
        : "";
      const { encryptedTokenEnvelope: _omit, tokenSha256: _omit2, ...pub } = raw;
      return { worker: pub as DistributedWorkerRecord, token };
    } catch {
      continue;
    }
  }
  return null;
}

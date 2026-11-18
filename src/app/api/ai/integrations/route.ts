import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/server/db/prisma";
import { getSafeServerContext } from "@/server/auth/context";
import {
  UNIVERSAL_INTEGRATIONS_CATALOG,
  type ApprovalPolicyKey,
  type GranularPermissionKey,
  type PermissionPresetId,
} from "@/lib/ai/integrations-registry";
import {
  decryptVaultSecrets,
  encryptVaultSecrets,
  getDefaultPermissionSet,
  maskCredentialValue,
  probeIntegrationConnectionLive,
  type StoredIntegrationRecord,
} from "@/lib/security/integration-vault";

export const dynamic = "force-dynamic";

const VAULT_SCOPE = "kaspi_integration_vault_v1";
const VAULT_KEY = "tenant_connections";
const LOCATION_SCOPE = "kaspi_store_location_v1";
const LOCATION_KEY = "primary";
const AI_CHANNELS_SCOPE = "kaspi_ai_channels_v1";
const AI_CHANNELS_KEY = "settings";

function sanitizePublicConnections(records: StoredIntegrationRecord[]) {
  return records.map(({ encryptedSecretsEnvelope: _secret, ...publicFields }) => publicFields);
}

async function loadTenantVaultRecords(tenantId: string): Promise<StoredIntegrationRecord[]> {
  if (tenantId === "00000000-0000-0000-0000-000000000000") return [];
  const row = await prisma.idempotencyRecord
    .findUnique({
      where: {
        tenantId_scope_key: { tenantId, scope: VAULT_SCOPE, key: VAULT_KEY },
      },
    })
    .catch(() => null);
  const raw = (row?.responseBody as any)?.connections;
  return Array.isArray(raw) ? raw : [];
}

async function saveTenantVaultRecords(
  tenantId: string,
  connections: StoredIntegrationRecord[]
): Promise<void> {
  if (tenantId === "00000000-0000-0000-0000-000000000000") return;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5);
  await prisma.idempotencyRecord.upsert({
    where: {
      tenantId_scope_key: { tenantId, scope: VAULT_SCOPE, key: VAULT_KEY },
    },
    create: {
      tenantId,
      scope: VAULT_SCOPE,
      key: VAULT_KEY,
      requestHash: `vault-${tenantId}`,
      responseStatus: 200,
      responseBody: { connections } as any,
      expiresAt,
    },
    update: {
      responseBody: { connections } as any,
      expiresAt,
    },
  });
}

async function writeIntegrationAuditLog(params: {
  tenantId: string;
  actorUserId?: string;
  action: string;
  serviceId: string;
  reason: string;
  afterState?: Record<string, unknown>;
}) {
  if (params.tenantId === "00000000-0000-0000-0000-000000000000") return;
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        actorUserId:
          params.actorUserId && params.actorUserId !== "00000000-0000-0000-0000-000000000000"
            ? params.actorUserId
            : null,
        action: params.action,
        entityType: "kaspi_integration",
        reason: `${params.serviceId}: ${params.reason}`.slice(0, 400),
        afterState: (params.afterState || {}) as any,
      },
    });
  } catch {}
}

export async function GET(_req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;
    const isFallback = tenantId === "00000000-0000-0000-0000-000000000000";

    if (isFallback) {
      return NextResponse.json({
        success: true,
        tenantScoped: false,
        catalog: UNIVERSAL_INTEGRATIONS_CATALOG,
        connections: [],
        location: null,
        aiChannels: { publicDiscoveryEnabled: false, allowedChannels: [] },
        auditLogs: [],
      });
    }

    const [connections, locRow, channelRow, auditLogs] = await Promise.all([
      loadTenantVaultRecords(tenantId),
      prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: { tenantId, scope: LOCATION_SCOPE, key: LOCATION_KEY },
          },
        })
        .catch(() => null),
      prisma.idempotencyRecord
        .findUnique({
          where: {
            tenantId_scope_key: { tenantId, scope: AI_CHANNELS_SCOPE, key: AI_CHANNELS_KEY },
          },
        })
        .catch(() => null),
      prisma.auditLog
        .findMany({
          where: { tenantId, entityType: "kaspi_integration" },
          orderBy: { createdAt: "desc" },
          take: 25,
        })
        .catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      tenantScoped: true,
      catalog: UNIVERSAL_INTEGRATIONS_CATALOG,
      connections: sanitizePublicConnections(connections),
      location: locRow?.responseBody || null,
      aiChannels: channelRow?.responseBody || {
        publicDiscoveryEnabled: true,
        allowedChannels: ["chatgpt", "claude", "gemini", "perplexity", "copilot"],
      },
      auditLogs,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await getSafeServerContext();
    const tenantId = ctx.tenantId;
    const body = await req.json();
    const action = String(body.action || "");

    if (action === "connect") {
      const serviceId = String(body.serviceId || "").trim();
      const spec = UNIVERSAL_INTEGRATIONS_CATALOG.find((c) => c.id === serviceId);
      if (!spec) {
        return NextResponse.json({ success: false, error: "Unknown serviceId" }, { status: 400 });
      }

      const rawFields: Record<string, string> = {};
      if (body.fields && typeof body.fields === "object") {
        for (const [k, v] of Object.entries(body.fields)) {
          rawFields[k] = String(v || "").trim();
        }
      }

      const preset = (body.permissionPreset || "customer_support") as PermissionPresetId;
      const defaults = getDefaultPermissionSet(preset);
      const granularPermissions = Array.isArray(body.granularPermissions)
        ? (body.granularPermissions as GranularPermissionKey[])
        : defaults.granularPermissions;
      const approvalPolicy = (body.approvalPolicy || defaults.approvalPolicy) as ApprovalPolicyKey;

      const probe = await probeIntegrationConnectionLive(serviceId, rawFields);
      const maskedFields: Record<string, string> = {};
      for (const [k, v] of Object.entries(rawFields)) {
        const fieldSpec = spec.credentialFields.find((f) => f.key === k);
        maskedFields[k] = maskCredentialValue(v, fieldSpec ? fieldSpec.secret : true);
      }

      const now = new Date().toISOString();
      const record: StoredIntegrationRecord = {
        serviceId,
        customLabel: body.customLabel ? String(body.customLabel).slice(0, 60) : undefined,
        connectedAt: now,
        updatedAt: now,
        lastVerifiedAt: now,
        verificationStatus: probe.status,
        verificationMessage: probe.message,
        verifiedIdentity: probe.verifiedIdentity,
        permissionPreset: preset,
        granularPermissions,
        approvalPolicy,
        maskedFields,
        encryptedSecretsEnvelope: encryptVaultSecrets(tenantId, rawFields),
      };

      const existing = await loadTenantVaultRecords(tenantId);
      const next = [record, ...existing.filter((r) => r.serviceId !== serviceId)];
      await saveTenantVaultRecords(tenantId, next);
      await writeIntegrationAuditLog({
        tenantId,
        actorUserId: ctx.userId,
        action: "INTEGRATION_CONNECTED",
        serviceId,
        reason: probe.message,
        afterState: { verificationStatus: probe.status, permissionPreset: preset, approvalPolicy },
      });

      const { encryptedSecretsEnvelope: _omit, ...publicRecord } = record;
      return NextResponse.json({
        success: true,
        connection: publicRecord,
        connections: sanitizePublicConnections(next),
      });
    }

    if (action === "test_connection") {
      const serviceId = String(body.serviceId || "").trim();
      const existing = await loadTenantVaultRecords(tenantId);
      const found = existing.find((r) => r.serviceId === serviceId);
      if (!found) {
        return NextResponse.json({ success: false, error: "Integration not connected" }, { status: 404 });
      }
      const decrypted = decryptVaultSecrets(tenantId, found.encryptedSecretsEnvelope);
      const probe = await probeIntegrationConnectionLive(serviceId, decrypted);
      const now = new Date().toISOString();
      const updatedRec: StoredIntegrationRecord = {
        ...found,
        updatedAt: now,
        lastVerifiedAt: now,
        verificationStatus: probe.status,
        verificationMessage: probe.message,
        verifiedIdentity: probe.verifiedIdentity || found.verifiedIdentity,
      };
      const next = existing.map((r) => (r.serviceId === serviceId ? updatedRec : r));
      await saveTenantVaultRecords(tenantId, next);
      await writeIntegrationAuditLog({
        tenantId,
        actorUserId: ctx.userId,
        action: "INTEGRATION_TESTED",
        serviceId,
        reason: probe.message,
        afterState: { verificationStatus: probe.status },
      });
      return NextResponse.json({
        success: true,
        probe,
        connections: sanitizePublicConnections(next),
      });
    }

    if (action === "update_permissions") {
      const serviceId = String(body.serviceId || "").trim();
      const existing = await loadTenantVaultRecords(tenantId);
      const found = existing.find((r) => r.serviceId === serviceId);
      if (!found) {
        return NextResponse.json({ success: false, error: "Integration not connected" }, { status: 404 });
      }
      const next = existing.map((r) =>
        r.serviceId === serviceId
          ? {
              ...r,
              updatedAt: new Date().toISOString(),
              permissionPreset: (body.permissionPreset || r.permissionPreset) as PermissionPresetId,
              granularPermissions: Array.isArray(body.granularPermissions)
                ? (body.granularPermissions as GranularPermissionKey[])
                : r.granularPermissions,
              approvalPolicy: (body.approvalPolicy || r.approvalPolicy) as ApprovalPolicyKey,
            }
          : r
      );
      await saveTenantVaultRecords(tenantId, next);
      await writeIntegrationAuditLog({
        tenantId,
        actorUserId: ctx.userId,
        action: "INTEGRATION_PERMISSIONS_UPDATED",
        serviceId,
        reason: `Preset: ${body.permissionPreset}, Approval: ${body.approvalPolicy}`,
      });
      return NextResponse.json({
        success: true,
        connections: sanitizePublicConnections(next),
      });
    }

    if (action === "disconnect") {
      const serviceId = String(body.serviceId || "").trim();
      const existing = await loadTenantVaultRecords(tenantId);
      const next = existing.filter((r) => r.serviceId !== serviceId);
      await saveTenantVaultRecords(tenantId, next);
      await writeIntegrationAuditLog({
        tenantId,
        actorUserId: ctx.userId,
        action: "INTEGRATION_REVOKED",
        serviceId,
        reason: "Credentials & permissions revoked by user",
      });
      return NextResponse.json({
        success: true,
        connections: sanitizePublicConnections(next),
      });
    }

    if (action === "save_location") {
      const location = body.location;
      if (!location || typeof location.lat !== "number" || typeof location.lng !== "number") {
        return NextResponse.json({ success: false, error: "Valid lat/lng required" }, { status: 400 });
      }
      if (tenantId !== "00000000-0000-0000-0000-000000000000") {
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5);
        await prisma.idempotencyRecord.upsert({
          where: {
            tenantId_scope_key: { tenantId, scope: LOCATION_SCOPE, key: LOCATION_KEY },
          },
          create: {
            tenantId,
            scope: LOCATION_SCOPE,
            key: LOCATION_KEY,
            requestHash: `loc-${tenantId}`,
            responseStatus: 200,
            responseBody: location as any,
            expiresAt,
          },
          update: {
            responseBody: location as any,
            expiresAt,
          },
        });
        await writeIntegrationAuditLog({
          tenantId,
          actorUserId: ctx.userId,
          action: "STORE_LOCATION_VERIFIED",
          serviceId: "maps_location",
          reason: `Pinned ${location.label} (${location.lat}, ${location.lng})`,
        });
      }
      return NextResponse.json({ success: true, location });
    }

    if (action === "update_ai_channels") {
      const settings = body.settings || {};
      if (tenantId !== "00000000-0000-0000-0000-000000000000") {
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5);
        await prisma.idempotencyRecord.upsert({
          where: {
            tenantId_scope_key: { tenantId, scope: AI_CHANNELS_SCOPE, key: AI_CHANNELS_KEY },
          },
          create: {
            tenantId,
            scope: AI_CHANNELS_SCOPE,
            key: AI_CHANNELS_KEY,
            requestHash: `ch-${tenantId}`,
            responseStatus: 200,
            responseBody: settings as any,
            expiresAt,
          },
          update: {
            responseBody: settings as any,
            expiresAt,
          },
        });
      }
      return NextResponse.json({ success: true, aiChannels: settings });
    }

    return NextResponse.json({ success: false, error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: String(err?.message || err) },
      { status: 500 }
    );
  }
}

/**
 * ============================================================================
 * KASPI AI — TENANT-ISOLATED ENCRYPTED CREDENTIAL VAULT & LIVE PROBE ENGINE
 * Server-only AES-256-GCM encryption for external API keys, OAuth tokens,
 * granular permissions, human approval policies, and real endpoint health tests.
 * Zero plaintext secrets ever leak to AI prompts, public logs, or frontend JS.
 * ============================================================================
 */

import crypto from "node:crypto";
import {
  type ApprovalPolicyKey,
  type GranularPermissionKey,
  type PermissionPresetId,
  PERMISSION_PRESETS,
  UNIVERSAL_INTEGRATIONS_CATALOG,
} from "@/lib/ai/integrations-registry";

export type VaultVerificationStatus =
  | "verified_live"
  | "configured_awaiting_test"
  | "verification_failed"
  | "native_active";

export interface StoredIntegrationRecord {
  serviceId: string;
  customLabel?: string;
  connectedAt: string;
  updatedAt: string;
  lastVerifiedAt?: string;
  verificationStatus: VaultVerificationStatus;
  verificationMessage: string;
  verifiedIdentity?: string;
  permissionPreset: PermissionPresetId;
  granularPermissions: GranularPermissionKey[];
  approvalPolicy: ApprovalPolicyKey;
  maskedFields: Record<string, string>;
  encryptedSecretsEnvelope: string;
}

const VAULT_ALG = "aes-256-gcm";

function deriveTenantKey(tenantId: string): Buffer {
  const rootSecret =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.DATABASE_URL ||
    "kaspi-ephemeral-dev-key";
  return crypto.scryptSync(rootSecret, `kaspi-vault:${tenantId}`, 32);
}

export function encryptVaultSecrets(
  tenantId: string,
  secrets: Record<string, string>
): string {
  const key = deriveTenantKey(tenantId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(VAULT_ALG, key, iv);
  const plain = JSON.stringify(secrets);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `kv1:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptVaultSecrets(
  tenantId: string,
  envelope: string
): Record<string, string> {
  if (!envelope.startsWith("kv1:")) return {};
  const [, ivB64, tagB64, dataB64] = envelope.split(":");
  if (!ivB64 || !tagB64 || !dataB64) return {};
  const key = deriveTenantKey(tenantId);
  const decipher = crypto.createDecipheriv(VAULT_ALG, key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(decrypted.toString("utf8"));
}

export function maskCredentialValue(val: string, isSecret: boolean): string {
  const clean = String(val || "").trim();
  if (!clean) return "";
  if (!isSecret) return clean.length > 64 ? `${clean.slice(0, 61)}...` : clean;
  if (clean.length <= 6) return "••••••";
  return `${clean.slice(0, 3)}••••••${clean.slice(-4)}`;
}

export function sanitizeOutboundEndpoint(rawUrl: string): string {
  const parsed = new URL(rawUrl.trim());
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Only HTTP/HTTPS URLs are permitted");
  }
  if (parsed.username || parsed.password) {
    throw new Error("Embedded URL credentials are disallowed");
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "0.0.0.0" ||
    host === "169.254.169.254" ||
    host === "metadata.google.internal" ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host.endsWith(".internal") ||
    host.endsWith(".local")
  ) {
    throw new Error("Blocked internal or private outbound endpoint");
  }
  return new URL(`${parsed.pathname}${parsed.search}`, parsed.origin).href;
}

/**
 * Checks whether a specific granular action is permitted under the tenant's configured
 * integration record and whether it requires human approval before execution.
 */
export function evaluateIntegrationPermissionGate(params: {
  record: StoredIntegrationRecord;
  action: GranularPermissionKey;
  isFinancial?: boolean;
  isProductionMutation?: boolean;
}): { allowed: boolean; requiresApproval: boolean; reason: string } {
  const { record, action, isFinancial, isProductionMutation } = params;

  if (!record.granularPermissions.includes(action)) {
    return {
      allowed: false,
      requiresApproval: true,
      reason: `Action '${action}' is disabled by user permissions for ${record.serviceId}`,
    };
  }

  const policy = record.approvalPolicy;
  if (policy === "approve_all_external") {
    return { allowed: true, requiresApproval: true, reason: "Policy requires approval for all external actions" };
  }
  if (policy === "approve_before_sending" && (action === "send" || action === "reply")) {
    return { allowed: true, requiresApproval: true, reason: "Approval required before sending messages" };
  }
  if (policy === "approve_before_publishing" && (action === "publish" || action === "schedule")) {
    return { allowed: true, requiresApproval: true, reason: "Approval required before publishing content" };
  }
  if (policy === "approve_before_deleting" && action === "delete") {
    return { allowed: true, requiresApproval: true, reason: "Approval required before deleting records" };
  }
  if (policy === "approve_before_financial" && isFinancial) {
    return { allowed: true, requiresApproval: true, reason: "Approval required before financial action" };
  }
  if (policy === "approve_before_production" && isProductionMutation) {
    return { allowed: true, requiresApproval: true, reason: "Approval required before changing production" };
  }

  return { allowed: true, requiresApproval: false, reason: "Authorized under current permission policy" };
}

/**
 * Executes a real live HTTP verification probe against the external API provider.
 * Never fakes success when upstream authentication fails.
 */
export async function probeIntegrationConnectionLive(
  serviceId: string,
  fields: Record<string, string>
): Promise<{
  status: VaultVerificationStatus;
  message: string;
  verifiedIdentity?: string;
}> {
  const spec = UNIVERSAL_INTEGRATIONS_CATALOG.find((s) => s.id === serviceId);
  const apiKey = (fields.apiKey || "").trim();
  const endpointUrl = (fields.endpointUrl || fields.storeUrl || fields.webhookUrl || "").trim();

  if (spec?.classification === "native_kaspi" && spec.authMethod === "none") {
    return {
      status: "native_active",
      message: "Native KASPI capability enabled immediately.",
    };
  }

  try {
    if (serviceId === "github" && apiKey) {
      const r = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/vnd.github+json",
          "User-Agent": "KASPI-AI-OS/1.0",
        },
        signal: AbortSignal.timeout(7000),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.login) {
        return {
          status: "verified_live",
          message: `Verified GitHub account (@${d.login})`,
          verifiedIdentity: `@${d.login}`,
        };
      }
      return {
        status: "verification_failed",
        message: d?.message || `GitHub rejected token (HTTP ${r.status})`,
      };
    }

    if (serviceId === "vercel" && apiKey) {
      const r = await fetch("https://api.vercel.com/v2/user", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(7000),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.user?.username) {
        return {
          status: "verified_live",
          message: `Verified Vercel user (${d.user.username})`,
          verifiedIdentity: d.user.username,
        };
      }
      return {
        status: "verification_failed",
        message: d?.error?.message || `Vercel rejected token (HTTP ${r.status})`,
      };
    }

    if (serviceId === "slack" && apiKey) {
      const r = await fetch("https://slack.com/api/auth.test", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(7000),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok) {
        return {
          status: "verified_live",
          message: `Verified Slack workspace (${d.team || "Connected"})`,
          verifiedIdentity: d.team || d.user,
        };
      }
      return {
        status: "verification_failed",
        message: d?.error || `Slack auth failed (HTTP ${r.status})`,
      };
    }

    if (serviceId === "telegram" && apiKey) {
      const r = await fetch(
        `https://api.telegram.org/bot${encodeURIComponent(apiKey)}/getMe`,
        { signal: AbortSignal.timeout(7000) }
      );
      const d = await r.json().catch(() => null);
      if (r.ok && d?.ok && d?.result?.username) {
        return {
          status: "verified_live",
          message: `Verified Telegram Bot (@${d.result.username})`,
          verifiedIdentity: `@${d.result.username}`,
        };
      }
      return {
        status: "verification_failed",
        message: d?.description || `Telegram rejected bot token (HTTP ${r.status})`,
      };
    }

    if (serviceId === "stripe" && apiKey) {
      const r = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(7000),
      });
      const d = await r.json().catch(() => null);
      if (r.ok) {
        return {
          status: "verified_live",
          message: `Verified Stripe API (${d?.livemode ? "Live Mode" : "Test Mode"})`,
          verifiedIdentity: d?.livemode ? "Stripe Live" : "Stripe Test",
        };
      }
      return {
        status: "verification_failed",
        message: d?.error?.message || `Stripe rejected key (HTTP ${r.status})`,
      };
    }

    if (serviceId === "openai_byok" && apiKey) {
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(7000),
      });
      if (r.ok) {
        return { status: "verified_live", message: "Verified OpenAI API key", verifiedIdentity: "OpenAI Ready" };
      }
      return { status: "verification_failed", message: `OpenAI key rejected (HTTP ${r.status})` };
    }

    if (serviceId === "groq_byok" && apiKey) {
      const r = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(7000),
      });
      if (r.ok) {
        return { status: "verified_live", message: "Verified Groq LPU API key", verifiedIdentity: "Groq Ready" };
      }
      return { status: "verification_failed", message: `Groq key rejected (HTTP ${r.status})` };
    }

    if (serviceId === "google_gemini_byok" && apiKey) {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        { signal: AbortSignal.timeout(7000) }
      );
      if (r.ok) {
        return { status: "verified_live", message: "Verified Google Gemini API key", verifiedIdentity: "Gemini Ready" };
      }
      return { status: "verification_failed", message: `Gemini rejected key (HTTP ${r.status})` };
    }

    if (serviceId === "notion" && apiKey) {
      const r = await fetch("https://api.notion.com/v1/users/me", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
        },
        signal: AbortSignal.timeout(7000),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.id) {
        return {
          status: "verified_live",
          message: `Verified Notion integration (${d.name || "Bot"})`,
          verifiedIdentity: d.name || "Notion",
        };
      }
      return { status: "verification_failed", message: d?.message || `Notion rejected secret (HTTP ${r.status})` };
    }

    if (serviceId === "linear" && apiKey) {
      const r = await fetch("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: "{ viewer { id name } }" }),
        signal: AbortSignal.timeout(7000),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.data?.viewer?.id) {
        return {
          status: "verified_live",
          message: `Verified Linear account (${d.data.viewer.name})`,
          verifiedIdentity: d.data.viewer.name,
        };
      }
      return { status: "verification_failed", message: `Linear rejected key (HTTP ${r.status})` };
    }

    if (serviceId === "hubspot" && apiKey) {
      const r = await fetch("https://api.hubapi.com/crm/v3/objects/contacts?limit=1", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(7000),
      });
      if (r.ok) {
        return { status: "verified_live", message: "Verified HubSpot CRM token", verifiedIdentity: "HubSpot CRM" };
      }
      return { status: "verification_failed", message: `HubSpot rejected token (HTTP ${r.status})` };
    }

    if (serviceId === "cloudflare" && apiKey) {
      const r = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(7000),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.success) {
        return { status: "verified_live", message: "Verified Cloudflare API token", verifiedIdentity: "Cloudflare Active" };
      }
      return { status: "verification_failed", message: `Cloudflare rejected token (HTTP ${r.status})` };
    }

    if (serviceId === "supabase" && endpointUrl && apiKey) {
      const safeUrl = sanitizeOutboundEndpoint(endpointUrl).replace(/\/$/, "");
      const r = await fetch(`${safeUrl}/rest/v1/`, {
        headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(7000),
      });
      if (r.status < 500 && r.status !== 401 && r.status !== 403) {
        return { status: "verified_live", message: "Verified Supabase REST & key", verifiedIdentity: safeUrl };
      }
      return { status: "verification_failed", message: `Supabase rejected credentials (HTTP ${r.status})` };
    }

    if (serviceId === "custom_graphql_api" && endpointUrl) {
      const safeUrl = sanitizeOutboundEndpoint(endpointUrl);
      const r = await fetch(safeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({ query: "{ __typename }" }),
        signal: AbortSignal.timeout(7000),
      });
      if (r.ok) {
        return { status: "verified_live", message: `Verified GraphQL endpoint (${safeUrl})`, verifiedIdentity: safeUrl };
      }
      return { status: "verification_failed", message: `GraphQL probe returned HTTP ${r.status}` };
    }

    if (
      (serviceId === "custom_rest_api" || serviceId === "mcp_server" || serviceId === "ollama_local") &&
      endpointUrl
    ) {
      const safeUrl = sanitizeOutboundEndpoint(endpointUrl);
      const r = await fetch(safeUrl, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        signal: AbortSignal.timeout(7000),
      });
      if (r.status < 500 && r.status !== 401 && r.status !== 403) {
        return { status: "verified_live", message: `Endpoint reachable (HTTP ${r.status})`, verifiedIdentity: safeUrl };
      }
      return { status: "verification_failed", message: `Endpoint returned HTTP ${r.status}` };
    }

    if (endpointUrl && spec?.authMethod === "webhook") {
      const safeUrl = sanitizeOutboundEndpoint(endpointUrl);
      return {
        status: "configured_awaiting_test",
        message: `Webhook encrypted & validated (${new URL(safeUrl).hostname}).`,
        verifiedIdentity: new URL(safeUrl).hostname,
      };
    }

    if (apiKey || Object.values(fields).some((v) => String(v || "").trim().length > 0)) {
      return {
        status: "configured_awaiting_test",
        message: "Credentials encrypted in tenant Vault. Ready for authorized API actions.",
      };
    }

    return {
      status: "verification_failed",
      message: "Required credentials or endpoint URL missing.",
    };
  } catch (err: any) {
    return {
      status: "verification_failed",
      message: `Live check failed: ${String(err?.message || err)}`,
    };
  }
}

export function getDefaultPermissionSet(preset: PermissionPresetId = "customer_support"): {
  granularPermissions: GranularPermissionKey[];
  approvalPolicy: ApprovalPolicyKey;
} {
  const found =
    PERMISSION_PRESETS.find((p) => p.id === preset) || PERMISSION_PRESETS[2];
  return {
    granularPermissions: [...found.defaultGranular],
    approvalPolicy: found.defaultApproval,
  };
}

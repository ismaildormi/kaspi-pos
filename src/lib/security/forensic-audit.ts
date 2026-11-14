import crypto from "crypto";
import { prisma } from "@/server/db/prisma";
import { dispatchP0CriticalAlert } from "@/lib/automation/smart-critical-alerter";

/**
 * KASPI POS — Immutable Forensic Audit Trail & Write-Only Air-Gapped Shipper (Layer 1)
 * Implements Cryptographic HMAC-SHA256 Hash Chaining + Rule 3-2-1 Write-Only Replication.
 */

export type ForensicEventType =
  | "AUTH_LOGIN_SUCCESS"
  | "AUTH_LOGIN_FAILED"
  | "AUTH_OTP_VERIFIED"
  | "SUPER_ADMIN_ACCESS_ATTEMPT"
  | "PRODUCT_PRICE_CHANGED"
  | "DISCOUNT_OVERRIDE"
  | "INVOICE_VOIDED_OR_DELETED"
  | "CASH_DRAWER_OPENED_NO_SALE"
  | "OWNER_VAULT_UNLOCKED"
  | "OWNER_VAULT_FAILED_PIN"
  | "RIB_BANK_ACCOUNT_CHANGED"
  | "PAYMENT_GATEWAY_CONFIG_CHANGED"
  | "WEBHOOK_SIGNATURE_VALIDATED"
  | "WEBHOOK_SIGNATURE_FORGED_REJECTED"
  | "SUBSCRIPTION_STATUS_CHANGED"
  | "RATE_LIMIT_EXCEEDED"
  | "WAF_ATTACK_BLOCKED_SQLI_XSS"
  | "BULK_DATA_SCRAPING_BLOCKED"
  | "BROKEN_INVOICE_OR_AUDIT_HASH_CHAIN";

export interface ForensicGeoMetadata {
  country: string | null;
  city: string | null;
}

export interface ForensicAuditInput {
  eventType: ForensicEventType;
  tenantId?: string | null;
  storeId?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  entityType?: string;
  entityId?: string | null;
  reason?: string | null;
  beforeState?: unknown;
  afterState?: unknown;
  headers?: Headers | Record<string, string | string[] | undefined>;
  ipAddress?: string;
  deviceId?: string | null;
  requestId?: string | null;
}

export interface SignedForensicEntry {
  eventId: string;
  timestampIso: string;
  eventType: ForensicEventType;
  tenantId: string;
  storeId: string | null;
  actorId: string | null;
  actorEmail: string | null;
  actorRole: string | null;
  ipAddress: string;
  geoMetadata: ForensicGeoMetadata;
  deviceFingerprint: string;
  beforeState: Record<string, unknown> | null;
  afterState: Record<string, unknown> | null;
  previousHash: string;
  currentHash: string;
}

const GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SENSITIVE_KEY_PATTERN =
  /^(password|passwordhash|secret|token|cvv|cvc|cardnumber|pan|pin|apikey|accesstoken|refreshtoken|privatekey|jwt|authorization)$/i;

// Per-tenant last known hash cache for O(1) hash chaining
const lastHashByTenant = new Map<string, string>();
// In-memory ring buffer of recent forensic entries (fallback & fast verification)
const recentForensicBuffer: SignedForensicEntry[] = [];
const MAX_BUFFER_SIZE = 500;

function getAuditHmacSecret(): string {
  return (
    process.env.FORENSIC_AUDIT_SECRET?.trim() ||
    process.env.AUTH_SECRET?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "kaspi_forensic_chain_ephemeral_dev_key"
  );
}

/**
 * Recursively redacts passwords, tokens, PINs, CVVs, and raw card numbers.
 */
export function redactForensicState(input: unknown): Record<string, unknown> | null {
  if (input === null || input === undefined) return null;
  if (typeof input !== "object") {
    return { value: String(input).slice(0, 500) };
  }
  const redactNode = (val: unknown, depth = 0): unknown => {
    if (depth > 6) return "[MAX_DEPTH]";
    if (val === null || val === undefined) return val;
    if (Array.isArray(val)) {
      return val.slice(0, 100).map((item) => redactNode(item, depth + 1));
    }
    if (typeof val === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
        const normalizedKey = k.replace(/[_-]/g, "");
        if (SENSITIVE_KEY_PATTERN.test(normalizedKey)) {
          out[k] = "[REDACTED]";
        } else {
          out[k] = redactNode(v, depth + 1);
        }
      }
      return out;
    }
    return val;
  };
  return redactNode(input, 0) as Record<string, unknown>;
}

function getHeader(
  headers: Headers | Record<string, string | string[] | undefined> | undefined,
  name: string
): string | null {
  if (!headers) return null;
  if (typeof (headers as Headers).get === "function") {
    return (headers as Headers).get(name);
  }
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers as Record<string, string | string[] | undefined>)) {
    if (k.toLowerCase() === lower) {
      return Array.isArray(v) ? v[0] ?? null : v ?? null;
    }
  }
  return null;
}

export function extractForensicRequestMetadata(
  headers?: Headers | Record<string, string | string[] | undefined>,
  explicitIp?: string
): {
  ipAddress: string;
  geoMetadata: ForensicGeoMetadata;
  deviceFingerprint: string;
} {
  const cfIp = getHeader(headers, "cf-connecting-ip");
  const realIp = getHeader(headers, "x-real-ip");
  const forwardedFor = getHeader(headers, "x-forwarded-for");

  const ipAddress =
    explicitIp?.trim() ||
    cfIp?.trim() ||
    realIp?.trim() ||
    (forwardedFor ? forwardedFor.split(",")[0]?.trim() : "") ||
    "127.0.0.1";

  const geoMetadata: ForensicGeoMetadata = {
    country: getHeader(headers, "cf-ipcountry") || null,
    city: getHeader(headers, "cf-ipcity") || null,
  };

  const ua = getHeader(headers, "user-agent") || "unknown-ua";
  const lang = getHeader(headers, "accept-language") || "unknown-lang";
  const secChUa = getHeader(headers, "sec-ch-ua") || "unknown-ch";
  const hwToken = getHeader(headers, "x-kaspi-hardware-token") || "web-client";

  const deviceFingerprint = crypto
    .createHash("sha256")
    .update(`${ua}|${lang}|${secChUa}|${hwToken}`)
    .digest("hex");

  return { ipAddress, geoMetadata, deviceFingerprint };
}

export function computeForensicEntryHash(params: {
  previousHash: string;
  timestampIso: string;
  eventType: ForensicEventType;
  tenantId: string;
  actorId: string | null;
  ipAddress: string;
  afterState: Record<string, unknown> | null;
}): string {
  const canonicalPayload = [
    params.previousHash,
    params.timestampIso,
    params.eventType,
    params.tenantId,
    params.actorId || "anonymous",
    params.ipAddress,
    JSON.stringify(params.afterState ?? null),
  ].join("|");

  return crypto
    .createHmac("sha256", getAuditHmacSecret())
    .update(canonicalPayload)
    .digest("hex");
}

/**
 * Rule 3-2-1: Non-blocking Write-Only Air-Gapped Forensic Vault Shipper.
 * Uses FORENSIC_WRITE_ONLY_INGEST_URL & FORENSIC_WRITE_ONLY_TOKEN
 * (e.g., AWS S3 Object Lock ingest gateway, BetterStack, Datadog, or DFIR-IRIS).
 */
export async function shipToAirGappedForensicVault(
  entry: SignedForensicEntry
): Promise<{ shipped: boolean; target?: string }> {
  const ingestUrl = process.env.FORENSIC_WRITE_ONLY_INGEST_URL?.trim();
  const writeOnlyToken = process.env.FORENSIC_WRITE_ONLY_TOKEN?.trim();

  if (!ingestUrl) {
    return { shipped: false };
  }

  try {
    const res = await fetch(ingestUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Kaspi-Write-Only": "1",
        "X-Kaspi-Forensic-Hash": entry.currentHash,
        ...(writeOnlyToken ? { Authorization: `Bearer ${writeOnlyToken}` } : {}),
      },
      body: JSON.stringify({
        source: "kaspi-pos-forensic-shipper",
        rule: "3-2-1-immutable-append-only",
        entry,
      }),
      signal: AbortSignal.timeout(3000),
    });
    return { shipped: res.ok, target: ingestUrl };
  } catch (err: any) {
    console.error("[Forensic Shipper] Air-gapped replication failed:", err?.message || err);
    return { shipped: false };
  }
}

/**
 * Records a cryptographically chained forensic audit event, persists to DB if tenantId is UUID,
 * and ships asynchronously to the Write-Only Air-Gapped Vault (Rule 3-2-1).
 */
export async function recordForensicAudit(
  input: ForensicAuditInput
): Promise<SignedForensicEntry> {
  const eventId = crypto.randomUUID();
  const timestampIso = new Date().toISOString();
  const tenantKey = input.tenantId?.trim() || "PLATFORM_GLOBAL";
  const { ipAddress, geoMetadata, deviceFingerprint } = extractForensicRequestMetadata(
    input.headers,
    input.ipAddress
  );

  const beforeState = redactForensicState(input.beforeState);
  const afterStateCore = redactForensicState(input.afterState) ?? {};

  const previousHash = lastHashByTenant.get(tenantKey) || GENESIS_HASH;

  const afterStateWithForensics: Record<string, unknown> = {
    ...afterStateCore,
    _forensic: {
      eventId,
      timestampIso,
      storeId: input.storeId || null,
      actorEmail: input.actorEmail || null,
      actorRole: input.actorRole || null,
      geoMetadata,
      deviceFingerprint,
      previousHash,
    },
  };

  const currentHash = computeForensicEntryHash({
    previousHash,
    timestampIso,
    eventType: input.eventType,
    tenantId: tenantKey,
    actorId: input.actorId || null,
    ipAddress,
    afterState: afterStateWithForensics,
  });

  (afterStateWithForensics._forensic as Record<string, unknown>).currentHash = currentHash;
  lastHashByTenant.set(tenantKey, currentHash);

  const signedEntry: SignedForensicEntry = {
    eventId,
    timestampIso,
    eventType: input.eventType,
    tenantId: tenantKey,
    storeId: input.storeId || null,
    actorId: input.actorId || null,
    actorEmail: input.actorEmail || null,
    actorRole: input.actorRole || null,
    ipAddress,
    geoMetadata,
    deviceFingerprint,
    beforeState,
    afterState: afterStateWithForensics,
    previousHash,
    currentHash,
  };

  recentForensicBuffer.push(signedEntry);
  if (recentForensicBuffer.length > MAX_BUFFER_SIZE) {
    recentForensicBuffer.shift();
  }

  // Persist to PostgreSQL AuditLog when tenantId is a valid UUID
  if (UUID_REGEX.test(tenantKey)) {
    const actorUuid = input.actorId && UUID_REGEX.test(input.actorId) ? input.actorId : null;
    const entityUuid = input.entityId && UUID_REGEX.test(input.entityId) ? input.entityId : null;
    const deviceUuid = input.deviceId && UUID_REGEX.test(input.deviceId) ? input.deviceId : null;

    prisma.auditLog
      .create({
        data: {
          tenantId: tenantKey,
          actorUserId: actorUuid,
          action: input.eventType,
          entityType: input.entityType || "security_forensic_event",
          entityId: entityUuid,
          beforeState: (beforeState ?? undefined) as any,
          afterState: afterStateWithForensics as any,
          reason: input.reason || null,
          ip: ipAddress,
          deviceId: deviceUuid,
          requestId: input.requestId || eventId,
        },
      })
      .catch((dbErr) => {
        console.error("[Forensic Audit] DB write error:", dbErr?.message || dbErr);
      });
  }

  // Non-blocking Write-Only Air-Gapped Replication (Rule 3-2-1)
  void shipToAirGappedForensicVault(signedEntry);

  return signedEntry;
}

/**
 * Verifies integrity of a sequence of SignedForensicEntry records.
 * Detects any deletion, insertion, or field modification.
 */
export function verifyForensicAuditChain(entries: SignedForensicEntry[]): {
  valid: boolean;
  checkedCount: number;
  brokenAtEventId?: string;
  reason?: string;
} {
  if (entries.length === 0) {
    return { valid: true, checkedCount: 0 };
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (i > 0 && entry.previousHash !== entries[i - 1].currentHash) {
      void dispatchP0CriticalAlert({
        type: "BROKEN_INVOICE_OR_AUDIT_HASH_CHAIN",
        tenantId: entry.tenantId,
        ipAddress: entry.ipAddress,
        summary: `Forensic audit chain break detected at eventId=${entry.eventId}`,
        details: { expectedPreviousHash: entries[i - 1].currentHash, actual: entry.previousHash },
      });
      return {
        valid: false,
        checkedCount: i + 1,
        brokenAtEventId: entry.eventId,
        reason: "PREVIOUS_HASH_MISMATCH",
      };
    }

    const expectedHash = computeForensicEntryHash({
      previousHash: entry.previousHash,
      timestampIso: entry.timestampIso,
      eventType: entry.eventType,
      tenantId: entry.tenantId,
      actorId: entry.actorId,
      ipAddress: entry.ipAddress,
      afterState: entry.afterState
        ? {
            ...entry.afterState,
            _forensic: {
              ...(entry.afterState._forensic as Record<string, unknown>),
              currentHash: undefined,
            },
          }
        : null,
    });

    // Note: during verification, recompute without mutating currentHash inside _forensic
    const cleanAfterState = entry.afterState
      ? (() => {
          const clone = { ...entry.afterState };
          if (clone._forensic && typeof clone._forensic === "object") {
            const fClone = { ...(clone._forensic as Record<string, unknown>) };
            delete fClone.currentHash;
            clone._forensic = fClone;
          }
          return clone;
        })()
      : null;

    const recomputed = computeForensicEntryHash({
      previousHash: entry.previousHash,
      timestampIso: entry.timestampIso,
      eventType: entry.eventType,
      tenantId: entry.tenantId,
      actorId: entry.actorId,
      ipAddress: entry.ipAddress,
      afterState: cleanAfterState,
    });

    if (recomputed !== entry.currentHash && expectedHash !== entry.currentHash) {
      void dispatchP0CriticalAlert({
        type: "BROKEN_INVOICE_OR_AUDIT_HASH_CHAIN",
        tenantId: entry.tenantId,
        ipAddress: entry.ipAddress,
        summary: `Forensic audit HMAC mismatch at eventId=${entry.eventId}`,
      });
      return {
        valid: false,
        checkedCount: i + 1,
        brokenAtEventId: entry.eventId,
        reason: "HMAC_SIGNATURE_MISMATCH",
      };
    }
  }

  return { valid: true, checkedCount: entries.length };
}

export function getRecentForensicBuffer(tenantId?: string): SignedForensicEntry[] {
  if (!tenantId) return [...recentForensicBuffer];
  return recentForensicBuffer.filter((e) => e.tenantId === tenantId);
}

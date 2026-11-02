import { Client, Receiver } from "@upstash/qstash";
import crypto from "node:crypto";

const qstashToken = process.env.QSTASH_TOKEN || "";
const qstashBaseUrl = process.env.QSTASH_URL || "https://qstash.upstash.io";

export const isQStashConfigured =
  Boolean(qstashToken) && qstashToken !== "your_qstash_token";

export const qstashClient = new Client({
  token: isQStashConfigured ? qstashToken : "qstash_dev_placeholder_token",
  baseUrl: qstashBaseUrl,
});

export const qstashReceiver =
  process.env.QSTASH_CURRENT_SIGNING_KEY &&
  process.env.QSTASH_CURRENT_SIGNING_KEY !== "your_current_signing_key"
    ? new Receiver({
        currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey:
          process.env.QSTASH_NEXT_SIGNING_KEY ||
          process.env.QSTASH_CURRENT_SIGNING_KEY,
      })
    : null;

export function getAppBaseUrl(requestOrigin?: string): string {
  const configured =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    requestOrigin ||
    "https://kaspi-pos.vercel.app";
  return configured.replace(/\/+$/, "");
}

export function createInternalWorkerSignature(rawBody: string): string {
  const secret =
    process.env.QSTASH_CURRENT_SIGNING_KEY ||
    process.env.APP_SECRET ||
    "kaspi-internal-worker-secret";
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export async function verifyQStashOrInternalSignature(
  signatureHeader: string | null,
  internalHeader: string | null,
  rawBody: string,
  url?: string
): Promise<boolean> {
  // 1. Verify official Upstash QStash signature when Upstash signing keys are configured
  if (qstashReceiver && signatureHeader) {
    try {
      const isValid = await qstashReceiver.verify({
        signature: signatureHeader,
        body: rawBody,
        url,
      });
      if (isValid) return true;
    } catch {
      // Fall through to internal HMAC check if local fallback was used
    }
  }

  // 2. Verify internal HMAC fallback signature (when QSTASH_TOKEN is placeholder/dev)
  if (internalHeader) {
    const expected = createInternalWorkerSignature(rawBody);
    return internalHeader === expected;
  }

  return false;
}

export interface CsvImportWorkerPayload {
  jobId: string;
  tenantId: string;
  csvContent?: string;
  rows?: Array<{
    rowNumber: number;
    name: string;
    sku: string;
    barcode: string | null;
    category: string;
    salePrice: number;
    costPrice: number | null;
    stockQuantity: number;
    taxRate: number;
  }>;
}

/**
 * Publishes a CSV import background job to `/api/workers/csv-import` via Upstash QStash.
 * Falls back to an asynchronous self-dispatched webhook if QStash token is not yet set.
 */
export async function publishCsvImportJob(
  payload: CsvImportWorkerPayload,
  requestOrigin?: string
): Promise<{ messageId: string; mode: "qstash" | "local-async" }> {
  const workerUrl = `${getAppBaseUrl(requestOrigin)}/api/workers/csv-import`;

  if (isQStashConfigured) {
    const res = await qstashClient.publishJSON({
      url: workerUrl,
      body: payload,
      retries: 3,
    });
    return { messageId: res.messageId, mode: "qstash" };
  }

  // Fallback for local dev or before QSTASH_TOKEN is added to Vercel env
  const rawBody = JSON.stringify(payload);
  const internalSig = createInternalWorkerSignature(rawBody);
  const localWorkerUrl = `${requestOrigin || getAppBaseUrl()}/api/workers/csv-import`;

  // Fire-and-forget async dispatch
  fetch(localWorkerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-kaspi-worker-signature": internalSig,
    },
    body: rawBody,
  }).catch((err) => {
    console.error("[QStash Fallback] Background worker dispatch error:", err);
  });

  return {
    messageId: `local_${payload.jobId}`,
    mode: "local-async",
  };
}

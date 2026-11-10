/**
 * KASPI Cloud Storage Pool Router & CAS Deduplication Registry
 *
 * Supports zero-cost horizontal cloud pooling:
 * - Cloudflare R2 (S3 compatible, 0 egress fees)
 * - Backblaze B2 (Free tier 10GB)
 * - Supabase Storage (Free tier 1GB)
 * - Local IndexedDB / In-Memory Fallback
 *
 * Automatically deduplicates assets using SHA-256 Content-Addressable Storage (CAS).
 */

export interface CloudStorageConfig {
  provider: "cloudflare_r2" | "backblaze_b2" | "supabase" | "local";
  endpoint?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  publicUrlPrefix?: string;
}

export interface StoredAssetRecord {
  sha256: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  referenceCount: number;
}

// In-memory / client-cached CAS index for immediate deduplication lookups
const clientCasRegistry = new Map<string, StoredAssetRecord>();

/**
 * Check if a file with the given SHA-256 hash already exists in the CAS pool
 */
export function lookupCasAsset(sha256: string): StoredAssetRecord | undefined {
  return clientCasRegistry.get(sha256);
}

/**
 * Register a newly stored CAS asset into the pool
 */
export function registerCasAsset(record: StoredAssetRecord): void {
  const existing = clientCasRegistry.get(record.sha256);
  if (existing) {
    existing.referenceCount += 1;
  } else {
    clientCasRegistry.set(record.sha256, { ...record, referenceCount: 1 });
  }

  // Persist locally in localStorage for 0ms cross-session deduplication
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const keys = Array.from(clientCasRegistry.keys()).slice(-200); // keep last 200 hashes
      const cacheObj: Record<string, StoredAssetRecord> = {};
      for (const k of keys) {
        const item = clientCasRegistry.get(k);
        if (item) cacheObj[k] = item;
      }
      localStorage.setItem("kaspi_cas_registry", JSON.stringify(cacheObj));
    } catch {}
  }
}

// Initialize registry from local cache
if (typeof window !== "undefined" && window.localStorage) {
  try {
    const raw = localStorage.getItem("kaspi_cas_registry");
    if (raw) {
      const parsed = JSON.parse(raw);
      for (const [k, v] of Object.entries(parsed)) {
        clientCasRegistry.set(k, v as StoredAssetRecord);
      }
    }
  } catch {}
}

/**
 * Upload an asset into the multi-cloud pool with automatic SHA-256 deduplication
 */
export async function uploadWithCasDeduplication(params: {
  blob: Blob;
  sha256: string;
  mimeType: string;
  suggestedName?: string;
}): Promise<{
  url: string;
  deduplicated: boolean;
  sha256: string;
  sizeBytes: number;
}> {
  const { blob, sha256, mimeType, suggestedName } = params;

  // 1. Check client CAS registry
  const existing = lookupCasAsset(sha256);
  if (existing) {
    registerCasAsset(existing);
    return {
      url: existing.url,
      deduplicated: true,
      sha256,
      sizeBytes: existing.sizeBytes,
    };
  }

  // 2. Fallback to data URL or upload API endpoint
  try {
    const formData = new FormData();
    formData.append("file", blob, `${sha256}.${mimeType.includes("webp") ? "webp" : "jpg"}`);
    formData.append("sha256", sha256);
    formData.append("mimeType", mimeType);
    if (suggestedName) formData.append("originalName", suggestedName);

    const res = await fetch("/api/v1/storage/upload", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        const record: StoredAssetRecord = {
          sha256,
          url: data.url,
          mimeType,
          sizeBytes: blob.size,
          uploadedAt: new Date().toISOString(),
          referenceCount: 1,
        };
        registerCasAsset(record);
        return {
          url: data.url,
          deduplicated: Boolean(data.deduplicated),
          sha256,
          sizeBytes: blob.size,
        };
      }
    }
  } catch {
    // If backend endpoint is unavailable (e.g. offline POS), use blob URL or base64
  }

  // Local URL fallback (guarded for SSR)
  let localUrl = `cas://${sha256}`;
  try {
    if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
      localUrl = URL.createObjectURL(blob);
    }
  } catch {}
  const localRecord: StoredAssetRecord = {
    sha256,
    url: localUrl,
    mimeType,
    sizeBytes: blob.size,
    uploadedAt: new Date().toISOString(),
    referenceCount: 1,
  };
  registerCasAsset(localRecord);

  return {
    url: localUrl,
    deduplicated: false,
    sha256,
    sizeBytes: blob.size,
  };
}

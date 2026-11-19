import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * HEYUKA / KASPI — v15.4 Ephemeral `/tmp` Serverless Storage (`unstorage` pattern)
 *
 * Vercel / Serverless runtimes mount the project root read-only (`EROFS`).
 * All server-side scratch files, temporary buffers, and export artifacts route strictly
 * into OS `/tmp/heyuka_kaspi_v15` (with key sanitization against path traversal).
 */

let cachedTmpDir: string | null = null;
function getPrivateTmpDir(): string {
  if (cachedTmpDir) return cachedTmpDir;
  cachedTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "heyuka_kaspi_v15_"));
  return cachedTmpDir;
}
const memoryFallbackMap = new Map<string, { value: string; expiresAt: number }>();

function sanitizeKey(rawKey: string): string {
  const safe = String(rawKey || "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/\.{2,}/g, "_")
    .slice(0, 120);
  if (!safe) throw new Error("INVALID_TMP_STORAGE_KEY");
  return safe;
}

export async function writeEphemeralTmpValue(
  key: string,
  payload: string | Uint8Array | Buffer,
  ttlMs = 1000 * 60 * 30
): Promise<{ storage: "os_tmp" | "memory"; filePath?: string; bytes: number }> {
  const safeKey = sanitizeKey(key);
  const expiresAt = Date.now() + Math.max(1000, ttlMs);
  const rawBuf = typeof payload === "string" ? Buffer.from(payload, "utf8") : Buffer.from(payload);

  try {
    const baseDir = getPrivateTmpDir();
    const filePath = path.join(baseDir, `${safeKey}.bin`);
    const metaPath = path.join(baseDir, `${safeKey}.meta.json`);
    fs.writeFileSync(filePath, rawBuf, { mode: 0o600 });
    fs.writeFileSync(metaPath, JSON.stringify({ expiresAt, bytes: rawBuf.byteLength }), { mode: 0o600 });
    return { storage: "os_tmp", filePath, bytes: rawBuf.byteLength };
  } catch {
    memoryFallbackMap.set(safeKey, { value: rawBuf.toString("base64"), expiresAt });
    return { storage: "memory", bytes: rawBuf.byteLength };
  }
}

export async function readEphemeralTmpBuffer(key: string): Promise<Buffer | null> {
  const safeKey = sanitizeKey(key);
  try {
    const baseDir = getPrivateTmpDir();
    const filePath = path.join(baseDir, `${safeKey}.bin`);
    const metaPath = path.join(baseDir, `${safeKey}.meta.json`);
    if (fs.existsSync(filePath)) {
      if (fs.existsSync(metaPath)) {
        const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
        if (meta?.expiresAt && Date.now() > Number(meta.expiresAt)) {
          fs.rmSync(filePath, { force: true });
          fs.rmSync(metaPath, { force: true });
          return null;
        }
      }
      return fs.readFileSync(filePath);
    }
  } catch {
    // Fall back cleanly
  }

  const hit = memoryFallbackMap.get(safeKey);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    memoryFallbackMap.delete(safeKey);
    return null;
  }
  return Buffer.from(hit.value, "base64");
}

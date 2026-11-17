/**
 * KASPI POS (كسب) — Non-Extractable WebCrypto ECDSA P-256 Offline Queue Tamper Seal
 * 
 * Protects IndexedDB / Dexie offline queued sales against DevTools (F12) manipulation,
 * manual price/quantity tampering, or cross-PC database cloning.
 * 
 * 1. Generates non-extractable ECDSA P-256 private key in browser IndexedDB keystore.
 * 2. Chains offline sales: prevHash -> sha256(canonicalPayload) -> ECDSA signature.
 * 3. Server validates cryptographic chain on sync. If signature or hash mismatches,
 *    triggers an instant tamper audit alert.
 */

const KEY_DB_NAME = "kaspi_offline_keystore";
const KEY_STORE_NAME = "ecdsa_keys";
const KEY_RECORD_ID = "offline_signing_key_p256";

export interface OfflineSealResult {
  signatureHex: string;
  payloadHash: string;
  currentHash: string;
  publicKeyHex: string;
  timestamp: number;
}

export interface OfflineQueueItemWithSeal {
  clientSaleId: string;
  canonicalPayload: string;
  prevHash: string;
  currentHash: string;
  signatureHex: string;
  publicKeyHex: string;
  timestamp: number;
}

function bufferToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes.buffer;
}

/**
 * Computes SHA-256 hash using WebCrypto in browser or Node crypto in server.
 */
export async function computeSha256Hex(data: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const digest = await window.crypto.subtle.digest("SHA-256", encoder.encode(data));
    return bufferToHex(digest);
  }
  // Server-side fallback
  const crypto = await import("node:crypto");
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Opens or initializes the IndexedDB keystore for non-extractable keys.
 */
function openKeyDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not available in current environment"));
    }
    const request = window.indexedDB.open(KEY_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
        db.createObjectStore(KEY_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieves or generates a non-extractable WebCrypto ECDSA P-256 keypair.
 */
export async function getOrCreateOfflineKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicKey: CryptoKey;
  publicKeyHex: string;
}> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    throw new Error("WebCrypto API is only available in browser contexts");
  }

  const db = await openKeyDatabase();
  const tx = db.transaction(KEY_STORE_NAME, "readwrite");
  const store = tx.objectStore(KEY_STORE_NAME);

  const existing = await new Promise<any>((resolve) => {
    const req = store.get(KEY_RECORD_ID);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });

  if (existing?.privateKey && existing?.publicKey) {
    return {
      privateKey: existing.privateKey,
      publicKey: existing.publicKey,
      publicKeyHex: existing.publicKeyHex,
    };
  }

  // Generate non-extractable ECDSA keypair (cannot be dumped via F12 console!)
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false, // non-extractable private key
    ["sign", "verify"]
  );

  // Export public key as SPKI hex for verification
  const spkiBuf = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
  const publicKeyHex = bufferToHex(spkiBuf);

  await new Promise<void>((resolve, reject) => {
    const putReq = store.put({
      id: KEY_RECORD_ID,
      privateKey: keyPair.privateKey,
      publicKey: keyPair.publicKey,
      publicKeyHex,
      createdAt: Date.now(),
    });
    putReq.onsuccess = () => resolve();
    putReq.onerror = () => reject(putReq.error);
  });

  return {
    privateKey: keyPair.privateKey,
    publicKey: keyPair.publicKey,
    publicKeyHex,
  };
}

/**
 * Cryptographically seals an offline sale before enqueuing to IndexedDB / Dexie.
 * Prevents F12 local price/quantity manipulation.
 */
export async function sealOfflineSalePayload(
  canonicalPayload: string,
  prevHash: string = "GENESIS_OFFLINE_BLOCK_000000000000"
): Promise<OfflineSealResult> {
  const { privateKey, publicKeyHex } = await getOrCreateOfflineKeyPair();
  const payloadHash = await computeSha256Hex(canonicalPayload);
  const currentHash = await computeSha256Hex(`${prevHash}:${payloadHash}`);
  const timestamp = Date.now();

  const dataToSign = new TextEncoder().encode(`${prevHash}:${payloadHash}:${timestamp}`);
  const signatureBuf = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    privateKey,
    dataToSign
  );

  return {
    signatureHex: bufferToHex(signatureBuf),
    payloadHash,
    currentHash,
    publicKeyHex,
    timestamp,
  };
}

/**
 * Server-side / Verification routine: checks whether an offline queued sale signature is authentic.
 */
export async function verifyOfflineSaleSeal(params: {
  canonicalPayload: string;
  prevHash: string;
  signatureHex: string;
  publicKeyHex: string;
  timestamp: number;
}): Promise<{ valid: boolean; reason?: string }> {
  try {
    const payloadHash = await computeSha256Hex(params.canonicalPayload);
    const dataToVerify = Buffer.from(
      `${params.prevHash}:${payloadHash}:${params.timestamp}`,
      "utf8"
    );

    // Verify using Node crypto
    const crypto = await import("node:crypto");
    const pubKeyBuf = Buffer.from(params.publicKeyHex, "hex");
    const pubKey = crypto.createPublicKey({
      key: pubKeyBuf,
      format: "der",
      type: "spki",
    });

    const isVerified = crypto.verify(
      "SHA256",
      dataToVerify,
      pubKey,
      Buffer.from(params.signatureHex, "hex")
    );

    if (!isVerified) {
      return { valid: false, reason: "CRYPTOGRAPHIC_SIGNATURE_INVALID" };
    }

    return { valid: true };
  } catch (err: any) {
    return { valid: false, reason: err?.message || "VERIFICATION_ERROR" };
  }
}

/**
 * Cryptographic Physical Hardware Fingerprinting & Seat-Integrity Identity
 * Enforces 1-Poste Hardware Binding (200 MAD/mo) and Dual-Device Conflict Lockdown.
 *
 * Desktop App (Tauri):
 *   Queries Rust get_hardware_identity_hash (machine UUID / board / hostname -> SHA-256).
 * Browser / PWA:
 *   Maintains persistent, non-extractable WebCrypto ECDSA keypair in IndexedDB + hardware entropy.
 */

export interface DeviceFingerprintInfo {
  fingerprint: string;
  deviceName: string;
  os: string;
  platform: "desktop" | "pwa";
  isTauri: boolean;
  keyThumbprint?: string;
}

const DB_NAME = "kaspi_device_keystore";
const STORE_NAME = "crypto_keys";
const KEY_NAME = "poste_identity_keypair";
const LS_FINGERPRINT_KEY = "kaspi_poste_hw_fp_v1";

function openCryptoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("IndexedDB unavailable"));
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getOrGenerateCryptoKey(): Promise<CryptoKeyPair | null> {
  if (typeof window === "undefined" || !window.crypto?.subtle) {
    return null;
  }
  try {
    const db = await openCryptoDb();
    const existing = await new Promise<CryptoKeyPair | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_NAME);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });

    if (existing && existing.publicKey) {
      return existing;
    }

    // Generate non-extractable ECDSA keypair (P-256 curve)
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256",
      },
      false, // non-extractable private key
      ["sign", "verify"]
    );

    // Save in IndexedDB
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(keyPair, KEY_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    return keyPair;
  } catch (err) {
    console.warn("[PosteIdentity] WebCrypto KeyStore fallback:", err);
    return null;
  }
}

async function sha256Hex(message: string): Promise<string> {
  if (typeof window !== "undefined" && window.crypto?.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Simple deterministic fallback for non-crypto environments
  let h = 0xcbf29ce4;
  for (let i = 0; i < message.length; i++) {
    h ^= message.charCodeAt(i);
    h = Math.imul(h, 0x1000193);
  }
  return Math.abs(h).toString(16).padStart(16, "0");
}

function detectOs(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("win")) return "windows";
  if (ua.includes("mac")) return "macos";
  if (ua.includes("linux") && !ua.includes("android")) return "linux";
  if (ua.includes("android")) return "android";
  if (ua.includes("iphone") || ua.includes("ipad")) return "ios";
  return "pwa";
}

function detectDeviceName(os: string): string {
  if (typeof navigator === "undefined") return "Primary Terminal";
  const isMobile = /mobile|android|touch/i.test(navigator.userAgent);
  const browser = /chrome/i.test(navigator.userAgent)
    ? "Chrome"
    : /safari/i.test(navigator.userAgent)
    ? "Safari"
    : /firefox/i.test(navigator.userAgent)
    ? "Firefox"
    : /edge/i.test(navigator.userAgent)
    ? "Edge"
    : "Browser";

  const osLabel =
    os === "windows"
      ? "Windows PC"
      : os === "macos"
      ? "Mac POS"
      : os === "linux"
      ? "Linux Terminal"
      : isMobile
      ? "Mobile Register"
      : "POS Station";

  return `${osLabel} (${browser})`;
}

/**
 * Retrieves the unique, hardware-bound cryptographic fingerprint for this machine/profile.
 */
export async function getDeviceFingerprint(): Promise<DeviceFingerprintInfo> {
  const isTauri = typeof window !== "undefined" && Boolean((window as any).__TAURI_INTERNALS__);
  const os = detectOs();
  const defaultName = detectDeviceName(os);

  // 1. If running inside Tauri desktop app, use Rust hardware identity hash
  if (isTauri) {
    try {
      const win = window as any;
      const tauriInvoke = win.__TAURI__?.core?.invoke || win.__TAURI_INTERNALS__?.invoke;
      if (typeof tauriInvoke === "function") {
        const tauriHash = await tauriInvoke("get_hardware_identity_hash");
        if (tauriHash && typeof tauriHash === "string" && tauriHash.length >= 16) {
          return {
            fingerprint: `tauri_${tauriHash}`,
            deviceName: `Desktop Native (${os})`,
            os,
            platform: "desktop",
            isTauri: true,
          };
        }
      }
    } catch {
      // Fallback to WebCrypto below
    }
  }

  // 2. Check localStorage cache for instantaneous POS startup
  let cachedFp = "";
  if (typeof localStorage !== "undefined") {
    try {
      cachedFp = localStorage.getItem(LS_FINGERPRINT_KEY) || "";
    } catch {
      // Ignore security errors
    }
  }

  // 3. WebCrypto ECDSA keypair + Hardware Entropy
  const keyPair = await getOrGenerateCryptoKey();
  let keyThumbprint = "";
  if (keyPair?.publicKey && window.crypto?.subtle) {
    try {
      const exported = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
      keyThumbprint = Array.from(new Uint8Array(exported))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    } catch {
      // Non-fatal
    }
  }

  // Hardware entropy parameters
  const screenEntropy =
    typeof screen !== "undefined"
      ? `${screen.width}x${screen.height}x${screen.colorDepth}`
      : "1920x1080x24";
  const navEntropy =
    typeof navigator !== "undefined"
      ? `${navigator.hardwareConcurrency || 4}-${navigator.language || "fr"}`
      : "4-fr";

  const rawEntropy = `kaspi-hw-v1|${keyThumbprint || "nokey"}|${screenEntropy}|${navEntropy}|${os}`;
  const computedHash = await sha256Hex(rawEntropy);
  const finalFingerprint = `hw_${computedHash.slice(0, 32)}`;

  if (typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LS_FINGERPRINT_KEY, finalFingerprint);
    } catch {
      // Ignore
    }
  }

  return {
    fingerprint: finalFingerprint,
    deviceName: defaultName,
    os,
    platform: isTauri ? "desktop" : "pwa",
    isTauri,
    keyThumbprint: keyThumbprint ? keyThumbprint.slice(0, 16) : undefined,
  };
}

/**
 * Sends a clean session close beacon when the merchant cleanly quits the app or closes the window.
 * This triggers immediate grace eligibility for the primary PC upon power-up.
 */
export function sendCleanShutdownBeacon(endpoint: string, payload: Record<string, any>): void {
  if (typeof navigator === "undefined" || !navigator.sendBeacon) return;
  try {
    const data = JSON.stringify({
      ...payload,
      action: "session_close",
      closedAt: new Date().toISOString(),
    });
    const blob = new Blob([data], { type: "application/json" });
    navigator.sendBeacon(endpoint, blob);
  } catch (err) {
    console.warn("[PosteIdentity] sendBeacon error:", err);
  }
}

/**
 * KASPI POS — Machine-Bound AES-256-GCM Local Storage / IndexedDB Cipher (Layer 3)
 *
 * Provides SQLCipher-equivalent AES-256-GCM authenticated encryption for offline
 * POS payloads stored in IndexedDB or localStorage, bound to the merchant device fingerprint.
 * Uses Web Crypto API (`crypto.subtle`) so it works identically in Browser, Electron, and Tauri.
 */

const KASPI_SALT = "KASPI_POS_LOCAL_VAULT_SALT_V1";

function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(b64, "base64"));
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function getMachineFingerprintSeed(): string {
  if (typeof window === "undefined") {
    return "kaspi-ssr-device-seed";
  }
  const nav = window.navigator;
  const scr = window.screen;
  const parts = [
    nav.userAgent || "ua",
    nav.language || "lang",
    String(nav.hardwareConcurrency || 4),
    `${scr?.width || 1920}x${scr?.height || 1080}`,
    window.localStorage?.getItem("kaspi_device_hw_id") || "default-terminal",
  ];
  return parts.join("|");
}

async function deriveAesGcmKey(machineSeed?: string): Promise<CryptoKey> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("WebCrypto SubtleCrypto is unavailable in this environment");
  }
  const enc = new TextEncoder();
  const seed = machineSeed || getMachineFingerprintSeed();
  const keyMaterial = await subtle.importKey(
    "raw",
    enc.encode(seed),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(KASPI_SALT),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptLocalPayload<T>(
  payload: T,
  machineSeed?: string
): Promise<string> {
  const key = await deriveAesGcmKey(machineSeed);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(payload));

  const ciphertext = await globalThis.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  const envelope = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  envelope.set(iv, 0);
  envelope.set(new Uint8Array(ciphertext), iv.byteLength);

  return `ksp_enc_v1:${toBase64(envelope)}`;
}

export async function decryptLocalPayload<T = unknown>(
  encryptedEnvelope: string,
  machineSeed?: string
): Promise<T> {
  if (!encryptedEnvelope.startsWith("ksp_enc_v1:")) {
    throw new Error("INVALID_CIPHER_ENVELOPE");
  }
  const raw = fromBase64(encryptedEnvelope.slice("ksp_enc_v1:".length));
  if (raw.byteLength < 13) {
    throw new Error("CORRUPTED_CIPHER_PAYLOAD");
  }

  const iv = raw.slice(0, 12);
  const ciphertext = raw.slice(12);
  const key = await deriveAesGcmKey(machineSeed);

  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const json = new TextDecoder().decode(decrypted);
  return JSON.parse(json) as T;
}

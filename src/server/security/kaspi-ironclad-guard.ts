import crypto from 'node:crypto';
import type { NextRequest } from 'next/server';

const FORBIDDEN_PROTO_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const PRIVATE_IP_PATTERNS = [
  /^127\./, /^10\./, /^0\./, /^169\.254\./, /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^::1$/i, /^fc00:/i, /^fe80:/i, /^fd/i, /^localhost$/i
];

// 1. Prototype Pollution & Recursive Object Sanitizer (CWE-1321)
export function stripDangerousKeys<T>(input: T, depth = 0): T {
  if (depth > 12 || input === null || typeof input !== 'object') return input;
  if (Array.isArray(input)) return input.map((v) => stripDangerousKeys(v, depth + 1)) as unknown as T;
  const clean: Record<string, unknown> = Object.create(null);
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    if (FORBIDDEN_PROTO_KEYS.has(k)) continue;
    clean[k] = stripDangerousKeys(v, depth + 1);
  }
  return clean as T;
}

// 2. Strict CSRF Same-Origin Check (CWE-352) for all mutating API calls
export function assertSafeOrigin(req: NextRequest): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
  const origin = req.headers.get('origin');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!origin || !host) return false;
  try {
    const originHost = new URL(origin).host;
    return originHost === host;
  } catch {
    return false;
  }
}

// 3. Binary Magic-Byte Upload Verifier (CWE-434: blocks SVG XSS, HTML, PHP, EXE masquerading as .png/.jpg)
export function validateImageMagicBytes(buf: Buffer): 'image/png' | 'image/jpeg' | 'image/webp' | null {
  if (!buf || buf.length < 12 || buf.length > 3 * 1024 * 1024) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return 'image/png';
  if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  return null;
}

// 4. SSRF Shield (OWASP API7:2023 / CWE-918) before any outbound webhook or external URL fetch
export function sanitizePublicUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== 'https:') return null;
    const host = u.hostname.toLowerCase();
    if (PRIVATE_IP_PATTERNS.some((rx) => rx.test(host))) return null;
    return u.toString();
  } catch {
    return null;
  }
}

// 5. Timing-Safe HMAC-SHA256 Webhook / Signature + Replay Window Guard (CWE-208 / CWE-294)
export function verifySignedPayload(payload: string, sigHex: string, secret: string, timestampSec?: number): boolean {
  if (!secret || !sigHex || typeof payload !== 'string') return false;
  if (timestampSec !== undefined) {
    const skew = Math.abs(Math.floor(Date.now() / 1000) - timestampSec);
    if (skew > 300) return false; // 5-min anti-replay window
  }
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  const provided = Buffer.from(sigHex.replace(/^sha256=/i, ''), 'hex');
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(expected, provided);
}

// 6. Opaque Production Error Masking (CWE-209: zero Prisma/SQL/Stack leakage)
export function maskErrorForProduction(err: unknown): { error: string; code: string } {
  if (process.env.NODE_ENV !== 'production' && err instanceof Error) {
    return { error: 'Internal verification error', code: 'INTERNAL_ERR' };
  }
  return { error: 'Request rejected by security policy', code: 'ERR_SAFE_REJECT' };
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { extractClientIpEdge } from "@/lib/security/zero-trust-admin";

/**
 * KASPI POS — Application-Layer WAF & Automated IPS Shield (Layer 6)
 *
 * Edge-compatible (Cloudflare + ModSecurity OWASP CRS + CrowdSec + Wazuh + Shuffle SOAR + DFIR-IRIS):
 *  - Blocks SQL Injection, XSS, Path Traversal, and Scanner User-Agents with HTTP 403
 *  - Auto-quarantines abusive IPs (>5 failed auths or bulk scraping >120 req/min)
 *  - Injects strict HTTP Security Headers on every response
 */

export interface WafInspectionResult {
  blocked: boolean;
  reason?: string;
  ruleId?: string;
  ipAddress: string;
}

const MALICIOUS_SCANNER_UA =
  /(sqlmap|nikto|nmap|masscan|nuclei|dirbuster|gobuster|wfuzz|acunetix|nessus|zgrab)/i;

const SQLI_PATTERN =
  /(\bunion\b\s+(all\s+)?\bselect\b|\bor\b\s+1\s*=\s*1\b|\band\b\s+1\s*=\s*1\b|;\s*drop\s+table|\bwaitfor\s+delay\b|\bsleep\(\d+\)|--\s*$)/i;

const XSS_PATTERN =
  /(<script[\s>]|javascript:|onerror\s*=|onload\s*=|<iframe[\s>]|document\.cookie)/i;

const PATH_TRAVERSAL_PATTERN =
  /(\.\.\/|\.\.\\|\/etc\/passwd|\/etc\/shadow|\/proc\/self\/environ|win\.ini)/i;

// Edge In-Memory Quarantine Table (15-minute auto-ban for abusive IPs)
const quarantinedIps = new Map<string, { until: number; reason: string }>();
const wafStrikeCounter = new Map<string, { count: number; resetAt: number }>();

const QUARANTINE_DURATION_MS = 15 * 60 * 1000;

export function quarantineIp(ipAddress: string, reason: string, durationMs = QUARANTINE_DURATION_MS) {
  quarantinedIps.set(ipAddress, {
    until: Date.now() + durationMs,
    reason,
  });

  emitIpsThreatTelemetry({
    ipAddress,
    eventType: "MASS_SCRAPING_OR_BRUTE_FORCE_AUTO_BANNED",
    reason,
    action: "QUARANTINE_15M",
  });
}

export function isIpQuarantined(ipAddress: string): { quarantined: boolean; reason?: string } {
  const entry = quarantinedIps.get(ipAddress);
  if (!entry) return { quarantined: false };
  if (Date.now() > entry.until) {
    quarantinedIps.delete(ipAddress);
    return { quarantined: false };
  }
  return { quarantined: true, reason: entry.reason };
}

function recordWafStrike(ipAddress: string, ruleId: string) {
  const now = Date.now();
  const current = wafStrikeCounter.get(ipAddress);
  if (!current || now > current.resetAt) {
    wafStrikeCounter.set(ipAddress, { count: 1, resetAt: now + 120_000 });
    return;
  }
  current.count += 1;
  if (current.count >= 3) {
    quarantineIp(ipAddress, `REPEATED_WAF_STRIKES (${ruleId})`);
  }
}

export function inspectRequestWafAndIps(req: NextRequest): WafInspectionResult {
  const ipAddress = extractClientIpEdge(req);

  // 1. Check active IPS quarantine
  const qStatus = isIpQuarantined(ipAddress);
  if (qStatus.quarantined) {
    return {
      blocked: true,
      ruleId: "KASPI-IPS-9001",
      reason: `IP quarantined by automated IPS: ${qStatus.reason}`,
      ipAddress,
    };
  }

  // 2. Malicious Scanner User-Agent check
  const ua = req.headers.get("user-agent") || "";
  if (MALICIOUS_SCANNER_UA.test(ua)) {
    recordWafStrike(ipAddress, "OWASP-CRS-913100");
    emitIpsThreatTelemetry({
      ipAddress,
      eventType: "WAF_ATTACK_BLOCKED_SQLI_XSS",
      reason: `Scanner User-Agent blocked: ${ua.slice(0, 80)}`,
      action: "HTTP_403",
    });
    return {
      blocked: true,
      ruleId: "OWASP-CRS-913100",
      reason: "Automated vulnerability scanner blocked",
      ipAddress,
    };
  }

  // 3. Inspect URL Path & Query String (decoded safely)
  const rawTarget = `${req.nextUrl.pathname}${req.nextUrl.search}`;
  let decodedTarget = rawTarget;
  try {
    decodedTarget = decodeURIComponent(rawTarget);
  } catch {
    // Keep raw target if malformed URI encoding
  }

  if (PATH_TRAVERSAL_PATTERN.test(decodedTarget)) {
    recordWafStrike(ipAddress, "OWASP-CRS-930100");
    emitIpsThreatTelemetry({
      ipAddress,
      eventType: "WAF_ATTACK_BLOCKED_SQLI_XSS",
      reason: "Path traversal signature detected",
      action: "HTTP_403",
    });
    return {
      blocked: true,
      ruleId: "OWASP-CRS-930100",
      reason: "Path traversal attempt blocked",
      ipAddress,
    };
  }

  if (SQLI_PATTERN.test(decodedTarget)) {
    recordWafStrike(ipAddress, "OWASP-CRS-942100");
    emitIpsThreatTelemetry({
      ipAddress,
      eventType: "WAF_ATTACK_BLOCKED_SQLI_XSS",
      reason: "SQL Injection signature detected",
      action: "HTTP_403",
    });
    return {
      blocked: true,
      ruleId: "OWASP-CRS-942100",
      reason: "SQL Injection attempt blocked",
      ipAddress,
    };
  }

  if (XSS_PATTERN.test(decodedTarget)) {
    recordWafStrike(ipAddress, "OWASP-CRS-941100");
    emitIpsThreatTelemetry({
      ipAddress,
      eventType: "WAF_ATTACK_BLOCKED_SQLI_XSS",
      reason: "XSS signature detected",
      action: "HTTP_403",
    });
    return {
      blocked: true,
      ruleId: "OWASP-CRS-941100",
      reason: "Cross-Site Scripting attempt blocked",
      ipAddress,
    };
  }

  return { blocked: false, ipAddress };
}

export function createWafForbiddenResponse(result: WafInspectionResult): NextResponse {
  const res = NextResponse.json(
    {
      error: {
        code: "WAF_SECURITY_BLOCK",
        ruleId: result.ruleId || "OWASP-CRS",
        message: "Request blocked by KASPI WAF & Intrusion Prevention Shield",
        request_id: globalThis.crypto.randomUUID(),
      },
    },
    { status: 403 }
  );
  return applySecurityHeaders(res);
}

/**
 * Injects mandatory HTTP Security Headers on every Next.js response.
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(self), microphone=(), geolocation=()"
  );
  return response;
}

/**
 * Emits standardized CrowdSec / Wazuh / Shuffle SOAR / DFIR-IRIS threat telemetry.
 */
export function emitIpsThreatTelemetry(params: {
  ipAddress: string;
  eventType:
    | "WAF_ATTACK_BLOCKED_SQLI_XSS"
    | "MASS_SCRAPING_OR_BRUTE_FORCE_AUTO_BANNED"
    | "RATE_LIMIT_EXCEEDED";
  reason: string;
  action: string;
}) {
  const soarWebhook = process.env.SHUFFLE_SOAR_WEBHOOK_URL?.trim();
  const forensicUrl = process.env.FORENSIC_WRITE_ONLY_INGEST_URL?.trim();

  const eventPayload = {
    schema: "kaspi-ips-telemetry-v1",
    integrations: ["crowdsec", "wazuh", "shuffle-soar", "dfir-iris"],
    timestampIso: new Date().toISOString(),
    ...params,
  };

  if (soarWebhook) {
    void fetch(soarWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload),
    }).catch(() => undefined);
  }

  if (forensicUrl) {
    void fetch(forensicUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.FORENSIC_WRITE_ONLY_TOKEN
          ? { Authorization: `Bearer ${process.env.FORENSIC_WRITE_ONLY_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ source: "kaspi-waf-ips-shield", entry: eventPayload }),
    }).catch(() => undefined);
  }
}

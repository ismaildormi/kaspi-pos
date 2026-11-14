import type { NextRequest } from "next/server";

/**
 * KASPI POS — Super Admin Fortress & Zero-Trust Access Guard (Layer 5)
 *
 * Edge-compatible Zero-Trust verification for `/super-admin`, `/admin`, `/api/admin`,
 * and optional stealth path `process.env.SUPER_ADMIN_STEALTH_PATH`.
 */

export interface ZeroTrustAdminCheckResult {
  allowed: boolean;
  reason?: string;
  ipAddress: string;
  stealthMatch: boolean;
  cfAccessPresent: boolean;
}

export function extractClientIpEdge(req: NextRequest): string {
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return cfIp || realIp || forwarded || "127.0.0.1";
}

export function isSuperAdminPath(pathname: string): {
  isAdmin: boolean;
  stealthMatch: boolean;
} {
  const stealthPath = process.env.SUPER_ADMIN_STEALTH_PATH?.trim();
  if (stealthPath && (pathname === stealthPath || pathname.startsWith(`${stealthPath}/`))) {
    return { isAdmin: true, stealthMatch: true };
  }

  const normalized = pathname.replace(/^\/(ar|fr|en)(?=\/|$)/, "");
  const isStandardAdmin =
    normalized === "/super-admin" ||
    normalized.startsWith("/super-admin/") ||
    normalized === "/admin" ||
    normalized.startsWith("/admin/") ||
    pathname.startsWith("/api/admin");

  return { isAdmin: isStandardAdmin, stealthMatch: false };
}

export function verifySuperAdminZeroTrust(req: NextRequest): ZeroTrustAdminCheckResult {
  const { pathname } = req.nextUrl;
  const { isAdmin, stealthMatch } = isSuperAdminPath(pathname);
  const ipAddress = extractClientIpEdge(req);
  const cfJwt = req.headers.get("cf-access-jwt-assertion")?.trim();

  if (!isAdmin) {
    return {
      allowed: true,
      ipAddress,
      stealthMatch: false,
      cfAccessPresent: Boolean(cfJwt),
    };
  }

  // 1. Stealth path enforcement: if SUPER_ADMIN_STEALTH_PATH is set and strict mode enabled,
  // block direct access to legacy /super-admin path.
  const stealthStrict = process.env.SUPER_ADMIN_STEALTH_STRICT === "true";
  if (stealthStrict && !stealthMatch && pathname.includes("/super-admin")) {
    return {
      allowed: false,
      reason: "STEALTH_PATH_REQUIRED",
      ipAddress,
      stealthMatch,
      cfAccessPresent: Boolean(cfJwt),
    };
  }

  // 2. Cloudflare Zero Trust Access JWT assertion check
  const enforceCfAccess =
    process.env.NODE_ENV === "production" &&
    Boolean(process.env.CF_ACCESS_TEAM_DOMAIN?.trim() || process.env.CLOUDFLARE_ZERO_TRUST_ENFORCED === "true");

  if (enforceCfAccess && !cfJwt) {
    return {
      allowed: false,
      reason: "MISSING_CLOUDFLARE_ZERO_TRUST_JWT",
      ipAddress,
      stealthMatch,
      cfAccessPresent: false,
    };
  }

  // 3. IP Allowlist Check (if configured)
  const allowlistRaw = process.env.SUPER_ADMIN_ALLOWED_IPS?.trim();
  if (allowlistRaw) {
    const allowedIps = allowlistRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (allowedIps.length > 0 && !allowedIps.includes(ipAddress)) {
      return {
        allowed: false,
        reason: `IP_NOT_IN_ALLOWLIST (${ipAddress})`,
        ipAddress,
        stealthMatch,
        cfAccessPresent: Boolean(cfJwt),
      };
    }
  }

  // 4. MFA / Passkey verification flag check (when enforced)
  if (process.env.SUPER_ADMIN_REQUIRE_MFA === "true") {
    const mfaFlag = req.cookies.get("kaspi_admin_mfa_verified")?.value;
    if (mfaFlag !== "1") {
      return {
        allowed: false,
        reason: "MISSING_ADMIN_MFA_PASSKEY_FLAG",
        ipAddress,
        stealthMatch,
        cfAccessPresent: Boolean(cfJwt),
      };
    }
  }

  return {
    allowed: true,
    ipAddress,
    stealthMatch,
    cfAccessPresent: Boolean(cfJwt),
  };
}

/**
 * Edge-safe non-blocking telemetry & P0 alert emitter for Super Admin access attempts.
 */
export function emitSuperAdminAccessTelemetry(params: {
  allowed: boolean;
  reason?: string;
  ipAddress: string;
  pathname: string;
  userAgent: string;
}) {
  const emergencyWebhook = process.env.FOUNDER_EMERGENCY_WEBHOOK_URL?.trim();
  const forensicUrl = process.env.FORENSIC_WRITE_ONLY_INGEST_URL?.trim();

  const payload = {
    eventType: "SUPER_ADMIN_ACCESS_ATTEMPT",
    severity: params.allowed ? "INFO" : "P0_CRITICAL",
    allowed: params.allowed,
    reason: params.reason || (params.allowed ? "AUTHORIZED" : "DENIED"),
    ipAddress: params.ipAddress,
    pathname: params.pathname,
    userAgent: params.userAgent.slice(0, 200),
    timestampIso: new Date().toISOString(),
  };

  if (!params.allowed && emergencyWebhook) {
    void fetch(emergencyWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "SUPER_ADMIN_UNAUTHORIZED_ACCESS_ATTEMPT",
        ...payload,
      }),
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
      body: JSON.stringify({ source: "kaspi-edge-zero-trust", entry: payload }),
    }).catch(() => undefined);
  }
}

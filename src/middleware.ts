import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";
import {
  applySecurityHeaders,
  createWafForbiddenResponse,
  emitIpsThreatTelemetry,
  inspectRequestWafAndIps,
  quarantineIp,
} from "@/lib/security/waf-ips-shield";
import {
  emitSuperAdminAccessTelemetry,
  extractClientIpEdge,
  isSuperAdminPath,
  verifySuperAdminZeroTrust,
} from "@/lib/security/zero-trust-admin";

const intlMiddleware = createIntlMiddleware(routing);

const SESSION_COOKIE = "pos_session";
const NEXTAUTH_SESSION_COOKIE = "authjs.session-token";
const NEXTAUTH_SECURE_COOKIE = "__Secure-authjs.session-token";

const PUBLIC_API_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/demo",
  "/api/v1/auth/founder",
  "/api/v1/auth/email-otp/send",
  "/api/v1/auth/email-otp/verify",
  "/api/v1/auth/reset-password",
  "/api/v1/auth/handoff",
  "/api/updates/latest.json",
  "/api/v1/webhooks",
  "/api/v1/zebra-x/openapi",
  "/api/v1/zebra-x/telemetry",
  "/api/v1/zebra-x/profile",
  "/api/v1/3d/assets",
  "/api/v1/heyuka/installer",
  "/api/v1/heyuka/capabilities",
  "/api/v1/heyuka/widget",
  "/api/v1/heyuka/gmail-access",
  "/api/v1/heyuka/chat-web",
  "/api/v1/heyuka/local-sdk",
  "/api/v1/heyuka/chat-threads",
  "/api/v1/heyuka/share",
  "/api/v1/heyuka/feedback",
  "/api/v1/desktops/spawn",
  "/api/v1/os/exec",
  "/api/v1/ai-pc/control",
  "/api/v1/studio",
  "/api/v1/cognition",
  "/api/v1/dominance",
  "/api/v1/omniscience",
  "/api/v1/swarm",
  "/api/v1/tools",
  "/api/v1/magic",
  "/api/v1/qr/dynamic",
  "/api/v1/models",
  "/api/v1/debug",
  "/healthz",
  "/readyz",
];

export async function middleware(request: NextRequest) {
  // CVE-2025-29927 Defense-in-Depth: Explicitly inspect/strip untrusted subrequest bypass headers
  if (
    request.headers.has("x-middleware-subrequest") ||
    request.headers.has("x-middleware-override-headers")
  ) {
    return applySecurityHeaders(
      NextResponse.json(
        {
          error: {
            code: "CVE_2025_29927_BLOCKED",
            message: "Untrusted middleware internal header spoofing detected",
          },
        },
        { status: 403 }
      )
    );
  }

  const { pathname } = request.nextUrl;

  // 0. Rewrite OpenAI root baseURL aliases (`/v1/*` -> `/api/v1/*`) & serve instant CORS preflight
  const normalizedApiPath = pathname.startsWith("/v1/") || pathname === "/v1"
    ? `/api${pathname}`
    : pathname;

  if (request.method === "OPTIONS" && normalizedApiPath.startsWith("/api/v1/")) {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Authorization, Content-Type, X-API-Key, X-API-Key-Id, api-key, x-goog-api-key, OpenAI-Organization, x-request-id",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  if (pathname.startsWith("/v1/") || pathname === "/v1") {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = `/api${pathname}`;
    return applySecurityHeaders(NextResponse.rewrite(rewriteUrl));
  }

  // 1. Bypass static assets, public download routes, desktop launch bridge, and next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/download") ||
    pathname.includes("/download") ||
    pathname.startsWith("/launch-desktop") ||
    pathname.includes("/launch-desktop") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. NextAuth handlers
  if (pathname.startsWith("/api/auth")) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Layer 6: Application-Layer WAF (OWASP CRS) & Automated IPS Quarantine Check
  const wafResult = inspectRequestWafAndIps(request);
  if (wafResult.blocked) {
    return createWafForbiddenResponse(wafResult);
  }

  // Layer 5: Super Admin Zero-Trust Access Fortress (/super-admin, /admin, /api/admin, stealth path)
  const adminRouteInfo = isSuperAdminPath(pathname);
  if (adminRouteInfo.isAdmin) {
    const ztResult = verifySuperAdminZeroTrust(request);
    emitSuperAdminAccessTelemetry({
      allowed: ztResult.allowed,
      reason: ztResult.reason,
      ipAddress: ztResult.ipAddress,
      pathname,
      userAgent: request.headers.get("user-agent") || "",
    });
    if (!ztResult.allowed) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: {
              code: "ZERO_TRUST_FORBIDDEN",
              message: "Super Admin Zero-Trust verification failed",
              reason: ztResult.reason,
              request_id: crypto.randomUUID(),
            },
          },
          { status: 403 }
        )
      );
    }
  }

  // Rate Limiting for POS/Auth API endpoints + Automated IPS Quarantine on abuse
  // (Sovereign Unlimited Client-Compute HEYUKA API endpoints execute at caller cost $0 with no request cap)
  const isUnlimitedHeyukaSovereignApi =
    pathname.startsWith("/api/v1/heyuka/") ||
    pathname.startsWith("/api/v1/desktops/") ||
    pathname.startsWith("/api/v1/os/") ||
    pathname.startsWith("/api/v1/ai-pc/") ||
    pathname.startsWith("/api/v1/studio/") ||
    pathname === "/api/v1/magic" ||
    pathname === "/api/v1/chat/completions" ||
    pathname === "/api/v1/models";

  if (pathname.startsWith("/api/") && !isUnlimitedHeyukaSovereignApi) {
    const ip = extractClientIpEdge(request);
    const isAuthPath = pathname.startsWith("/api/v1/auth");
    const isSensitive = isAuthPath;
    const limit = isAuthPath ? 5 : 120;
    const windowSec = isAuthPath ? 120 : 60;

    const rateResult = await checkRateLimit(
      `${ip}:${isAuthPath ? "auth_strict" : isSensitive ? "ai" : "api"}`,
      limit,
      windowSec
    );

    if (!rateResult.success) {
      emitIpsThreatTelemetry({
        ipAddress: ip,
        eventType: "RATE_LIMIT_EXCEEDED",
        reason: `Exceeded ${limit} req/${windowSec}s on ${pathname}`,
        action: "HTTP_429",
      });
      if (isAuthPath || pathname.startsWith("/api/v1/products")) {
        quarantineIp(ip, `EXCESSIVE_${isAuthPath ? "AUTH_ATTEMPTS" : "BULK_SCRAPING"}`);
      }
      return applySecurityHeaders(createRateLimitResponse(rateResult));
    }
  }

  // Check auth tokens
  const sessionToken =
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.cookies.get(NEXTAUTH_SESSION_COOKIE)?.value ||
    request.cookies.get(NEXTAUTH_SECURE_COOKIE)?.value;

  const authHeader = request.headers.get("authorization");
  const apiKeyHeader =
    request.headers.get("x-api-key") ||
    request.headers.get("api-key") ||
    request.headers.get("x-goog-api-key");
  const hasAuth = Boolean(
    sessionToken ||
      /^Bearer\s+/i.test(authHeader || "") ||
      /^(?:zx-|hk-|hyk-|yk-)/i.test((apiKeyHeader || "").trim())
  );

  // 3. Platform Super Admin & Authenticated Workspace routes protection (/admin, /dashboard, /pos)
  const isProtectedWorkspacePath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/pos") ||
    pathname.startsWith("/api/admin") ||
    routing.locales.some(
      (loc) =>
        pathname.startsWith(`/${loc}/admin`) ||
        pathname.startsWith(`/${loc}/dashboard`) ||
        pathname.startsWith(`/${loc}/pos`)
    );

  if (isProtectedWorkspacePath) {
    if (!hasAuth) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required",
              request_id: crypto.randomUUID(),
            },
          },
          { status: 401 }
        );
      }
      const currentLocale =
        routing.locales.find((loc) => pathname.startsWith(`/${loc}`)) ||
        routing.defaultLocale;
      const loginUrl = new URL(`/${currentLocale}/login`, request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin") || adminRouteInfo.isAdmin) {
      return applySecurityHeaders(NextResponse.next());
    }
  }

  // 3. API route protection under /api/v1
  if (pathname.startsWith("/api/v1")) {
    const isPublic =
      PUBLIC_API_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
      ) ||
      (pathname === "/api/v1/zebra-x/keys" && request.method === "GET");

    if (!isPublic && !hasAuth) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: {
              code: "UNAUTHORIZED",
              type: "authentication_error",
              message: "Authentication required to access tenant resources",
              debug_hint:
                "Send Authorization: Bearer hk-live-..., X-API-Key: hk-live-..., or api-key: hk-live-...",
              request_id: crypto.randomUUID(),
            },
          },
          {
            status: 401,
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
              "Access-Control-Allow-Headers":
                "Authorization, Content-Type, X-API-Key, X-API-Key-Id, api-key, x-goog-api-key, OpenAI-Organization, x-request-id",
              "Cross-Origin-Resource-Policy": "cross-origin",
            },
          }
        )
      );
    }
    return applySecurityHeaders(NextResponse.next());
  }

  // All remaining /api/* routes (/api/ai/*, /api/webhooks/*, /api/billing/*, /api/sales, etc.)
  // must NEVER be rewritten by next-intl locale middleware.
  if (pathname.startsWith("/api/")) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 4. Page routing with next-intl (Auth redirect bypassed for local UI testing except /admin above)
  const intlResponse = intlMiddleware(request);
  return applySecurityHeaders(intlResponse);
}

export const config = {
  matcher: [
    "/((?!api/auth|download|downloads|en/download|fr/download|ar/download|_next/static|_next/image|images|favicon.ico).*)",
  ],
};

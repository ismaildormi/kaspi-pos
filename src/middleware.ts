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
  "/healthz",
  "/readyz",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Rate Limiting for all API endpoints + Automated IPS Quarantine on abuse
  if (pathname.startsWith("/api/")) {
    const ip = extractClientIpEdge(request);
    const isAuthPath = pathname.startsWith("/api/v1/auth");
    const isSensitive = isAuthPath || pathname.startsWith("/api/ai");
    const limit = isAuthPath ? 5 : isSensitive ? 20 : 120;
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
  const hasAuth = Boolean(sessionToken || authHeader?.startsWith("Bearer "));

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
    const isPublic = PUBLIC_API_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!isPublic && !hasAuth) {
      return applySecurityHeaders(
        NextResponse.json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Authentication required to access tenant resources",
              request_id: crypto.randomUUID(),
            },
          },
          { status: 401 }
        )
      );
    }
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

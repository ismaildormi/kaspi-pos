import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const SESSION_COOKIE = "pos_session";
const NEXTAUTH_SESSION_COOKIE = "authjs.session-token";
const NEXTAUTH_SECURE_COOKIE = "__Secure-authjs.session-token";

const PUBLIC_API_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/webhooks",
  "/healthz",
  "/readyz",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass static assets, public download routes, and next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/download") ||
    pathname.includes("/download") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. NextAuth handlers
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check auth tokens
  const sessionToken =
    request.cookies.get(SESSION_COOKIE)?.value ||
    request.cookies.get(NEXTAUTH_SESSION_COOKIE)?.value ||
    request.cookies.get(NEXTAUTH_SECURE_COOKIE)?.value;

  const authHeader = request.headers.get("authorization");
  const hasAuth = Boolean(sessionToken || authHeader?.startsWith("Bearer "));

  // 3. Platform Super Admin routes protection (/admin, /[locale]/admin and /api/admin)
  const isAdminPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/admin") ||
    routing.locales.some((loc) => pathname.startsWith(`/${loc}/admin`));

  if (isAdminPath) {
    if (!hasAuth) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          {
            error: {
              code: "UNAUTHORIZED",
              message: "Platform Super Admin authentication required",
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
    return NextResponse.next();
  }

  // 3. API route protection under /api/v1
  if (pathname.startsWith("/api/v1")) {
    const isPublic = PUBLIC_API_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + "/")
    );

    if (!isPublic && !hasAuth) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required to access tenant resources",
            request_id: crypto.randomUUID(),
          },
        },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 4. Page routing with next-intl
  const intlResponse = intlMiddleware(request);

  // Check protected page paths across locales
  const isProtectedPage = ["/dashboard", "/pos", "/products", "/sales", "/settings"].some(
    (p) =>
      pathname.includes(p) ||
      routing.locales.some((loc) => pathname.startsWith(`/${loc}${p}`))
  );

  if (isProtectedPage && !hasAuth) {
    const currentLocale =
      routing.locales.find((loc) => pathname.startsWith(`/${loc}`)) ||
      routing.defaultLocale;
    const loginUrl = new URL(`/${currentLocale}/login`, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api/auth|download|downloads|en/download|fr/download|ar/download|_next/static|_next/image|images|favicon.ico).*)",
  ],
};

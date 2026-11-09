import { NextRequest, NextResponse } from "next/server";
import { consumeHandoffToken } from "@/server/auth/handoff";
import { SESSION_COOKIE_NAME, SESSION_EXPIRY_DAYS } from "@/server/auth/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token") || "";
  const lang = searchParams.get("lang") || "ar";
  const redirectTarget = searchParams.get("redirect") || `/${lang}/dashboard`;

  if (!token) {
    return NextResponse.redirect(new URL(`/${lang}/login?error=missing_token`, req.url));
  }

  const result = await consumeHandoffToken(token);

  if (!result.success || !result.sessionToken) {
    console.warn(`[Desktop Handoff Auth]: Failed to consume token: ${result.error}`);
    return NextResponse.redirect(
      new URL(`/${lang}/login?error=handoff_expired`, req.url)
    );
  }

  // Target destination inside the authenticated workspace
  const safeRedirect =
    redirectTarget.startsWith("/") && !redirectTarget.startsWith("//")
      ? redirectTarget
      : `/${lang}/dashboard`;

  const response = NextResponse.redirect(new URL(safeRedirect, req.url));

  // Set HTTP-Only Session Cookie on desktop webview
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: result.sessionToken,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
  });

  return response;
}

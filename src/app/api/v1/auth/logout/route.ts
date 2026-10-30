import { NextRequest } from "next/server";
import { revokeSession, SESSION_COOKIE_NAME } from "@/server/auth/session";
import { jsonOk } from "@/server/http/response";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    await revokeSession(token);
  }

  const response = jsonOk({ success: true, message: "Logged out successfully" });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}

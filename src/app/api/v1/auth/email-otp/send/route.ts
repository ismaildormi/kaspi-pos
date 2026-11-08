import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/server/db/prisma";
import { sendKaspiEmail } from "@/lib/email/mailer";
import { jsonError, jsonOk } from "@/server/http/response";

const SendOtpSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح").transform((v) => v.toLowerCase().trim()),
  purpose: z.enum(["login", "reset"]).default("login"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SendOtpSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError("VALIDATION_ERROR", parsed.error.issues[0]?.message || "بيانات غير صالحة", 400);
    }

    const { email, purpose } = parsed.data;

    // Check user existence
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (purpose === "reset" && !user) {
      return jsonError("USER_NOT_FOUND", "لا يوجد حساب مسجل بهذا البريد الإلكتروني. يرجى التأكد من البريد أو إنشاء حساب جديد.", 404);
    }

    // Generate secure 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const identifier = `${purpose}:${email}`;

    // Clean up any existing tokens for this purpose & email
    await prisma.verificationToken.deleteMany({
      where: { identifier },
    });

    // Store new token (10 minutes validity)
    const expires = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.verificationToken.create({
      data: {
        identifier,
        token: code,
        expires,
      },
    });

    // Dispatch email with native OTP subject format so Gmail renders "Copy code" chip
    const subject =
      purpose === "reset"
        ? `رمز إعادة تعيين كلمة المرور KASPI POS: ${code} • Reset code: ${code}`
        : `رمز التحقق KASPI POS: ${code} • Your verification code is ${code}`;

    const sendResult = await sendKaspiEmail({
      to: email,
      subject,
      code,
      type: purpose === "reset" ? "password_reset" : "login_otp",
    });

    if (!sendResult.success) {
      return jsonError(
        "EMAIL_DELIVERY_FAILED",
        `تعذر إرسال رمز التحقق إلى ${email} عبر خادم Gmail SMTP (${sendResult.error || "خطأ في الاتصال"}). يرجى التحقق من البريد والمحاولة مجدداً.`,
        502
      );
    }

    return jsonOk({
      message: `تم إرسال رمز التحقق إلى ${email}`,
      messageId: sendResult.messageId,
      smtpResponse: sendResult.response,
      devCode: process.env.NODE_ENV !== "production" ? code : undefined,
    });
  } catch (err: unknown) {
    console.error("[Email OTP Send Error]:", err);
    return jsonError("INTERNAL_ERROR", "حدث خطأ أثناء إرسال البريد الإلكتروني. يرجى المحاولة لاحقاً.", 500);
  }
}

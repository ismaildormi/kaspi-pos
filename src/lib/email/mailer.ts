import nodemailer, { type Transporter } from "nodemailer";
import { renderVerificationEmailHtml } from "./verification-email";
import { renderWelcomeEmailHtml } from "./welcome-email";
import { createHandoffToken } from "@/server/auth/handoff";
import {
  WELCOME_COPY,
  WelcomeEmailData,
  WelcomeLang,
  formatWelcomeDate,
  normalizeWelcomeLang,
  resolveStoreCategory,
} from "./welcome-copy";

export interface SendEmailOptions {
  to: string;
  subject: string;
  code?: string;
  magicLink?: string;
  type: "login_otp" | "password_reset" | "login_alert" | "broadcast";
  title?: string;
  message?: string;
  version?: string;
  ip?: string;
  userAgent?: string;
  time?: string;
}

const OFFICIAL_GMAIL_USER = "kaspipos.official@gmail.com";
const OFFICIAL_GMAIL_APP_PASSWORD = "lmft boxo ytls gtbk";
const OFFICIAL_SMTP_HOST = "smtp.gmail.com";
const OFFICIAL_SMTP_PORT = 465;

let transporter: Transporter | null = null;

function createSmtpTransporter(portOverride?: number): Transporter {
  const gmailUser = (process.env.GMAIL_USER || OFFICIAL_GMAIL_USER).trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD || OFFICIAL_GMAIL_APP_PASSWORD;
  const gmailPass = rawPass.replace(/\s+/g, "");
  const host = (process.env.SMTP_HOST || OFFICIAL_SMTP_HOST).trim();
  const port = portOverride ?? Number(process.env.SMTP_PORT || OFFICIAL_SMTP_PORT);
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host,
    port,
    secure: isSecure,
    requireTLS: !isSecure,
    auth: {
      user: gmailUser,
      pass: gmailPass,
    },
    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = createSmtpTransporter();
  }
  return transporter;
}

export function generatePlainTextEmail(options: SendEmailOptions): string {
  if (options.code) {
    const isReset = options.type === "password_reset";
    return [
      `Your KASPI POS verification code is ${options.code}`,
      `Votre code de vérification KASPI POS est : ${options.code}`,
      isReset
        ? `رمز إعادة تعيين كلمة المرور لحسابك في نظام KASPI POS هو: ${options.code}`
        : `رمز التحقق السري لتسجيل الدخول إلى نظام KASPI POS هو: ${options.code}`,
      "",
      `Verification Code: ${options.code}`,
      "This code is valid for 10 minutes. Do not share this code with anyone.",
      "هذا الرمز صالح لمدة 10 دقائق فقط. انسخ الرمز والصقه في تطبيق KASPI POS.",
    ].join("\n");
  }

  if (options.type === "login_alert") {
    return `KASPI POS Security Alert — تنبيه أمني: تم تسجيل الدخول إلى حسابك بتوقيت ${
      options.time || new Date().toISOString()
    }.`;
  }

  return `${options.title || "KASPI POS"}\n\n${options.message || ""}`;
}

export function generateArabicEmailHtml(options: SendEmailOptions): string {
  if (options.code) {
    return renderVerificationEmailHtml({
      code: options.code,
      lang: "ar",
      purpose: options.type === "password_reset" ? "reset" : "login",
    });
  }

  const isAlert = options.type === "login_alert";
  const titleAr = isAlert
    ? "تنبيه أمني — تسجيل دخول جديد"
    : options.title || "تحديث هام من منصة KASPI POS";
  const descAr = isAlert
    ? "تم تسجيل الدخول بنجاح إلى حسابك في منصة KASPI POS."
    : options.message || "إليك آخر التحديثات والتحسينات المتاحة على نظامك.";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleAr}</title>
</head>
<body dir="rtl" style="margin: 0; padding: 28px 14px; background-color: #f4f4f5; color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Roboto, Helvetica, Arial, sans-serif; direction: rtl;">
  <table role="presentation" dir="rtl" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 460px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.08);">
    <tr>
      <td align="center" style="padding: 32px 26px 28px 26px;">
        <table role="presentation" align="center" border="0" cellpadding="0" cellspacing="0" dir="ltr" style="margin:0 auto 10px auto;">
          <tr>
            <td style="font-size:28px;font-weight:900;letter-spacing:-0.8px;color:#09090b;line-height:1;padding-right:8px;">KASPI</td>
            <td style="background-color:#09090b;border-radius:8px;padding:5px 10px;font-size:22px;font-weight:900;letter-spacing:-0.4px;color:#ffffff;line-height:1;">POS</td>
          </tr>
        </table>
        <div dir="rtl" style="font-size: 13px; font-weight: 700; color: #52525b; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #e4e4e7; text-align: center;">
          نظام إدارة نقاط البيع والمتاجر
        </div>
        <div dir="rtl" style="font-size: 22px; font-weight: 900; color: #09090b; margin-bottom: 8px; text-align: center;">
          ${titleAr}
        </div>
        <div dir="rtl" style="font-size: 14px; line-height: 1.7; color: #52525b; margin-bottom: 16px; text-align: center;">
          ${descAr}
        </div>
        ${
          isAlert
            ? `
        <div dir="rtl" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin: 16px 0; text-align: right; font-size: 12px; color: #27272a; line-height: 1.8;">
          <div><strong>التوقيت:</strong> <span dir="ltr">${options.time || new Date().toLocaleString("ar-MA", { timeZone: "Africa/Casablanca" })}</span></div>
          ${options.ip ? `<div><strong>عنوان IP:</strong> <code dir="ltr" style="color:#09090b;">${options.ip}</code></div>` : ""}
          ${options.userAgent ? `<div><strong>الجهاز والمتصفح:</strong> <span dir="ltr">${options.userAgent}</span></div>` : ""}
        </div>
        `
            : ""
        }
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendKaspiEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; messageId?: string; response?: string; error?: string }> {
  const html = generateArabicEmailHtml(options);
  const text = generatePlainTextEmail(options);

  // Official sender address: "KASPI POS <kaspipos.official@gmail.com>"
  const gmailSender = (process.env.GMAIL_USER || OFFICIAL_GMAIL_USER).trim();
  const from = `"KASPI POS" <${gmailSender}>`;

  const entityRefId = `kaspi-tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const emailSubject = options.code
    ? `${options.code} • ${options.subject}`
    : options.subject;

  const transactionalHeaders = {
    "X-Entity-Ref-ID": entityRefId,
    "X-Priority": "1",
    "Importance": "high",
    "Priority": "urgent",
    "X-Mailer": "KASPI POS Dispatcher",
  };

  console.log("\n==================================================================");
  console.log(`[KASPI MAIL] Sending ${options.type} email to: ${options.to}`);
  console.log(`[KASPI MAIL] From: ${from}`);
  console.log(`[KASPI MAIL] Subject: ${emailSubject}`);
  if (options.code) {
    console.log(`[KASPI MAIL] >>> VERIFICATION CODE: ${options.code} <<<`);
  }
  console.log("==================================================================\n");

  const primaryMailer = getTransporter();

  try {
    const info = await primaryMailer.sendMail({
      from,
      to: options.to,
      subject: emailSubject,
      text,
      html,
      headers: transactionalHeaders,
    });
    console.log(`[KASPI Mailer] Email sent via SSL/TLS (465) to ${options.to} | MessageID: ${info.messageId} | Response: ${info.response}`);
    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (primaryErr: any) {
    console.warn(`[KASPI Mailer] Port 465 attempt failed (${primaryErr?.message}), retrying via STARTTLS Port 587...`);
    try {
      const fallbackMailer = createSmtpTransporter(587);
      const info587 = await fallbackMailer.sendMail({
        from,
        to: options.to,
        subject: emailSubject,
        text,
        html,
        headers: transactionalHeaders,
      });
      transporter = fallbackMailer;
      console.log(`[KASPI Mailer] Email sent via STARTTLS (587) to ${options.to} | MessageID: ${info587.messageId} | Response: ${info587.response}`);
      return {
        success: true,
        messageId: info587.messageId,
        response: info587.response,
      };
    } catch (secondaryErr: any) {
      const errMsg = secondaryErr?.message || primaryErr?.message || "SMTP Connection Error";
      console.error("[KASPI Mailer] Fatal SMTP delivery failure on both ports 465 and 587:", errMsg);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}

/**
 * Send security alert email upon successful login
 */
export async function sendLoginAlertEmail(params: {
  to: string;
  ip?: string;
  userAgent?: string;
  time?: string;
}): Promise<{ success: boolean; messageId?: string; response?: string; error?: string }> {
  return sendKaspiEmail({
    to: params.to,
    subject: "KASPI POS — تنبيه أمني: تسجيل دخول جديد إلى حسابك",
    type: "login_alert",
    ip: params.ip,
    userAgent: params.userAgent,
    time: params.time || new Date().toLocaleString("ar-MA", { timeZone: "Africa/Casablanca" }),
  });
}

/**
 * Send platform broadcast announcement email to merchants / users
 */
export async function sendBroadcastEmail(params: {
  to: string;
  title: string;
  message: string;
  version?: string;
}): Promise<{ success: boolean; messageId?: string; response?: string; error?: string }> {
  return sendKaspiEmail({
    to: params.to,
    subject: `KASPI POS: ${params.title}`,
    type: "broadcast",
    title: params.title,
    message: params.message,
    version: params.version,
  });
}

/**
 * Send enterprise Welcome & Successful Sign-In Email upon registration or first-time login
 */
export async function sendWelcomeEmail(params: {
  to: string;
  userName?: string;
  storeName?: string;
  storeCategory?: string;
  loginDate?: string;
  lang?: WelcomeLang;
  userId?: string;
  activeTenantId?: string | null;
  handoffToken?: string;
}): Promise<{ success: boolean; messageId?: string; response?: string; error?: string }> {
  const lang = normalizeWelcomeLang(params.lang);
  const copy = WELCOME_COPY[lang];

  let handoffToken = params.handoffToken;
  if (!handoffToken && params.userId) {
    try {
      handoffToken = await createHandoffToken({
        userId: params.userId,
        email: params.to,
        activeTenantId: params.activeTenantId,
      });
    } catch (e: any) {
      console.warn("[Welcome Email Handoff Token Generation Warning]:", e?.message || e);
    }
  }

  const welcomeData: WelcomeEmailData = {
    userName: params.userName,
    storeName: params.storeName,
    storeCategory: params.storeCategory,
    userEmail: params.to,
    loginDate: params.loginDate || new Date().toISOString(),
    handoffToken,
  };

  const html = renderWelcomeEmailHtml(welcomeData, lang);
  const resolvedCategory = resolveStoreCategory(params.storeCategory, lang);
  const formattedDate = formatWelcomeDate(welcomeData.loginDate, lang);
  const resolvedOwner = params.userName || params.to.split("@")[0] || "Merchant";
  const launcherUrl = `https://kaspi-pos.vercel.app/launch-desktop?token=${encodeURIComponent(
    handoffToken || ""
  )}&lang=${lang}&target=/${lang}/dashboard`;

  const text = [
    copy.heroHeading(resolvedOwner),
    copy.heroDescription,
    "",
    `[${copy.storePass.statusBadge}]`,
    `${copy.storePass.ownerLabel}: ${resolvedOwner}`,
    `${copy.storePass.categoryLabel}: ${resolvedCategory}`,
    `${copy.storePass.dateLabel}: ${formattedDate}`,
    "",
    copy.onboarding.sectionTitle,
    ...copy.onboarding.steps.map((s, i) => `0${i + 1}. ${s}`),
    "",
    `KASPI POS Desktop Launcher: ${launcherUrl}`,
    "",
    copy.footerNote,
  ].join("\n");

  const gmailSender = (process.env.GMAIL_USER || OFFICIAL_GMAIL_USER).trim();
  const from = `"KASPI POS" <${gmailSender}>`;

  const entityRefId = `kaspi-welcome-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const transactionalHeaders = {
    "X-Entity-Ref-ID": entityRefId,
    "X-Priority": "1",
    "Importance": "high",
    "Priority": "urgent",
    "X-Mailer": "KASPI POS Dispatcher",
  };

  console.log(`[KASPI MAIL] Sending Welcome Email to: ${params.to} (${resolvedOwner} - ${welcomeData.storeName})`);

  const primaryMailer = getTransporter();
  try {
    const info = await primaryMailer.sendMail({
      from,
      to: params.to,
      subject: copy.subject,
      text,
      html,
      headers: transactionalHeaders,
    });
    console.log(`[KASPI Mailer] Welcome email delivered via SSL/TLS (465) to ${params.to} | MessageID: ${info.messageId}`);
    return { success: true, messageId: info.messageId, response: info.response };
  } catch (primaryErr: any) {
    console.warn(`[KASPI Mailer] Welcome email port 465 failed (${primaryErr?.message}), retrying via STARTTLS 587...`);
    try {
      const fallbackMailer = createSmtpTransporter(587);
      const info587 = await fallbackMailer.sendMail({
        from,
        to: params.to,
        subject: copy.subject,
        text,
        html,
        headers: transactionalHeaders,
      });
      console.log(`[KASPI Mailer] Welcome email delivered via STARTTLS (587) to ${params.to} | MessageID: ${info587.messageId}`);
      return { success: true, messageId: info587.messageId, response: info587.response };
    } catch (secondaryErr: any) {
      const errMsg = secondaryErr?.message || primaryErr?.message || "SMTP Delivery Failure";
      console.error("[KASPI Mailer] Fatal Welcome email delivery failure:", errMsg);
      return { success: false, error: errMsg };
    }
  }
}

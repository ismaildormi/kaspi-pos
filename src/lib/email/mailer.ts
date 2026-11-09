import nodemailer, { type Transporter } from "nodemailer";

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
  const isReset = options.type === "password_reset";
  const isAlert = options.type === "login_alert";
  const isBroadcast = options.type === "broadcast";

  let titleAr = "تسجيل الدخول إلى حسابك";
  let descAr = "استخدم رمز التحقق السري أثناء تسجيل الدخول بأمان إلى النظام.";

  if (isReset) {
    titleAr = "استعادة كلمة المرور";
    descAr = "استخدم رمز التحقق السري أدناه لإعادة تعيين كلمة المرور لحسابك بأمان.";
  } else if (isAlert) {
    titleAr = "تنبيه أمني — تسجيل دخول جديد";
    descAr = "تم تسجيل الدخول بنجاح إلى حسابك في منصة KASPI POS.";
  } else if (isBroadcast) {
    titleAr = options.title || "تحديث هام من منصة KASPI POS";
    descAr = options.message || "إليك آخر التحديثات والتحسينات المتاحة على نظامك.";
  }

  const digits = options.code ? String(options.code).trim().split("") : [];

  const jsonLdSchema = options.code
    ? `<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "EmailMessage",
  "description": "Your KASPI POS verification code is ${options.code}"
}
</script>`
    : "";

  const digitCellsHtml =
    digits.length > 0
      ? `
      <!-- 6 Distinct Digit Boxes (LTR) -->
      <table role="presentation" dir="ltr" align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 22px auto 22px auto; direction: ltr;">
        <tr>
          ${digits
            .map(
              (digit) => `
            <td style="padding: 0 4px;">
              <div style="width: 46px; height: 56px; line-height: 56px; text-align: center; background-color: #ffffff; border: 1.5px solid #a1a1aa; border-radius: 14px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 28px; font-weight: 900; color: #09090b;">
                ${digit}
              </div>
            </td>`
            )
            .join("")}
        </tr>
      </table>

      <!-- Prominent Black Pill Copy-Code Box (No Login Redirect Link) -->
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 8px 0 24px 0;">
        <tr>
          <td align="center">
            <div style="background-color: #09090b; color: #ffffff; border-radius: 9999px; padding: 12px 34px; display: inline-block; min-width: 210px; box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);">
              <span style="font-size: 15px; font-weight: 800; color: #ffffff; vertical-align: middle;">📋 نسخ الرمز : </span>
              <span dir="ltr" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 18px; font-weight: 900; letter-spacing: 3px; color: #ffffff; user-select: all; -webkit-user-select: all; -moz-user-select: all; cursor: pointer; vertical-align: middle; padding: 2px 6px; background-color: #18181b; border-radius: 6px;">${options.code}</span>
            </div>
          </td>
        </tr>
      </table>
      `
      : "";

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titleAr}</title>
  ${jsonLdSchema}
</head>
<body dir="rtl" style="margin: 0; padding: 28px 14px; background-color: #f4f4f5; color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Roboto, Helvetica, Arial, sans-serif; direction: rtl;">
  ${
    options.code
      ? `<div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Your KASPI POS verification code is ${options.code} • رمز التحقق الخاص بك هو ${options.code}</div>`
      : ""
  }
  <table role="presentation" dir="rtl" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 460px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 28px; overflow: hidden; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.08);">
    <tr>
      <td align="center" style="padding: 32px 26px 28px 26px;">
        <!-- Top Brand Header: KASPI [POS] -->
        <div dir="ltr" style="text-align: center; margin-bottom: 10px;">
          <span style="font-size: 26px; font-weight: 900; color: #09090b; letter-spacing: -0.5px; vertical-align: middle;">🛒 KASPI </span>
          <span style="display: inline-block; background-color: #09090b; color: #ffffff; font-size: 24px; font-weight: 900; padding: 2px 10px; border-radius: 10px; vertical-align: middle;">POS</span>
        </div>

        <!-- Subtitle Badge -->
        <div dir="rtl" style="font-size: 13px; font-weight: 700; color: #18181b; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid #e4e4e7; text-align: center;">
          نظام إدارة نقاط البيع والمتاجر
        </div>

        <!-- Security Padlock Badge Inside Dashed Circular Ring -->
        <div style="width: 58px; height: 58px; line-height: 58px; margin: 0 auto 18px auto; border: 1.5px dashed #d4d4d8; border-radius: 9999px; background-color: #fafafa; text-align: center; font-size: 26px;">
          🔒
        </div>

        <!-- Main Heading & Copy -->
        <div dir="rtl" style="font-size: 24px; font-weight: 900; color: #09090b; margin-bottom: 8px; text-align: center;">
          ${titleAr}
        </div>
        <div dir="rtl" style="font-size: 13px; line-height: 1.7; color: #52525b; margin-bottom: 12px; text-align: center;">
          ${descAr}
        </div>

        ${digitCellsHtml}

        ${
          isAlert
            ? `
        <div dir="rtl" style="background-color: #fafafa; border: 1px solid #e4e4e7; border-radius: 14px; padding: 14px; margin: 16px 0; text-align: right; font-size: 12px; color: #27272a; line-height: 1.8;">
          <div><strong>التوقيت:</strong> <span dir="ltr">${options.time || new Date().toLocaleString("ar-MA", { timeZone: "Africa/Casablanca" })}</span></div>
          ${options.ip ? `<div><strong>عنوان IP:</strong> <code dir="ltr" style="color:#09090b;">${options.ip}</code></div>` : ""}
          ${options.userAgent ? `<div><strong>الجهاز والمتصفح:</strong> <span dir="ltr">${options.userAgent}</span></div>` : ""}
        </div>
        `
            : ""
        }

        <!-- Bottom Language Pills Row -->
        <div dir="rtl" style="margin-top: 10px; padding-top: 14px; border-top: 1px solid #f4f4f5; text-align: center;">
          <span style="display: inline-block; background-color: #09090b; color: #ffffff; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 9999px; margin: 0 3px;">✓ العربية</span>
          <span dir="ltr" style="display: inline-block; background-color: #ffffff; color: #18181b; border: 1px solid #d4d4d8; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 9999px; margin: 0 3px;">🇫🇷 Français</span>
          <span dir="ltr" style="display: inline-block; background-color: #ffffff; color: #18181b; border: 1px solid #d4d4d8; font-size: 11px; font-weight: 600; padding: 5px 12px; border-radius: 9999px; margin: 0 3px;">🇬🇧 English</span>
        </div>
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
  const from = process.env.SMTP_FROM || `KASPI POS <${gmailSender}>`;

  console.log("\n==================================================================");
  console.log(`[KASPI MAIL] Sending ${options.type} email to: ${options.to}`);
  console.log(`[KASPI MAIL] From: ${from}`);
  console.log(`[KASPI MAIL] Subject: ${options.subject}`);
  if (options.code) {
    console.log(`[KASPI MAIL] >>> VERIFICATION CODE: ${options.code} <<<`);
  }
  console.log("==================================================================\n");

  const primaryMailer = getTransporter();

  try {
    const info = await primaryMailer.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text,
      html,
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
        subject: options.subject,
        text,
        html,
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
    subject: "🔔 KASPI POS — تنبيه أمني: تسجيل دخول جديد إلى حسابك",
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
    subject: `📢 KASPI POS: ${params.title}`,
    type: "broadcast",
    title: params.title,
    message: params.message,
    version: params.version,
  });
}

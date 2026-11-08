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

  let titleAr = "رمز التحقق لتسجيل الدخول";
  let titleFr = "Code de vérification de connexion";
  let descAr =
    "استخدم رمز التحقق السري المكون من 6 أرقام أدناه لتسجيل الدخول بأمان إلى تطبيق أو لوحة تحكم KASPI POS دون الحاجة إلى كلمة المرور.";
  let descFr =
    "Copiez ce code à 6 chiffres et collez-le (Ctrl+V) dans votre application KASPI POS.";

  if (isReset) {
    titleAr = "رمز استعادة وتعيين كلمة المرور";
    titleFr = "Code de réinitialisation du mot de passe";
    descAr =
      "لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة KASPI POS. انسخ الرمز المكون من 6 أرقام أدناه وأدخله لإتمام العملية بأمان.";
    descFr =
      "Utilisez ce code de sécurité à 6 chiffres pour définir votre nouveau mot de passe.";
  } else if (isAlert) {
    titleAr = "تنبيه أمني — تسجيل دخول جديد";
    titleFr = "Alerte de sécurité — Nouvelle connexion";
    descAr = "تم تسجيل الدخول بنجاح إلى حسابك في منصة KASPI POS.";
    descFr = "Une nouvelle connexion a été détectée sur votre compte KASPI POS.";
  } else if (isBroadcast) {
    titleAr = options.title || "تحديث هام من منصة KASPI POS";
    titleFr = "Annonce Officielle KASPI POS";
    descAr = options.message || "إليك آخر التحديثات والتحسينات المتاحة على نظامك.";
    descFr = "";
  }

  const digits = options.code ? String(options.code).trim().split("") : [];

  const jsonLdSchema = options.code
    ? `<script type="application/ld+json">
{
  "@context": "http://schema.org",
  "@type": "EmailMessage",
  "description": "Your KASPI POS verification code is ${options.code}",
  "potentialAction": {
    "@type": "ViewAction",
    "name": "Copy code ${options.code}",
    "target": "https://kaspi-pos.vercel.app"
  }
}
</script>`
    : "";

  const digitCellsHtml =
    digits.length > 0
      ? `
      <!-- Individual LTR Digit Cells -->
      <table role="presentation" dir="ltr" align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 24px auto 18px auto; direction: ltr;">
        <tr>
          ${digits
            .map(
              (digit) => `
            <td style="padding: 0 4px;">
              <div style="width: 44px; height: 54px; line-height: 54px; text-align: center; background-color: #09090b; border: 1px solid #3f3f46; border-radius: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 26px; font-weight: 900; color: #ffffff;">
                ${digit}
              </div>
            </td>`
            )
            .join("")}
        </tr>
      </table>

      <!-- Pure White Copy-Code Box (Single-Click Select All for Desktop App Ctrl+C / Ctrl+V) -->
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 16px 0 20px 0;">
        <tr>
          <td align="center">
            <div style="background-color: #ffffff; color: #09090b; border-radius: 14px; padding: 14px 24px; display: inline-block; min-width: 260px; box-shadow: 0 10px 25px rgba(255, 255, 255, 0.08); border: 2px solid #e4e4e7;">
              <div dir="rtl" style="font-size: 11px; font-weight: 700; color: #52525b; margin-bottom: 4px; direction: rtl; unicode-bidi: embed; text-align: center;">
                📋 انقر لتحديد الرمز ونسخه فوراً (Ctrl+C)
              </div>
              <div dir="ltr" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 28px; font-weight: 900; letter-spacing: 6px; color: #09090b; user-select: all; -webkit-user-select: all; -moz-user-select: all; cursor: pointer; padding: 4px 10px; background-color: #f4f4f5; border-radius: 8px; direction: ltr; text-align: center;">${options.code}</div>
              <div dir="ltr" style="font-size: 11px; font-weight: 600; color: #71717a; margin-top: 4px; direction: ltr; text-align: center;">
                Click code above to select &amp; copy • Coller avec Ctrl+V
              </div>
            </div>
          </td>
        </tr>
      </table>

      <div dir="rtl" style="font-size: 12px; color: #a1a1aa; margin-top: 10px; direction: rtl; unicode-bidi: embed; text-align: center;">
        ⏱️ صلاحية هذا الرمز 10 دقائق فقط — لا تشاركه مع أي شخص لحماية حسابك.
      </div>
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
<body dir="rtl" style="margin: 0; padding: 28px 16px; background-color: #09090b; color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Tahoma, Roboto, Helvetica, Arial, sans-serif; direction: rtl;">
  ${
    options.code
      ? `<div style="display:none;font-size:1px;color:#09090b;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">Your KASPI POS verification code is ${options.code} • رمز التحقق الخاص بك هو ${options.code}</div>`
      : ""
  }
  <table role="presentation" dir="rtl" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 540px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 22px; overflow: hidden; box-shadow: 0 25px 40px -10px rgba(0, 0, 0, 0.7);">
    <!-- Top Brand Header -->
    <tr>
      <td align="center" style="padding: 32px 28px 20px 28px; border-bottom: 1px solid #27272a; background-color: #121215;">
        <img src="https://kaspi-pos.vercel.app/logo.png" alt="KASPI POS" width="52" height="52" style="width: 52px; height: 52px; display: block; margin: 0 auto 12px auto; border-radius: 12px;" />
        <div dir="ltr" style="font-size: 22px; font-weight: 900; color: #ffffff; letter-spacing: 0.5px;">KASPI POS • كسب</div>
        <div dir="rtl" style="display: inline-block; background-color: #27272a; color: #d4d4d8; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-top: 8px; direction: rtl; unicode-bidi: embed;">
          ${options.version ? `الإصدار ${options.version}` : "نظام نقاط البيع السحابي والمكتبي المتكامل"}
        </div>
      </td>
    </tr>

    <!-- Main Body Content -->
    <tr>
      <td style="padding: 30px 28px;">
        <div dir="rtl" style="font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 4px; text-align: right; direction: rtl; unicode-bidi: embed;">
          ${titleAr}
        </div>
        ${
          titleFr
            ? `<div dir="ltr" style="font-size: 12px; font-weight: 600; color: #71717a; margin-bottom: 16px; text-align: right; direction: ltr;">${titleFr}</div>`
            : ""
        }

        <div dir="rtl" style="font-size: 14px; line-height: 1.8; color: #d4d4d8; margin-bottom: 10px; text-align: right; direction: rtl; unicode-bidi: embed; white-space: pre-line;">
          ${descAr}
        </div>
        ${
          descFr
            ? `<div dir="ltr" style="font-size: 12px; line-height: 1.6; color: #a1a1aa; margin-bottom: 20px; text-align: left; direction: ltr; background-color: #09090b; border: 1px solid #27272a; border-radius: 10px; padding: 10px 14px;">${descFr}</div>`
            : ""
        }

        ${digitCellsHtml}

        ${
          isAlert
            ? `
        <div dir="rtl" style="background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: right; font-size: 13px; color: #d4d4d8; line-height: 1.9; direction: rtl; unicode-bidi: embed;">
          <div><strong>التوقيت:</strong> <span dir="ltr">${options.time || new Date().toLocaleString("ar-MA", { timeZone: "Africa/Casablanca" })}</span></div>
          ${options.ip ? `<div><strong>عنوان IP:</strong> <code dir="ltr" style="color:#ffffff;">${options.ip}</code></div>` : ""}
          ${options.userAgent ? `<div><strong>الجهاز والمتصفح:</strong> <span dir="ltr">${options.userAgent}</span></div>` : ""}
        </div>
        <p dir="rtl" style="font-size: 12px; color: #ef4444; margin-top: 12px; text-align: right; direction: rtl; unicode-bidi: embed;">إذا لم تكن أنت من قام بتسجيل الدخول، يرجى تغيير كلمة المرور فوراً من خلال شاشة الدخول.</p>
        `
            : ""
        }
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td align="center" style="padding: 20px 28px 26px 28px; border-top: 1px solid #27272a; background-color: #121215;">
        <div dir="rtl" style="font-size: 12px; color: #71717a; line-height: 1.7; direction: rtl; unicode-bidi: embed; text-align: center;">
          هذه الرسالة مرسلة تلقائياً من خادم الأمان المشفر لمنصة <strong>KASPI POS</strong>.
        </div>
        <div dir="ltr" style="font-size: 11px; color: #52525b; margin-top: 6px; direction: ltr; text-align: center;">
          © ${new Date().getFullYear()} KASPI POS (ZUVYR). Morocco &amp; Global Retail Cloud.
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

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

let transporter: Transporter | null = null;

function createSmtpTransporter(portOverride?: number): Transporter {
  const gmailUser = (process.env.GMAIL_USER || process.env.SMTP_USER || "kaspipos.official@gmail.com").trim();
  const rawPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || "lmft boxo ytls gtbk";
  const gmailPass = rawPass.replace(/\s+/g, "");
  const host = (process.env.SMTP_HOST || (gmailUser.endsWith("@gmail.com") ? "smtp.gmail.com" : "smtp.gmail.com")).trim();
  const port = portOverride ?? Number(process.env.SMTP_PORT || "465");
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

export function generateArabicEmailHtml(options: SendEmailOptions): string {
  const isReset = options.type === "password_reset";
  const isAlert = options.type === "login_alert";
  const isBroadcast = options.type === "broadcast";

  let title = "تسجيل الدخول إلى حسابك";
  let desc = "استخدم رمز التحقق السري أدناه لتسجيل الدخول بأمان إلى نظام KASPI POS دون الحاجة لكلمة المرور:";

  if (isReset) {
    title = "إعادة تعيين كلمة المرور والرمز";
    desc = "لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في منصة KASPI POS. استخدم الرمز أدناه لإتمام العملية:";
  } else if (isAlert) {
    title = "تنبيه أمني: تسجيل دخول جديد";
    desc = "تم تسجيل الدخول بنجاح إلى حسابك في منصة KASPI POS.";
  } else if (isBroadcast) {
    title = options.title || "تحديث هام من منصة KASPI POS";
    desc = options.message || "إليك آخر التحديثات والتحسينات المتاحة على نظامك.";
  }

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #f4f4f5; margin: 0; padding: 24px; direction: rtl; }
    .container { max-width: 540px; margin: 0 auto; background-color: #18181b; border: 1px solid #27272a; border-radius: 20px; padding: 36px 32px; box-shadow: 0 25px 30px -5px rgba(0, 0, 0, 0.6); }
    .header { text-align: center; margin-bottom: 24px; }
    .logo-img { width: 56px; height: 56px; margin: 0 auto 12px auto; display: block; border-radius: 12px; }
    .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px; }
    .badge { display: inline-block; background-color: #27272a; color: #a1a1aa; font-size: 11px; font-weight: 600; padding: 4px 12px; border-radius: 9999px; margin-top: 6px; }
    .content { text-align: center; margin: 28px 0; }
    .title { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
    .desc { font-size: 14px; line-height: 1.7; color: #a1a1aa; margin-bottom: 24px; white-space: pre-line; }
    .code-box { background-color: #09090b; border: 2px dashed #3f3f46; border-radius: 14px; padding: 22px; display: inline-block; margin-bottom: 24px; min-width: 220px; }
    .code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #ffffff; margin: 0; }
    .details-box { background-color: #09090b; border: 1px solid #27272a; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: right; font-size: 13px; color: #a1a1aa; line-height: 1.8; }
    .btn { display: inline-block; background-color: #ffffff; color: #000000 !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 28px; border-radius: 12px; margin-top: 10px; transition: background-color 0.2s; }
    .btn:hover { background-color: #e4e4e7; }
    .footer { text-align: center; border-top: 1px solid #27272a; margin-top: 36px; padding-top: 24px; font-size: 12px; color: #71717a; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://kaspi-pos.vercel.app/logo.png" alt="KASPI POS" class="logo-img" />
      <div class="logo">KASPI POS • كسب</div>
      <div class="badge">${options.version ? `الإصدار ${options.version}` : "نظام إدارة نقاط البيع والمتاجر المتكامل"}</div>
    </div>
    <div class="content">
      <div class="title">${title}</div>
      <div class="desc">${desc}</div>

      ${
        options.code
          ? `
      <div class="code-box">
        <div class="code">${options.code}</div>
      </div>
      <p style="font-size: 12px; color: #71717a; margin-bottom: 20px;">⏱️ هذا الرمز صالح لمدة 10 دقائق فقط. لا تشاركه مع أي شخص لحماية حسابك.</p>
      `
          : ""
      }

      ${
        isAlert
          ? `
      <div class="details-box">
        <div><strong>التوقيت:</strong> ${options.time || new Date().toLocaleString("ar-MA", { timeZone: "Africa/Casablanca" })}</div>
        ${options.ip ? `<div><strong>عنوان IP:</strong> <code style="color:#ffffff;">${options.ip}</code></div>` : ""}
        ${options.userAgent ? `<div><strong>الجهاز والمتصفح:</strong> ${options.userAgent}</div>` : ""}
      </div>
      <p style="font-size: 12px; color: #ef4444; margin-top: 12px;">إذا لم تكن أنت من قام بتسجيل الدخول، يرجى تغيير كلمة المرور فوراً من خلال صفحة الدخول.</p>
      `
          : ""
      }

      ${
        options.magicLink
          ? `<div><a href="${options.magicLink}" class="btn" target="_blank">🔗 اضغط هنا للدخول المباشر بنقرة واحدة</a></div>`
          : ""
      }
    </div>
    <div class="footer">
      <p>هذه الرسالة مرسلة تلقائياً من خادم KASPI POS السحابي المشفر.</p>
      <p>© ${new Date().getFullYear()} KASPI POS. جميع الحقوق محفوظة للمملكة المغربية والعالم.</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function sendKaspiEmail(
  options: SendEmailOptions
): Promise<{ success: boolean; simulated?: boolean; messageId?: string; response?: string; error?: string }> {
  const html = generateArabicEmailHtml(options);

  // Official sender address: "KASPI POS <kaspipos.official@gmail.com>"
  const gmailSender = (process.env.GMAIL_USER || process.env.SMTP_USER || "kaspipos.official@gmail.com").trim();
  const from = process.env.SMTP_FROM || `KASPI POS <${gmailSender}>`;

  console.log("\n==================================================================");
  console.log(`[KASPI MAIL] Sending ${options.type} email to: ${options.to}`);
  console.log(`[KASPI MAIL] From: ${from}`);
  console.log(`[KASPI MAIL] Subject: ${options.subject}`);
  if (options.code) {
    console.log(`[KASPI MAIL] >>> VERIFICATION CODE: ${options.code} <<<`);
  }
  if (options.magicLink) {
    console.log(`[KASPI MAIL] >>> MAGIC LINK: ${options.magicLink} <<<`);
  }
  console.log("==================================================================\n");

  const primaryMailer = getTransporter();

  try {
    const info = await primaryMailer.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      html,
    });
    console.log(`[KASPI Mailer] Email sent via SSL/TLS (465) to ${options.to} | MessageID: ${info.messageId} | Response: ${info.response}`);
    return {
      success: true,
      simulated: false,
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
        html,
      });
      transporter = fallbackMailer;
      console.log(`[KASPI Mailer] Email sent via STARTTLS (587) to ${options.to} | MessageID: ${info587.messageId} | Response: ${info587.response}`);
      return {
        success: true,
        simulated: false,
        messageId: info587.messageId,
        response: info587.response,
      };
    } catch (secondaryErr: any) {
      const errMsg = secondaryErr?.message || primaryErr?.message || "SMTP Connection Error";
      console.error("[KASPI Mailer] Fatal SMTP delivery failure on both ports 465 and 587:", errMsg);
      return {
        success: false,
        simulated: false,
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
}): Promise<{ success: boolean; simulated?: boolean }> {
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
}): Promise<{ success: boolean; simulated?: boolean }> {
  return sendKaspiEmail({
    to: params.to,
    subject: `📢 KASPI POS: ${params.title}`,
    type: "broadcast",
    title: params.title,
    message: params.message,
    version: params.version,
  });
}

import { getAppBaseUrl, escapeHtml } from "./welcome-email";

export type SubscriptionEmailLang = "ar" | "fr" | "en";

export interface SubscriptionEmailData {
  userName: string;
  userEmail: string;
  storeName: string;
  planName: string;
  amountMAD: number;
  paymentMethod: string;
  licenseKey?: string;
  periodEnd?: string;
  lang?: SubscriptionEmailLang;
}

export function renderSubscriptionEmailHtml(data: SubscriptionEmailData): string {
  const lang = data.lang || "fr";
  const baseUrl = getAppBaseUrl();
  const isAr = lang === "ar";
  const isEn = lang === "en";

  const safeName = escapeHtml(data.userName || "Commerçant");
  const safeStore = escapeHtml(data.storeName || "Mon Commerce");
  const safePlan = escapeHtml(data.planName || "KASPI POS Pro All-in-One");
  const safeLicense = data.licenseKey ? escapeHtml(data.licenseKey) : null;
  const safeMethod = escapeHtml(data.paymentMethod || "Virement Bancaire / Carte");
  const dateStr = new Date().toLocaleDateString(isAr ? "ar-MA" : isEn ? "en-US" : "fr-FR");

  const title = isAr
    ? "تأكيد الاشتراك وتفعيل رخصة كسب POS الرسمية"
    : isEn
    ? "Official KASPI POS Subscription & License Activation Confirmation"
    : "Confirmation Officielle d'Abonnement & Activation Licence KASPI POS";

  const subtitle = isAr
    ? "شكراً لثقتكم بنظام كسب POS. تم تأكيد وتفعيل ترخيص متجركم بنجاح."
    : isEn
    ? "Thank you for choosing KASPI POS. Your store license has been successfully activated."
    : "Merci de votre confiance. La licence de votre établissement est officiellement active.";

  const planLabel = isAr ? "الخطة المعتمدة" : isEn ? "Subscription Plan" : "Formule";
  const amountLabel = isAr ? "المبلغ المؤدى" : isEn ? "Amount Paid" : "Montant Réglé";
  const licenseLabel = isAr ? "مفتاح الترخيص الرقمي" : isEn ? "Digital License Key" : "Clé de Licence Officielle";
  const methodLabel = isAr ? "طريقة الأداء" : isEn ? "Payment Method" : "Mode de Paiement";
  const dateLabel = isAr ? "تاريخ التفعيل" : isEn ? "Activation Date" : "Date d'Activation";
  const statusLabel = isAr ? "الحالة" : isEn ? "Status" : "Statut";
  const activeStatus = isAr ? "نشط ومؤكد ✓" : isEn ? "Active & Verified ✓" : "Actif & Vérifié ✓";
  const ctaBtn = isAr ? "الدخول إلى لوحة التحكم POS" : isEn ? "Open POS Dashboard" : "Accéder à mon Dashboard POS";

  return `<!DOCTYPE html>
<html lang="${lang}" dir="ltr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; }
    .card { background-color: #121215; border: 1px solid #27272a; border-radius: 24px; padding: 36px 28px; max-width: 580px; margin: 40px auto; box-shadow: 0 25px 60px rgba(0,0,0,0.8); }
    .btn { display: inline-block; background-color: #ffffff; color: #09090b; font-weight: 800; font-size: 13px; text-decoration: none; padding: 14px 28px; border-radius: 12px; margin-top: 24px; letter-spacing: -0.2px; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
  </style>
</head>
<body>
  <div style="padding: 24px 12px;">
    <div class="card">
      <!-- Logo Header -->
      <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 24px; border-bottom: 1px solid #27272a; padding-bottom: 20px;">
        <tr>
          <td>
            <span style="font-size: 20px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff;">KASPI <span style="background: #ffffff; color: #000; padding: 2px 6px; border-radius: 6px; font-size: 14px;">POS</span></span>
          </td>
          <td align="right">
            <span style="background: rgba(16,185,129,0.15); color: #34d399; border: 1px solid rgba(16,185,129,0.3); font-size: 11px; font-family: ui-monospace, monospace; padding: 4px 10px; border-radius: 20px; font-weight: bold;">${activeStatus}</span>
          </td>
        </tr>
      </table>

      <!-- Title & Greeting -->
      <h1 style="font-size: 22px; font-weight: 900; color: #ffffff; margin: 0 0 10px 0; line-height: 1.3;">
        ${title}
      </h1>
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.6; margin: 0 0 24px 0;">
        ${subtitle}
      </p>

      <!-- 3D Receipt Box -->
      <div style="background-color: #09090b; border: 1px solid #27272a; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
        <table role="presentation" width="100%" border="0" cellpadding="6" cellspacing="0" style="font-size: 12px;">
          <tr>
            <td style="color: #71717a;">${isAr ? "المتجر" : "Établissement"}</td>
            <td align="right" style="color: #ffffff; font-weight: bold;">${safeStore}</td>
          </tr>
          <tr>
            <td style="color: #71717a;">${planLabel}</td>
            <td align="right" style="color: #ffffff; font-weight: bold;">${safePlan}</td>
          </tr>
          <tr>
            <td style="color: #71717a;">${amountLabel}</td>
            <td align="right" class="mono" style="color: #34d399; font-weight: 900; font-size: 15px;">${data.amountMAD.toFixed(2)} MAD</td>
          </tr>
          <tr>
            <td style="color: #71717a;">${methodLabel}</td>
            <td align="right" style="color: #ffffff;">${safeMethod}</td>
          </tr>
          <tr>
            <td style="color: #71717a;">${dateLabel}</td>
            <td align="right" class="mono" style="color: #a1a1aa;">${dateStr}</td>
          </tr>
          ${safeLicense ? `
          <tr>
            <td colspan="2" style="padding-top: 14px; border-top: 1px solid #1f1f23;">
              <span style="font-size: 10px; font-family: ui-monospace, monospace; color: #a1a1aa; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 6px;">${licenseLabel}</span>
              <div class="mono" style="background: #18181b; border: 1px dashed #3f3f46; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: bold; color: #ffffff; text-align: center; letter-spacing: 2px;">
                ${safeLicense}
              </div>
            </td>
          </tr>
          ` : ""}
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center;">
        <a href="${baseUrl}/${lang}/dashboard/billing" class="btn">
          ${ctaBtn} &rarr;
        </a>
      </div>

      <!-- Footnote -->
      <p style="font-size: 11px; color: #52525b; text-align: center; margin: 30px 0 0 0; font-family: ui-monospace, monospace;">
        KASPI POS S.A.R.L • Casablanca, Maroc • Transaction SHA-256 Sécurisée
      </p>
    </div>
  </div>
</body>
</html>`;
}
